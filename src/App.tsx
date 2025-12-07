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
  const [error, setError] = createSignal<string>('');

  onMount(async () => {
    console.log('App starting...');
    
    try {
      // Initialize Telegram
      initTelegram();
      console.log('Telegram initialized');
      
      // Load cards or create demo cards
      await loadCardsFromStorage();
      console.log('Cards loaded:', cards().length);
      
    } catch (e) {
      console.error('Error:', e);
      setError('Ошибка инициализации');
      // Create demo cards as fallback
      createDemoCards();
    }
  });

  const createDemoCards = () => {
    const demoCards: Card[] = [
      { question: 'Hello', answer: 'Привет' },
      { question: 'World', answer: 'Мир' },
      { question: 'Cat', answer: 'Кот' },
      { question: 'Dog', answer: 'Собака' },
      { question: 'House', answer: 'Дом' }
    ];
    console.log('Creating demo cards...');
    setCards(demoCards);
    console.log('Cards set, current length:', cards().length);
    
    // Force re-render by setting view after a small delay
    setTimeout(() => {
      setCurrentView('study');
      console.log('View switched to study, current view:', currentView());
    }, 100);
    
    console.log('Demo cards created:', demoCards.length);
  };

  const loadCardsFromStorage = async () => {
    try {
      const tsvData = await loadCards();
      console.log('Raw data loaded:', typeof tsvData, tsvData?.length);
      
      if (tsvData && typeof tsvData === 'string' && tsvData.trim()) {
        const loadedCards = parseTSV(tsvData);
        if (loadedCards.length > 0) {
          setCards(loadedCards);
          console.log('Parsed cards:', loadedCards);
          return;
        }
      }
      
      // No data found, create demo cards
      createDemoCards();
      
    } catch (error) {
      console.error('Error loading cards:', error);
      setError('Ошибка загрузки данных');
      createDemoCards();
    }
  };

  const handleCardsUpdated = async (newCards: Card[]) => {
    console.log('Updating cards:', newCards.length);
    setCards(newCards);
    try {
      const tsvData = stringifyTSV(newCards);
      await saveCards(tsvData);
      console.log('Cards saved successfully');
    } catch (error) {
      console.error('Error saving cards:', error);
      setError('Ошибка сохранения данных');
    }
  };

  const handleCardUpdated = async (updatedCard: Card, index: number) => {
    console.log('Updating single card at index:', index);
    const newCards = [...cards()];
    newCards[index] = updatedCard;
    await handleCardsUpdated(newCards);
  };

  const switchToEdit = () => {
    console.log('Switching to edit view');
    hideMainButton();
    setCurrentView('edit');
  };

  const switchToStudy = () => {
    console.log('Switching to study view');
    hideMainButton();
    hideBackButton();
    setCurrentView('study');
  };

  console.log('Render - currentView:', currentView(), 'cards:', cards().length, 'error:', error());

  // Show loading screen only if no cards are loaded yet
  if (cards().length === 0) {
    return (
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px; background: #f5f5f5;">
        <div style="font-size: 48px; margin-bottom: 20px;">📚</div>
        <div style="font-size: 18px; margin-bottom: 10px;">Загрузка карточек...</div>
        
        {/* Debug info */}
        <div style="background: #f0f0f0; padding: 10px; border-radius: 8px; margin: 10px 0; font-size: 12px; color: #666;">
          <div>Текущий режим: {currentView()}</div>
          <div>Карточек загружено: {cards().length}</div>
          <div>Ошибка: {error() || 'нет'}</div>
        </div>
        
        {error() && (
          <div style="color: #ff6b6b; margin-top: 20px; font-size: 14px; background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #ffcdd2; max-width: 300px;">
            {error()}
          </div>
        )}
        
        <button 
          onClick={() => {
            console.log('Button clicked, current cards:', cards().length);
            createDemoCards();
          }}
          style="margin-top: 20px; padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;"
        >
          Создать тестовые карточки
        </button>
        
        {/* Debug: Force show study view button */}
        <button 
          onClick={() => {
            console.log('Force study button clicked, cards before:', cards().length);
            if (cards().length === 0) {
              createDemoCards();
            } else {
              setCurrentView('study');
            }
            console.log('Force study button - after action, cards:', cards().length, 'view:', currentView());
          }}
          style="margin-top: 10px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
        >
          Принудительно к изучению
        </button>
      </div>
    );
  }

  // Main app - always render the main interface when cards are available
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
      
      {error() && (
        <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; background: #ff6b6b; color: white; padding: 10px; border-radius: 8px; text-align: center; font-size: 14px; z-index: 1000;">
          {error()}
        </div>
      )}
    </div>
  );
};

export default App;