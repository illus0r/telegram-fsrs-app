import React, { useRef, useEffect } from 'react';
import { logger } from '../lib/logger';

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logsText = logger.getLogsAsText();

  useEffect(() => {
    // Auto-scroll to bottom when logs update
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [logsText]);

  const handleClearLogs = () => {
    if (confirm('Очистить все логи?')) {
      logger.clearLogs();
      // Force re-render by triggering parent update
      onBack();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← Назад
        </button>
        <h1 style={styles.title}>Настройки</h1>
        <button style={styles.clearButton} onClick={handleClearLogs}>
          Очистить
        </button>
      </div>

      {/* Logs section */}
      <div style={styles.content}>
        <div style={styles.logsSection}>
          <h2 style={styles.sectionTitle}>Логи приложения</h2>
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

  content: {
    flex: 1,
    padding: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },

  logsSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },

  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0',
    color: 'var(--tg-theme-text-color, #000000)',
  },

  logsTextarea: {
    flex: 1,
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