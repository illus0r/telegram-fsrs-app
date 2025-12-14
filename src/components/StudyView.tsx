import React, { useState, useEffect } from 'react';
import { FSRSManager, CardData } from '../lib/fsrs';
import type { Rating } from 'ts-fsrs';
import { telegram } from '../lib/telegram';
import { List, Plus, Award } from 'react-feather';

interface StudyViewProps {
  fsrs: FSRSManager;
  onEditCard: (card: CardData) => void;
  onEditTSV: () => void;
  onCreateCard: () => void;
  onSaveProgress: () => Promise<void>;
}

export const StudyView: React.FC<StudyViewProps> = ({ fsrs, onEditCard, onEditTSV, onCreateCard, onSaveProgress }) => {
  const [currentCard, setCurrentCard] = useState<CardData | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState(fsrs.getStats());

  useEffect(() => {
    loadNextCard();
    updateStats();
  }, []);

  const loadNextCard = () => {
    const nextCard = fsrs.getNextCard();
    setCurrentCard(nextCard);
    setShowAnswer(false);
  };

  const updateStats = () => {
    setStats(fsrs.getStats());
  };

  const handleCardClick = () => {
    if (!showAnswer) {
      setShowAnswer(true);
    }
  };

  const handleGrade = async (grade: Rating) => {
    if (!currentCard || !showAnswer) return;

    fsrs.reviewCard(currentCard, grade);

    // Save progress to storage
    try {
      await onSaveProgress();
    } catch (error) {
      console.error('Failed to save progress:', error);
    }

    loadNextCard();
    updateStats();

    // Haptic feedback
    telegram.hapticFeedback('impact');
  };

  const getSchedulingInfo = () => {
    if (!currentCard) return null;

    try {
      const schedulingInfo = fsrs.getSchedulingInfo(currentCard);
      return schedulingInfo;
    } catch (error) {
      return null;
    }
  };

  const formatInterval = (dueDate: Date): string => {
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMinutes / 60;
    const diffDays = diffHours / 24;

    if (diffMinutes < 1) {
      return '1 мин';
    } else if (diffMinutes < 60) {
      return `${Math.round(diffMinutes)} мин`;
    } else if (diffHours < 24) {
      return `${Math.round(diffHours)} ч`;
    } else if (diffDays < 30) {
      return `${Math.round(diffDays)} д`;
    } else if (diffDays < 365) {
      const months = Math.round(diffDays / 30);
      return `${months} мес`;
    } else {
      const years = Math.round(diffDays / 365);
      return `${years} г`;
    }
  };

  const getGradeText = (grade: Rating): string => {
    const schedulingInfo = getSchedulingInfo();

    if (!schedulingInfo) return '?';

    switch (grade) {
      case 1:
        if (schedulingInfo?.again) {
          return formatInterval(schedulingInfo.again.card.due);
        }
        break;
      case 2:
        if (schedulingInfo?.hard) {
          return formatInterval(schedulingInfo.hard.card.due);
        }
        break;
      case 3:
        if (schedulingInfo?.good) {
          return formatInterval(schedulingInfo.good.card.due);
        }
        break;
      case 4:
        if (schedulingInfo?.easy) {
          return formatInterval(schedulingInfo.easy.card.due);
        }
        break;
    }

    return '?';
  };

  const getGradeColor = (grade: Rating): string => {
    switch (grade) {
      case 1: return '#ff4757';
      case 2: return '#ff6b35';
      case 3: return '#26de81';
      case 4: return '#45aaf2';
      default: return '#26de81';
    }
  };

  if (stats.total === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>Нет карточек</h2>
          <p style={styles.emptyText}>
            Нажмите "Редактировать", чтобы добавить карточки для изучения.
          </p>
          <div style={styles.statsContainer}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{stats.total}</span>
              <span style={styles.statLabel}>Всего</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div style={styles.container}>
        {/* Stats header */}
        <div style={styles.statsHeader}>
          <div style={styles.statsContainer}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{stats.total}</span>
              <span style={styles.statLabel}>Всего</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{stats.review}</span>
              <span style={styles.statLabel}>На повторении</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{stats.new}</span>
              <span style={styles.statLabel}>Новые</span>
            </div>
          </div>
          <div style={styles.buttonGroup}>
            <button
              style={styles.listButton}
              onClick={onEditTSV}
              title="Массовое редактирование"
            >
              <List size={16} />
            </button>
            <button
              style={styles.createButton}
              onClick={onCreateCard}
              title="Создать новую карточку"
            >
              +
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div style={styles.completedState}>
          <h2 style={styles.completedTitle}>
            <Award size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Все готово!
          </h2>
          <p style={styles.completedText}>
            Вы повторили все карточки на сегодня. Отличная работа!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Stats header */}
      <div style={styles.statsHeader}>
        <div style={styles.statsContainer}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.due}</span>
            <span style={styles.statLabel}>К изучению</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.new}</span>
            <span style={styles.statLabel}>Новые</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.review}</span>
            <span style={styles.statLabel}>Повторение</span>
          </div>
        </div>
        <div style={styles.buttonGroup}>
          <button
            style={styles.createButton}
            onClick={onCreateCard}
            title="Создать новую карточку"
          >
            <Plus size={16} />
          </button>
          <button
            style={styles.listButton}
            onClick={onEditTSV}
            title="Массовое редактирование"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Card */}
      <div style={styles.cardContainer}>
        <div
          style={{
            ...styles.card,
            cursor: showAnswer ? 'default' : 'pointer'
          }}
          onClick={handleCardClick}
        >
          <div style={styles.cardContent}>
            <div style={styles.questionContainer}>
              <h2 style={styles.question}>{currentCard.question}</h2>
            </div>

            {showAnswer && (
              <div style={styles.answerContainer}>
                <div style={styles.divider} />
                <p style={styles.answer}>{currentCard.answer}</p>
              </div>
            )}
          </div>

          {!showAnswer && (
            <div style={styles.tapHint}>
              <span style={styles.tapHintText}>Нажмите, чтобы увидеть ответ</span>
            </div>
          )}
        </div>
      </div>

      {/* Grade buttons */}
      {showAnswer && (
        <div style={styles.gradeContainer}>
          <div style={styles.gradeButtons}>
            {[1, 2, 3, 4].map((grade) => (
              <button
                key={grade}
                style={{
                  ...styles.gradeButton,
                  backgroundColor: getGradeColor(grade),
                }}
                onClick={() => handleGrade(grade)}
              >
                {getGradeText(grade)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Edit button under card */}
      {currentCard && (
        <div style={styles.editContainer}>
          <button
            style={styles.editButton}
            onClick={() => onEditCard(currentCard)}
          >
            Редактировать
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    color: 'var(--tg-theme-text-color, #000000)',
    padding: '0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  statsHeader: {
    padding: '16px',
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
    borderBottom: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statsContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '16px',
  },

  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },

  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--tg-theme-button-color, #2481cc)',
  },

  statLabel: {
    fontSize: '12px',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
    textTransform: 'uppercase' as const,
  },

  cardContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },

  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    borderRadius: '12px',
    boxShadow: '0 2px 16px rgba(0, 0, 0, 0.1)',
    border: '1px solid var(--tg-theme-hint-color, #c8c7cc)',
    overflow: 'hidden',
    transition: 'transform 0.2s ease',
  },

  cardContent: {
    padding: '24px',
  },

  questionContainer: {
    textAlign: 'center' as const,
  },

  question: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0',
    color: 'var(--tg-theme-text-color, #000000)',
    lineHeight: '1.4',
    whiteSpace: 'pre-line' as const,
  },

  divider: {
    height: '1px',
    backgroundColor: 'var(--tg-theme-hint-color, #c8c7cc)',
    margin: '20px 0',
  },

  answerContainer: {
    textAlign: 'center' as const,
  },

  answer: {
    fontSize: '18px',
    margin: '0',
    color: 'var(--tg-theme-text-color, #000000)',
    lineHeight: '1.4',
    whiteSpace: 'pre-line' as const,
  },

  tapHint: {
    padding: '16px 24px',
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
    textAlign: 'center' as const,
  },

  tapHintText: {
    fontSize: '14px',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
  },

  gradeContainer: {
    padding: '16px',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
  },

  gradeButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '8px',
  },

  gradeButton: {
    padding: '8px 4px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
    outline: 'none',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
    lineHeight: '1.2',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    textAlign: 'center' as const,
  },

  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    color: 'var(--tg-theme-text-color, #000000)',
  },

  emptyText: {
    fontSize: '16px',
    margin: '0 0 32px 0',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
    lineHeight: '1.4',
  },

  completedState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    textAlign: 'center' as const,
    minHeight: '300px',
  },

  completedTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    color: 'var(--tg-theme-text-color, #000000)',
  },

  completedText: {
    fontSize: '16px',
    margin: '0 0 32px 0',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
    lineHeight: '1.4',
  },

  editContainer: {
    padding: '16px',
    textAlign: 'center' as const,
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
  },

  editButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'var(--tg-theme-link-color, #2481cc)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'underline',
    outline: 'none',
  },

  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },

  createButton: {
    width: '32px',
    height: '32px',
    backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
    color: 'var(--tg-theme-button-text-color, #ffffff)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    transition: 'opacity 0.2s ease',
  },

  listButton: {
    width: '32px',
    height: '32px',
    backgroundColor: 'transparent',
    color: 'var(--tg-theme-hint-color, #8e8e93)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
};
