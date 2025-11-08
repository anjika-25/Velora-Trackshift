import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TelemetryCharts } from './TelemetryCharts';
import { TrackView } from './TrackView';
import { Track, Car, Race, RaceStatus, WeatherCondition, TyreCompound } from '../types/models';

interface Props {
  track: Track;
  raceSettings: {
    numberOfCars: number;
    numberOfLaps: number;
    weather: WeatherCondition;
    tyreType: TyreCompound;
  };
  onBack?: () => void;
}

const generateRandomName = () => {
  const prefixes = ['Super', 'Turbo', 'Nitro', 'Racing', 'Speed'];
  const names = ['Racer', 'Driver', 'Pilot', 'Champion', 'Star'];
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${names[Math.floor(Math.random() * names.length)]} ${Math.floor(Math.random() * 100)}`;
};

export function RaceDashboard({ track, raceSettings, onBack }: Props) {
  // Calculate total track points (like Python: len(track_data['x']))
  const totalTrackPoints = track.checkpoints.length;
  
  // Initialize cars positioned along track path (like Python: position=i * (total_points / num_cars))
  const initialCars = Array.from({ length: raceSettings.numberOfCars }, (_, i) => {
    // Position cars along track path, spaced evenly (like Python)
    const trackPosition = (i * totalTrackPoints) / raceSettings.numberOfCars;
    const normalizedPosition = trackPosition / totalTrackPoints;
    
    // Get actual x,y position on track at this normalized position
    const checkpointIndex = Math.floor(normalizedPosition * totalTrackPoints) % totalTrackPoints;
    const nextIndex = (checkpointIndex + 1) % totalTrackPoints;
    const segmentPos = (normalizedPosition * totalTrackPoints) % 1;
    
    const [x1, y1] = track.checkpoints[checkpointIndex];
    const [x2, y2] = track.checkpoints[nextIndex];
    
    const x = x1 + (x2 - x1) * segmentPos;
    const y = y1 + (y2 - y1) * segmentPos;
    
    return {
      id: `car_${i}`,
      name: generateRandomName(),
      position: [x, y] as [number, number],
      velocity: 0,
      lapTime: 0,
      lastLapTime: null,
      bestLapTime: null,
      tyreWear: 0,
      tyreTemp: 25,
      enginePower: 100,
      dnf: false,
      pitStatus: false,
      lap: 0,
      color: `hsl(${(i * 360) / raceSettings.numberOfCars}, 70%, 50%)`,
      trackPosition: normalizedPosition // Store normalized position along track (0-1)
    };
  });

  const [race, setRace] = useState<Race & { cars: (Car & { trackPosition: number })[] }>({
    id: 'race_' + Date.now(),
    status: 'ready' as RaceStatus,
    laps: raceSettings.numberOfLaps,
    cars: initialCars,
    weather: {
      condition: raceSettings.weather,
      temperature: 25,
      humidity: 60,
      pressure: 1013,
      trackGrip: 1.0
    }
  });

  const [isRunning, setIsRunning] = useState(false);
  
  const sortedCars = [...race.cars].sort((a, b) => {
    if (a.lap === b.lap) {
      return a.lapTime - b.lapTime;
    }
    return b.lap - a.lap;
  });

  const handleStart = () => {
    setIsRunning(true);
    setRace(prev => ({ ...prev, status: 'running' }));
  };

  const handlePause = () => {
    setIsRunning(false);
    setRace(prev => ({ ...prev, status: 'paused' }));
  };

  const handleStop = () => {
    setIsRunning(false);
    setRace(prev => ({ ...prev, status: 'finished' }));
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRace(prev => {
        const updatedCars = prev.cars.map(car => {
          // Move car along track path (like Python: position increments along track)
          const speed = 0.001; // Normalized speed (0-1 range)
          let newTrackPosition = (car.trackPosition + speed) % 1;
          
          // Get checkpoint indices
          const checkpointIndex = Math.floor(newTrackPosition * totalTrackPoints) % totalTrackPoints;
          const nextIndex = (checkpointIndex + 1) % totalTrackPoints;
          const segmentPos = (newTrackPosition * totalTrackPoints) % 1;
          
          // Interpolate position between checkpoints
          const [x1, y1] = track.checkpoints[checkpointIndex];
          const [x2, y2] = track.checkpoints[nextIndex];
          
          const newX = x1 + (x2 - x1) * segmentPos;
          const newY = y1 + (y2 - y1) * segmentPos;
          
          // Check if car crossed start line (completed a lap)
          const crossedStartLine = newTrackPosition < 0.01 && car.trackPosition > 0.99;
          
          return {
            ...car,
            position: [newX, newY] as [number, number],
            trackPosition: newTrackPosition,
            lap: crossedStartLine ? car.lap + 1 : car.lap,
            lapTime: crossedStartLine ? 0 : car.lapTime + 0.1,
            lastLapTime: crossedStartLine ? car.lapTime : car.lastLapTime,
            bestLapTime: crossedStartLine ? 
              (car.bestLapTime === null ? car.lapTime : Math.min(car.lapTime, car.bestLapTime)) 
              : car.bestLapTime,
            velocity: speed * 100 // Convert to velocity for display
          };
        });

        // Check if race is finished
        const allCarsFinished = updatedCars.every(car => car.lap >= prev.laps);
        if (allCarsFinished) {
          clearInterval(interval);
          return { ...prev, cars: updatedCars, status: 'finished' };
        }

        return { ...prev, cars: updatedCars };
      });
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [isRunning, track, raceSettings.numberOfLaps, totalTrackPoints]);

  return (
    <div className="grid grid-cols-4 gap-4 p-4 min-h-screen bg-gray-900">
      <div className="col-span-3 bg-gray-800 rounded-xl p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {onBack && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="px-4 py-2 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white"
                >
                  ← Back
                </motion.button>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{track.name}</h2>
                <div className="flex gap-4">
                  <div className="text-gray-400">
                    <span className="font-semibold">Weather:</span> {race.weather.condition}
                  </div>
                  <div className="text-gray-400">
                    <span className="font-semibold">Tyres:</span> {raceSettings.tyreType}
                  </div>
                  <div className="text-gray-400">
                    <span className="font-semibold">Laps:</span> {raceSettings.numberOfLaps}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {race.status !== 'finished' && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isRunning ? handlePause : handleStart}
                    className={`px-6 py-2 rounded-lg font-semibold ${
                      isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isRunning ? 'Pause' : 'Start'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStop}
                    className="px-6 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700"
                  >
                    Stop
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative h-[600px] mb-4 overflow-hidden rounded-lg bg-black">
          {/* Track view with cars */}
          <TrackView track={track} cars={race.cars} />
        </div>
        
        <TelemetryCharts backend="http://localhost:8000" cars={race.cars} />
      </div>

      <div className="bg-gray-800 rounded-xl p-4">
        <h2 className="text-2xl font-bold text-white mb-4">Leaderboard</h2>
        <div className="space-y-2">
          {sortedCars.map((car, index) => (
            <div
              key={car.id}
              className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white">{index + 1}.</span>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: car.color }}
                />
                <div>
                  <div className="text-white">{car.name}</div>
                  <div className="text-sm text-gray-400">
                    Lap {car.lap}/{raceSettings.numberOfLaps}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white">
                  {car.lastLapTime ? `${car.lastLapTime.toFixed(1)}s` : '-'}
                </div>
                <div className="text-sm text-gray-400">
                  Best: {car.bestLapTime ? `${car.bestLapTime.toFixed(1)}s` : '-'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {race.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg"
          >
            <h3 className="text-xl font-bold text-white mb-2">Race Finished!</h3>
            <p className="text-white">Winner: {sortedCars[0]?.name}</p>
            <p className="text-yellow-100">Best Lap: {sortedCars[0]?.bestLapTime?.toFixed(1)}s</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
