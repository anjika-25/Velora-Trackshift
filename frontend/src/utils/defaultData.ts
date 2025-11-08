import { Track } from '../types/models';

export const defaultTrack: Track = {
  id: 'default',
  name: 'Sample Track',
  type: 'grandPrix',
  checkpoints: [
    [0.2, 0.2, 0],  // Start point
    [0.4, 0.2, 0],  // Turn 1
    [0.6, 0.3, 0],  // Turn 2
    [0.8, 0.5, 0],  // Turn 3
    [0.8, 0.7, 0],  // Turn 4
    [0.6, 0.8, 0],  // Turn 5
    [0.4, 0.8, 0],  // Turn 6
    [0.2, 0.7, 0],  // Turn 7
    [0.2, 0.5, 0],  // Final turn
    [0.2, 0.2, 0],  // Back to start
  ],
  pitLane: {
    entry: [0.4, 0.3, 0],
    exit: [0.6, 0.3, 0]
  },
  frictionMap: Array.from({ length: 10 }, () => Array(10).fill(1.0))
};