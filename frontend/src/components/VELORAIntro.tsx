import React from 'react';
import { motion } from 'framer-motion';

interface VELORAIntroProps {
  onAnimationEnd: () => void;
}

export const VELORAIntro: React.FC<VELORAIntroProps> = ({ onAnimationEnd }) => {
  const text = "VELORA";
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: i * 0.1 },
    }),
  };

  const childVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <motion.h1
        className="text-7xl md:text-9xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 shadow-2xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onAnimationComplete={onAnimationEnd}
      >
        {Array.from(text).map((char, index) => (
          <motion.span key={index} variants={childVariants} className="inline-block">
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.h1>
    </div>
  );
};