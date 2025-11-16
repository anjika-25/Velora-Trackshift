import argparse
import math
import random
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from scipy.interpolate import splprep, splev

# ---------------------------
# RaceTrackModel
# ---------------------------
class RaceTrackModel:
    def __init__(self, control_points=None, mu=1.3, g=9.81, scale=5500):
        # default control points: somewhat larger varied track (blend of code1 & 2 shapes)
        if control_points is None:
            self.control_points = np.array([
                [50, 150], [80, 80], [150, 100],
            [200, 130], [270, 160], [280, 180],
            [250, 220], [200, 250], [120, 200],
            [50, 150]
            ])
        else:
            self.control_points = np.asarray(control_points)
        self.mu = mu
        self.g = g
        self.scale = scale
        self.track_length = 0

    def catmull_rom_spline(self, points, num_points=1000):
        tck, _ = splprep([points[:, 0], points[:, 1]], s=0, per=True, k=3)
        u_new = np.linspace(0, 1, num_points)
        x_new, y_new = splev(u_new, tck)
        return np.array(x_new), np.array(y_new)

    def calculate_curvature(self, x, y):
        dx = np.gradient(x)
        dy = np.gradient(y)
        ddx = np.gradient(dx)
        ddy = np.gradient(dy)
        num = np.abs(dx * ddy - dy * ddx)
        den = (dx**2 + dy**2)**(3/2)
        curvature = np.divide(num, den, where=den > 1e-10, out=np.zeros_like(num))
        return curvature

    def calculate_speed_limits(self, curvature, max_speed=700):
        # Blend: give a reasonable cap (320 realistic) but allow higher for demo
        limits = []
        for k in curvature:
            if k < 0.0003:
                limits.append(400.0)  # generous straight-line for spectacle
            else:
                radius = max(1.0 / k, 1e-3)
                v_ms = math.sqrt(self.mu * self.g * radius * self.scale)
                v_kmh = v_ms * 3.6
                # apply gentle cap
                limits.append(min(v_kmh, max_speed))
        return np.array(limits)

    def analyze_track(self, num_points=1000, max_speed=700):
        x, y = self.catmull_rom_spline(self.control_points, num_points)
        curvature = self.calculate_curvature(x, y)
        speed_limits = self.calculate_speed_limits(curvature, max_speed=max_speed)
        self.track_length = num_points
        return {'x': x, 'y': y, 'curvature': curvature, 'speed_limits': speed_limits}


# ---------------------------
# EventEngine (light scaffold)
# ---------------------------
class EventEngine:
    """Simple event engine to schedule/probabilistic events.
    For the MVP this supports manual injection via API (function call) or
    random failures with configurable rate.
    """
    def __init__(self, rng=None, failure_rate_per_minute=0.02):
        self.rng = rng or random.Random()
        self.failure_rate_per_minute = failure_rate_per_minute
        self.pending = []  # list of (time, function)

    def schedule(self, sim_time, callback):
        self.pending.append((sim_time, callback))
        self.pending.sort(key=lambda x: x[0])

    def poll(self, sim_time):
        """Run any events scheduled for <= sim_time."""
        to_run = [ev for ev in self.pending if ev[0] <= sim_time]
        self.pending = [ev for ev in self.pending if ev[0] > sim_time]
        for _, cb in to_run:
            try:
                cb()
            except Exception:
                pass

    def maybe_random_failure(self, sim_time, agents):
        # small chance per tick to trigger a failure on a random agent
        # convert rate per minute to per-second probability
        p = self.failure_rate_per_minute / 60.0
        if self.rng.random() < p and len(agents) > 0:
            victim = self.rng.choice(agents)
            def failure():
                # simple effect: sudden speed drop and tyre damage
                victim.tire_health = max(0.0, victim.tire_health - 30.0)
                victim.speed *= 0.5
                victim.status = 'damaged'
            # schedule immediate
            failure()


