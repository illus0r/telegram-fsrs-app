import React, { useState, useEffect } from 'react';
import { syncStatus, SyncStatus } from '../lib/syncStatus';

export const SyncIndicator: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>(syncStatus.getStatus());

  useEffect(() => {
    const unsubscribe = syncStatus.subscribe(setStatus);
    return unsubscribe;
  }, []);

  // Don't show anything if everything is synced
  if (!status.hasUnsavedChanges && !status.isSyncing) {
    return null;
  }

  console.log('[SyncIndicator] Rendering indicator:', { 
    hasUnsavedChanges: status.hasUnsavedChanges, 
    isSyncing: status.isSyncing 
  });

  return (
    <div style={styles.container}>
      <div 
        style={{
          ...styles.dot,
          backgroundColor: status.isSyncing ? '#007AFF' : '#FF6B6B',
          animation: status.isSyncing ? 'pulse 2s infinite' : 'none',
        }}
        title={status.isSyncing ? 'Синхронизация...' : 'Есть несохраненные изменения'}
      />
      <style>{keyframes}</style>
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute' as const,
    top: '8px',
    left: '8px',
    zIndex: 1000,
    pointerEvents: 'none' as const,
  },
  
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: 'background-color 0.3s ease',
    boxShadow: '0 0 4px rgba(0,0,0,0.3)',
  },
};

const keyframes = `
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
`;