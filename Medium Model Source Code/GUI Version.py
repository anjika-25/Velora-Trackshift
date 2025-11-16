# VELORA - Dynamic Racing Simulation System (Local Windows Version with GPU Support)
# 🏎️ Real-time multi-agent racing simulation with physics, events, and 3D visualization

"""
INSTALLATION INSTRUCTIONS FOR WINDOWS:

1. Install Python 3.8+ from python.org
2. Open Command Prompt and install dependencies:

   pip install numpy pandas matplotlib pygame pillow
   pip install PyQt5 pyqtgraph
   
   Optional (for GPU acceleration):
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   
3. Save this file as velora_racing_sim.py
4. Run: python velora_racing_sim.py

GPU will be auto-detected and used if available (PyTorch CUDA).
"""

import sys
import numpy as np
import pandas as pd
import json
import random
import time
from datetime import datetime
from collections import deque
from pathlib import Path

# PyQt5 for GUI
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                              QHBoxLayout, QPushButton, QLabel, QComboBox, 
                              QTextEdit, QSlider, QGroupBox, QGridLayout, QTabWidget,
                              QTableWidget, QTableWidgetItem, QProgressBar, QFileDialog,
                              QDockWidget, QAction, QMenuBar, QMenu)
from PyQt5.QtCore import QTimer, Qt, pyqtSignal, QThread
from PyQt5.QtGui import QPainter, QColor, QPen, QBrush, QFont, QPalette

# Matplotlib for plotting
import matplotlib
matplotlib.use('Qt5Agg')
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg
from matplotlib.figure import Figure

# Check for GPU support
try:
    import torch
    GPU_AVAILABLE = torch.cuda.is_available()
    DEVICE = torch.device("cuda" if GPU_AVAILABLE else "cpu")
    print(f"🚀 GPU Support: {'ENABLED ✓' if GPU_AVAILABLE else 'CPU Mode'}")
    if GPU_AVAILABLE:
        print(f"   GPU Device: {torch.cuda.get_device_name(0)}")
except ImportError:
    GPU_AVAILABLE = False
    DEVICE = None
    print("⚠️  PyTorch not installed. Running in CPU mode only.")

# ============================================================================
# GPU-ACCELERATED PHYSICS ENGINE
# ============================================================================

class GPUPhysicsEngine:
    """GPU-accelerated physics calculations using PyTorch"""
    
    def __init__(self, num_cars):
        self.num_cars = num_cars
        self.use_gpu = GPU_AVAILABLE
        
        if self.use_gpu:
            # Initialize tensors on GPU
            self.positions = torch.zeros(num_cars, device=DEVICE)
            self.speeds = torch.zeros(num_cars, device=DEVICE)
            self.accelerations = torch.zeros(num_cars, device=DEVICE)
        
    def batch_update_physics(self, max_speeds, accels, power_mults, wear_mults, 
                            damage_mults, env_mult, dt):
        """Update all car physics in parallel on GPU"""
        if not self.use_gpu:
            return None, None
        
        # Convert to tensors
        max_speeds_t = torch.tensor(max_speeds, device=DEVICE, dtype=torch.float32)
        accels_t = torch.tensor(accels, device=DEVICE, dtype=torch.float32)
        power_mults_t = torch.tensor(power_mults, device=DEVICE, dtype=torch.float32)
        wear_mults_t = torch.tensor(wear_mults, device=DEVICE, dtype=torch.float32)
        damage_mults_t = torch.tensor(damage_mults, device=DEVICE, dtype=torch.float32)
        
        # Calculate effective speeds
        effective_max_speeds = (max_speeds_t * env_mult * power_mults_t * 
                               wear_mults_t * damage_mults_t)
        effective_accels = accels_t * power_mults_t * damage_mults_t
        
        # Update speeds
        speed_increases = effective_accels * dt
        self.speeds = torch.minimum(self.speeds + speed_increases, effective_max_speeds)
        
        # Update positions
        track_length = 5000.0
        distances = self.speeds * (1000.0/3600.0) * dt
        lap_progress = distances / track_length
        self.positions += lap_progress
        
        # Return to CPU
        return self.speeds.cpu().numpy(), self.positions.cpu().numpy()

# ============================================================================
# CORE CLASSES
# ============================================================================

class EnvironmentConditions:
    """Manages environmental factors affecting race performance"""
    
    def __init__(self):
        self.temperature = 25.0  # Celsius
        self.humidity = 50.0  # Percentage
        self.air_density = 1.225  # kg/m³
        self.weather = "Clear"
        self.track_grip = 1.0
        
    def update_weather(self, weather_type):
        self.weather = weather_type
        if weather_type == "Rain":
            self.track_grip = 0.6
            self.humidity = 85.0
        elif weather_type == "Fog":
            self.track_grip = 0.85
            self.humidity = 95.0
        else:
            self.track_grip = 1.0
            self.humidity = 50.0
    
    def get_performance_multiplier(self):
        temp_factor = 1.0 - abs(self.temperature - 25) * 0.002
        humidity_factor = 1.0 - (self.humidity - 50) * 0.001
        density_factor = self.air_density / 1.225
        return temp_factor * humidity_factor * density_factor * self.track_grip


