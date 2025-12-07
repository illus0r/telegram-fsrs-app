import { type Component, createSignal, onMount } from 'solid-js';
import StudyView from './components/StudyView';
import EditView from './components/EditView';
import { type Card, parseTSV, stringifyTSV } from './lib/fsrs';
import { saveCards, loadCards } from './lib/storage';
import { initTelegram, hideMainButton, hideBackButton, getTelegramVersion, getTelegramDebugInfo } from './lib/telegram';
import './App.css';

type View = 'study' | 'edit' | 'debug';

const App: Component = () => {
  const [currentView, setCurrentView] = createSignal<View>('study');
  const [cards, setCards] = createSignal<Card[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string>('');
  const [debugInfo, setDebugInfo] = createSignal<string[]>([]);

  onMount(async () => {
    const debug: string[] = [];
    debug.push('🚀 Приложение запускается...');
    
    try {
      initTelegram();
      debug.push('✅ Telegram WebApp инициализирован');
      debug.push(`📱 Версия: ${getTelegramVersion()}`);
      debug.push(`🔧 Детали: ${getTelegramDebugInfo()}`);
    } catch (e) {
      debug.push(`❌ Ошибка инициализации Telegram: ${e}`);
    }
    
    setDebugInfo([...debug]);
    await loadCardsFromStorage();
  });

  const loadCardsFromStorage = async () => {
    const debug = [...debugInfo()];
    
    try {
      setError('');
      debug.push('📂 Начинаем загрузку карточек...');
      
      const tsvData = await loadCards();
      debug.push(`💾 Загружены данные: ${tsvData ? `${tsvData.length} символов` : 'пусто'}`);
      
      if (tsvData) {
        const loadedCards = parseTSV(tsvData);
        debug.push(`🃏 Распарсено карточек: ${loadedCards.length}`);
        setCards(loadedCards);
      } else {
        debug.push('📝 Создаём демо карточки...');
        // Initialize with sample data
        const sampleCards: Card[] = [
          { question: 'Hello', answer: 'Привет' },
          { question: 'World', answer: 'Мир' },
          { question: 'Cat', answer: 'Кот' }
        ];
        setCards(sampleCards);
        debug.push(`✨ Создано демо карточек: ${sampleCards.length}`);
      }
      debug.push('✅ Загрузка завершена успешно');
    } catch (error) {
      console.error('Error loading cards:', error);
      debug.push(`❌ Ошибка загрузки: ${error}`);
      setError('Ошибка загрузки данных. Используется локальное хранилище.');
      
      // Fallback to sample data
      const sampleCards: Card[] = [
        { question: 'Hello', answer: 'Привет' },
        { question: 'World', answer: 'Мир' },
        { question: 'Cat', answer: 'Кот' }
      ];
      setCards(sampleCards);
      debug.push(`🔄 Fallback: создано карточек: ${sampleCards.length}`);
    }
    
    setDebugInfo(debug);
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

  const switchToDebug = () => {
    setCurrentView('debug');
  };

  if (isLoading()) {
    return (
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px;">
        <div>
          <div style="font-size: 24px; margin-bottom: 10px;">📚</div>
          <div style="margin-bottom: 15px;">Загрузка карточек...</div>
          
          {/* Debug info */}
          <div style="background: #f5f5f5; border-radius: 8px; padding: 10px; margin: 10px 0; max-width: 300px; font-size: 12px; text-align: left;">
            <div style="font-weight: bold; margin-bottom: 5px;">Отладочная информация:</div>
            {debugInfo().map(info => (
              <div style="margin: 2px 0; color: #666;">{info}</div>
            ))}
          </div>
          
          {error() && (
            <div style="color: #ff6b6b; margin-top: 10px; font-size: 14px; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #ffcdd2;">
              {error()}
            </div>
          )}
          
          <button onClick={switchToDebug} style="margin-top: 10px; padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; font-size: 12px;">
            Показать детали
          </button>
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
      ) : currentView() === 'edit' ? (
        <EditView
          cards={cards()}
          onCardsUpdated={handleCardsUpdated}
          onSwitchToStudy={switchToStudy}
        />
      ) : (
        <div style="padding: 20px; font-family: monospace; font-size: 12px;">
          <h2 style="margin-bottom: 20px; font-size: 18px;">🔍 Отладочная информация</h2>
          
          <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #ddd;">
            <h3 style="margin-bottom: 10px;">Логи загрузки:</h3>
            {debugInfo().map(info => (
              <div style="margin: 3px 0; padding: 2px 0; border-bottom: 1px solid #f0f0f0;">{info}</div>
            ))}
          </div>
          
          <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #ddd;">
            <h3 style="margin-bottom: 10px;">Состояние приложения:</h3>
            <div>📊 Карточек загружено: {cards().length}</div>
            <div>🔄 Текущий режим: {currentView()}</div>
            <div>❗ Ошибки: {error() || 'нет'}</div>
          </div>
          
          <div style="display: flex; gap: 10px;">
            <button onClick={switchToStudy} style="padding: 10px 20px; background: #007AFF; color: white; border: none; border-radius: 6px;">
              К изучению
            </button>
            <button onClick={switchToEdit} style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 6px;">
              К редактированию
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;