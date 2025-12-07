import { type Component, createSignal, onMount } from 'solid-js';
import StudyView from './components/StudyView';
import EditView from './components/EditView';
import { type Card, parseTSV, stringifyTSV } from './lib/fsrs';
import { saveCards, loadCards } from './lib/storage';
import { initTelegram, hideMainButton, hideBackButton } from './lib/telegram';
import './App.css';

type View = 'loading' | 'study' | 'edit';

const App: Component = () => {
  const [currentView, setCurrentView] = createSignal<View>('loading');
  const [cards, setCards] = createSignal<Card[]>([]);
  const [error, setError] = createSignal<string>('');

  onMount(async () => {
    try {
      // Initialize Telegram
      initTelegram();
      
      // Load cards
      await loadCardsFromStorage();
      
      // Switch to main view after short delay to ensure loading screen is visible
      setTimeout(() => {
        setCurrentView('study');
      }, 1000);
      
    } catch (e) {
      console.error('Initialization error:', e);
      setError('Ошибка инициализации');
      // Still switch to study view even if there's an error
      setTimeout(() => {
        setCurrentView('study');
      }, 2000);
    }
  });

  const loadCardsFromStorage = async () => {
    try {
      const tsvData = await loadCards();
      
      if (tsvData && typeof tsvData === 'string' && tsvData.trim()) {
        const loadedCards = parseTSV(tsvData);
        if (loadedCards.length > 0) {
          setCards(loadedCards);
          return;
        }
      }
      
      // Create demo cards if no data
      const sampleCards: Card[] = [
        { question: 'Hello', answer: 'Привет' },
        { question: 'World', answer: 'Мир' },
        { question: 'Cat', answer: 'Кот' }
      ];
      setCards(sampleCards);
      
    } catch (error) {
      console.error('Error loading cards:', error);
      setError('Ошибка загрузки данных');
      
      // Fallback to demo cards
      const sampleCards: Card[] = [
        { question: 'Hello', answer: 'Привет' },
        { question: 'World', answer: 'Мир' },
        { question: 'Cat', answer: 'Кот' }
      ];
      setCards(sampleCards);
    }
  };

  const handleCardsUpdated = async (newCards: Card[]) => {
    setCards(newCards);
    try {
      const tsvData = stringifyTSV(newCards);
      await saveCards(tsvData);
    } catch (error) {
      console.error('Error saving cards:', error);
      setError('Ошибка сохранения данных');
    }
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

  // Loading screen
  if (currentView() === 'loading') {
    return (
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px; background: #f5f5f5;">
        <div style="font-size: 48px; margin-bottom: 20px;">📚</div>
        <div style="font-size: 18px; margin-bottom: 10px;">Загрузка карточек...</div>
        <div style="font-size: 14px; color: #666;">Подготавливаем ваши карточки для изучения</div>
        
        {error() && (
          <div style="color: #ff6b6b; margin-top: 20px; font-size: 14px; background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #ffcdd2; max-width: 300px;">
            {error()}
          </div>
        )}
        
        {/* Force switch to study after 5 seconds if stuck */}
        <button 
          onClick={() => setCurrentView('study')} 
          style="margin-top: 30px; padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;"
        >
          Продолжить без ожидания
        </button>
      </div>
    );
  }

  // Main app
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