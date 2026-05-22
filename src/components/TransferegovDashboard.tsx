import React from 'react';
import { useTransferegovSync } from '../hooks/useTransferegovSync';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700/50">
    <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">{title}</h3>
    {children}
  </div>
);

interface BadgeProps {
  color: string;
  text: string;
}

const Badge: React.FC<BadgeProps> = ({ color, text }) => (
  <span className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${color}`}>{text}</span>
);

/**
 * Componente de dashboard para exibir status de sincronização com Transfere.gov.
 * Utiliza Tailwind CSS para estilização.
 */
const TransferegovDashboard: React.FC = () => {
  const {
    loading,
    error,
    lastUpdate,
    report,
    totalRecords,
    isPaused,
    pause,
    resume,
    forceSync,
    clearCache,
  } = useTransferegovSync({
    onSync: (report) => console.log('[Dashboard] Sincronizado:', report),
    onError: (error) => console.error('[Dashboard] Erro:', error),
  });

  const formatTimeAgo = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay === 0) {
      if (diffHour === 0) {
        if (diffMin === 0) return 'há poucos segundos';
        return `há ${diffMin} minutos`;
      }
      return `há ${diffHour} horas`;
    }
    if (diffDay === 1) return 'ontem';
    return `há ${diffDay} dias`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Transfere.gov Dashboard</h1>
      
      {/* Notifications */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 rounded-lg p-4 mb-6 flex items-center">
          <span className="mr-2">❌</span>
          <span>{error}</span>
        </div>
      )}
      {!error && lastUpdate && (
        <div className="bg-green-500/20 border border-green-500 text-green-200 rounded-lg p-4 mb-6 flex items-center">
          <span className="mr-2">✅</span>
          <span>Última sincronização: {formatTimeAgo(lastUpdate)}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Status */}
        <Card title="Status">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">⏱️ Última atualização</span>
              <span>{lastUpdate ? formatTimeAgo(lastUpdate) : 'Nunca'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">🔄 Próxima execução</span>
              <span>{isPaused ? 'Pausada' : loading ? 'Em andamento...' : 'Em breve'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">📦 Total de convênios</span>
              <span className="font-semibold">{totalRecords}</span>
            </div>
          </div>
        </Card>

        {/* Card Sincronização */}
        <Card title="Sincronização">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={isPaused ? resume : pause}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center ${
                isPaused
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              } disabled:opacity-50`}
            >
              {isPaused ? '▶️ Retomar' : '⏸️ Pausar'}
            </button>
            <button
              onClick={forceSync}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? '⏳ Sincronizando...' : '🔄 Sincronizar Agora'}
            </button>
            <button
              onClick={clearCache}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors flex items-center"
            >
              🗑️ Limpar Cache
            </button>
          </div>
        </Card>

        {/* Card Resultados */}
        <Card title="Resultados">
          {report ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Novos</span>
                <Badge color="bg-green-500 text-white" text={`+${report.novos}`} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Removidos</span>
                <Badge color="bg-red-500 text-white" text={`-${report.removidos}`} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Alterados</span>
                <Badge color="bg-yellow-500 text-black" text={`~${report.alterados}`} />
              </div>
            </div>
          ) : (
            <p className="text-slate-400">Nenhum dado disponível</p>
          )}
        </Card>
      </div>

      {/* Timeline (simplificada) */}
      <div className="mt-8">
        <Card title="Timeline de Sincronizações">
          {lastUpdate ? (
            <p className="text-slate-300">Última sincronização: {new Date(lastUpdate).toLocaleString()}</p>
          ) : (
            <p className="text-slate-400">Nenhuma sincronização registrada.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TransferegovDashboard;
