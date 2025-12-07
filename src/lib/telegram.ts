declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready(): void;
        close(): void;
        expand(): void;
        version?: string;
        platform?: string;
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

export function getTelegramVersion(): string {
  return telegram?.version || 'unknown';
}

export function getTelegramDebugInfo(): string {
  if (!telegram) return 'Telegram WebApp not available';
  
  const info = [
    `Version: ${telegram.version || 'unknown'}`,
    `Platform: ${telegram.platform || 'unknown'}`,
    `CloudStorage: ${isCloudStorageSupported() ? 'supported' : 'not supported'}`,
    `MainButton: ${telegram.MainButton ? 'available' : 'not available'}`,
    `BackButton: ${telegram.BackButton ? 'available' : 'not available'}`
  ];
  
  return info.join(', ');
}

export function initTelegram() {
  if (telegram) {
    console.log('Telegram WebApp Debug:', getTelegramDebugInfo());
    telegram.ready();
    telegram.expand();
  } else {
    console.warn('Telegram WebApp not available - running in browser mode');
  }
}

export function isCloudStorageSupported(): boolean {
  return !!(telegram?.CloudStorage && 
    typeof telegram.CloudStorage.setItem === 'function' &&
    typeof telegram.CloudStorage.getItem === 'function');
}

export async function saveToCloud(key: string, value: string): Promise<void> {
  try {
    if (isCloudStorageSupported()) {
      await telegram!.CloudStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    console.warn('CloudStorage failed, using localStorage:', error);
    localStorage.setItem(key, value);
  }
}

export async function loadFromCloud(key: string): Promise<string> {
  try {
    if (isCloudStorageSupported()) {
      return await telegram!.CloudStorage.getItem(key);
    } else {
      return localStorage.getItem(key) || '';
    }
  } catch (error) {
    console.warn('CloudStorage failed, using localStorage:', error);
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