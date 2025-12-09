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

// Chunked storage methods for handling large data
const MAX_CHUNK_SIZE = 3800;

export async function setChunkedItem(key: string, value: string): Promise<void> {
  try {
    // If data fits in one chunk, use regular storage
    if (value.length <= MAX_CHUNK_SIZE) {
      await storage.setItem(key, value);
      // Clean up any existing chunks
      await cleanupChunks(key);
      return;
    }

    // Split into chunks
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += MAX_CHUNK_SIZE) {
      chunks.push(value.slice(i, i + MAX_CHUNK_SIZE));
    }

    // Save metadata
    const meta = {
      cardsBatches: chunks.length
    };
    await storage.setItem(`${key}_meta`, JSON.stringify(meta));

    // Save chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunkData = {
        content: chunks[i]
      };
      await storage.setItem(`${key}_cardsBatch${i}`, JSON.stringify(chunkData));
    }

    // Clean up any extra chunks from previous saves
    await cleanupExtraChunks(key, chunks.length);

  } catch (error) {
    console.error(`Failed to save chunked item ${key}:`, error);
    throw new Error(`Ошибка сохранения данных: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getChunkedItem(key: string): Promise<string | null> {
  try {
    // Try to get regular item first
    const regularValue = await storage.getItem(key);
    if (regularValue !== null) {
      return regularValue;
    }

    // Try to get chunked data
    const metaValue = await storage.getItem(`${key}_meta`);
    if (!metaValue) {
      return null;
    }

    let meta;
    try {
      meta = JSON.parse(metaValue);
    } catch {
      throw new Error('Invalid meta data format');
    }

    if (!meta.cardsBatches || typeof meta.cardsBatches !== 'number') {
      throw new Error('Invalid meta data structure');
    }

    // Load all chunks
    const chunks: string[] = [];
    for (let i = 0; i < meta.cardsBatches; i++) {
      const chunkValue = await storage.getItem(`${key}_cardsBatch${i}`);
      if (!chunkValue) {
        throw new Error(`Missing chunk ${i} of ${meta.cardsBatches}`);
      }

      let chunkData;
      try {
        chunkData = JSON.parse(chunkValue);
      } catch {
        throw new Error(`Invalid chunk ${i} data format`);
      }

      if (!chunkData.content || typeof chunkData.content !== 'string') {
        throw new Error(`Invalid chunk ${i} data structure`);
      }

      chunks.push(chunkData.content);
    }

    return chunks.join('');

  } catch (error) {
    console.error(`Failed to load chunked item ${key}:`, error);
    throw new Error(`Ошибка загрузки данных: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function cleanupChunks(key: string): Promise<void> {
  try {
    const metaValue = await storage.getItem(`${key}_meta`);
    if (metaValue) {
      await storage.removeItem(`${key}_meta`);

      const meta = JSON.parse(metaValue);
      if (meta.cardsBatches && typeof meta.cardsBatches === 'number') {
        for (let i = 0; i < meta.cardsBatches; i++) {
          await storage.removeItem(`${key}_cardsBatch${i}`);
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

async function cleanupExtraChunks(key: string, currentBatchCount: number): Promise<void> {
  try {
    // Try to remove chunks beyond the current count
    for (let i = currentBatchCount; i < currentBatchCount + 10; i++) {
      try {
        await storage.removeItem(`${key}_cardsBatch${i}`);
      } catch {
        // Stop when we can't find more chunks
        break;
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

// Test function for chunked storage
export async function testChunkedStorage(): Promise<void> {
  try {
    console.log('Testing chunked storage...');

    // Test with small data (should use regular storage)
    const smallData = 'Hello, world!';
    await setChunkedItem('test_small', smallData);
    const retrievedSmall = await getChunkedItem('test_small');
    if (retrievedSmall !== smallData) {
      throw new Error('Small data test failed');
    }
    console.log('✓ Small data test passed');

    // Test with large data (should use chunked storage)
    const largeData = 'A'.repeat(10000); // 10KB of data
    await setChunkedItem('test_large', largeData);
    const retrievedLarge = await getChunkedItem('test_large');
    if (retrievedLarge !== largeData) {
      throw new Error('Large data test failed');
    }
    console.log('✓ Large data test passed');

    // Cleanup test data
    await storage.removeItem('test_small');
    await cleanupChunks('test_large');

    console.log('✓ All chunked storage tests passed!');

  } catch (error) {
    console.error('Chunked storage test failed:', error);
    throw error;
  }
}
