import { type Component, createSignal, onMount } from 'solid-js';
import StudyView from './components/StudyView';
import EditView from './components/EditView';
import { type Card, parseTSV, stringifyTSV } from './lib/fsrs';
import { saveCards, loadCards } from './lib/storage';
import { initTelegram, hideMainButton, hideBackButton } from './lib/telegram';
import './App.css';

type View = 'study' | 'edit';

const App: Component = () => {
  const [currentView, setCurrentView] = createSignal<View>('study');
  const [cards, setCards] = createSignal<Card[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string>('');

  onMount(async () => {
    initTelegram();
    await loadCardsFromStorage();
  });

  const loadCardsFromStorage = async () => {
    try {
      setError('');
      const tsvData = await loadCards();
      if (tsvData) {
        const loadedCards = parseTSV(tsvData);
        setCards(loadedCards);
      } else {
        // Initialize with sample data
        const sampleCards: Card[] = [
          { question: 'Hello', answer: 'Привет' },
          { question: 'World', answer: 'Мир' },
          { question: 'Cat', answer: 'Кот' }
        ];
        setCards(sampleCards);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      setError('Ошибка загрузки данных. Используется локальное хранилище.');
      // Fallback to sample data
      const sampleCards: Card[] = [
        { question: 'Hello', answer: 'Привет' },
        { question: 'World', answer: 'Мир' },
        { question: 'Cat', answer: 'Кот' }
      ];
      setCards(sampleCards);
    }
    setIsLoading(false);
  };

  const handleCardsUpdated = async (newCards: Card[]) => {
    setCards(newCards);
    const tsvData = stringifyTSV(newCards);
    await saveCards(tsvData);
  };

  const handleCardUpdated = async (updatedCard: Card, index: number) => {
    const newCards = [...cards()];
    newCards[index] = updatedCard;
    await handleCardsUpdated(newCards);
  };

  const switchToEdit = () => {
    hideMainButton();
    setCurrentView('edit');
  };

  const switchToStudy = () => {
    hideMainButton();
    hideBackButton();
    setCurrentView('study');
  };

  if (isLoading()) {
    return (
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
        <div>
          <div style="font-size: 24px; margin-bottom: 10px;">📚</div>
          <div>Загрузка карточек...</div>
          {error() && (
            <div style="color: #ff6b6b; margin-top: 10px; font-size: 14px;">
              {error()}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style="min-height: 100vh; background: #f5f5f5;">
      {currentView() === 'study' ? (
        <StudyView
          cards={cards()}
          onCardUpdated={handleCardUpdated}
          onSwitchToEdit={switchToEdit}
        />
      ) : (
        <EditView
          cards={cards()}
          onCardsUpdated={handleCardsUpdated}
          onSwitchToStudy={switchToStudy}
        />
      )}
    </div>
  );
};

export default App;