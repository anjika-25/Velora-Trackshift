import { Track, TrackName, TrackType } from '../types/models';
import { pythonTrackToCheckpoints } from './pythonTrackLoader';
import silverstoneImage from '../assets/1.png';
import interlagosImage from '../assets/4.png';
import nurburgringImage from '../assets/5.png';
import lagunaSecaImage from '../assets/6.png';
import brandsHatchImage from '../assets/7.png';
import watkinsGlenImage from '../assets/8.png';
import roadAmericaImage from '../assets/9.png';
import barcelonaImage from '../assets/10.png';
import cotaImage from '../assets/12.png';

// Helper function to generate standard checkpoints for a track
const generateCheckpoints = (): [number, number, number][] => [
  [0.1, 0.5, 0],    // Start line
  [0.2, 0.5, 0],    // First straight
  [0.3, 0.4, 45],   // First turn
  [0.4, 0.3, 90],   // Second turn
  [0.6, 0.3, 0],    // Back straight
  [0.7, 0.4, -45],  // Final turn
  [0.8, 0.5, 0],    // Final straight
  [0.9, 0.5, 0]     // Finish line
];

// Helper function to create a track with Python track data
const createTrack = (
  id: string,
  name: TrackName,
  type: TrackType,
  description: string,
  previewImage: string,
  trackNumber: number,
  checkpoints?: [number, number, number][]
): Track => {
  // Use Python track checkpoints if available, otherwise use provided or default
  const finalCheckpoints = checkpoints || pythonTrackToCheckpoints(trackNumber) || generateCheckpoints();
  
  // Calculate start line from first checkpoint
  const startCheckpoint = finalCheckpoints[0] || [0.1, 0.5, 0];
  
  return {
    id,
    name,
    type,
    description,
    previewImage,
    trackImage: previewImage,
    checkpoints: finalCheckpoints,
    pitLane: {
      entry: [startCheckpoint[0] - 0.05, startCheckpoint[1] - 0.05, startCheckpoint[2]],
      exit: [startCheckpoint[0] + 0.05, startCheckpoint[1] + 0.05, startCheckpoint[2]]
    },
    frictionMap: Array(20).fill(Array(20).fill(1.0)),
    startLine: {
      position: [startCheckpoint[0], startCheckpoint[1]],
      angle: startCheckpoint[2],
      width: 0.02
    },
    raceLine: finalCheckpoints.map(([x, y]) => [x, y] as [number, number]),
    trackBounds: {
      inner: finalCheckpoints.map(([x, y]) => [x - 0.05, y - 0.05] as [number, number]),
      outer: finalCheckpoints.map(([x, y]) => [x + 0.05, y + 0.05] as [number, number])
    }
  };
};

// Track mapping: Image number → Track configuration
// Each track is connected to its Python track file (track__{number}.py)
export const tracks: Record<TrackName, Track> = {
  'Silverstone': createTrack(
    'silverstone',
    'Silverstone',
    'grandPrix',
    'The home of British motorsport, known for its high-speed corners and challenging weather conditions. Connected to track__1.py',
    silverstoneImage,
    1 // Maps to track__1.py
  ),
  'Interlagos': createTrack(
    'interlagos',
    'Interlagos',
    'grandPrix',
    'The legendary Brazilian circuit with dramatic elevation changes and unpredictable weather. Connected to track__4.py',
    interlagosImage,
    4 // Maps to track__4.py
  ),
  'Nürburgring': createTrack(
    'nurburgring',
    'Nürburgring',
    'circuit',
    'The Green Hell - One of the most challenging and dangerous circuits in the world. Connected to track__5.py',
    nurburgringImage,
    5 // Maps to track__5.py
  ),
  'Laguna Seca': createTrack(
    'laguna-seca',
    'Laguna Seca',
    'circuit',
    'Famous for the iconic Corkscrew turn, a technical circuit with dramatic elevation changes. Connected to track__6.py',
    lagunaSecaImage,
    6 // Maps to track__6.py
  ),
  'Brands Hatch': createTrack(
    'brands-hatch',
    'Brands Hatch',
    'circuit',
    'A classic British circuit with fast, flowing corners and challenging elevation changes. Connected to track__7.py',
    brandsHatchImage,
    7 // Maps to track__7.py
  ),
  'Watkins Glen': createTrack(
    'watkins-glen',
    'Watkins Glen',
    'circuit',
    'The historic American circuit known for its fast straights and technical sections. Connected to track__8.py',
    watkinsGlenImage,
    8 // Maps to track__8.py
  ),
  'Road America': createTrack(
    'road-america',
    'Road America',
    'circuit',
    'A long, fast circuit through the Wisconsin countryside with challenging corners. Connected to track__9.py',
    roadAmericaImage,
    9 // Maps to track__9.py
  ),
  'Barcelona': createTrack(
    'barcelona',
    'Barcelona',
    'grandPrix',
    'Circuit de Barcelona-Catalunya, a technical track that tests both car and driver. Connected to track__10.py',
    barcelonaImage,
    10 // Maps to track__10.py
  ),
  'COTA': createTrack(
    'cota',
    'COTA',
    'grandPrix',
    'Circuit of the Americas - A modern American F1 circuit with challenging elevation changes. Connected to track__12.py',
    cotaImage,
    12 // Maps to track__12.py
  )
};

export const sampleCarNames = ['Falcon', 'Viper', 'Comet', 'Blaze', 'Shrike', 'Raptor', 'Phoenix', 'Ghost', 'Stinger', 'Javelin'];