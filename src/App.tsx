import React, { useEffect, useState } from 'react';
import TransferegovDashboard from './components/TransferegovDashboard';

const App: React.FC = () => {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[DEBUG] App component mounted');
    const checkIndexedDB = async () => {
      try {
        console.log('[DEBUG] Checking IndexedDB...');
        // Simulate checking IndexedDB
        const request = indexedDB.open('myDatabase', 1);
        request.onsuccess = () => {
          console.log('[DEBUG] IndexedDB is ready');
          setDbReady(true);
        };
        request.onerror = () => {
          console.error('[DEBUG] IndexedDB error:', request.error);
          setError('Failed to access IndexedDB');
        };
      } catch (err) {
        console.error('[DEBUG] Error in useEffect:', err);
        setError('An unexpected error occurred');
      }
    };
    checkIndexedDB();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {error ? (
        <div className="p-4 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md m-4">
          <p>Error: {error}</p>
        </div>
      ) : dbReady ? (
        <TransferegovDashboard />
      ) : (
        <div className="p-4">
          <p>Loading IndexedDB...</p>
        </div>
      )}
    </div>
  );
};

export default App;
