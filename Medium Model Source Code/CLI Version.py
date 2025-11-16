import time
import json
import os


class Car:
    """Represents a racing car with individual characteristics"""
    
    def __init__(self, name, top_speed, pit_stops, track_length):
        self.name = name
        self.top_speed = top_speed  # km/h
        self.track_length = track_length  # meters
        self.speed = top_speed  # Current speed
        self.pit_stops = pit_stops  # List of laps to pit
        self.completed_laps = 0
        self.total_time = 0  # Total race time in seconds
        self.is_pitting = False
        self.next_pit_stop_index = 0
    
    def calculate_lap_time(self):
        """Calculate time to complete one lap at current speed (in seconds)"""
        if self.speed == 0:
            return float('inf')
        # Time = Distance / Speed
        # track_length in meters, speed in km/h -> convert to m/s
        speed_ms = self.speed * 1000 / 3600
        return self.track_length / speed_ms
    
    def complete_lap(self):
        """Complete a lap and update time"""
        lap_time = self.calculate_lap_time()
        self.total_time += lap_time
        self.completed_laps += 1
        
        # Check if we need to pit on the NEXT lap
        if (self.next_pit_stop_index < len(self.pit_stops) and 
            self.completed_laps + 1 == self.pit_stops[self.next_pit_stop_index]):
            self.enter_pit()
            self.next_pit_stop_index += 1
    
    def enter_pit(self):
        """Enter pit stop"""
        self.is_pitting = True
        pit_stop_time = 20  # 20 seconds
        self.total_time += pit_stop_time
        self.is_pitting = False  # Exit immediately after adding time


