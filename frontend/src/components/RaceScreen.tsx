import React, { useState, useEffect, useCallback } from 'react';
import { Car, TrackName, Track, TyreCompound, WeatherCondition, TelemetryData } from '../types/models';
import { tracks, sampleCarNames } from '../utils/trackData';
import { TrackView } from './TrackView';
import { Leaderboard } from './Leaderboard';
import { TelemetryGraphs } from './TelemetryGraphs';
import { RaceControls } from './RaceControls';
import { motion } from 'framer-motion';
import { RaceSetupModal } from './RaceSetupModal';

interface RaceScreenProps {
  trackName: TrackName;
  onBack: () => void;
}

type RaceStatus = 'pending' | 'running' | 'paused' | 'finished';

export const RaceScreen: React.FC<RaceScreenProps> = ({ trackName, onBack }) => {
  const track: Track = tracks[trackName];
  const [status, setStatus] = useState<RaceStatus>('pending');
  const [cars, setCars] = useState<Car[]>([]);
  const [carCount, setCarCount] = useState<number | null>(null);
  const [weather, setWeather] = useState<WeatherCondition>('Sunny');
  const [tyreCompound, setTyreCompound] = useState<TyreCompound>('Dry');
  const [telemetryHistory, setTelemetryHistory] = useState<Record<string, TelemetryData[]>>({});
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);

  // Function to initialize cars
  const initializeCars = (count: number) => {
    const newCars: Car[] = [];
    const carColors = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#D946EF'];
    for (let i = 0; i < count; i++) {
      const carId = `car-${i + 1}`;
      newCars.push({
        id: carId,
        name: sampleCarNames[i % sampleCarNames.length],
        color: carColors[i % carColors.length],
        position: [...track.startLine[0]] as [number, number], // Starting at start line
        velocity: 0,
        lapTime: 0,
        lastLapTime: null,
        bestLapTime: null,
        tyreWear: 100,
        tyreTemp: 90,
        enginePower: 100,
        dnf: false,
        pitStatus: false,
        lap: 0,
      });
      // Initialize empty history for the car
      setTelemetryHistory(prev => ({ ...prev, [carId]: [] }));
    }
    setCars(newCars);
    setCarCount(count);
  };

  // Car simulation function (highly simplified)
  const simulateRace = useCallback((timestamp: DOMHighResTimeStamp) => {
    let prevTime = timestamp;

    const loop = (currentTime: DOMHighResTimeStamp) => {
      const deltaTime = (currentTime - prevTime) / 1000; // time in seconds
      prevTime = currentTime;

      setCars(prevCars => {
        const newCars = prevCars.map(car => {
          if (car.dnf || status !== 'running') return car;

          let newVelocity = car.velocity;
          let newPosition = [...car.position];
          let newLapTime = car.lapTime + deltaTime;

          // Simple acceleration/deceleration logic
          if (status === 'running') {
            newVelocity = Math.min(10 + Math.random() * 5, car.velocity + deltaTime * 2); // Accelerate up to 15 m/s
          } else {
            newVelocity = Math.max(0, car.velocity - deltaTime * 5); // Decelerate
          }

          // Simple movement along a path (using a placeholder for progress on the track)
          const progressStep = newVelocity * deltaTime * 0.1; // Magic number for speed scaling on normalized track

          // --- Placeholder for actual pathfinding/movement logic ---
          // This would be replaced by complex race engine logic
          let currentTrackIndex = parseInt(car.id.split('-')[1]) % track.checkpoints.length;
          // Simple sequential movement:
          if (progressStep > 0) {
            currentTrackIndex = (currentTrackIndex + 1) % track.checkpoints.length;
            newPosition = track.checkpoints[currentTrackIndex] as [number, number];

            // Simple lap increment
            if (currentTrackIndex === 0 && newPosition[0] === track.checkpoints[0][0] && newPosition[1] === track.checkpoints[0][1] && newLapTime > 1) {
                car.lap += 1;
                car.lastLapTime = newLapTime;
                if (!car.bestLapTime || newLapTime < car.bestLapTime) {
                    car.bestLapTime = newLapTime;
                }
                newLapTime = 0; // Start new lap time
            }
          }

          // Simple Telemetry update
          if (car.lap % 1 === 0) { // Update telemetry every second (simplified)
            setTelemetryHistory(prev => ({
              ...prev,
              [car.id]: [...(prev[car.id] || []), {
                time: Math.floor(newLapTime),
                velocity: newVelocity,
                tyreWear: car.tyreWear - (0.01 * deltaTime), // Very slow wear
                enginePower: car.enginePower,
              }].slice(-60) // Keep last 60 seconds/points
            }));
          }

          return {
            ...car,
            position: newPosition,
            velocity: newVelocity,
            lapTime: newLapTime,
            tyreWear: car.tyreWear - (0.005 * deltaTime),
          };
        });

        // Simple sorting for leaderboard position
        newCars.sort((a, b) => {
            // Sort by lap number (desc), then best lap time (asc)
            if (b.lap !== a.lap) return b.lap - a.lap;
            if (a.bestLapTime && b.bestLapTime) return a.bestLapTime - b.bestLapTime;
            return 0;
        });

        return newCars;
      });

      if (status === 'running' || status === 'paused') {
        setAnimationFrame(requestAnimationFrame(loop));
      }
    };

    setAnimationFrame(requestAnimationFrame(loop));
  }, [track, status]);

  // Handle Race Status changes
  useEffect(() => {
    if (status === 'running') {
      simulateRace(performance.now());
    } else if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      setAnimationFrame(null);
    }
    return () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [status, simulateRace, animationFrame]);

  // Race Control Handlers
  const handleStart = () => setStatus('running');
  const handlePause = () => setStatus('paused');
  const handleEndRace = () => setStatus('finished');

  const handleControlAction = (actionType: string, carId?: string) => {
    if (actionType === 'Accident' && carId) {
        setCars(prev => prev.map(c => c.id === carId ? { ...c, dnf: true, velocity: 0 } : c));
    } else if (actionType === 'Pit Stop' && carId) {
        setCars(prev => prev.map(c => {
            if (c.id === carId) {
                c.pitStatus = true;
                c.velocity = 0;
                // Simulate pit stop duration
                setTimeout(() => {
                    setCars(next => next.map(nc => nc.id === carId ? { ...nc, pitStatus: false, tyreWear: 100 } : nc));
                }, 5000);
            }
            return c;
        }));
    }
  };


  if (carCount === null) {
    return <RaceSetupModal onSubmit={initializeCars} maxCars={10} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left Column - Leaderboard */}
        <div className="lg:col-span-1">
          <button
            onClick={onBack}
            className="mb-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            &larr; Back to Tracks
          </button>
          <Leaderboard cars={cars} />
        </div>

        {/* Center/Main Column - Track View and Controls */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-6">
          <RaceControls
            status={status}
            onStart={handleStart}
            onPause={handlePause}
            onEndRace={handleEndRace}
            onTyreChange={setTyreCompound}
            onWeatherChange={setWeather}
            onControlAction={handleControlAction}
            cars={cars}
            weather={weather}
            tyreCompound={tyreCompound}
          />
          <div className="bg-gray-800 rounded-xl shadow-2xl p-4 aspect-video">
            <TrackView track={track} cars={cars} />
          </div>
        </div>

        {/* Right Column - Telemetry Graphs */}
        <div className="lg:col-span-4 xl:col-span-1 flex flex-col gap-6">
          <TelemetryGraphs cars={cars} telemetryHistory={telemetryHistory} />
        </div>
      </motion.div>
    </div>
  );
};