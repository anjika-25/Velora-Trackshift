import { Chart, ChartConfiguration } from 'chart.js';
import { TelemetryData } from '../types/models';

export const createTelemetryChart = (ctx: CanvasRenderingContext2D, type: string): Chart => {
  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      animation: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second'
          }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  };

  return new Chart(ctx, config);
};

export const updateTelemetryChart = (
  chart: Chart,
  data: TelemetryData[],
  property: keyof TelemetryData
): void => {
  // Destroy and recreate chart on what-if events
  if (chart.data.labels?.length === 0) {
    chart.destroy();
    chart = createTelemetryChart(chart.ctx as CanvasRenderingContext2D, chart.config.type);
  }

  chart.data.labels = data.map(d => d.timestamp);
  chart.data.datasets = [{
    data: data.map(d => d[property]),
    borderColor: 'rgb(75, 192, 192)',
    tension: 0.1
  }];
  
  chart.update('none'); // Use 'none' mode for performance
};

export const formatLapTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const milliseconds = Math.floor((time % 1) * 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

export const calculateGapToLeader = (
  carTime: number,
  leaderTime: number
): string => {
  const gap = carTime - leaderTime;
  return gap > 0 ? `+${gap.toFixed(3)}` : 'LEADER';
};