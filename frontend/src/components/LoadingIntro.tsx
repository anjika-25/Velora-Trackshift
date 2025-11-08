import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingIntroProps {
  onComplete: () => void;
}

export const LoadingIntro: React.FC<LoadingIntroProps> = ({ onComplete }) => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Show spinner for 2 seconds, then show text
    const spinnerTimer = setTimeout(() => {
      setShowText(true);
    }, 2000);

    // After text animation, trigger onComplete
    const completionTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(spinnerTimer);
      clearTimeout(completionTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <AnimatePresence>
        {!showText ? (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-16 h-16 border-4 border-t-red-600 border-r-red-600 border-b-transparent border-l-transparent rounded-full animate-spin"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.h1 
              className="text-7xl font-bold text-red-600"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {Array.from("VELORA").map((letter, index) => (
                <motion.span
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 50 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};