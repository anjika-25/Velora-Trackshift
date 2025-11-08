import React from 'react';
import { motion } from 'framer-motion';

interface RaceSetupFormProps {
  onStartRace: (settings: RaceSettings) => void;
  onBack?: () => void;
}

import { WeatherCondition, TyreCompound } from '../types/models';

export interface RaceSettings {
  numberOfCars: number;
  numberOfLaps: number;
  weather: WeatherCondition;
  tyreType: TyreCompound;
}

export const RaceSetupForm: React.FC<RaceSetupFormProps> = ({ onStartRace, onBack }) => {
  const [settings, setSettings] = React.useState<RaceSettings>({
    numberOfCars: 10,
    numberOfLaps: 5,
    weather: 'Sunny',
    tyreType: 'Dry'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartRace(settings);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
    >
      <motion.form 
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-red-500">Race Setup</h2>
          {onBack && (
            <motion.button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back
            </motion.button>
          )}
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Number of Cars</label>
            <input
              type="number"
              min="2"
              max="20"
              value={settings.numberOfCars}
              onChange={(e) => setSettings({...settings, numberOfCars: parseInt(e.target.value)})}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Number of Laps</label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.numberOfLaps}
              onChange={(e) => setSettings({...settings, numberOfLaps: parseInt(e.target.value)})}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Weather Condition</label>
            <select
              value={settings.weather}
              onChange={(e) => setSettings({...settings, weather: e.target.value as RaceSettings['weather']})}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Sunny">Sunny</option>
              <option value="Rainy">Rainy</option>
              <option value="Cloudy">Cloudy</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Tyre Type</label>
            <select
              value={settings.tyreType}
              onChange={(e) => setSettings({...settings, tyreType: e.target.value as RaceSettings['tyreType']})}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Dry">Dry</option>
              <option value="Wet">Wet</option>
            </select>
          </div>

          <motion.button
            type="submit"
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold mt-4 hover:bg-red-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Race
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
};