# ---------------------------
# Car class (merged)
# ---------------------------
class Car:
    def __init__(self, track_data, position=0, color='red', skill=0.96, car_id=0, name="Car", seed=None):
        self.track_data = track_data
        self.position = float(position)
        self.color = color
        self.skill = float(skill)
        self.car_id = car_id
        self.name = name

        # realistic starting speed (km/h)
        self.speed = 100.0 
        self.top_speed = 700.0

        # lap tracking
        self.lap_count = 0
        self.last_position = float(position)

        # tyres
        self.tire_health = 100.0
        self.tire_degradation_rate = 0.008

        # physics limits (km/h per second)
        self.max_acceleration = 200.0
        self.max_braking = 400.0

        # collision/safety
        self.safety_distance = 20.0
        self.critical_distance = 10.0

        # smoothing
        self.prev_target_speed = self.speed

        # misc
        self.scale = 5500.0
        self.status = 'ok'

        self.rng = random.Random() if seed is None else random.Random(seed + car_id)

    def check_car_ahead(self, others):
        track_len = len(self.track_data['x'])
        min_dist = float('inf')
        car_ahead = None
        for other in others:
            if other.car_id == self.car_id:
                continue
            # distance modulo track length
            dist = (other.position - self.position) % track_len
            if 0 < dist < self.safety_distance * 2:
                if dist < min_dist:
                    min_dist = dist
                    car_ahead = other
        return car_ahead, min_dist

    def get_xy(self):
        idx = int(self.position) % len(self.track_data['x'])
        return self.track_data['x'][idx], self.track_data['y'][idx]

    def get_info(self):
        return {
            'name': self.name,
            'lap': self.lap_count,
            'tire_health': self.tire_health,
            'speed': self.speed,
            'status': self.status
        }

    def update(self, others, dt=0.05):
        track_len = len(self.track_data['x'])
        idx = int(self.position) % track_len

        # compute base limits and curvature
        base_limit = self.track_data['speed_limits'][idx]
        curvature = self.track_data['curvature'][idx]

        # tire factor depends on health
        tire_factor = 0.85 + (self.tire_health / 100.0) * 0.15

        # calculate target speed: blend straight logic and turn severity
        if curvature < 0.0003:
            target_speed = min(base_limit * self.skill * tire_factor, self.top_speed)
        else:
            # turn severity scaled
            turn_severity = min(curvature / 0.0015, 1.0)
            turn_factor = 0.55 + 0.35 * (1 - turn_severity)
            target_speed = base_limit * self.skill * turn_factor * tire_factor

        # if damaged, lower target speed more
        if self.status != 'ok':
            target_speed *= 0.6

        # smoothing (mix previous)
        alpha = 0.4
        target_speed = alpha * target_speed + (1 - alpha) * self.prev_target_speed
        self.prev_target_speed = target_speed

        # collision avoidance
        car_ahead, dist = self.check_car_ahead(others)
        if car_ahead is not None:
            if dist < self.critical_distance:
                target_speed = min(target_speed, car_ahead.speed * 0.65)
            elif dist < self.safety_distance:
                target_speed = min(target_speed, car_ahead.speed * 0.85)
            elif dist < self.safety_distance * 1.5:
                target_speed = min(target_speed, car_ahead.speed * 0.95)

        # speed change (accel or brake)
        speed_diff = target_speed - self.speed
        if speed_diff > 0:
            # acceleration limited
            accel = min(speed_diff / dt, self.max_acceleration)
            self.speed += accel * dt
        else:
            brake = max(speed_diff / dt, -self.max_braking)
            self.speed += brake * dt

        # clamp speed
        self.speed = max(0.0, min(self.speed, self.top_speed))

        # update position: convert km/h to m/s-ish and scale to track points
        speed_ms = self.speed / 3.6
        ds = speed_ms * dt * (track_len / self.scale)
        self.position = (self.position + ds) % track_len

        # lap count: detect by wrap-around robustly
        if self.position < self.last_position - 0.5:
            self.lap_count += 1
        self.last_position = self.position

        # tire degradation increases on tight turns
        if curvature > 0.0003:
            deg_rate = self.tire_degradation_rate * (1 + curvature * 1000.0)
        else:
            deg_rate = self.tire_degradation_rate * 0.5
        self.tire_health = max(0.0, self.tire_health - deg_rate * dt)


