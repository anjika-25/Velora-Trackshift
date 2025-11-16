export interface Car {
  id: string;
  name: string;
  position: [number, number, number]; // [x, y, z]
  velocity: [number, number, number];
  yaw: number;
  enginePower: number;
  tyreWear: number[];
  tyreTemp: number[];
  lap: number;
  pitStatus: boolean;
  lastLapTime?: number;
  bestLapTime?: number;
  dnf: boolean;
}

export interface WeatherState {
  temperature: number;
  humidity: number;
  pressure: number;
  condition: 'clear' | 'cloudy' | 'rain';
  trackGrip: number;
}

export interface Race {
  id: string;
  laps: number;
  cars: Car[];
  weather: WeatherState;
  events: RaceEvent[];
  status: 'pending' | 'running' | 'finished';
}

export interface RaceEvent {
  id: string;
  timestamp: number;
  type: 'crash' | 'pit' | 'engineFailure' | 'weatherChange';
  carId?: string;
  data: any;
}

export interface TelemetryData {
  carId: string;
  timestamp: number;
  position: [number, number, number];
  velocity: [number, number, number];
  enginePower: number;
  tyreWear: number[];
  tyreTemp: number[];
}

export interface Track {
  id: string;
  name: string;
  type: 'grandPrix' | 'street' | 'oval' | 'test';
  checkpoints: [number, number, number][];
  pitLane: {
    entry: [number, number, number];
    exit: [number, number, number];
  };
  frictionMap: number[][];
}

export interface Panel {
  id: string;
  title: string;
  type: 'telemetry' | 'track' | 'weather' | 'agent';
  isPopped: boolean;
  position?: { x: number; y: number };
}

export interface WhatIfScenario {
  type: 'rain' | 'tyrePuncture' | 'engineCut' | 'debris' | 'pitStop';
  carId?: string;
  data?: any;
}