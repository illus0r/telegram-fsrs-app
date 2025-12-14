import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CardData } from '../lib/fsrs';
import { telegram } from '../lib/telegram';
import { Trash2, Zap, BarChart, Info } from 'react-feather';

interface CardEditViewProps {
  card: CardData;
  onSave: (question: string, answer: string) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export const CardEditView: React.FC<CardEditViewProps> = ({ card, onSave, onCancel, onDelete }) => {
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveCallbackRef = useRef<() => void>();
  const cancelCallbackRef = useRef<() => void>();

  const handleSave = useCallback(() => {
    console.log('CardEditView: handleSave called', { hasChanges, error });
    
    if (!hasChanges || error) {
      console.log('CardEditView: Save blocked:', { hasChanges, error });
      return;
    }
    
    // Check if both question and answer are empty - delete card
    if (!question.trim() && !answer.trim()) {
      console.log('CardEditView: Both fields empty, deleting card...');
      onDelete();
      return;
    }
    
    // Validate input - only question is required
    if (!question.trim()) {
      setError('Вопрос не может быть пустым');
      return;
    }
    
    try {
      console.log('CardEditView: Calling onSave...');
      onSave(question.trim(), answer.trim());
      telegram.hapticFeedback('notification');
    } catch (e) {
      setError('Ошибка сохранения карточки');
      console.error('CardEditView: Save error:', e);
    }
  }, [hasChanges, error, question, answer, onSave, onDelete]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
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
    // Setup buttons
    console.log('CardEditView: Setting up buttons');
    
    // Setup save button with ref
    telegram.showMainButton('Сохранить', () => saveCallbackRef.current?.());
    telegram.disableMainButton(); // Initially disabled
    
    // Setup back button with ref
    telegram.showBackButton(() => cancelCallbackRef.current?.());
    
    return () => {
      telegram.hideMainButton();
      telegram.hideBackButton();
    };
  }, []);

  // Update button state when hasChanges or error changes
  useEffect(() => {
    if (hasChanges && !error) {
      console.log('CardEditView: Enabling save button due to changes');
      telegram.enableMainButton();
    } else {
      console.log('CardEditView: Disabling save button', { hasChanges, error });
      telegram.disableMainButton();
    }
  }, [hasChanges, error]);

  const handleQuestionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setQuestion(newValue);
    updateChangesState(newValue, answer);
    setError(null);
  };

  const handleAnswerChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setAnswer(newValue);
    updateChangesState(question, newValue);
    setError(null);
  };

  const updateChangesState = (newQuestion: string, newAnswer: string) => {
    const hasChanged = 
      newQuestion !== card.question || 
      newAnswer !== card.answer;
    
    setHasChanges(hasChanged);
    
    console.log('CardEditView: Changes detected', {
      questionChanged: newQuestion !== card.question,
      answerChanged: newAnswer !== card.answer,
      hasChanged
    });
  };

  // Auto-resize textareas
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Редактировать карточку</h2>
        {hasChanges && (
          <span style={styles.changedIndicator}>• Изменено</span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {/* Form */}
      <div style={styles.formContainer}>
        <div style={styles.fieldContainer}>
          <label style={styles.label}>Вопрос:</label>
          <textarea
            style={styles.textarea}
            value={question}
            onChange={handleQuestionChange}
            onInput={(e) => autoResize(e.currentTarget)}
            placeholder="Введите вопрос..."
            rows={2}
          />
        </div>

        <div style={styles.fieldContainer}>
          <label style={styles.label}>Ответ:</label>
          <textarea
            style={styles.textarea}
            value={answer}
            onChange={handleAnswerChange}
            onInput={(e) => autoResize(e.currentTarget)}
            placeholder="Введите ответ..."
            rows={2}
          />
        </div>
      </div>



      {/* Hints */}
      <div style={styles.hintsContainer}>
        <p style={styles.hint}>
          <Zap size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Поддерживаются многострочные записи
        </p>
        <p style={styles.hint}>
          <BarChart size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Прогресс изучения сохранится после редактирования
        </p>
        <p style={styles.hint}>
          <Info size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Ответ может быть пустым (фронтальная карта)
        </p>
        <p style={styles.hint}>
          <Trash2 size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Для удаления карточки очистите оба поля и сохраните
        </p>
        {telegram.isAvailable() && (
          <p style={styles.hint}>
            Используйте кнопку "Сохранить" вверху экрана
          </p>
        )}
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  title: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0',
    color: 'var(--tg-theme-text-color, #000000)',
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
  
  formContainer: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  
  fieldContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  
  label: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--tg-theme-text-color, #000000)',
  },
  
  textarea: {
    width: '100%',
    minHeight: '80px',
    padding: '12px',
    border: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.4',
    resize: 'none' as const,
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    color: 'var(--tg-theme-text-color, #000000)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  
  hintsContainer: {
    padding: '16px',
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
    borderTop: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
  },
  
  hint: {
    fontSize: '12px',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
    margin: '4px 0',
    lineHeight: '1.3',
  },
  

};