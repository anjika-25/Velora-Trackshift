import React, { useState } from 'react';
import { Car, TyreCompound, WeatherCondition } from '../types/models';
import { motion } from 'framer-motion';

interface RaceControlsProps {
  status: 'pending' | 'running' | 'paused' | 'finished';
  onStart: () => void;
  onPause: () => void;
  onEndRace: () => void;
  onTyreChange: (tyre: TyreCompound) => void;
  onWeatherChange: (weather: WeatherCondition) => void;
  onControlAction: (actionType: string, carId?: string) => void;
  cars: Car[];
  weather: WeatherCondition;
  tyreCompound: TyreCompound;
}

export const RaceControls: React.FC<RaceControlsProps> = ({
  status,
  onStart,
  onPause,
  onEndRace,
  onTyreChange,
  onWeatherChange,
  onControlAction,
  cars,
  weather,
  tyreCompound,
}) => {
  const [selectedCarId, setSelectedCarId] = useState(cars[0]?.id || '');

  React.useEffect(() => {
    if (!selectedCarId && cars.length > 0) {
      setSelectedCarId(cars[0].id);
    }
  }, [cars, selectedCarId]);

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl p-5 flex flex-wrap gap-4 items-center justify-between">
      {/* Race Control Buttons */}
      <div className="flex gap-3">
        <motion.button
          onClick={onStart}
          disabled={status === 'running'}
          className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          {status === 'pending' ? 'Start' : 'Resume'}
        </motion.button>
        <motion.button
          onClick={onPause}
          disabled={status !== 'running'}
          className="px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          Pause
        </motion.button>
        <motion.button
          onClick={onEndRace}
          disabled={status === 'finished'}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          End Race
        </motion.button>
      </div>

      {/* Telemetry Controls */}
      <div className="flex flex-wrap gap-4 items-center text-sm">
        {/* Weather Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-gray-300">Weather:</label>
          <select
            value={weather}
            onChange={(e) => onWeatherChange(e.target.value as WeatherCondition)}
            className="bg-gray-700 text-white rounded p-1.5 border border-gray-600 focus:ring-red-500 focus:border-red-500"
          >
            <option>Sunny</option>
            <option>Rainy</option>
            <option>Snow</option>
          </select>
        </div>

        {/* Tyre Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-gray-300">Tyres:</label>
          <select
            value={tyreCompound}
            onChange={(e) => onTyreChange(e.target.value as TyreCompound)}
            className="bg-gray-700 text-white rounded p-1.5 border border-gray-600 focus:ring-red-500 focus:border-red-500"
          >
            <option>Dry</option>
            <option>Wet</option>
          </select>
        </div>

        {/* Vehicle Dropdown for Actions */}
        <div className="flex items-center gap-2">
          <label className="text-gray-300">Target Car:</label>
          <select
            value={selectedCarId}
            onChange={(e) => setSelectedCarId(e.target.value)}
            className="bg-gray-700 text-white rounded p-1.5 border border-gray-600 focus:ring-red-500 focus:border-red-500 w-24"
          >
            {cars.map(car => (
              <option key={car.id} value={car.id}>{car.name}</option>
            ))}
          </select>
        </div>

        {/* Accident Button */}
        <motion.button
          onClick={() => onControlAction('Accident', selectedCarId)}
          disabled={!selectedCarId || status !== 'running'}
          className="px-3 py-1.5 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          Accident
        </motion.button>

        {/* Pit Stop Button */}
        <motion.button
          onClick={() => onControlAction('Pit Stop', selectedCarId)}
          disabled={!selectedCarId || status !== 'running' || cars.find(c => c.id === selectedCarId)?.pitStatus}
          className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          whileHover={{ scale: 1.05 }}
        >
          Pit Stop
        </motion.button>
      </div>
    </div>
  );
};