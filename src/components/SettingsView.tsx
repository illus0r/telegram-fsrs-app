import React, { useRef, useEffect, useState } from 'react';
import { logger } from '../lib/logger';
import { getLocalStorageInfo, clearLocalStorage, getChunkedItem, setChunkedItem } from '../lib/storage';

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [logsText, setLogsText] = useState(logger.getLogsAsText());
  const [storageInfo, setStorageInfo] = useState(getLocalStorageInfo('cards'));
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Auto-scroll to bottom when logs update
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [logsText]);

  const refreshData = () => {
    setLogsText(logger.getLogsAsText());
    setStorageInfo(getLocalStorageInfo('cards'));
  };

  const handleClearLogs = () => {
    if (confirm('Очистить все логи?')) {
      logger.clearLogs();
      refreshData();
    }
  };

  const handleClearLocalStorage = () => {
    if (confirm('Очистить локальное хранилище? Это может помочь при проблемах с синхронизацией.')) {
      clearLocalStorage('cards');
      refreshData();
    }
  };

  const handleForceReload = async () => {
    if (confirm('Перезагрузить данные из облачного хранилища? Несохраненные изменения будут потеряны.')) {
      setIsRefreshing(true);
      try {
        // Clear localStorage first
        clearLocalStorage('cards');
        
        // Try to load from cloud storage
        const cloudData = await getChunkedItem('cards');
        if (cloudData) {
          console.log('Reloaded data from cloud storage');
        } else {
          console.log('No cloud data found');
        }
        
        refreshData();
        alert('Данные перезагружены из облачного хранилища');
      } catch (error) {
        console.error('Failed to reload from cloud:', error);
        alert('Ошибка при перезагрузке данных');
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleTestStorage = async () => {
    const testData = `test_${Date.now()}`;
    try {
      await setChunkedItem('test', testData);
      const retrieved = await getChunkedItem('test');
      if (retrieved === testData) {
        alert('✅ Тест хранилища пройден успешно');
      } else {
        alert('❌ Тест хранилища не пройден: данные не совпадают');
      }
    } catch (error) {
      console.error('Storage test failed:', error);
      alert('❌ Тест хранилища не пройден: ' + error);
    }
  };

  const handleExportLogs = () => {
    const logs = logger.getLogsAsText();
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anki-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← Назад
        </button>
        <h1 style={styles.title}>Настройки</h1>
        <button style={styles.refreshButton} onClick={refreshData}>
          🔄
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Storage Info */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Состояние хранилища</h2>
          <div style={styles.storageInfo}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Локальные данные:</span>
              <span style={styles.infoValue}>
                {storageInfo.hasLocal ? `✅ ${storageInfo.size} символов` : '❌ Отсутствуют'}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Время сохранения:</span>
              <span style={styles.infoValue}>
                {storageInfo.timestamp ? new Date(storageInfo.timestamp).toLocaleString('ru-RU') : '—'}
              </span>
            </div>
          </div>
          
          <div style={styles.buttonGroup}>
            <button 
              style={styles.actionButton} 
              onClick={handleTestStorage}
              disabled={isRefreshing}
            >
              🧪 Тест хранилища
            </button>
            <button 
              style={styles.actionButton} 
              onClick={handleClearLocalStorage}
              disabled={isRefreshing}
            >
              🗑️ Очистить кэш
            </button>
            <button 
              style={{...styles.actionButton, ...styles.dangerButton}} 
              onClick={handleForceReload}
              disabled={isRefreshing}
            >
              {isRefreshing ? '⏳ Загрузка...' : '☁️ Из облака'}
            </button>
          </div>
        </div>

        {/* Logs section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Логи приложения</h2>
            <div style={styles.logButtons}>
              <button style={styles.exportButton} onClick={handleExportLogs}>
                💾 Экспорт
              </button>
              <button style={styles.clearButton} onClick={handleClearLogs}>
                Очистить
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            style={styles.logsTextarea}
            value={logsText}
            readOnly
            placeholder="Логи пока отсутствуют..."
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    color: 'var(--tg-theme-text-color, #000000)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
    borderBottom: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
    minHeight: '60px',
  },

  backButton: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: 'var(--tg-theme-button-color, #2481cc)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
    transition: 'background-color 0.2s ease',
  },

  title: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0',
    color: 'var(--tg-theme-text-color, #000000)',
  },

  clearButton: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: 'var(--tg-theme-destructive-text-color, #ff3b30)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
    transition: 'background-color 0.2s ease',
  },

  refreshButton: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: 'var(--tg-theme-button-color, #2481cc)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'background-color 0.2s ease',
  },

  content: {
    flex: 1,
    padding: '16px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },

  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  storageInfo: {
    padding: '12px',
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
    borderRadius: '8px',
    border: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
  },

  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },

  infoLabel: {
    fontSize: '14px',
    color: 'var(--tg-theme-hint-color, #999999)',
  },

  infoValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--tg-theme-text-color, #000000)',
  },

  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },

  actionButton: {
    padding: '8px 12px',
    backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
    color: 'var(--tg-theme-button-text-color, #ffffff)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
    transition: 'opacity 0.2s ease',
    disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  dangerButton: {
    backgroundColor: 'var(--tg-theme-destructive-text-color, #ff3b30)',
  },

  logButtons: {
    display: 'flex',
    gap: '8px',
  },

  exportButton: {
    padding: '8px 12px',
    backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
    color: 'var(--tg-theme-button-text-color, #ffffff)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
    transition: 'background-color 0.2s ease',
  },

  logsSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    minHeight: '300px',
  },

  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0',
    color: 'var(--tg-theme-text-color, #000000)',
  },

  logsTextarea: {
    flex: 1,
    minHeight: '300px',
    padding: '12px',
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
    color: 'var(--tg-theme-text-color, #000000)',
    border: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'Monaco, Menlo, Consolas, "Courier New", monospace',
    lineHeight: '1.4',
    resize: 'none' as const,
    outline: 'none',
    whiteSpace: 'pre-wrap' as const,
    wordWrap: 'break-word' as const,
  },
};