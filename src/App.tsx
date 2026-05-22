import { useTransferegovSync } from './hooks/useTransferegovSync';

function MyComponent() {
  const { loading, forceSync } = useTransferegovSync();
  
  return (
    <div style={{ padding: '2rem', background: '#0f172a', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>
        Status: {loading ? '⏳ Sincronizando...' : '✅ Pronto'}
      </p>
      <button 
        onClick={forceSync}
        style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
        onMouseOver={(e) => (e.currentTarget.style.background = '#2563eb')}
        onMouseOut={(e) => (e.currentTarget.style.background = '#3b82f6')}
      >
        Sincronizar Agora
      </button>
    </div>
  );
}

export default function App() {
  return <MyComponent />;
}