class Race:
    """Manages the overall race simulation"""
    
    def __init__(self, track_length, num_laps, cars):
        self.track_length = track_length  # meters
        self.num_laps = num_laps
        self.cars = cars
    
    def run(self):
        """Main race loop - simulates the race"""
        print(f"\n{'='*70}")
        print(f"🏁 RACE START! {self.num_laps} laps on a {self.track_length/1000:.1f}km track")
        print(f"{'='*70}\n")
        
        # Separate active cars from DNF cars
        active_cars = [car for car in self.cars if car.top_speed > 0]
        dnf_cars = [car for car in self.cars if car.top_speed == 0]
        
        if dnf_cars:
            print("⚠️  DNF (Did Not Finish) - Cars with no speed data:")
            for car in dnf_cars:
                print(f"   ❌ {car.name} - No speed data (DNF)")
            print()
        
        if not active_cars:
            print("❌ No active cars to race!")
            return
        
        # Simulate lap by lap
        for lap in range(1, self.num_laps + 1):
            print(f"\n--- LAP {lap} ---")
            
            # Each car completes the lap
            for car in active_cars:
                car.complete_lap()
                
                # Show status
                time_str = self.format_time(car.total_time)
                pit_msg = " 🔧 PIT STOP" if (car.next_pit_stop_index > 0 and 
                          lap in car.pit_stops[:car.next_pit_stop_index]) else ""
                print(f"  {car.name:<12} | Time: {time_str}{pit_msg}")
        
        print(f"\n{'='*70}")
        print("🏁 RACE FINISHED!")
        print(f"{'='*70}\n")
        self.show_leaderboard(active_cars, dnf_cars)
    
    def format_time(self, seconds):
        """Format seconds into MM:SS.mmm"""
        minutes = int(seconds // 60)
        secs = seconds % 60
        return f"{minutes:02d}:{secs:06.3f}"
    
    def show_leaderboard(self, active_cars, dnf_cars=[]):
        """Display final race results"""
        # Sort cars by total time (ascending - fastest first)
        sorted_cars = sorted(active_cars, key=lambda c: c.total_time)
        
        print("\n🏆 FINAL LEADERBOARD 🏆")
        print(f"{'='*70}")
        print(f"{'Pos':<5} {'Driver':<15} {'Total Time':<20} {'Gap':<15}")
        print(f"{'-'*70}")
        
        winner_time = sorted_cars[0].total_time if sorted_cars else 0
        
        for i, car in enumerate(sorted_cars, 1):
            time_str = self.format_time(car.total_time)
            
            if i == 1:
                gap_str = "---"
            else:
                gap = car.total_time - winner_time
                gap_str = f"+{self.format_time(gap)}"
            
            print(f"{i:<5} {car.name:<15} {time_str:<20} {gap_str:<15}")
        
        # Show DNF cars
        if dnf_cars:
            print(f"{'-'*70}")
            for car in dnf_cars:
                print(f"DNF  {car.name:<15} {'Did Not Finish':<20} {'No data':<15}")
        
        print(f"{'='*70}\n")
        if sorted_cars:
            print(f"🥇 Winner: {sorted_cars[0].name} in {self.format_time(winner_time)}!")


def load_data_from_json(filepath):
    """Load race data from JSON file"""
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        starting_grid = []
        car_speeds = []
        pit_stops_per_car = []
        
        for driver_data in data:
            starting_grid.append(driver_data["Driver"])
            car_speeds.append(float(driver_data["Avg Speed in Fastest Lap"]))
            pit_stops_per_car.append(driver_data["Lap Numbers"])
        
        print(f"\n✅ Successfully loaded data for {len(starting_grid)} drivers from JSON")
        return starting_grid, car_speeds, pit_stops_per_car
    
    except FileNotFoundError:
        print(f"❌ Error: File '{filepath}' not found")
        return None, None, None
    except json.JSONDecodeError:
        print(f"❌ Error: Invalid JSON format in '{filepath}'")
        return None, None, None
    except KeyError as e:
        print(f"❌ Error: Missing required field {e} in JSON")
        return None, None, None


def collect_lightweight_data():
    """Collect race data from user input"""
    print("\n" + "="*70)
    print("  VELORA F1 SIMULATION - LIGHTWEIGHT MODEL")
    print("="*70 + "\n")
    
    # Ask for input method
    print("Data Input Options:")
    print("1. Manual input (enter data step by step)")
    print("2. Load from JSON file")
    input_method = input("Choose option (1 or 2): ").strip()
    
    if input_method == "2":
        filepath = input("\nEnter JSON file path (e.g., race_data.json): ").strip()
        return load_data_from_json(filepath)
    
    # Manual input (original method)
    # Get starting grid
    starting_grid_input = input("\nEnter starting grid (comma-separated names, e.g., Max,Lewis,Lando): ")
    starting_grid = [name.strip() for name in starting_grid_input.split(',')]
    
    # Get speeds - either top speeds or max speeds reached
    print("\nSpeed Input Options:")
    print("1. Top speeds (theoretical maximum)")
    print("2. Max speeds reached during race (actual data)")
    speed_option = input("Choose option (1 or 2): ").strip()
    
    if speed_option == "2":
        speeds_input = input(f"Enter max speeds reached for {len(starting_grid)} cars (comma-separated km/h, e.g., 350,330,351): ")
        print("Note: Using max speeds reached as racing speeds")
    else:
        speeds_input = input(f"Enter top speeds for {len(starting_grid)} cars (comma-separated km/h, e.g., 350,330,351): ")
    
    car_speeds = [float(speed.strip()) for speed in speeds_input.split(',')]
    
    # Validate input lengths match
    if len(starting_grid) != len(car_speeds):
        print("Error: Number of cars and speeds must match!")
        return None, None, None
    
    # Get pit stops for each car
    pit_stops_per_car = []
    print("\n--- PIT STOP CONFIGURATION ---")
    for driver in starting_grid:
        num_stops = int(input(f"How many pit stops for {driver}? "))
        if num_stops > 0:
            stops_input = input(f"Enter lap numbers for {driver}'s pit stops (comma-separated): ")
            stops = [int(lap.strip()) for lap in stops_input.split(',')]
        else:
            stops = []
        pit_stops_per_car.append(stops)
    
    return starting_grid, car_speeds, pit_stops_per_car


def main():
    """Main function to run the simulation"""
    print("\n🏎️  Welcome to Velora F1 Simulation! 🏎️")
    print("You have selected: Lightweight Model\n")
    
    # Collect race data
    starting_grid, car_speeds, pit_stops_per_car = collect_lightweight_data()
    
    if starting_grid is None:
        print("Simulation aborted due to input error.")
        return
    
    # Set race parameters
    lap_length = float(input("\nEnter the length of 1 lap (in km): "))
    num_laps = int(input("Enter number of laps for the race: "))
    
    track_length = lap_length * 1000  # Convert km to meters
    total_distance = lap_length * num_laps
    
    print(f"\n📏 Track Configuration:")
    print(f"   Lap length: {lap_length} km")
    print(f"   Number of laps: {num_laps}")
    print(f"   Total race distance: {total_distance} km")
    
    # Create car objects
    cars = []
    for i, driver in enumerate(starting_grid):
        car = Car(driver, car_speeds[i], pit_stops_per_car[i], track_length)
        cars.append(car)
    
    # Initialize and run race
    race = Race(track_length, num_laps, cars)
    race.run()


if __name__ == "__main__":
    main()