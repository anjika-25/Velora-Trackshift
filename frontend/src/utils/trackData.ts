import { Track, TrackName, TrackType } from '../types/models';
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

// Helper function to create a track
const createTrack = (
  id: string,
  name: TrackName,
  type: TrackType,
  description: string,
  previewImage: string,
  checkpoints?: [number, number, number][]
): Track => {
  // Use provided checkpoints or default checkpoints
  const finalCheckpoints = checkpoints || generateCheckpoints();
  
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
export const tracks: Record<TrackName, Track> = {
  'Silverstone': createTrack(
    'silverstone',
    'Silverstone',
    'grandPrix',
    'The home of British motorsport, known for its high-speed corners and challenging weather conditions.',
    silverstoneImage
  ),
  'Interlagos': createTrack(
    'interlagos',
    'Interlagos',
    'grandPrix',
    'The legendary Brazilian circuit with dramatic elevation changes and unpredictable weather.',
    interlagosImage
  ),
  'Nürburgring': createTrack(
    'nurburgring',
    'Nürburgring',
    'circuit',
    'The Green Hell - One of the most challenging and dangerous circuits in the world.',
    nurburgringImage
  ),
  'Laguna Seca': createTrack(
    'laguna-seca',
    'Laguna Seca',
    'circuit',
    'Famous for the iconic Corkscrew turn, a technical circuit with dramatic elevation changes.',
    lagunaSecaImage
  ),
  'Brands Hatch': createTrack(
    'brands-hatch',
    'Brands Hatch',
    'circuit',
    'A classic British circuit with fast, flowing corners and challenging elevation changes.',
    brandsHatchImage
  ),
  'Watkins Glen': createTrack(
    'watkins-glen',
    'Watkins Glen',
    'circuit',
    'The historic American circuit known for its fast straights and technical sections.',
    watkinsGlenImage
  ),
  'Road America': createTrack(
    'road-america',
    'Road America',
    'circuit',
    'A long, fast circuit through the Wisconsin countryside with challenging corners.',
    roadAmericaImage
  ),
  'Barcelona': createTrack(
    'barcelona',
    'Barcelona',
    'grandPrix',
    'Circuit de Barcelona-Catalunya, a technical track that tests both car and driver.',
    barcelonaImage
  ),
  'COTA': createTrack(
    'cota',
    'COTA',
    'grandPrix',
    'Circuit of the Americas - A modern American F1 circuit with challenging elevation changes.',
    cotaImage
  )
};

export const sampleCarNames = ['Falcon', 'Viper', 'Comet', 'Blaze', 'Shrike', 'Raptor', 'Phoenix', 'Ghost', 'Stinger', 'Javelin'];