import React from 'react';
import { Car } from '../types/models';
import { motion } from 'framer-motion';

interface LeaderboardProps {
  cars: Car[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ cars }) => {
  // Determine time difference from the car in front
  const getDiff = (index: number, car: Car): string => {
    if (index === 0) return 'LEADER';
    const leader = cars[0];

    // Simple diff logic: difference in leader's best lap and this car's best lap, scaled by current lap.
    // In a real simulator, this would be a time gap in seconds.
    if (!leader.bestLapTime || !car.bestLapTime) return '---';

    const timeDiff = car.bestLapTime - leader.bestLapTime;
    return `+${timeDiff.toFixed(3)}s (${leader.lap - car.lap} Lap${leader.lap - car.lap !== 1 ? 's' : ''})`;
  };

  return (
    <motion.div
      className="bg-gray-800 rounded-xl shadow-2xl p-4 h-full overflow-hidden"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-2xl font-bold text-red-500 border-b border-gray-700 pb-3 mb-3">
        LEADERBOARD
      </h3>
      <div className="overflow-y-auto h-[calc(100vh-250px)] custom-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="uppercase text-sm text-gray-400">
              <th className="py-2">POS</th>
              <th>CAR</th>
              <th>LAP</th>
              <th>DIFF</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car, index) => (
              <tr
                key={car.id}
                className={`border-b border-gray-700 transition-all duration-150 ${index === 0 ? 'bg-red-900/40 font-bold' : 'hover:bg-gray-700'}`}
              >
                <td className="py-2 text-xl font-extrabold" style={{ color: car.color }}>
                  {index + 1}
                </td>
                <td className='flex items-center gap-2'>
                    <div className='w-2 h-2 rounded-full' style={{backgroundColor: car.color}}></div>
                    {car.name}
                </td>
                <td>{car.lap}</td>
                <td className={index === 0 ? 'text-green-400' : 'text-yellow-400'}>{getDiff(index, car)}</td>
                <td className={`${car.dnf ? 'text-red-500' : car.pitStatus ? 'text-blue-400' : 'text-green-400'}`}>
                    {car.dnf ? 'DNF' : car.pitStatus ? 'PIT' : 'RACING'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};