class RaceCar:
    """Individual race car agent"""
    
    def __init__(self, car_id, name, color):
        self.id = car_id
        self.name = name
        self.color = color
        
        # Performance
        self.max_speed = random.uniform(280, 320)
        self.acceleration = random.uniform(8, 12)
        self.handling = random.uniform(0.7, 1.0)
        self.engine_power = 100.0
        
        # State
        self.position = 0.0
        self.speed = 0.0
        self.lap = 0
        self.lap_time = 0.0
        self.total_time = 0.0
        self.finish_time = None  # Time when car finished race
        
        # Condition
        self.tyre_wear = 0.0
        self.fuel = 100.0
        self.damage = 0.0
        self.in_pit = False
        self.pit_stops = 0
        self.pit_time_remaining = 0.0
        self.status = "Racing"
        
        # History
        self.speed_history = deque(maxlen=200)
        self.position_history = deque(maxlen=200)
        self.lap_times = []
        
    def update_physics(self, dt, env_conditions):
        """Update car physics"""
        if self.status == "Finished":
            # Car has finished, maintain finish state
            self.speed = 0
            return
            
        if self.status == "DNF":
            self.speed = 0
            return
            
        if self.in_pit:
            self.pit_time_remaining -= dt
            if self.pit_time_remaining <= 0:
                self.finish_pit_stop()
            self.total_time += dt
            return
        
        # Calculate multipliers
        env_mult = env_conditions.get_performance_multiplier()
        power_mult = self.engine_power / 100.0
        tyre_mult = max(0.5, 1.0 - self.tyre_wear / 100.0)
        damage_mult = max(0.3, 1.0 - self.damage / 100.0)
        
        effective_max_speed = self.max_speed * env_mult * power_mult * tyre_mult * damage_mult
        effective_accel = self.acceleration * power_mult * damage_mult
        
        # Update speed
        if self.speed < effective_max_speed:
            self.speed = min(self.speed + effective_accel * dt, effective_max_speed)
        else:
            self.speed = effective_max_speed
        
        # Update position
        track_length = 5000
        distance = self.speed * (1000/3600) * dt
        lap_progress = distance / track_length
        
        self.position += lap_progress
        
        # Check lap completion
        if self.position >= 1.0:
            self.position -= 1.0
            self.lap += 1
            self.lap_times.append(self.lap_time)
            self.lap_time = 0.0
        
        # Degradation
        self.tyre_wear += 0.1 * dt * (self.speed / self.max_speed)
        self.fuel -= 0.05 * dt
        self.lap_time += dt
        self.total_time += dt
        
        # History
        self.speed_history.append(self.speed)
        self.position_history.append(self.position)
        
        # Failures
        if self.fuel <= 0 or self.damage >= 100:
            self.status = "DNF"
            self.speed = 0
    
    def pit_stop(self):
        self.in_pit = True
        self.pit_stops += 1
        self.pit_time_remaining = 3.0  # 3 seconds
        self.speed = 0
    
    def finish_pit_stop(self):
        self.in_pit = False
        self.tyre_wear = 0.0
        self.fuel = 100.0
        self.damage = max(0, self.damage - 20)
    
    def apply_damage(self, amount):
        self.damage = min(100, self.damage + amount)
        if self.damage >= 100:
            self.status = "DNF"
            self.speed = 0
    
    def reduce_power(self, amount):
        self.engine_power = max(0, self.engine_power - amount)


class RaceEvent:
    def __init__(self, event_type, car_id, timestamp, description):
        self.type = event_type
        self.car_id = car_id
        self.timestamp = timestamp
        self.description = description


