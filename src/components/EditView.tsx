import { type Component, createSignal, onMount } from 'solid-js';
import { type Card, parseTSV, stringifyTSV } from '../lib/fsrs';
import { showMainButton, showBackButton, isCloudStorageSupported } from '../lib/telegram';

interface EditViewProps {
  cards: Card[];
  onCardsUpdated: (cards: Card[]) => void;
  onSwitchToStudy: () => void;
}

const EditView: Component<EditViewProps> = (props) => {
  const [tsvText, setTsvText] = createSignal('');
  const [isSaving, setIsSaving] = createSignal(false);

  onMount(() => {
    // Initialize with current cards data
    const initialTsv = props.cards.length > 0 
      ? stringifyTSV(props.cards)
      : 'question\tanswer\tD\tS\tI\nHello\tПривет\t\t\t\nWorld\tМир\t\t\t\nCat\tКот\t\t\t';
    
    setTsvText(initialTsv);

    // Setup Telegram UI
    showBackButton(props.onSwitchToStudy);
    showMainButton('Сохранить', handleSave);
  });

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const newCards = parseTSV(tsvText());
      await props.onCardsUpdated(newCards);
      
      // Visual feedback
      const button = document.querySelector('.save-feedback');
      if (button) {
        button.textContent = 'Сохранено ✓';
        setTimeout(() => {
          button.textContent = 'Сохранить';
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving cards:', error);
      alert('Ошибка при сохранении данных');
    }
    
    setIsSaving(false);
  };

  return (
    <div style="padding: 20px; display: flex; flex-direction: column; height: 100vh;">
      <h2 style="margin-bottom: 10px;">Редактировать карточки</h2>
      
      <div style="margin-bottom: 15px; font-size: 14px; color: #666;">
        <div style="margin-bottom: 5px;">
          <strong>Формат:</strong> Вопрос [TAB] Ответ [TAB] метаданные...
        </div>
        <div style="margin-bottom: 5px;">
          Пустые метаданные = новая карточка
        </div>
        <div style="font-size: 12px; color: #999;">
          💾 Хранение: {isCloudStorageSupported() ? 'Telegram Cloud' : 'Локальное'}
        </div>
      </div>

      <textarea
        value={tsvText()}
        onInput={(e) => setTsvText(e.currentTarget.value)}
        style="flex-grow: 1; width: 100%; padding: 10px; font-family: monospace; font-size: 12px; border: 1px solid #ddd; border-radius: 4px; resize: none; margin-bottom: 15px;"
        placeholder="question	answer	D	S	I
Hello	Привет			
World	Мир			
Cat	Кот			"
      />

      <button
        onClick={handleSave}
        disabled={isSaving()}
        class="save-feedback"
        style={`padding: 15px; background: ${isSaving() ? '#ccc' : '#007AFF'}; color: white; border: none; border-radius: 6px; cursor: ${isSaving() ? 'not-allowed' : 'pointer'}; font-size: 16px;`}
      >
        {isSaving() ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  );
};

export default EditView;