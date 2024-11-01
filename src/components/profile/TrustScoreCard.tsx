// components/profile/TrustScoreCard.tsx
import { FC } from 'react';
import { useTrustScore } from '../../hooks/useTrustScore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const TrustScoreCard: FC = () => {
  const { metrics, isLoading } = useTrustScore();

  if (isLoading || !metrics) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />;
  }

  const chartData = {
    labels: metrics.history.map(h => h.date),
    datasets: [{
      label: 'Trust Score',
      data: metrics.history.map(h => h.score),
      fill: false,
      borderColor: '#4CAF50',
      tension: 0.1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Trust Score History'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">Trust Score</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {metrics.overall}
            </div>
            <div className="text-gray-600">Overall Score</div>
          </div>
          
          <div className="mt-6 space-y-4">
            {Object.entries({
              'Activity': metrics.activity,
              'Holdings': metrics.holdings,
              'Longevity': metrics.longevity
            }).map(([label, score]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium">{score}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};