class VeloraRaceSimulation:
    """Main simulation engine"""
    
    def __init__(self, num_cars=8, num_laps=10, use_gpu=True):
        self.num_cars = num_cars
        self.num_laps = num_laps
        self.time = 0.0
        self.is_running = False
        self.is_paused = False
        self.race_finished = False
        
        self.environment = EnvironmentConditions()
        self.cars = self._initialize_cars()
        self.events = []
        
        self.dt = 0.05  # 50ms time step
        
        # GPU engine
        self.use_gpu = use_gpu and GPU_AVAILABLE
        if self.use_gpu:
            self.gpu_engine = GPUPhysicsEngine(num_cars)
        
    def _initialize_cars(self):
        colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', 
                 '#FF00FF', '#00FFFF', '#FFA500', '#800080',
                 '#FF1493', '#32CD32', '#FFD700', '#4169E1']
        names = ['Thunder', 'Lightning', 'Phoenix', 'Dragon', 
                'Falcon', 'Viper', 'Cobra', 'Eagle',
                'Raptor', 'Titan', 'Storm', 'Blaze']
        
        cars = []
        for i in range(self.num_cars):
            car = RaceCar(i, names[i % len(names)], colors[i % len(colors)])
            car.position = -i * 0.01
            cars.append(car)
        return cars
    
    def update(self):
        """Main update loop"""
        if not self.is_running or self.is_paused or self.race_finished:
            return
        
        # Update all cars
        if self.use_gpu:
            self._gpu_update()
        else:
            self._cpu_update()
        
        # Check if cars have finished
        for car in self.cars:
            if car.status == "Racing" and not car.in_pit and car.lap >= self.num_laps:
                car.status = "Finished"
                car.finish_time = car.total_time
                car.speed = 0
                event = RaceEvent("Finish", car.id, self.time,
                                 f"🏁 {car.name} finished the race!")
                self.events.append(event)
        
        self.time += self.dt
        
        # Check if ALL cars have finished or DNF'd
        active_racing_cars = [c for c in self.cars if c.status == "Racing" or c.in_pit]
        if not active_racing_cars:
            self.race_finished = True
            self.is_running = False
    
    def _cpu_update(self):
        """Standard CPU update"""
        for car in self.cars:
            car.update_physics(self.dt, self.environment)
    
    def _gpu_update(self):
        """GPU-accelerated update"""
        # Prepare data for batch processing
        max_speeds = []
        accels = []
        power_mults = []
        wear_mults = []
        damage_mults = []
        
        for car in self.cars:
            if car.status == "Racing" and not car.in_pit:
                max_speeds.append(car.max_speed)
                accels.append(car.acceleration)
                power_mults.append(car.engine_power / 100.0)
                wear_mults.append(max(0.5, 1.0 - car.tyre_wear / 100.0))
                damage_mults.append(max(0.3, 1.0 - car.damage / 100.0))
            else:
                max_speeds.append(0)
                accels.append(0)
                power_mults.append(0)
                wear_mults.append(1)
                damage_mults.append(1)
        
        env_mult = self.environment.get_performance_multiplier()
        
        # Update on GPU
        speeds, positions = self.gpu_engine.batch_update_physics(
            max_speeds, accels, power_mults, wear_mults, damage_mults, 
            env_mult, self.dt
        )
        
        # Apply results back to cars
        for i, car in enumerate(self.cars):
            if car.status == "Racing" and not car.in_pit:
                car.speed = float(speeds[i])
                old_pos = car.position
                car.position = float(positions[i]) % 1.0
                
                # Check lap completion
                if car.position < old_pos:
                    car.lap += 1
                    car.lap_times.append(car.lap_time)
                    car.lap_time = 0.0
                
                # Degradation
                car.tyre_wear += 0.1 * self.dt * (car.speed / car.max_speed)
                car.fuel -= 0.05 * self.dt
                car.lap_time += self.dt
                car.total_time += self.dt
                
                car.speed_history.append(car.speed)
                car.position_history.append(car.position)
                
                if car.fuel <= 0 or car.damage >= 100:
                    car.status = "DNF"
                    car.speed = 0
            elif car.in_pit:
                car.pit_time_remaining -= self.dt
                car.total_time += self.dt
                if car.pit_time_remaining <= 0:
                    car.finish_pit_stop()
    
    def check_collision_chain(self, car_id):
        """Check if accident affects nearby cars"""
        crashed_car = self.cars[car_id]
        affected_cars = []
        
        # Check cars within 0.02 track position (about 100m)
        for car in self.cars:
            if car.id == car_id or car.status != "Racing":
                continue
            
            # Check if on same lap and close proximity
            if car.lap == crashed_car.lap:
                distance = abs(car.position - crashed_car.position)
                # Handle wrap-around on track
                if distance > 0.5:
                    distance = 1.0 - distance
                
                if distance < 0.02:  # Within collision range
                    # Car behind gets affected more severely
                    if (car.position < crashed_car.position and 
                        crashed_car.position - car.position < 0.5) or \
                       (car.position > crashed_car.position and 
                        car.position - crashed_car.position > 0.5):
                        # Trailing car - severe damage
                        damage = random.uniform(30, 60)
                        car.apply_damage(damage)
                        affected_cars.append((car, damage, "collision"))
                    else:
                        # Leading car - minor damage from debris
                        damage = random.uniform(10, 25)
                        car.apply_damage(damage)
                        affected_cars.append((car, damage, "debris"))
        
        return affected_cars
    
    def trigger_accident(self, car_id):
        car = self.cars[car_id]
        damage = random.uniform(20, 50)
        car.apply_damage(damage)
        event = RaceEvent("Accident", car_id, self.time, 
                         f"💥 {car.name} crashed! Damage: {damage:.1f}%")
        self.events.append(event)
        
        # Check for collision chain reaction
        affected = self.check_collision_chain(car_id)
        for affected_car, affected_damage, collision_type in affected:
            if collision_type == "collision":
                event = RaceEvent("Collision", affected_car.id, self.time,
                                 f"💥 {affected_car.name} collided with {car.name}! Damage: {affected_damage:.1f}%")
            else:
                event = RaceEvent("Debris", affected_car.id, self.time,
                                 f"⚠️ {affected_car.name} hit debris! Damage: {affected_damage:.1f}%")
            self.events.append(event)
    
    def trigger_engine_failure(self, car_id):
        car = self.cars[car_id]
        power_loss = random.uniform(30, 60)
        car.reduce_power(power_loss)
        event = RaceEvent("Engine Failure", car_id, self.time,
                         f"🔧 {car.name} engine failure! Power: -{power_loss:.1f}%")
        self.events.append(event)
    
    def trigger_pit_stop(self, car_id):
        car = self.cars[car_id]
        if not car.in_pit and car.status == "Racing":
            car.pit_stop()
            event = RaceEvent("Pit Stop", car_id, self.time,
                             f"🛠️ {car.name} entered pit")
            self.events.append(event)
    
    def change_weather(self, weather_type):
        self.environment.update_weather(weather_type)
        event = RaceEvent("Weather", -1, self.time,
                         f"🌦️ Weather: {weather_type}")
        self.events.append(event)
    
    def get_leaderboard(self):
        # Separate finished and racing cars
        finished_cars = [car for car in self.cars if car.status == "Finished"]
        racing_cars = [car for car in self.cars if car.status == "Racing" or car.in_pit]
        dnf_cars = [car for car in self.cars if car.status == "DNF"]
        
        # Sort finished by total time
        finished_sorted = sorted(finished_cars, key=lambda c: c.finish_time)
        
        # Sort racing by lap and position
        racing_sorted = sorted(racing_cars, key=lambda c: (-c.lap, -c.position, c.total_time))
        
        # Combine: finished first, then racing, then DNF
        return finished_sorted + racing_sorted + dnf_cars
    
    def export_data(self, directory, file_format='csv'):
        """Export simulation data"""
        Path(directory).mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Car data
        car_data = []
        for car in self.cars:
            car_data.append({
                'id': car.id,
                'name': car.name,
                'laps_completed': car.lap,
                'total_time': car.total_time,
                'finish_time': car.finish_time,
                'pit_stops': car.pit_stops,
                'status': car.status,
                'final_damage': car.damage,
                'avg_speed': np.mean(list(car.speed_history)) if car.speed_history else 0
            })
        
        df_cars = pd.DataFrame(car_data)
        
        # Lap times
        lap_data = []
        for car in self.cars:
            for lap_num, lap_time in enumerate(car.lap_times):
                lap_data.append({
                    'car_id': car.id,
                    'car_name': car.name,
                    'lap': lap_num + 1,
                    'lap_time': lap_time
                })
        df_laps = pd.DataFrame(lap_data)
        
        # Events
        event_data = [{
            'time': e.timestamp,
            'type': e.type,
            'car_id': e.car_id,
            'description': e.description
        } for e in self.events]
        df_events = pd.DataFrame(event_data)
        
        if file_format == 'csv':
            df_cars.to_csv(f'{directory}/velora_cars_{timestamp}.csv', index=False)
            df_laps.to_csv(f'{directory}/velora_laps_{timestamp}.csv', index=False)
            df_events.to_csv(f'{directory}/velora_events_{timestamp}.csv', index=False)
            return f"Exported to {directory}/"
        else:
            data = {
                'cars': car_data,
                'laps': lap_data,
                'events': event_data,
                'environment': {
                    'temperature': self.environment.temperature,
                    'humidity': self.environment.humidity,
                    'weather': self.environment.weather
                }
            }
            with open(f'{directory}/velora_simulation_{timestamp}.json', 'w') as f:
                json.dump(data, f, indent=2)
            return f"Exported to {directory}/velora_simulation_{timestamp}.json"


