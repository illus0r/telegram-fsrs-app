import React, { useRef, useEffect, useState } from 'react';
import { logger } from '../lib/logger';
import { getLocalStorageInfo, clearLocalStorage, tryReadFromCloud, tryWriteToCloud, downloadAndShowCloudData, migrateOldDataToNewFormat } from '../lib/storage';
import { syncStatus, SyncStatus } from '../lib/syncStatus';

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [logsText, setLogsText] = useState(logger.getLogsAsText());
  const [storageInfo, setStorageInfo] = useState(getLocalStorageInfo());
  const [syncStatusData, setSyncStatusData] = useState<SyncStatus>(syncStatus.getStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [cloudData, setCloudData] = useState<string>('');
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  useEffect(() => {
    // Auto-scroll to bottom when logs update
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [logsText]);

  useEffect(() => {
    // Subscribe to sync status updates
    const unsubscribe = syncStatus.subscribe(setSyncStatusData);
    return unsubscribe;
  }, []);

  const refreshData = () => {
    setLogsText(logger.getLogsAsText());
    setStorageInfo(getLocalStorageInfo());
    setSyncStatusData(syncStatus.getStatus());
  };

  const handleClearLogs = () => {
    if (confirm('Очистить все логи?')) {
      logger.clearLogs();
      refreshData();
    }
  };

  const handleClearLocalStorage = () => {
    if (confirm('Очистить локальное хранилище? Это сбросит все данные и ревизии.')) {
      clearLocalStorage();
      refreshData();
      alert('Локальное хранилище очищено. Перезагрузите страницу для инициализации.');
    }
  };

  const handleForceCloudRead = async () => {
    if (confirm('Принудительно загрузить данные из облака? Локальные изменения будут потеряны.')) {
      setIsRefreshing(true);
      try {
        const cloudData = await tryReadFromCloud();
        if (cloudData) {
          refreshData();
          alert('Данные успешно загружены из облака');
        } else {
          alert('Данные в облаке не найдены');
        }
      } catch (error) {
        console.error('Failed to read from cloud:', error);
        alert('Ошибка при загрузке данных из облака');
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleForceCloudWrite = async () => {
    if (confirm('Принудительно записать локальные данные в облако?')) {
      setIsTesting(true);
      try {
        const success = await tryWriteToCloud();
        if (success) {
          refreshData();
          alert('Данные успешно записаны в облако');
        } else {
          alert('Не удалось записать данные в облако');
        }
      } catch (error) {
        console.error('Failed to write to cloud:', error);
        alert('Ошибка при записи данных в облако');
      } finally {
        setIsTesting(false);
      }
    }
  };

  const handleInspectCloud = async () => {
    setIsLoadingCloud(true);
    setCloudData('Загрузка данных из облака...');
    
    try {
      const report = await downloadAndShowCloudData();
      setCloudData(report);
    } catch (error) {
      console.error('Failed to inspect cloud data:', error);
      setCloudData(`❌ Ошибка загрузки: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleMigrateOldData = async () => {
    if (confirm('Попробовать мигрировать старые данные в новый формат? Это безопасная операция.')) {
      setIsTesting(true);
      try {
        const success = await migrateOldDataToNewFormat();
        if (success) {
          refreshData();
          alert('✅ Миграция завершена успешно!');
        } else {
          alert('ℹ️ Миграция не требуется или не удалась');
        }
      } catch (error) {
        console.error('Migration failed:', error);
        alert('❌ Ошибка миграции: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsTesting(false);
      }
    }
  };

  const handleResetRevisions = async () => {
    if (confirm('Сбросить ревизии? Это установит локальную ревизию = 1, серверную = 0, что запустит синхронизацию.')) {
      try {
        // Force reset revisions
        syncStatus.setLocalRevision(1);
        syncStatus.setServerRevision(0);
        refreshData();
        alert('✅ Ревизии сброшены! Локальная = 1, серверная = 0');
      } catch (error) {
        console.error('Failed to reset revisions:', error);
        alert('❌ Ошибка сброса ревизий');
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          onClick={onBack}
          style={styles.backButton}
        >
          ← Назад
        </button>
        <h1 style={styles.title}>Настройки и диагностика</h1>
      </div>

      <div style={styles.content}>
        {/* Storage Info Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Информация о хранилище</h2>
          
          <div style={styles.infoGrid}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Локальные данные:</span>
              <span style={styles.infoValue}>
                {storageInfo.hasData ? `✅ ${storageInfo.size} символов` : '❌ Отсутствуют'}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Ревизия локальная:</span>
              <span style={styles.infoValue}>
                {storageInfo.revision || 0}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Ревизия сервера:</span>
              <span style={styles.infoValue}>
                {storageInfo.serverRevision || 0}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Статус синхронизации:</span>
              <span style={styles.infoValue}>
                {syncStatusData.isSyncing ? '🔄 Синхронизация...' :
                 syncStatusData.hasUnsavedChanges ? '⚠️ Есть изменения' :
                 '✅ Синхронизировано'}
              </span>
            </div>
            {syncStatusData.lastSyncError && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Ошибка синхронизации:</span>
                <span style={{...styles.infoValue, color: '#ff6b6b'}}>
                  {syncStatusData.lastSyncError}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Действия</h2>
          
          <div style={styles.buttonGrid}>
            <button
              onClick={refreshData}
              style={styles.actionButton}
            >
              🔄 Обновить информацию
            </button>
            
            <button
              onClick={handleForceCloudRead}
              style={styles.actionButton}
              disabled={isRefreshing}
            >
              {isRefreshing ? '⏳ Загрузка...' : '⬇️ Загрузить из облака'}
            </button>
            
            <button
              onClick={handleForceCloudWrite}
              style={styles.actionButton}
              disabled={isTesting}
            >
              {isTesting ? '⏳ Запись...' : '⬆️ Записать в облако'}
            </button>
            
            <button
              onClick={handleInspectCloud}
              style={styles.actionButton}
              disabled={isLoadingCloud}
            >
              {isLoadingCloud ? '⏳ Загружаем...' : '🔍 Показать данные из облака'}
            </button>
            
            <button
              onClick={handleMigrateOldData}
              style={{...styles.actionButton, backgroundColor: '#ff9500'}}
              disabled={isTesting}
            >
              {isTesting ? '⏳ Миграция...' : '🔄 Мигрировать старые данные'}
            </button>

            <button
              onClick={handleResetRevisions}
              style={{...styles.actionButton, backgroundColor: '#34c759'}}
            >
              🔢 Сбросить ревизии
            </button>
            
            <button
              onClick={handleClearLocalStorage}
              style={{...styles.actionButton, backgroundColor: '#ff6b6b'}}
            >
              🗑️ Очистить локальные данные
            </button>
          </div>
        </div>

        {/* Cloud Data Section */}
        {cloudData && (
          <div style={styles.section}>
            <div style={styles.logsHeader}>
              <h2 style={styles.sectionTitle}>Данные из Telegram CloudStorage</h2>
              <div style={styles.logsActions}>
                <button
                  onClick={handleInspectCloud}
                  style={styles.smallButton}
                  disabled={isLoadingCloud}
                >
                  🔄 Обновить
                </button>
                <button
                  onClick={() => setCloudData('')}
                  style={{...styles.smallButton, backgroundColor: '#ff6b6b'}}
                >
                  🗑️ Скрыть
                </button>
              </div>
            </div>
            
            <textarea
              value={cloudData}
              readOnly
              style={styles.logsTextarea}
              placeholder="Данные из облака появятся здесь..."
            />
          </div>
        )}

        {/* Logs Section */}
        <div style={styles.section}>
          <div style={styles.logsHeader}>
            <h2 style={styles.sectionTitle}>Логи отладки</h2>
            <div style={styles.logsActions}>
              <button
                onClick={refreshData}
                style={styles.smallButton}
              >
                🔄 Обновить
              </button>
              <button
                onClick={handleClearLogs}
                style={{...styles.smallButton, backgroundColor: '#ff6b6b'}}
              >
                🗑️ Очистить
              </button>
            </div>
          </div>
          
          <textarea
            ref={textareaRef}
            value={logsText}
            readOnly
            style={styles.logsTextarea}
            placeholder="Логи появятся здесь..."
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    color: 'var(--tg-theme-text-color, #000000)',
    display: 'flex',
    flexDirection: 'column' as const,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid var(--tg-theme-section-separator-color, #e5e5e7)',
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
  },

  backButton: {
    background: 'none',
    border: 'none',
    color: 'var(--tg-theme-link-color, #2481cc)',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '8px',
    marginRight: '12px',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease',
  },

  title: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0',
    flex: 1,
  },

  content: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },

  section: {
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f8f9fa)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    color: 'var(--tg-theme-text-color, #000000)',
  },

  infoGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },

  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid var(--tg-theme-section-separator-color, #e5e5e7)',
  },

  infoLabel: {
    fontSize: '14px',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
    fontWeight: '500',
  },

  infoValue: {
    fontSize: '14px',
    color: 'var(--tg-theme-text-color, #000000)',
    fontWeight: '500',
    textAlign: 'right' as const,
  },

  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },

  actionButton: {
    padding: '12px 16px',
    backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
    color: 'var(--tg-theme-button-text-color, #ffffff)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
    minHeight: '44px',
  },

  logsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },

  logsActions: {
    display: 'flex',
    gap: '8px',
  },

  smallButton: {
    padding: '6px 12px',
    backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
    color: 'var(--tg-theme-button-text-color, #ffffff)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },

  logsTextarea: {
    width: '100%',
    height: '300px',
    padding: '12px',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    color: 'var(--tg-theme-text-color, #000000)',
    border: '1px solid var(--tg-theme-section-separator-color, #e5e5e7)',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    resize: 'vertical' as const,
    outline: 'none',
  },
};