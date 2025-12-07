import { type Component, createSignal, createEffect, onMount } from 'solid-js';
import { type Card, getCardsForReview, gradeCard } from '../lib/fsrs';
import { showMainButton } from '../lib/telegram';

interface StudyViewProps {
  cards: Card[];
  onCardUpdated: (updatedCard: Card, index: number) => void;
  onSwitchToEdit: () => void;
  onSwitchToDebug?: () => void;
}

const StudyView: Component<StudyViewProps> = (props) => {
  const [reviewCards, setReviewCards] = createSignal<Card[]>([]);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [showAnswer, setShowAnswer] = createSignal(false);

  createEffect(() => {
    const cardsToReview = getCardsForReview(props.cards);
    setReviewCards(cardsToReview);
    setCurrentIndex(0);
    setShowAnswer(false);
  });

  onMount(() => {
    showMainButton('Редактировать', props.onSwitchToEdit);
  });

  const currentCard = () => reviewCards()[currentIndex()];

  const handleCardClick = () => {
    if (!showAnswer()) {
      setShowAnswer(true);
    }
  };

  const handleGrade = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const card = currentCard();
    if (!card) return;

    const updatedCard = gradeCard(card, rating);
    
    // Find original index in props.cards
    const originalIndex = props.cards.findIndex(
      c => c.question === card.question && c.answer === card.answer
    );
    
    if (originalIndex !== -1) {
      props.onCardUpdated(updatedCard, originalIndex);
    }

    // Move to next card
    if (currentIndex() < reviewCards().length - 1) {
      setCurrentIndex(currentIndex() + 1);
      setShowAnswer(false);
    } else {
      // All cards reviewed - refresh the list
      const newReviewCards = getCardsForReview(props.cards);
      setReviewCards(newReviewCards);
      setCurrentIndex(0);
      setShowAnswer(false);
    }
  };

  if (reviewCards().length === 0) {
    return (
      <div style="padding: 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
        <h2>🎉 Нет карточек для повторения!</h2>
        <p>Все карточки изучены. Возвращайтесь позже или добавьте новые.</p>
        <p style="color: #666; font-size: 14px; margin-top: 10px;">
          Всего карточек: {props.cards.length}
        </p>
      </div>
    );
  }

  const card = currentCard();
  if (!card) return null;

  return (
    <div style="padding: 20px; display: flex; flex-direction: column; height: 100vh;">
      <div style="margin-bottom: 10px; text-align: center; color: #666;">
        <span>{currentIndex() + 1} / {reviewCards().length}</span>
      </div>

      <div 
        onClick={handleCardClick}
        style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; min-height: 200px; display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex-grow: 1;"
      >
        <div>
          <div style="font-size: 18px; margin-bottom: 20px;">
            {card.question}
          </div>
          
          {showAnswer() && (
            <div style="font-size: 16px; color: #666; border-top: 1px solid #eee; padding-top: 20px;">
              {card.answer}
            </div>
          )}
          
          {!showAnswer() && (
            <div style="color: #999; font-size: 14px;">
              Нажмите, чтобы увидеть ответ
            </div>
          )}
        </div>
      </div>

      {showAnswer() && (
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <button
            onClick={() => handleGrade('again')}
            style="padding: 15px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;"
          >
            Снова
          </button>
          
          <button
            onClick={() => handleGrade('hard')}
            style="padding: 15px; background: #ff9944; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;"
          >
            Трудно
          </button>
          
          <button
            onClick={() => handleGrade('good')}
            style="padding: 15px; background: #44aa44; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;"
          >
            Хорошо
          </button>
          
          <button
            onClick={() => handleGrade('easy')}
            style="padding: 15px; background: #4444aa; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;"
          >
            Легко
          </button>
        </div>
      )}
    </div>
  );
};

export default StudyView;