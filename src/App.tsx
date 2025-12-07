import React, { useState, useEffect } from 'react';
import { StudyView } from './components/StudyView';
import { EditView } from './components/EditView';
import { FSRSManager } from './lib/fsrs';
import { storage } from './lib/storage';
import { telegram } from './lib/telegram';

type View = 'study' | 'edit';

const STORAGE_KEY = 'cards';

export const App: React.FC = () => {
  const [fsrs] = useState(() => new FSRSManager());
  const [currentView, setCurrentView] = useState<View>('study');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Initializing Telegram Anki FSRS...');
      console.log('Storage type:', storage.getStorageType());
      console.log('Telegram WebApp available:', telegram.isAvailable());

      // Load cards from storage
      const savedData = await storage.getItem(STORAGE_KEY);
      
      if (savedData) {
        console.log('Loaded cards from storage');
        fsrs.loadCards(savedData);
      } else {
        console.log('No saved data found, loading demo cards');
        const demoTsv = FSRSManager.getDemoTSV();
        fsrs.loadCards(demoTsv);
        // Save demo cards to storage
        await storage.setItem(STORAGE_KEY, demoTsv);
      }

      const stats = fsrs.getStats();
      console.log('Cards loaded:', stats);

    } catch (err) {
      console.error('Failed to initialize app:', err);
      setError('Ошибка загрузки данных. Попробуйте обновить страницу.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setCurrentView('edit');
  };

  const handleSave = async (tsvData: string) => {
    try {
      console.log('Saving TSV data...');
      
      // Parse and validate the data
      fsrs.loadCards(tsvData);
      
      // Save to storage
      await storage.setItem(STORAGE_KEY, tsvData);
      
      console.log('Data saved successfully');
      setCurrentView('study');
      setError(null);
      
    } catch (err) {
      console.error('Failed to save data:', err);
      setError('Ошибка сохранения данных');
      throw err; // Re-throw to let EditView handle it
    }
  };

  const handleCancel = () => {
    // Reload cards from storage to discard changes
    initializeApp();
    setCurrentView('study');
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorTitle}>Ошибка</h2>
        <p style={styles.errorText}>{error}</p>
        <button
          style={styles.retryButton}
          onClick={() => {
            setError(null);
            initializeApp();
          }}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {currentView === 'study' ? (
        <StudyView
          fsrs={fsrs}
          onEdit={handleEdit}
        />
      ) : (
        <EditView
          fsrs={fsrs}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

const styles = {
  app: {
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    color: 'var(--tg-theme-text-color, #000000)',
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    padding: '32px',
  },

  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--tg-theme-hint-color, #c8c7cc)',
    borderTop: '3px solid var(--tg-theme-button-color, #2481cc)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },

  loadingText: {
    fontSize: '16px',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
    margin: '0',
  },

  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    padding: '32px',
    textAlign: 'center' as const,
  },

  errorTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    color: 'var(--tg-theme-text-color, #000000)',
  },

  errorText: {
    fontSize: '16px',
    margin: '0 0 32px 0',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
    lineHeight: '1.4',
  },

  retryButton: {
    padding: '12px 24px',
    backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
    color: 'var(--tg-theme-button-text-color, #ffffff)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
};

// CSS animation for loading spinner
const spinKeyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inject CSS animation
const style = document.createElement('style');
style.textContent = spinKeyframes;
document.head.appendChild(style);