import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartData } from 'chart.js';
import { Car, TelemetryData } from '../types/models';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface TelemetryGraphsProps {
  cars: Car[];
  telemetryHistory: Record<string, TelemetryData[]>;
}

const ChartCard: React.FC<{ title: string; data: ChartData<'line'> }> = ({ title, data }) => (
  <div className="bg-gray-700 rounded-lg p-4 shadow-xl">
    <h4 className="text-lg font-semibold text-white mb-3">{title}</h4>
    <div className="h-48">
      <Line data={data} options={{
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: { display: false },
          y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'white' } }
        },
        plugins: { legend: { labels: { color: 'white' } }, tooltip: { bodyColor: 'white', titleColor: 'white' } }
      }} />
    </div>
  </div>
);

export const TelemetryGraphs: React.FC<TelemetryGraphsProps> = ({ cars, telemetryHistory }) => {
  const chartDatasets = (key: keyof TelemetryData) => cars.map(car => ({
    label: car.name,
    data: telemetryHistory[car.id]?.map(d => d[key]) || [],
    borderColor: car.color,
    backgroundColor: car.color + '40',
    tension: 0.3,
    pointRadius: 0,
    borderWidth: 2,
  }));

  const labels = telemetryHistory[cars[0]?.id]?.map(d => d.time) || [];

  return (
    <div className='flex flex-col gap-6'>
      <ChartCard
        title="Live Velocity (m/s)"
        data={{
          labels,
          datasets: chartDatasets('velocity'),
        }}
      />
      <ChartCard
        title="Tyre Wear (%)"
        data={{
          labels,
          datasets: chartDatasets('tyreWear'),
        }}
      />
      <ChartCard
        title="Engine Power (%)"
        data={{
          labels,
          datasets: chartDatasets('enginePower'),
        }}
      />
    </div>
  );
};