# ============================================================================
# GUI COMPONENTS
# ============================================================================

class TrackWidget(QWidget):
    """3D-style track visualization"""
    
    def __init__(self, simulation):
        super().__init__()
        self.sim = simulation
        self.setMinimumSize(500, 500)
        
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        width = self.width()
        height = self.height()
        center_x = width // 2
        center_y = height // 2
        
        # Draw track
        track_radius = min(width, height) // 2 - 40
        
        # Track background (grass)
        painter.setBrush(QBrush(QColor(34, 139, 34)))
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(center_x - track_radius - 60, center_y - track_radius - 60,
                           (track_radius + 60) * 2, (track_radius + 60) * 2)
        
        # Track surface
        painter.setBrush(QBrush(QColor(64, 64, 64)))
        painter.setPen(QPen(QColor(128, 128, 128), 3))
        painter.drawEllipse(center_x - track_radius, center_y - track_radius,
                           track_radius * 2, track_radius * 2)
        
        # Inner grass
        inner_radius = int(track_radius * 0.6)
        painter.setBrush(QBrush(QColor(34, 139, 34)))
        painter.drawEllipse(center_x - inner_radius, center_y - inner_radius,
                           inner_radius * 2, inner_radius * 2)
        
        # Start/finish line
        painter.setPen(QPen(Qt.white, 5))
        painter.drawLine(center_x, center_y - track_radius, 
                        center_x, center_y - inner_radius)
        
        # Draw cars
        for car in self.sim.cars:
            if car.status == "DNF":
                continue
                
            angle = car.position * 2 * np.pi - np.pi / 2
            x = center_x + track_radius * 0.8 * np.cos(angle)
            y = center_y + track_radius * 0.8 * np.sin(angle)
            
            # Car body
            color = QColor(car.color)
            painter.setBrush(QBrush(color))
            painter.setPen(QPen(Qt.black, 2))
            
            car_size = 12 if not car.in_pit else 8
            if car.status == "Finished":
                car_size = 10
                # Add checkered flag effect
                painter.setPen(QPen(QColor("#FFD700"), 3))
            
            painter.drawEllipse(int(x - car_size//2), int(y - car_size//2), 
                               car_size, car_size)
            
            # Car number
            painter.setPen(QPen(Qt.white))
            painter.setFont(QFont('Arial', 8, QFont.Bold))
            painter.drawText(int(x - 5), int(y + 4), str(car.id + 1))
        
        # Info overlay
        painter.setPen(QPen(Qt.white))
        painter.setFont(QFont('Arial', 12, QFont.Bold))
        painter.drawText(10, 20, f"Time: {self.sim.time:.1f}s")
        painter.drawText(10, 40, f"Weather: {self.sim.environment.weather}")


class TelemetryChart(FigureCanvasQTAgg):
    """Real-time telemetry charts"""
    
    def __init__(self, width=5, height=4):
        fig = Figure(figsize=(width, height), facecolor='#1a1a1a')
        self.axes = fig.add_subplot(111)
        super().__init__(fig)
        
        self.axes.set_facecolor('#2a2a2a')
        self.axes.tick_params(colors='white')
        self.axes.spines['bottom'].set_color('white')
        self.axes.spines['left'].set_color('white')
        self.axes.spines['top'].set_visible(False)
        self.axes.spines['right'].set_visible(False)
        
        self.last_update_time = 0
        
    def update_plot(self, simulation, force=False):
        # Throttle updates to reduce lag
        current_time = time.time()
        if not force and current_time - self.last_update_time < 0.5:  # Update every 500ms
            return
        
        self.last_update_time = current_time
        
        self.axes.clear()
        self.axes.set_facecolor('#2a2a2a')
        self.axes.set_xlabel('Time', color='white')
        self.axes.set_ylabel('Speed (km/h)', color='white')
        self.axes.set_title('Real-time Speed Telemetry', color='white', fontweight='bold')
        self.axes.grid(True, alpha=0.3, color='gray')
        
        for car in simulation.cars[:6]:  # Top 6 cars
            if len(car.speed_history) > 1:
                self.axes.plot(list(car.speed_history), 
                             color=car.color, label=car.name, linewidth=2, alpha=0.8)
        
        self.axes.legend(facecolor='#2a2a2a', edgecolor='white', 
                        labelcolor='white', fontsize=8)
        self.draw()


class DetachableWidget(QDockWidget):
    """Detachable widget that can be pulled out to separate window"""
    
    def __init__(self, title, widget, parent=None):
        super().__init__(title, parent)
        self.setWidget(widget)
        self.setAllowedAreas(Qt.AllDockWidgetAreas)
        self.setFeatures(QDockWidget.DockWidgetMovable | 
                        QDockWidget.DockWidgetFloatable |
                        QDockWidget.DockWidgetClosable)


class VeloraMainWindow(QMainWindow):
    """Main application window"""
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle("VELORA - Racing Simulation System")
        self.setGeometry(100, 100, 1600, 900)
        
        # Dark theme
        self.setStyleSheet("""
            QMainWindow, QWidget {
                background-color: #1a1a1a;
                color: #ffffff;
            }
            QPushButton {
                background-color: #3a3a3a;
                color: #ffffff;
                border: 2px solid #555555;
                border-radius: 5px;
                padding: 8px 16px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #4a4a4a;
                border-color: #00ff00;
            }
            QPushButton:pressed {
                background-color: #2a2a2a;
            }
            QGroupBox {
                border: 2px solid #555555;
                border-radius: 5px;
                margin-top: 10px;
                font-weight: bold;
                color: #00ff00;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px;
            }
            QComboBox, QTextEdit {
                background-color: #2a2a2a;
                color: #ffffff;
                border: 1px solid #555555;
                border-radius: 3px;
                padding: 5px;
            }
            QTableWidget {
                background-color: #2a2a2a;
                color: #ffffff;
                gridline-color: #555555;
            }
            QHeaderView::section {
                background-color: #3a3a3a;
                color: #00ff00;
                border: 1px solid #555555;
                padding: 5px;
                font-weight: bold;
            }
            QProgressBar {
                border: 1px solid #555555;
                border-radius: 3px;
                text-align: center;
                color: white;
            }
            QProgressBar::chunk {
                background-color: #00ff00;
            }
            QDockWidget {
                background-color: #1a1a1a;
                color: #ffffff;
                titlebar-close-icon: url(close.png);
                titlebar-normal-icon: url(float.png);
            }
            QDockWidget::title {
                background-color: #2a2a2a;
                padding: 5px;
                border: 1px solid #555555;
            }
        """)
        
        # Initialize simulation
        self.sim = VeloraRaceSimulation(num_cars=8, num_laps=5, use_gpu=GPU_AVAILABLE)
        
        # Setup UI
        self.setup_ui()
        
        # Timer for updates
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_simulation)
        self.timer.start(50)  # 50ms = 20 FPS
        
        self.frame_counter = 0
        
    def setup_ui(self):
        # Create menu bar
        self.create_menu_bar()
        
        # Central widget with track
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        central_layout = QVBoxLayout(central_widget)
        
        self.track_widget = TrackWidget(self.sim)
        central_layout.addWidget(self.track_widget)
        
        # Status bar
        self.status_label = QLabel("Ready to race...")
        self.status_label.setStyleSheet("color: #00ff00; font-weight: bold;")
        central_layout.addWidget(self.status_label)
        
        # Create detachable dock widgets
        self.create_docks()
        
    def create_menu_bar(self):
        """Create menu bar with window options"""
        menubar = self.menuBar()
        menubar.setStyleSheet("""
            QMenuBar {
                background-color: #2a2a2a;
                color: #ffffff;
            }
            QMenuBar::item:selected {
                background-color: #3a3a3a;
            }
            QMenu {
                background-color: #2a2a2a;
                color: #ffffff;
                border: 1px solid #555555;
            }
            QMenu::item:selected {
                background-color: #3a3a3a;
            }
        """)
        
        # View menu
        view_menu = menubar.addMenu("View")
        
        self.toggle_control_action = QAction("Show/Hide Controls", self)
        self.toggle_control_action.setCheckable(True)
        self.toggle_control_action.setChecked(True)
        view_menu.addAction(self.toggle_control_action)
        
        self.toggle_scenario_action = QAction("Show/Hide What-If Scenarios", self)
        self.toggle_scenario_action.setCheckable(True)
        self.toggle_scenario_action.setChecked(True)
        view_menu.addAction(self.toggle_scenario_action)
        
        self.toggle_leaderboard_action = QAction("Show/Hide Leaderboard", self)
        self.toggle_leaderboard_action.setCheckable(True)
        self.toggle_leaderboard_action.setChecked(True)
        view_menu.addAction(self.toggle_leaderboard_action)
        
        self.toggle_telemetry_action = QAction("Show/Hide Telemetry", self)
        self.toggle_telemetry_action.setCheckable(True)
        self.toggle_telemetry_action.setChecked(True)
        view_menu.addAction(self.toggle_telemetry_action)
        
        self.toggle_chart_action = QAction("Show/Hide Speed Chart", self)
        self.toggle_chart_action.setCheckable(True)
        self.toggle_chart_action.setChecked(True)
        view_menu.addAction(self.toggle_chart_action)
        
        self.toggle_events_action = QAction("Show/Hide Event Log", self)
        self.toggle_events_action.setCheckable(True)
        self.toggle_events_action.setChecked(True)
        view_menu.addAction(self.toggle_events_action)
        
        view_menu.addSeparator()
        
        reset_layout_action = QAction("Reset Layout", self)
        reset_layout_action.triggered.connect(self.reset_layout)
        view_menu.addAction(reset_layout_action)
        
    def create_docks(self):
        """Create all detachable dock widgets"""
        
        # Control dock
        control_widget = QWidget()
        control_layout = QGridLayout(control_widget)
        
        self.start_btn = QPushButton("▶️ Start Race")
        self.start_btn.clicked.connect(self.start_race)
        self.pause_btn = QPushButton("⏸️ Pause")
        self.pause_btn.clicked.connect(self.pause_race)
        self.reset_btn = QPushButton("🔄 Reset")
        self.reset_btn.clicked.connect(self.reset_race)
        
        control_layout.addWidget(self.start_btn, 0, 0)
        control_layout.addWidget(self.pause_btn, 0, 1)
        control_layout.addWidget(self.reset_btn, 0, 2)
        
        self.export_csv_btn = QPushButton("💾 Export CSV")
        self.export_csv_btn.clicked.connect(lambda: self.export_data('csv'))
        self.export_json_btn = QPushButton("💾 Export JSON")
        self.export_json_btn.clicked.connect(lambda: self.export_data('json'))
        
        control_layout.addWidget(self.export_csv_btn, 1, 0, 1, 2)
        control_layout.addWidget(self.export_json_btn, 1, 2)
        
        self.control_dock = DetachableWidget("🎮 Race Controls", control_widget, self)
        self.addDockWidget(Qt.TopDockWidgetArea, self.control_dock)
        self.toggle_control_action.triggered.connect(
            lambda checked: self.control_dock.setVisible(checked))
        self.control_dock.visibilityChanged.connect(
            lambda visible: self.toggle_control_action.setChecked(visible))
        
        # What-if scenarios dock
        scenario_widget = QWidget()
        scenario_layout = QGridLayout(scenario_widget)
        
        scenario_layout.addWidget(QLabel("Select Car:"), 0, 0)
        self.car_combo = QComboBox()
        for car in self.sim.cars:
            self.car_combo.addItem(f"{car.name} (#{car.id + 1})", car.id)
        scenario_layout.addWidget(self.car_combo, 0, 1, 1, 2)
        
        self.accident_btn = QPushButton("💥 Accident")
        self.accident_btn.clicked.connect(self.trigger_accident)
        scenario_layout.addWidget(self.accident_btn, 1, 0)
        
        self.engine_btn = QPushButton("🔧 Engine Fail")
        self.engine_btn.clicked.connect(self.trigger_engine_failure)
        scenario_layout.addWidget(self.engine_btn, 1, 1)
        
        self.pit_btn = QPushButton("🛠️ Pit Stop")
        self.pit_btn.clicked.connect(self.trigger_pit_stop)
        scenario_layout.addWidget(self.pit_btn, 1, 2)
        
        scenario_layout.addWidget(QLabel("Weather:"), 2, 0)
        self.weather_combo = QComboBox()
        self.weather_combo.addItems(["Clear", "Rain", "Fog"])
        scenario_layout.addWidget(self.weather_combo, 2, 1)
        
        self.weather_btn = QPushButton("🌦️ Change")
        self.weather_btn.clicked.connect(self.change_weather)
        scenario_layout.addWidget(self.weather_btn, 2, 2)
        
        self.scenario_dock = DetachableWidget("⚙️ What-If Scenarios", scenario_widget, self)
        self.addDockWidget(Qt.TopDockWidgetArea, self.scenario_dock)
        self.toggle_scenario_action.triggered.connect(
            lambda checked: self.scenario_dock.setVisible(checked))
        self.scenario_dock.visibilityChanged.connect(
            lambda visible: self.toggle_scenario_action.setChecked(visible))
        
        # Leaderboard dock
        leaderboard_widget = QWidget()
        leaderboard_layout = QVBoxLayout(leaderboard_widget)
        
        self.leaderboard_table = QTableWidget()
        self.leaderboard_table.setColumnCount(6)
        self.leaderboard_table.setHorizontalHeaderLabels(
            ["Pos", "Car", "Lap", "Speed", "Status", "Time"])
        self.leaderboard_table.setRowCount(10)
        leaderboard_layout.addWidget(self.leaderboard_table)
        
        self.leaderboard_dock = DetachableWidget("🏁 Live Leaderboard", leaderboard_widget, self)
        self.addDockWidget(Qt.RightDockWidgetArea, self.leaderboard_dock)
        self.toggle_leaderboard_action.triggered.connect(
            lambda checked: self.leaderboard_dock.setVisible(checked))
        self.leaderboard_dock.visibilityChanged.connect(
            lambda visible: self.toggle_leaderboard_action.setChecked(visible))
        
        # Telemetry dock
        telemetry_widget = QWidget()
        telemetry_layout = QVBoxLayout(telemetry_widget)
        
        self.telemetry_text = QTextEdit()
        self.telemetry_text.setReadOnly(True)
        telemetry_layout.addWidget(self.telemetry_text)
        
        self.telemetry_dock = DetachableWidget("📊 Vehicle Telemetry", telemetry_widget, self)
        self.addDockWidget(Qt.RightDockWidgetArea, self.telemetry_dock)
        self.toggle_telemetry_action.triggered.connect(
            lambda checked: self.telemetry_dock.setVisible(checked))
        self.telemetry_dock.visibilityChanged.connect(
            lambda visible: self.toggle_telemetry_action.setChecked(visible))
        
        # Speed chart dock
        self.telemetry_chart = TelemetryChart(width=6, height=4)
        self.chart_dock = DetachableWidget("📈 Speed Telemetry Chart", self.telemetry_chart, self)
        self.addDockWidget(Qt.BottomDockWidgetArea, self.chart_dock)
        self.toggle_chart_action.triggered.connect(
            lambda checked: self.chart_dock.setVisible(checked))
        self.chart_dock.visibilityChanged.connect(
            lambda visible: self.toggle_chart_action.setChecked(visible))
        
        # Event log dock
        event_widget = QWidget()
        event_layout = QVBoxLayout(event_widget)
        
        self.event_log = QTextEdit()
        self.event_log.setReadOnly(True)
        event_layout.addWidget(self.event_log)
        
        self.event_dock = DetachableWidget("📢 Event Log", event_widget, self)
        self.addDockWidget(Qt.BottomDockWidgetArea, self.event_dock)
        self.toggle_events_action.triggered.connect(
            lambda checked: self.event_dock.setVisible(checked))
        self.event_dock.visibilityChanged.connect(
            lambda visible: self.toggle_events_action.setChecked(visible))
    
    def reset_layout(self):
        """Reset dock widget layout to default"""
        # Reset all docks to default positions
        self.addDockWidget(Qt.TopDockWidgetArea, self.control_dock)
        self.addDockWidget(Qt.TopDockWidgetArea, self.scenario_dock)
        self.addDockWidget(Qt.RightDockWidgetArea, self.leaderboard_dock)
        self.addDockWidget(Qt.RightDockWidgetArea, self.telemetry_dock)
        self.addDockWidget(Qt.BottomDockWidgetArea, self.chart_dock)
        self.addDockWidget(Qt.BottomDockWidgetArea, self.event_dock)
        
        # Show all docks
        self.control_dock.show()
        self.scenario_dock.show()
        self.leaderboard_dock.show()
        self.telemetry_dock.show()
        self.chart_dock.show()
        self.event_dock.show()
        
        # Update menu actions
        self.toggle_control_action.setChecked(True)
        self.toggle_scenario_action.setChecked(True)
        self.toggle_leaderboard_action.setChecked(True)
        self.toggle_telemetry_action.setChecked(True)
        self.toggle_chart_action.setChecked(True)
        self.toggle_events_action.setChecked(True)
    
    def update_simulation(self):
        """Main update loop"""
        if self.sim.is_running and not self.sim.is_paused:
            self.sim.update()
            
            if self.sim.race_finished:
                winner = self.sim.get_leaderboard()[0]
                self.status_label.setText(f"🏁 RACE FINISHED! Winner: {winner.name} ({winner.finish_time:.2f}s)")
                self.status_label.setStyleSheet("color: #FFD700; font-weight: bold; font-size: 16px;")
        
        # Update visualizations
        self.track_widget.update()
        self.update_leaderboard()
        self.update_telemetry()
        self.update_event_log()
        
        # Update telemetry chart every 10 frames (reduce CPU usage)
        self.frame_counter += 1
        if self.frame_counter % 10 == 0:
            self.telemetry_chart.update_plot(self.sim)
    
    def update_leaderboard(self):
        """Update leaderboard table"""
        leaderboard = self.sim.get_leaderboard()
        
        self.leaderboard_table.setRowCount(max(len(leaderboard), 10))
        
        for i in range(len(leaderboard)):
            car = leaderboard[i]
            
            # Position
            self.leaderboard_table.setItem(i, 0, QTableWidgetItem(str(i + 1)))
            
            # Car name with color
            car_item = QTableWidgetItem(f"⬤ {car.name}")
            car_item.setForeground(QColor(car.color))
            self.leaderboard_table.setItem(i, 1, car_item)
            
            # Lap
            lap_text = f"{car.lap}/{self.sim.num_laps}"
            self.leaderboard_table.setItem(i, 2, QTableWidgetItem(lap_text))
            
            # Speed
            speed_text = f"{car.speed:.1f} km/h"
            self.leaderboard_table.setItem(i, 3, QTableWidgetItem(speed_text))
            
            # Status
            status_text = car.status
            if car.in_pit:
                status_text = "Pitting"
            status_item = QTableWidgetItem(status_text)
            
            if car.status == "Finished":
                status_item.setForeground(QColor("#FFD700"))
            elif car.status == "Racing":
                status_item.setForeground(QColor("#00ff00"))
            elif car.in_pit:
                status_item.setForeground(QColor("#ffff00"))
            else:
                status_item.setForeground(QColor("#ff0000"))
            self.leaderboard_table.setItem(i, 4, status_item)
            
            # Time
            time_text = f"{car.total_time:.2f}s"
            self.leaderboard_table.setItem(i, 5, QTableWidgetItem(time_text))
    
    def update_telemetry(self):
        """Update telemetry display"""
        html = "<div style='font-family: Courier New; color: #00ffff;'>"
        html += "<b>🔧 VEHICLE CONDITION</b><br/><br/>"
        
        leaderboard = self.sim.get_leaderboard()
        for car in leaderboard[:6]:  # Top 6 cars
            status_symbol = "🏁" if car.status == "Finished" else "🏎️" if car.status == "Racing" else "❌"
            html += f"<span style='color: {car.color};'><b>{status_symbol} {car.name}</b></span><br/>"
            html += f"├ Tyres: {car.tyre_wear:.1f}% worn<br/>"
            html += f"├ Fuel: {car.fuel:.1f}%<br/>"
            html += f"├ Damage: {car.damage:.1f}%<br/>"
            html += f"└ Power: {car.engine_power:.1f}%<br/><br/>"
        
        html += "</div>"
        self.telemetry_text.setHtml(html)
    
    def update_event_log(self):
        """Update event log"""
        html = "<div style='font-family: Courier New;'>"
        
        recent_events = self.sim.events[-20:]
        for event in reversed(recent_events):
            color = {
                'Accident': '#ff0000',
                'Collision': '#ff3333',
                'Debris': '#ff9900',
                'Pit Stop': '#ffff00',
                'Engine Failure': '#ff6600',
                'Weather': '#00ccff',
                'Finish': '#FFD700'
            }.get(event.type, '#ffffff')
            
            html += f"<span style='color: {color};'>"
            html += f"[{event.timestamp:.1f}s] {event.description}"
            html += "</span><br/>"
        
        html += "</div>"
        self.event_log.setHtml(html)
    
    def start_race(self):
        """Start the race"""
        self.sim.is_running = True
        self.sim.is_paused = False
        self.status_label.setText("🏁 Race in progress...")
        self.status_label.setStyleSheet("color: #00ff00; font-weight: bold;")
    
    def pause_race(self):
        """Pause/resume race"""
        self.sim.is_paused = not self.sim.is_paused
        if self.sim.is_paused:
            self.status_label.setText("⏸️ Race paused")
            self.pause_btn.setText("▶️ Resume")
        else:
            self.status_label.setText("🏁 Race in progress...")
            self.pause_btn.setText("⏸️ Pause")
    
    def reset_race(self):
        """Reset simulation"""
        self.sim = VeloraRaceSimulation(num_cars=8, num_laps=5, use_gpu=GPU_AVAILABLE)
        self.track_widget.sim = self.sim
        self.status_label.setText("🔄 Simulation reset. Ready to race!")
        self.status_label.setStyleSheet("color: #00ff00; font-weight: bold;")
        self.pause_btn.setText("⏸️ Pause")
        
        # Update car combo
        self.car_combo.clear()
        for car in self.sim.cars:
            self.car_combo.addItem(f"{car.name} (#{car.id + 1})", car.id)
        
        # Clear displays
        self.event_log.clear()
        self.frame_counter = 0
        
        # Force chart update
        self.telemetry_chart.update_plot(self.sim, force=True)
    
    def trigger_accident(self):
        """Trigger accident for selected car"""
        car_id = self.car_combo.currentData()
        self.sim.trigger_accident(car_id)
        self.status_label.setText(f"💥 Accident: {self.sim.cars[car_id].name}!")
        self.status_label.setStyleSheet("color: #ff0000; font-weight: bold;")
        
        # Force immediate chart update
        self.telemetry_chart.update_plot(self.sim, force=True)
    
    def trigger_engine_failure(self):
        """Trigger engine failure"""
        car_id = self.car_combo.currentData()
        self.sim.trigger_engine_failure(car_id)
        self.status_label.setText(f"🔧 Engine failure: {self.sim.cars[car_id].name}!")
        self.status_label.setStyleSheet("color: #ff6600; font-weight: bold;")
        
        # Force immediate chart update
        self.telemetry_chart.update_plot(self.sim, force=True)
    
    def trigger_pit_stop(self):
        """Send car to pit"""
        car_id = self.car_combo.currentData()
        self.sim.trigger_pit_stop(car_id)
        self.status_label.setText(f"🛠️ {self.sim.cars[car_id].name} pitting!")
        self.status_label.setStyleSheet("color: #ffff00; font-weight: bold;")
        
        # Force immediate chart update
        self.telemetry_chart.update_plot(self.sim, force=True)
    
    def change_weather(self):
        """Change weather conditions"""
        weather = self.weather_combo.currentText()
        self.sim.change_weather(weather)
        self.status_label.setText(f"🌦️ Weather changed to {weather}")
        self.status_label.setStyleSheet("color: #00ccff; font-weight: bold;")
        
        # Force immediate chart update
        self.telemetry_chart.update_plot(self.sim, force=True)
    
    def export_data(self, file_format):
        """Export simulation data"""
        directory = QFileDialog.getExistingDirectory(self, "Select Export Directory")
        if directory:
            message = self.sim.export_data(directory, file_format)
            self.status_label.setText(f"💾 {message}")
            self.status_label.setStyleSheet("color: #00ff00; font-weight: bold;")


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    """Main application entry point"""
    print("=" * 70)
    print("🏎️  VELORA - Dynamic Racing Simulation System")
    print("=" * 70)
    print()
    
    if GPU_AVAILABLE:
        print("✓ GPU Acceleration: ENABLED")
        print(f"  Device: {torch.cuda.get_device_name(0)}")
    else:
        print("⚠ GPU Acceleration: DISABLED (CPU Mode)")
    
    print()
    print("Starting application...")
    print()
    print("💡 TIP: Use View menu to detach panels for multi-screen setup!")
    print()
    
    app = QApplication(sys.argv)
    
    # Set application-wide font
    font = QFont("Segoe UI", 10)
    app.setFont(font)
    
    window = VeloraMainWindow()
    window.show()
    
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()