# ---------------------------
# VisualRace - visualization merged
# ---------------------------
class VisualRace:
    def __init__(self, track_data, num_cars=8, seed=None):
        self.track_data = track_data
        self.cars = []
        self.seed = seed if seed is not None else random.randrange(1<<30)
        self.rng = random.Random(self.seed)

        num_cars = int(max(1, min(num_cars, 25)))

        colors = ['red', 'cyan', 'yellow', 'orange', 'lime', 'magenta',
                  'hotpink', 'deepskyblue', 'gold', 'springgreen',
                  'crimson', 'aqua', 'khaki', 'coral', 'limegreen',
                  'violet', 'salmon', 'turquoise', 'wheat', 'chartreuse',
                  'pink', 'skyblue', 'plum', 'lightsalmon', 'palegreen']

        names = ['Lightning', 'Thunder', 'Blaze', 'Storm', 'Flash',
                 'Rocket', 'Turbo', 'Nitro', 'Phantom', 'Viper',
                 'Shadow', 'Cobra', 'Falcon', 'Eagle', 'Phoenix',
                 'Dragon', 'Titan', 'Raptor', 'Ghost', 'Bullet',
                 'Sonic', 'Laser', 'Bolt', 'Cyclone', 'Inferno']

        total_points = len(track_data['x'])
        for i in range(num_cars):
            car_skill = self.rng.uniform(0.92, 0.99)
            car = Car(
                track_data,
                position=i * (total_points / num_cars),
                color=colors[i % len(colors)],
                skill=car_skill,
                car_id=i,
                name=names[i % len(names)],
                seed=self.seed
            )
            self.cars.append(car)

        self._setup_plot()
        self.hover_car = None
        self.sim_time = 0.0
        self.event_engine = EventEngine(rng=self.rng)

    def _setup_plot(self):
        self.fig, self.ax = plt.subplots(figsize=(14, 10))
        self.fig.patch.set_facecolor('black')
        self.ax.set_facecolor('black')

        # multi-layer track glow
        self.ax.plot(self.track_data['x'], self.track_data['y'], color='white', linewidth=12, alpha=0.08)
        self.ax.plot(self.track_data['x'], self.track_data['y'], color='white', linewidth=8, alpha=0.25)
        self.ax.plot(self.track_data['x'], self.track_data['y'], color='white', linewidth=5, alpha=0.6)
        self.ax.plot(self.track_data['x'], self.track_data['y'], color='yellow', linewidth=1, alpha=0.4, linestyle=':')

        # curvature markers
        for i in range(len(self.track_data['curvature'])):
            if i % 50 == 0:
                if self.track_data['curvature'][i] < 0.0003:
                    self.ax.plot(self.track_data['x'][i], self.track_data['y'][i], 'o', color='green', markersize=3, alpha=0.25)
                else:
                    self.ax.plot(self.track_data['x'][i], self.track_data['y'][i], 'o', color='red', markersize=3, alpha=0.25)

        # car markers
        self.car_dots = []
        for car in self.cars:
            x, y = car.get_xy()
            dot, = self.ax.plot(x, y, 'o', color=car.color, markersize=18, markeredgecolor='white', markeredgewidth=2)
            self.car_dots.append(dot)

        self.ax.axis('off')
        self.ax.set_aspect('equal')
        self.ax.set_title('Velora — Race Track', color='white', fontsize=16, fontweight='bold', pad=20)
        self.ax.set_xlim(min(self.track_data['x']) - 40, max(self.track_data['x']) + 40)
        self.ax.set_ylim(min(self.track_data['y']) - 40, max(self.track_data['y']) + 40)

        # hover annotation with smart placement (from Code1)
        self.hover_annotation = self.ax.annotate(
            '', xy=(0,0), xytext=(20,20), textcoords='offset points',
            bbox=dict(boxstyle='round,pad=0.8', facecolor='black', edgecolor='white', alpha=0.95, linewidth=2),
            color='white', fontsize=10, fontweight='bold', visible=False, zorder=1000,
            ha='left', va='bottom'
        )

        self.fig.canvas.mpl_connect('motion_notify_event', self._on_hover)

    def _on_hover(self, event):
        if event.inaxes != self.ax or event.xdata is None or event.ydata is None:
            if self.hover_car is not None:
                self.hover_car = None
                self.hover_annotation.set_visible(False)
            return

        HOVER_RADIUS = 30.0
        found_car = None
        for car in self.cars:
            x, y = car.get_xy()
            d = math.hypot(event.xdata - x, event.ydata - y)
            if d < HOVER_RADIUS:
                found_car = car
                break

        if found_car is not None:
            if self.hover_car != found_car:
                self.hover_car = found_car
                info = found_car.get_info()
                tire_status = 'Good' if info['tire_health'] > 70 else ('Worn' if info['tire_health'] > 40 else 'Critical')
                text = (f"Name: {info['name']}\n"
                        f"Lap: {info['lap']}\n"
                        f"Tire: {info['tire_health']:.1f}% ({tire_status})\n"
                        f"Speed: {int(info['speed'])} km/h\n"
                        f"Status: {info.get('status','ok')}")
                self.hover_annotation.set_text(text)
                x, y = found_car.get_xy()
                self.hover_annotation.xy = (x, y)

                x_range = self.ax.get_xlim()
                y_range = self.ax.get_ylim()
                x_mid = (x_range[0] + x_range[1]) / 2
                y_mid = (y_range[0] + y_range[1]) / 2

                # smart placement
                if x < x_mid:
                    self.hover_annotation.set_ha('left')
                    self.hover_annotation.xytext = (20, 20)
                else:
                    self.hover_annotation.set_ha('right')
                    self.hover_annotation.xytext = (-20, 20)

                if y < y_mid:
                    self.hover_annotation.set_va('bottom')
                else:
                    self.hover_annotation.set_va('top')
                    if x < x_mid:
                        self.hover_annotation.xytext = (20, -20)
                    else:
                        self.hover_annotation.xytext = (-20, -20)

                self.hover_annotation.get_bbox_patch().set_edgecolor(found_car.color)
                self.hover_annotation.set_visible(True)
        else:
            if self.hover_car is not None:
                self.hover_car = None
                self.hover_annotation.set_visible(False)

    def _step(self, frame):
        dt = 0.05
        self.sim_time += dt

        # poll events and maybe random failures
        self.event_engine.poll(self.sim_time)
        self.event_engine.maybe_random_failure(self.sim_time, self.cars)

        for car in self.cars:
            car.update(self.cars, dt)

        for i, car in enumerate(self.cars):
            x, y = car.get_xy()
            self.car_dots[i].set_data([x], [y])

        if self.hover_car is not None:
            info = self.hover_car.get_info()
            tire_status = 'Good' if info['tire_health'] > 70 else ('Worn' if info['tire_health'] > 40 else 'Critical')
            text = (f"Name: {info['name']}\n"
                    f"Lap: {info['lap']}\n"
                    f"Tire: {info['tire_health']:.1f}% ({tire_status})\n"
                    f"Speed: {int(info['speed'])} km/h\n"
                    f"Status: {info.get('status','ok')}")
            self.hover_annotation.set_text(text)
            x, y = self.hover_car.get_xy()
            self.hover_annotation.xy = (x, y)

        return self.car_dots + [self.hover_annotation]

    def run(self, duration=120):
        frames = int(duration / 0.05)
        anim = FuncAnimation(self.fig, self._step, frames=frames, interval=50, blit=True, repeat=True)
        plt.tight_layout()
        plt.show()
        return anim


# ---------------------------
# CLI and main
# ---------------------------
def parse_args():
    p = argparse.ArgumentParser(description='Velora - merged race simulation')
    p.add_argument('--cars', type=int, default=8, help='Number of cars (1-25)')
    p.add_argument('--duration', type=int, default=120, help='Run time in seconds')
    p.add_argument('--points', type=int, default=1000, help='Spline resolution')
    p.add_argument('--seed', type=int, default=None, help='Random seed for reproducibility')
    p.add_argument('--max_speed', type=int, default=700, help='Max speed cap (km/h)')
    return p.parse_args()


if __name__ == '__main__':
    args = parse_args()
    num_cars = max(1, min(args.cars, 25))
    seed = args.seed

    print(f"Starting Velora simulation with {num_cars} cars for {args.duration}s (seed={seed})")

    track = RaceTrackModel()
    data = track.analyze_track(num_points=args.points, max_speed=args.max_speed)

    race = VisualRace(data, num_cars=num_cars, seed=seed)
    race.run(duration=args.duration)