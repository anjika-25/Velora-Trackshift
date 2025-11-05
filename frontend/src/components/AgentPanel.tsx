import React from 'react';
import { Car } from '../types/models';
import '../styles/dashboard.css';

interface AgentPanelProps {
  car: Car;
  onTriggerWhatIf: (type: string, carId: string) => void;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ car, onTriggerWhatIf }) => {
  const tyreStatus = car.tyreWear.map((wear, index) => {
    const temp = car.tyreTemp[index];
    const wearColor = wear < 30 ? 'red' : wear < 60 ? 'yellow' : 'green';
    const tempColor = temp < 60 ? 'blue' : temp > 100 ? 'red' : 'green';
    
    return (
      <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Tyre {index + 1}:</span>
        <span style={{ color: wearColor }}>{wear.toFixed(1)}% </span>
        <span style={{ color: tempColor }}>{temp.toFixed(1)}°C</span>
      </div>
    );
  });

  return (
    <div className="panel">
      <div className="panelHeader">
        <h2 className="panelTitle">{car.name}</h2>
        <div className="panelControls">
          <button
            className="button"
            onClick={() => onTriggerWhatIf('tyrePuncture', car.id)}
          >
            Puncture
          </button>
          <button
            className="button"
            onClick={() => onTriggerWhatIf('engineCut', car.id)}
          >
            Engine Cut
          </button>
          <button
            className="button"
            onClick={() => onTriggerWhatIf('pitStop', car.id)}
          >
            Pit Stop
          </button>
        </div>
      </div>

      <div>
        <h3>Race Status</h3>
        <div>
          <p>Lap: {car.lap}</p>
          <p>Position: {car.position.map(p => p.toFixed(2)).join(', ')}</p>
          <p>Speed: {Math.sqrt(car.velocity.reduce((acc, v) => acc + v * v, 0)).toFixed(2)} m/s</p>
          <p>Engine Power: {car.enginePower.toFixed(1)}%</p>
          <p>Status: {car.dnf ? 'DNF' : car.pitStatus ? 'PIT' : 'RACING'}</p>
        </div>

        <h3>Tyre Status</h3>
        <div>{tyreStatus}</div>

        <h3>Lap Times</h3>
        <div>
          {car.lastLapTime && <p>Last Lap: {(car.lastLapTime).toFixed(3)}s</p>}
          {car.bestLapTime && <p>Best Lap: {(car.bestLapTime).toFixed(3)}s</p>}
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;