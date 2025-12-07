// CloudStorage wrapper with localStorage fallback
import { telegram } from './telegram';

export interface StorageInterface {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

class TelegramCloudStorage implements StorageInterface {
  async setItem(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!telegram.isCloudStorageAvailable()) {
        reject(new Error('CloudStorage not available'));
        return;
      }

      const tg = (window as any).Telegram?.WebApp?.CloudStorage;
      if (!tg) {
        reject(new Error('CloudStorage API not found'));
        return;
      }

      tg.setItem(key, value, (error: string | null, success: boolean) => {
        if (error) {
          reject(new Error(error));
        } else if (success) {
          resolve();
        } else {
          reject(new Error('Failed to save data'));
        }
      });
    });
  }

  async getItem(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!telegram.isCloudStorageAvailable()) {
        reject(new Error('CloudStorage not available'));
        return;
      }

      const tg = (window as any).Telegram?.WebApp?.CloudStorage;
      if (!tg) {
        reject(new Error('CloudStorage API not found'));
        return;
      }

      tg.getItem(key, (error: string | null, value: string | null) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(value);
        }
      });
    });
  }

  async removeItem(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!telegram.isCloudStorageAvailable()) {
        reject(new Error('CloudStorage not available'));
        return;
      }

      const tg = (window as any).Telegram?.WebApp?.CloudStorage;
      if (!tg) {
        reject(new Error('CloudStorage API not found'));
        return;
      }

      tg.removeItem(key, (error: string | null, success: boolean) => {
        if (error) {
          reject(new Error(error));
        } else if (success) {
          resolve();
        } else {
          reject(new Error('Failed to remove data'));
        }
      });
    });
  }

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!telegram.isCloudStorageAvailable()) {
        reject(new Error('CloudStorage not available'));
        return;
      }

      const tg = (window as any).Telegram?.WebApp?.CloudStorage;
      if (!tg) {
        reject(new Error('CloudStorage API not found'));
        return;
      }

      tg.getKeys((error: string | null, keys: string[] | null) => {
        if (error || !keys) {
          reject(new Error(error || 'Failed to get keys'));
          return;
        }

        if (keys.length === 0) {
          resolve();
          return;
        }

        tg.removeItems(keys, (removeError: string | null, success: boolean) => {
          if (removeError) {
            reject(new Error(removeError));
          } else if (success) {
            resolve();
          } else {
            reject(new Error('Failed to clear data'));
          }
        });
      });
    });
  }
}

class LocalStorageWrapper implements StorageInterface {
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      throw new Error(`Failed to save to localStorage: ${error}`);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      throw new Error(`Failed to read from localStorage: ${error}`);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      throw new Error(`Failed to remove from localStorage: ${error}`);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      throw new Error(`Failed to clear localStorage: ${error}`);
    }
  }
}

class StorageManager {
  private cloudStorage = new TelegramCloudStorage();
  private localStorage = new LocalStorageWrapper();
  private storage: StorageInterface;

  constructor() {
    // Try to use CloudStorage, fallback to localStorage
    this.storage = telegram.isCloudStorageAvailable() 
      ? this.cloudStorage 
      : this.localStorage;

    console.log('Storage initialized:', {
      type: telegram.isCloudStorageAvailable() ? 'CloudStorage' : 'localStorage',
      telegramAvailable: telegram.isAvailable(),
      cloudStorageAvailable: telegram.isCloudStorageAvailable(),
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.storage.setItem(key, value);
      console.log(`Saved to storage: ${key}`);
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      
      // Fallback to localStorage if CloudStorage fails
      if (this.storage === this.cloudStorage) {
        console.log('Falling back to localStorage...');
        this.storage = this.localStorage;
        await this.storage.setItem(key, value);
        console.log(`Saved to localStorage fallback: ${key}`);
      } else {
        throw error;
      }
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const value = await this.storage.getItem(key);
      console.log(`Loaded from storage: ${key}`, value ? 'found' : 'not found');
      return value;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      
      // Fallback to localStorage if CloudStorage fails
      if (this.storage === this.cloudStorage) {
        console.log('Falling back to localStorage...');
        this.storage = this.localStorage;
        const value = await this.storage.getItem(key);
        console.log(`Loaded from localStorage fallback: ${key}`, value ? 'found' : 'not found');
        return value;
      } else {
        throw error;
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.storage.removeItem(key);
      console.log(`Removed from storage: ${key}`);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
      
      // Fallback to localStorage if CloudStorage fails
      if (this.storage === this.cloudStorage) {
        console.log('Falling back to localStorage...');
        this.storage = this.localStorage;
        await this.storage.removeItem(key);
        console.log(`Removed from localStorage fallback: ${key}`);
      } else {
        throw error;
      }
    }
  }

  async clear(): Promise<void> {
    try {
      await this.storage.clear();
      console.log('Storage cleared');
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  getStorageType(): 'CloudStorage' | 'localStorage' {
    return this.storage === this.cloudStorage ? 'CloudStorage' : 'localStorage';
  }
}

export const storage = new StorageManager();