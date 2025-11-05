import { Track } from '../types/models';

export const defaultTrack: Track = {
  id: 'default',
  name: 'Sample Track',
  type: 'grandPrix',
  checkpoints: [
    [0.1, 0.2, 0],
    [0.3, 0.2, 0],
    [0.5, 0.3, 0],
    [0.7, 0.5, 0],
    [0.8, 0.7, 0],
    [0.7, 0.8, 0],
    [0.5, 0.8, 0],
    [0.3, 0.7, 0],
    [0.2, 0.5, 0],
  ],
  pitLane: {
    entry: [0.4, 0.3, 0],
    exit: [0.6, 0.3, 0]
  },
  frictionMap: Array(10).fill(Array(10).fill(1.0))
};