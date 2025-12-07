declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready(): void;
        close(): void;
        expand(): void;
        MainButton: {
          text: string;
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
          isVisible: boolean;
        };
        BackButton: {
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
          isVisible: boolean;
        };
        CloudStorage: {
          setItem(key: string, value: string): Promise<void>;
          getItem(key: string): Promise<string>;
          getKeys(): Promise<string[]>;
          removeItem(key: string): Promise<void>;
        };
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
      };
    };
  }
}

export const telegram = window.Telegram?.WebApp;

export function initTelegram() {
  if (telegram) {
    telegram.ready();
    telegram.expand();
  }
}

export async function saveToCloud(key: string, value: string): Promise<void> {
  if (telegram?.CloudStorage) {
    await telegram.CloudStorage.setItem(key, value);
  } else {
    localStorage.setItem(key, value);
  }
}

export async function loadFromCloud(key: string): Promise<string> {
  if (telegram?.CloudStorage) {
    return await telegram.CloudStorage.getItem(key);
  } else {
    return localStorage.getItem(key) || '';
  }
}

export function showMainButton(text: string, onClick: () => void) {
  if (telegram?.MainButton) {
    telegram.MainButton.text = text;
    telegram.MainButton.onClick(onClick);
    telegram.MainButton.show();
  }
}

export function hideMainButton() {
  if (telegram?.MainButton) {
    telegram.MainButton.hide();
  }
}

export function showBackButton(onClick: () => void) {
  if (telegram?.BackButton) {
    telegram.BackButton.onClick(onClick);
    telegram.BackButton.show();
  }
}

export function hideBackButton() {
  if (telegram?.BackButton) {
    telegram.BackButton.hide();
  }
}