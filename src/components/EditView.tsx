import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FSRSManager } from '../lib/fsrs';
import { telegram } from '../lib/telegram';
import { tryReadFromCloud } from '../lib/storage';

interface EditViewProps {
  fsrs: FSRSManager;
  onSave: (tsvData: string) => void;
  onCancel: () => void;
}

export const EditView: React.FC<EditViewProps> = ({ fsrs, onSave, onCancel }) => {
  const [tsvData, setTsvData] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalTsv, setOriginalTsv] = useState('');
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const saveCallbackRef = useRef<() => void>();
  const cancelCallbackRef = useRef<() => void>();

  const handleSave = useCallback(() => {
    console.log('EditView: handleSave called', { hasChanges, error, tsvDataLength: tsvData.length });
    
    if (!hasChanges || error) {
      console.log('EditView: Save blocked:', { hasChanges, error });
      return;
    }
    
    try {
      console.log('EditView: Calling onSave with TSV data...');
      onSave(tsvData);
      telegram.hapticFeedback('notification');
    } catch (e) {
      setError('Ошибка сохранения данных');
      console.error('EditView: Save error:', e);
    }
  }, [hasChanges, error, tsvData, onSave]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      // Show confirmation if there are unsaved changes
      if (confirm('У вас есть несохранённые изменения. Выйти без сохранения?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  }, [hasChanges, onCancel]);

  // Update refs when callbacks change
  useEffect(() => {
    saveCallbackRef.current = handleSave;
    cancelCallbackRef.current = handleCancel;
  }, [handleSave, handleCancel]);

  useEffect(() => {
    const loadLatestData = async () => {
      console.log('EditView: Starting to load latest data...');
      setIsLoadingCloud(true);
      
      try {
        // First try to get the latest version from cloud
        console.log('EditView: Attempting to load from cloud...');
        const cloudData = await tryReadFromCloud();
        
        let dataToUse: string;
        if (cloudData) {
          console.log('EditView: Using cloud data:', cloudData.length, 'characters');
          // Create a temporary FSRS instance to parse cloud data
          const tempFsrs = new FSRSManager();
          tempFsrs.loadCards(cloudData);
          dataToUse = tempFsrs.exportTSV();
        } else {
          console.log('EditView: No cloud data, using current local data');
          dataToUse = fsrs.exportTSV();
        }
        
        console.log('EditView: Setting TSV data:', dataToUse.length, 'characters');
        setTsvData(dataToUse);
        setOriginalTsv(dataToUse);
        
      } catch (error) {
        console.error('EditView: Failed to load cloud data, using local:', error);
        const localTsv = fsrs.exportTSV();
        setTsvData(localTsv);
        setOriginalTsv(localTsv);
      } finally {
        setIsLoadingCloud(false);
      }
    };
    
    loadLatestData();
    
    // Setup buttons
    const setupButtons = () => {
      console.log('EditView: Setting up buttons');
      
      // Setup save button with ref
      telegram.showMainButton('Сохранить', () => saveCallbackRef.current?.());
      telegram.disableMainButton(); // Initially disabled
      
      // Setup back button with ref
      telegram.showBackButton(() => cancelCallbackRef.current?.());
    };
    
    setupButtons();
    
    return () => {
      telegram.hideMainButton();
      telegram.hideBackButton();
    };
  }, [fsrs]);

  // Update button state when hasChanges or error changes
  useEffect(() => {
    if (hasChanges && !error) {
      console.log('EditView: Enabling save button due to changes');
      telegram.enableMainButton();
    } else {
      console.log('EditView: Disabling save button', { hasChanges, error });
      telegram.disableMainButton();
    }
  }, [hasChanges, error]);

  const handleTsvChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    
    console.log('EditView: TSV change detected', {
      newLength: newValue.length,
      originalLength: originalTsv.length,
      hasChanged: newValue !== originalTsv
    });
    
    setTsvData(newValue);
    
    const hasChanged = newValue !== originalTsv;
    setHasChanges(hasChanged);
    setError(null);
    
    // Validate TSV format first
    validateTSV(newValue);
    
    // Enable/disable save button based on changes and validation
    setTimeout(() => {
      if (hasChanged && !error) {
        console.log('EditView: Enabling save button after change');
        telegram.enableMainButton();
      } else {
        console.log('EditView: Disabling save button after change', { hasChanged, error });
        telegram.disableMainButton();
      }
    }, 100);
  };

  const validateTSV = (data: string) => {
    if (!data.trim()) {
      setError(null);
      return;
    }

    try {
      // Replace == with tabs before validation
      const processedData = data.replace(/==/g, '\t');
      const lines = processedData.trim().split('\n');
      let hasError = false;
      let errorMessage = '';

      for (let i = 1; i < lines.length; i++) { // Skip header line
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split('\t');
        if (columns.length < 1) {
          hasError = true;
          errorMessage = `Строка ${i + 1}: нужен как минимум вопрос`;
          break;
        }

        // Validate that question is not empty after unescaping
        const question = (columns[0] || '').replace(/\\n/g, '\n').replace(/\\t/g, '\t').trim();
        
        if (!question) {
          hasError = true;
          errorMessage = `Строка ${i + 1}: вопрос не может быть пустым`;
          break;
        }
      }

      if (hasError) {
        setError(errorMessage);
        telegram.disableMainButton();
      } else {
        setError(null);
        if (hasChanges && !hasError) {
          telegram.enableMainButton();
        }
      }
    } catch (e) {
      setError('Ошибка формата TSV');
      telegram.disableMainButton();
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

Для новых карточек достаточно указать только вопрос:
Hello==Привет
World==Мир
Incomplete question (без ответа)

Используйте == вместо табуляции между столбцами.
Для многострочных записей используйте \\n:
What is TypeScript?==TypeScript is a programming\\nlanguage that builds on JavaScript\\nby adding static type definitions.
How to cook pasta?==1. Boil water\\n2. Add pasta\\n3. Cook for 8-10 minutes\\n4. Drain and serve`;

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

      {/* Loading indicator */}
      {isLoadingCloud && (
        <div style={styles.loadingContainer}>
          <span style={styles.loadingText}>⏳ Загрузка последней версии из облака...</span>
        </div>
      )}

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
          placeholder="question==answer==[метаданные FSRS...]
Hello==Привет
World==Мир
Cat==Кот
Incomplete question"
          spellCheck={false}
          disabled={isLoadingCloud}
        />
      </div>

      {/* Actions */}
      <div style={styles.actionsContainer}>
        {!tsvData.trim() && !isLoadingCloud && (
          <div>
            <button
              style={styles.demoButton}
              onClick={insertDemoData}
            >
              Добавить демо-карточки
            </button>
            {telegram.isAvailable() && (
              <p style={styles.buttonHint}>
                Используйте кнопку "Сохранить" вверху экрана после внесения изменений
              </p>
            )}
          </div>
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
  
  buttonHint: {
    fontSize: '12px',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
    textAlign: 'center' as const,
    marginTop: '8px',
    fontStyle: 'italic',
  },

  loadingContainer: {
    padding: '12px 16px',
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
    borderBottom: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
    textAlign: 'center' as const,
  },

  loadingText: {
    fontSize: '14px',
    color: 'var(--tg-theme-button-color, #2481cc)',
    fontWeight: '500',
  },
};