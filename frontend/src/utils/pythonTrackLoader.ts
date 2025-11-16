// Utility to load track data from Python track files
// Maps image numbers to Python track files and extracts control points

export interface PythonTrackData {
  trackNumber: number;
  controlPoints: number[][];
  trackFile: string;
}

// Map image numbers to Python track files
export const TRACK_FILE_MAP: Record<number, string> = {
  1: 'track__1.py',
  4: 'track__4.py',
  5: 'track__5.py',
  6: 'track__6.py',
  7: 'track__7.py',
  8: 'track__8.py',
  9: 'track__9.py',
  10: 'track__10.py',
  12: 'track__12.py',
};

// Control points extracted from Python track files
// Format: [x, y] in pixel coordinates (0-1000 range)
const PYTHON_TRACK_CONTROL_POINTS: Record<number, number[][]> = {
  1: [
    [50, 150], [80, 80], [150, 100],
    [200, 130], [270, 160], [280, 180],
    [250, 220], [200, 250], [120, 200],
    [50, 150]
  ],
  4: [
    [100, 800],
    [300, 800], [750, 800],
    [900, 700],
    [850, 450], [600, 300],
    [300, 350], [150, 400],
    [100, 600],
    [100, 800]
  ],
  5: [
    [100, 850], [250, 850],
    [350, 800], [400, 750],
    [450, 600], [550, 500], [700, 550], [800, 500],
    [850, 400], [800, 300], [700, 250],
    [550, 200], [400, 250], [250, 300],
    [150, 400], [200, 550], [100, 700],
    [100, 850]
  ],
  6: [
    [100, 850], [400, 850], [800, 850],
    [900, 750], [850, 650], [900, 550],
    [750, 450], [550, 400],
    [350, 300], [200, 400],
    [100, 550], [150, 700],
    [100, 850]
  ],
  7: [
    [100, 850], [300, 850],
    [500, 800], [650, 700],
    [750, 550], [800, 400], [700, 300],
    [500, 250], [300, 350],
    [250, 500], [350, 650], [200, 750],
    [100, 850]
  ],
  8: [
    [100, 100], [400, 100],
    [450, 150], [450, 300], [400, 450],
    [600, 600], [900, 700],
    [950, 750], [900, 900], [750, 850],
    [500, 800], [200, 700],
    [150, 500], [250, 300],
    [100, 100]
  ],
  9: [
    [100, 100], [300, 100],
    [400, 150], [400, 300], [300, 450],
    [550, 500], [800, 600],
    [900, 700], [800, 850], [600, 900], [400, 800],
    [250, 650], [200, 400],
    [150, 250], [100, 100]
  ],
  10: [
    [100, 100],
    [100, 300],
    [250, 450], [400, 450],
    [600, 600], [800, 700],
    [900, 500], [800, 200],
    [600, 150], [400, 150],
    [250, 200],
    [100, 100]
  ],
  12: [
    [50, 500],
    [200, 800],
    [400, 950], [900, 850], [950, 500],
    [800, 100], [500, 50],
    [250, 150], [350, 350], [150, 400],
    [50, 500]
  ],
};

/**
 * Normalize control points from pixel coordinates (0-1000) to normalized coordinates (0-1)
 */
function normalizeControlPoints(points: number[][]): [number, number, number][] {
  if (points.length === 0) return [];
  
  // Find min/max for normalization
  const allX = points.map(p => p[0]);
  const allY = points.map(p => p[1]);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  
  // Calculate ranges
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  
  // Normalize and calculate angles
  const normalized: [number, number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    const normX = (x - minX) / rangeX;
    const normY = (y - minY) / rangeY;
    
    // Calculate angle from current point to next point
    let angle = 0;
    if (i < points.length - 1) {
      const next = points[i + 1];
      const dx = next[0] - x;
      const dy = next[1] - y;
      angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    } else if (points.length > 1) {
      // Last point: use angle from previous point
      const prev = points[i - 1];
      const dx = x - prev[0];
      const dy = y - prev[1];
      angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    }
    
    normalized.push([normX, normY, angle]);
  }
  
  return normalized;
}

/**
 * Get track data for a specific track number
 */
export function getPythonTrackData(trackNumber: number): PythonTrackData | null {
  const controlPoints = PYTHON_TRACK_CONTROL_POINTS[trackNumber];
  const trackFile = TRACK_FILE_MAP[trackNumber];
  
  if (!controlPoints || !trackFile) {
    return null;
  }
  
  return {
    trackNumber,
    controlPoints,
    trackFile,
  };
}

/**
 * Convert Python track control points to TypeScript Track checkpoints
 */
export function pythonTrackToCheckpoints(trackNumber: number): [number, number, number][] {
  const data = getPythonTrackData(trackNumber);
  if (!data) {
    return [];
  }
  
  return normalizeControlPoints(data.controlPoints);
}

/**
 * Get all available track numbers
 */
export function getAvailableTrackNumbers(): number[] {
  return Object.keys(TRACK_FILE_MAP).map(Number).sort((a, b) => a - b);
}

