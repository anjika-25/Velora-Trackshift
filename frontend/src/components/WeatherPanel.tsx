import React from 'react';
import { WeatherState } from '../types/models';
import { getWeatherIcon, calculateGripMultiplier } from '../utils/weatherHelpers';
import '../styles/dashboard.css';

interface WeatherPanelProps {
  weather: WeatherState;
  onTriggerWhatIf: (type: string) => void;
}

const WeatherPanel: React.FC<WeatherPanelProps> = ({ weather, onTriggerWhatIf }) => {
  const gripMultiplier = calculateGripMultiplier(weather.condition, weather.trackGrip);

  return (
    <div className="panel weatherPanel">
      <div className="panelHeader">
        <h2 className="panelTitle">Weather Conditions</h2>
        <div className="panelControls">
          <button
            className="button"
            onClick={() => onTriggerWhatIf('rain')}
          >
            Trigger Rain
          </button>
        </div>
      </div>

      <div className="weatherIcon">
        {getWeatherIcon(weather.condition)}
      </div>

      <div className="weatherInfo">
        <div>
          <strong>Temperature:</strong>
          <span>{weather.temperature.toFixed(1)}°C</span>
        </div>
        <div>
          <strong>Humidity:</strong>
          <span>{weather.humidity.toFixed(1)}%</span>
        </div>
        <div>
          <strong>Pressure:</strong>
          <span>{weather.pressure.toFixed(1)} hPa</span>
        </div>
        <div>
          <strong>Condition:</strong>
          <span>{weather.condition}</span>
        </div>
        <div>
          <strong>Track Grip:</strong>
          <span>{(gripMultiplier * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;