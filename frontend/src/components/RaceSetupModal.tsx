import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface RaceSetupModalProps {
  onSubmit: (carCount: number) => void;
  maxCars: number;
}

export const RaceSetupModal: React.FC<RaceSetupModalProps> = ({ onSubmit, maxCars }) => {
  const [count, setCount] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(count);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/90 z-50 flex items-center justify-center">
      <motion.div
        className="bg-gray-800 p-8 rounded-xl shadow-3xl w-full max-w-md border-t-4 border-red-600"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <h2 className="text-3xl font-bold text-red-500 mb-6 text-center">🏁 Race Setup</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="car-count" className="block text-lg font-medium text-gray-300 mb-2">
              Number of Cars ({count})
            </label>
            <input
              id="car-count"
              type="range"
              min="2"
              max={maxCars}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-red-600"
            />
            <div className='flex justify-between text-sm text-gray-400 mt-1'>
                <span>2</span>
                <span>{maxCars}</span>
            </div>
          </div>
          <motion.button
            type="submit"
            className="w-full py-3 bg-red-600 text-white font-bold rounded-lg text-xl hover:bg-red-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Grid Setup
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};