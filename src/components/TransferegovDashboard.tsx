import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    console.log('[DEBUG] getDerivedStateFromError called');
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('[DEBUG] componentDidCatch:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Helper component for cards
interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  console.log('[DEBUG] Rendering card:', title);
  return (
    <div className={`bg-slate-800 rounded-lg shadow-md p-4 ${className}`}>
      <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
      <div className="text-slate-300">{children}</div>
    </div>
  );
};

// SVG Donut Chart Component
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, size = 120 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <p className="text-slate-400">No data</p>;

  const center = size / 2;
  const radius = size * 0.35;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const slices = data.map((d, i) => {
    const percent = d.value / total;
    const offset = cumulativePercent * circumference;
    cumulativePercent += percent;
    const dashArray = `${percent * circumference} ${circumference - percent * circumference}`;
    const rotation = -90 + (offset / circumference) * 360;
    return (
      <circle
        key={i}
        r={radius}
        cx={center}
        cy={center}
        fill="transparent"
        stroke={d.color}
        strokeWidth={size * 0.1}
        strokeDasharray={dashArray}
        strokeDashoffset={-offset}
        transform={`rotate(${rotation} ${center} ${center})`}
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-sm font-bold"
      >
        {total}
      </text>
    </svg>
  );
};

// Placeholder content for each card that might throw
function CardContent({ cardId }: { cardId: number }) {
  console.log('[DEBUG] CardContent for card', cardId);
  if (cardId === 3) {
    // Simulate error for demonstration
    throw new Error('Simulated error on Card 4');
  }
  switch (cardId) {
    case 1:
      return (
        <div>
          <p>Upload CSV para Transferegov</p>
          <input type="file" accept=".csv" className="mt-2 block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600" />
        </div>
      );
    case 2:
      return (
        <div>
          <p>Upload de arquivos SIAFI</p>
          <input type="file" multiple className="mt-2 block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600" />
        </div>
      );
    case 3:
      return (
        <div>
          <p>Upload de dados TCE</p>
          <input type="file" accept=".xlsx,.xls" className="mt-2 block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600" />
        </div>
      );
    case 4:
      return (
        <div>
          <p>Dashboard TCE - Gráficos Donut</p>
          <div className="flex justify-center mt-2">
            <DonutChart
              data={[
                { label: 'A', value: 30, color: '#3b82f6' },
                { label: 'B', value: 50, color: '#10b981' },
                { label: 'C', value: 20, color: '#f59e0b' },
              ]}
            />
          </div>
        </div>
      );
    case 5:
      return (
        <div>
          <p>Tabela de resultados</p>
          <table className="min-w-full divide-y divide-slate-600 mt-2">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">1</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">Item A</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">R$ 100,00</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">2</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">Item B</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">R$ 200,00</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

const TransferegovDashboard: React.FC = () => {
  console.log('[DEBUG] TransferegovDashboard mounted');

  const cards = [
    { id: 1, title: 'Transferegov Upload' },
    { id: 2, title: 'SIAFI Upload' },
    { id: 3, title: 'TCE Upload' },
    { id: 4, title: 'Dashboard TCE' },
    { id: 5, title: 'Tabela de Resultados' },
  ];

  const fallback = (cardTitle: string) => (
    <div className="bg-slate-800 rounded-lg shadow-md p-4 border border-red-500">
      <h2 className="text-lg font-semibold text-white mb-2">{cardTitle}</h2>
      <p className="text-red-400">Erro ao carregar este card. Tente novamente.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard Transferegov</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <ErrorBoundary
            key={card.id}
            fallback={fallback(card.title)}
            onError={(error) => console.log('[DEBUG] ErrorBoundary caught error on card', card.id, error)}
          >
            <Card title={card.title}>
              <CardContent cardId={card.id} />
            </Card>
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
};

export default TransferegovDashboard;
