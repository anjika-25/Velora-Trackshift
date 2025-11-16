import { WeatherState } from '../types/models';

export const getWeatherIcon = (condition: WeatherState['condition']): string => {
  switch (condition) {
    case 'clear':
      return '☀️';
    case 'cloudy':
      return '☁️';
    case 'rain':
      return '🌧️';
    default:
      return '❓';
  }
};

export const calculateAirDensity = (
  temperature: number,
  pressure: number,
  humidity: number
): number => {
  // Constants
  const Rd = 287.05; // Specific gas constant for dry air
  const Rv = 461.495; // Specific gas constant for water vapor

  // Convert temperature to Kelvin
  const T = temperature + 273.15;

  // Calculate saturation vapor pressure using Magnus formula
  const es = 6.1078 * Math.exp((17.27 * temperature) / (temperature + 237.3));
  
  // Calculate actual vapor pressure
  const e = (humidity / 100) * es;

  // Calculate air density using combined gas law
  const pd = pressure - e; // Partial pressure of dry air
  const density = (pd / (Rd * T)) + (e / (Rv * T));

  return density;
};

export const calculateGripMultiplier = (
  condition: WeatherState['condition'],
  trackGrip: number
): number => {
  const baseGrip = trackGrip;
  switch (condition) {
    case 'clear':
      return baseGrip;
    case 'cloudy':
      return baseGrip * 0.95;
    case 'rain':
      return baseGrip * 0.7;
    default:
      return baseGrip;
  }
};