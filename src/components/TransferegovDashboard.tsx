import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import './TransferegovDashboard.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-card">
          <h3>Error</h3>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Card Components
const Card1: React.FC = () => <div className="card"><h3>Card 1 - Summary</h3><p>Total transferências: R$ 1.234.567,89</p></div>;
const Card2: React.FC = () => <div className="card"><h3>Card 2 - Status</h3><p>Em andamento: 15</p><p>Concluídas: 42</p></div>;

const Card3: React.FC = () => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('TCE file selected:', file.name);
      // Process upload logic here
    }
  };

  return (
    <div className="card">
      <h3>TCE Upload</h3>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
      />
      <p>Selecione a planilha de prestação de contas (TCE).</p>
    </div>
  );
};

const Card4: React.FC = () => <div className="card"><h3>Card 4 - Aprovações</h3><p>Aprovações pendentes: 8</p></div>;

// Donut Chart Data
const data = [
  { name: 'Federal', value: 400 },
  { name: 'Estadual', value: 300 },
  { name: 'Municipal', value: 200 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const DonutChart: React.FC = () => (
  <PieChart width={400} height={400}>
    <Pie
      data={data}
      cx={200}
      cy={200}
      innerRadius={60}
      outerRadius={100}
      fill="#8884d8"
      paddingAngle={5}
      dataKey="value"
    >
      {data.map((_, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
    <Legend />
  </PieChart>
);

// Table Component
const Table: React.FC = () => {
  const rows = [
    { id: 1, nome: 'Projeto A', valor: 'R$ 500.000,00', status: 'Concluído' },
    { id: 2, nome: 'Projeto B', valor: 'R$ 350.000,00', status: 'Em andamento' },
    { id: 3, nome: 'Projeto C', valor: 'R$ 200.000,00', status: 'Atrasado' },
  ];
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Valor</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.nome}</td>
            <td>{row.valor}</td>
            <td>{row.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Main Dashboard Component
const TransferegovDashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h1>Dashboard Transferegov</h1>
      <div className="cards-container">
        <ErrorBoundary><Card1 /></ErrorBoundary>
        <ErrorBoundary><Card2 /></ErrorBoundary>
        <ErrorBoundary><Card3 /></ErrorBoundary>
        <ErrorBoundary><Card4 /></ErrorBoundary>
      </div>
      <div className="chart-container">
        <h2>Distribuição por Esfera</h2>
        <DonutChart />
      </div>
      <div className="table-container">
        <h2>Projetos Recentes</h2>
        <Table />
      </div>
    </div>
  );
};

export default TransferegovDashboard;
