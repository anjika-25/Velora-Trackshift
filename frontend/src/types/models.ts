export interface Car {
  id: string;
  name: string;
  color: string;
  position: [number, number]; // [x, y] normalized (0-1)
  velocity: number; // m/s
  lapTime: number; // current lap time in seconds
  lastLapTime: number | null;
  bestLapTime: number | null;
  tyreWear: number; // % wear
  tyreTemp: number; // °C
  enginePower: number; // %
  dnf: boolean;
  pitStatus: boolean;
  lap: number;
}

export type TrackName = 'Silverstone' | 'Interlagos' | 'Nürburgring' | 'Laguna Seca' | 'Brands Hatch' | 'Watkins Glen' | 'Road America' | 'Barcelona' | 'COTA';

export type TrackType = 'grandPrix' | 'street' | 'circuit';

export interface Track {
  id: string;
  name: TrackName;
  type: TrackType;
  description: string;
  previewImage: string;
  trackImage: string;
  checkpoints: [number, number, number][]; // [x, y, angle] normalized points
  pitLane: {
    entry: [number, number, number];
    exit: [number, number, number];
  };
  frictionMap: number[][];
  startLine: {
    position: [number, number]; // [x, y] normalized
    angle: number; // degrees
    width: number; // normalized (0-1)
  };
  raceLine: [number, number][]; // Series of points defining the optimal racing line
  trackBounds: {
    inner: [number, number][];
    outer: [number, number][];
  };
}

export interface TelemetryData {
  time: number;
  velocity: number;
  tyreWear: number;
  enginePower: number;
}

export type TyreCompound = 'Wet' | 'Dry';
export type WeatherCondition = 'Sunny' | 'Rainy' | 'Snow';

export type RaceStatus = 'ready' | 'running' | 'paused' | 'finished';

export interface Race {
  id: string;
  status: RaceStatus;
  laps: number;
  cars: Car[];
  weather: {
    condition: string;
    temperature: number;
    humidity: number;
    pressure: number;
    trackGrip: number;
  };
}