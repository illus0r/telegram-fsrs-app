import React, { useState, useEffect } from 'react';
import { FSRSManager } from '../lib/fsrs';
import { telegram } from '../lib/telegram';

interface EditViewProps {
  fsrs: FSRSManager;
  onSave: (tsvData: string) => void;
  onCancel: () => void;
}

export const EditView: React.FC<EditViewProps> = ({ fsrs, onSave, onCancel }) => {
  const [tsvData, setTsvData] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load current TSV data
    const currentTsv = fsrs.exportTSV();
    setTsvData(currentTsv);
    
    setupButtons();
    
    return () => {
      telegram.hideMainButton();
      telegram.hideBackButton();
    };
  }, []);

  const setupButtons = () => {
    // Setup save button
    telegram.showMainButton('Сохранить', handleSave);
    telegram.disableMainButton(); // Initially disabled
    
    // Setup back button
    telegram.showBackButton(handleCancel);
  };

  const handleTsvChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setTsvData(newValue);
    
    const hasChanged = newValue !== fsrs.exportTSV();
    setHasChanges(hasChanged);
    setError(null);
    
    // Enable/disable save button based on changes
    if (hasChanged) {
      telegram.enableMainButton();
    } else {
      telegram.disableMainButton();
    }
    
    // Validate TSV format
    validateTSV(newValue);
  };

  const validateTSV = (data: string) => {
    if (!data.trim()) {
      setError(null);
      return;
    }

    try {
      const lines = data.trim().split('\n');
      let hasError = false;
      let errorMessage = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split('\t');
        if (columns.length < 2) {
          hasError = true;
          errorMessage = `Строка ${i + 1}: минимум 2 колонки (вопрос и ответ)`;
          break;
        }

        if (!columns[0].trim() || !columns[1].trim()) {
          hasError = true;
          errorMessage = `Строка ${i + 1}: вопрос и ответ не могут быть пустыми`;
          break;
        }
      }

      if (hasError) {
        setError(errorMessage);
        telegram.disableMainButton();
      } else {
        setError(null);
        if (hasChanges) {
          telegram.enableMainButton();
        }
      }
    } catch (e) {
      setError('Ошибка формата TSV');
      telegram.disableMainButton();
    }
  };

  const handleSave = () => {
    if (!hasChanges || error) return;
    
    try {
      onSave(tsvData);
      telegram.hapticFeedback('notification');
    } catch (e) {
      setError('Ошибка сохранения данных');
      console.error('Save error:', e);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      // Show confirmation if there are unsaved changes
      if (confirm('У вас есть несохранённые изменения. Выйти без сохранения?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const insertDemoData = () => {
    if (tsvData.trim() && !confirm('Заменить текущие данные демо-карточками?')) {
      return;
    }
    
    const demoTsv = FSRSManager.getDemoTSV();
    setTsvData(demoTsv);
    setHasChanges(true);
    setError(null);
    telegram.enableMainButton();
  };

  const getLineCount = (): number => {
    if (!tsvData.trim()) return 0;
    return tsvData.trim().split('\n').filter(line => line.trim()).length;
  };

  const formatHelp = `Формат TSV:
question	answer	due	stability	difficulty	elapsed_days	scheduled_days	reps	lapses	state	last_review

Для новых карточек достаточно указать только вопрос и ответ:
Hello	Привет
World	Мир`;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Редактировать карточки</h2>
        <div style={styles.stats}>
          <span style={styles.statText}>
            Карточек: {getLineCount()}
          </span>
          {hasChanges && (
            <span style={styles.changedIndicator}>• Изменено</span>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {/* TSV Editor */}
      <div style={styles.editorContainer}>
        <textarea
          style={styles.textarea}
          value={tsvData}
          onChange={handleTsvChange}
          placeholder="question	answer	[метаданные FSRS...]
Hello	Привет
World	Мир
Cat	Кот"
          spellCheck={false}
        />
      </div>

      {/* Actions */}
      <div style={styles.actionsContainer}>
        {!tsvData.trim() && (
          <button
            style={styles.demoButton}
            onClick={insertDemoData}
          >
            Добавить демо-карточки
          </button>
        )}
        
        <details style={styles.helpDetails}>
          <summary style={styles.helpSummary}>Справка по формату</summary>
          <pre style={styles.helpContent}>{formatHelp}</pre>
        </details>
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
    padding: '16px',
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
    borderBottom: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
  },
  
  title: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: 'var(--tg-theme-text-color, #000000)',
  },
  
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  
  statText: {
    fontSize: '14px',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
  },
  
  changedIndicator: {
    fontSize: '14px',
    color: 'var(--tg-theme-button-color, #2481cc)',
    fontWeight: '500',
  },
  
  errorContainer: {
    padding: '12px 16px',
    backgroundColor: '#ffebee',
    borderBottom: '1px solid #ffcdd2',
  },
  
  errorText: {
    fontSize: '14px',
    color: '#c62828',
    fontWeight: '500',
  },
  
  editorContainer: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  
  textarea: {
    flex: 1,
    width: '100%',
    padding: '12px',
    border: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Monaco, "SF Mono", Consolas, monospace',
    lineHeight: '1.5',
    resize: 'none' as const,
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    color: 'var(--tg-theme-text-color, #000000)',
    outline: 'none',
    whiteSpace: 'pre' as const,
    overflowWrap: 'normal' as const,
    overflowX: 'auto' as const,
  },
  
  actionsContainer: {
    padding: '16px',
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
    borderTop: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
  },
  
  demoButton: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
    color: 'var(--tg-theme-button-text-color, #ffffff)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'opacity 0.2s ease',
  },
  
  helpDetails: {
    width: '100%',
  },
  
  helpSummary: {
    fontSize: '14px',
    color: 'var(--tg-theme-link-color, #2481cc)',
    cursor: 'pointer',
    padding: '8px 0',
    outline: 'none',
  },
  
  helpContent: {
    fontSize: '12px',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    border: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
    borderRadius: '6px',
    padding: '12px',
    margin: '8px 0 0 0',
    fontFamily: 'Monaco, "SF Mono", Consolas, monospace',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap' as const,
    overflowX: 'auto' as const,
  },
};