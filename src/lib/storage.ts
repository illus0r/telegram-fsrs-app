// CloudStorage wrapper with localStorage fallback
import { telegram } from './telegram';

export interface StorageInterface {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

class TelegramCloudStorage implements StorageInterface {
  private createTimeoutPromise(timeoutMs: number, operation: string, key: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        console.error(`[CloudStorage] ${operation} timeout after ${timeoutMs}ms for key: ${key}`);
        reject(new Error(`CloudStorage ${operation} timeout after ${timeoutMs}ms for key: ${key}. This may indicate a Telegram API issue or network problem.`));
      }, timeoutMs);
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    const startTime = Date.now();
    console.log(`[CloudStorage] setItem called for key: ${key}, size: ${value.length} chars`);

    const operationPromise = new Promise<void>((resolve, reject) => {
      if (!telegram.isCloudStorageAvailable()) {
        console.error(`[CloudStorage] CloudStorage not available for key: ${key}`);
        reject(new Error('CloudStorage not available'));
        return;
      }

      const tg = (window as any).Telegram?.WebApp?.CloudStorage;
      if (!tg) {
        console.error(`[CloudStorage] CloudStorage API not found for key: ${key}`);
        reject(new Error('CloudStorage API not found'));
        return;
      }

      console.log(`[CloudStorage] Calling tg.setItem for key: ${key}...`);

      tg.setItem(key, value, (error: string | null, success: boolean) => {
        const duration = Date.now() - startTime;

        if (error) {
          console.error(`[CloudStorage] setItem failed for key ${key} after ${duration}ms:`, error);
          reject(new Error(error));
        } else if (success) {
          console.log(`[CloudStorage] setItem succeeded for key ${key} in ${duration}ms`);
          resolve();
        } else {
          console.error(`[CloudStorage] setItem returned false for key ${key} after ${duration}ms`);
          reject(new Error('Failed to save data'));
        }
      });
    });

    const timeoutPromise = this.createTimeoutPromise(15000, 'setItem', key); // 15 second timeout for chunks

    try {
      await Promise.race([operationPromise, timeoutPromise]);
    } catch (error) {
      console.error(`[CloudStorage] setItem operation failed or timed out for key ${key}:`, error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    const startTime = Date.now();
    console.log(`[CloudStorage] getItem called for key: ${key}`);

    const operationPromise = new Promise<string | null>((resolve, reject) => {
      if (!telegram.isCloudStorageAvailable()) {
        console.error(`[CloudStorage] CloudStorage not available for key: ${key}`);
        reject(new Error('CloudStorage not available'));
        return;
      }

      const tg = (window as any).Telegram?.WebApp?.CloudStorage;
      if (!tg) {
        console.error(`[CloudStorage] CloudStorage API not found for key: ${key}`);
        reject(new Error('CloudStorage API not found'));
        return;
      }

      console.log(`[CloudStorage] Calling tg.getItem for key: ${key}...`);

      tg.getItem(key, (error: string | null, value: string | null) => {
        const duration = Date.now() - startTime;

        if (error) {
          console.error(`[CloudStorage] getItem failed for key ${key} after ${duration}ms:`, error);
          reject(new Error(error));
        } else {
          const size = value ? value.length : 0;
          console.log(`[CloudStorage] getItem succeeded for key ${key} in ${duration}ms, size: ${size} chars`);
          resolve(value);
        }
      });
    });

    const timeoutPromise = this.createTimeoutPromise(10000, 'getItem', key); // 10 second timeout

    try {
      return await Promise.race([operationPromise, timeoutPromise]);
    } catch (error) {
      console.error(`[CloudStorage] getItem operation failed or timed out for key ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    const startTime = Date.now();
    console.log(`[CloudStorage] removeItem called for key: ${key}`);

    const operationPromise = new Promise<void>((resolve, reject) => {
      if (!telegram.isCloudStorageAvailable()) {
        console.error(`[CloudStorage] CloudStorage not available for key: ${key}`);
        reject(new Error('CloudStorage not available'));
        return;
      }

      const tg = (window as any).Telegram?.WebApp?.CloudStorage;
      if (!tg) {
        console.error(`[CloudStorage] CloudStorage API not found for key: ${key}`);
        reject(new Error('CloudStorage API not found'));
        return;
      }

      console.log(`[CloudStorage] Calling tg.removeItem for key: ${key}...`);

      tg.removeItem(key, (error: string | null, success: boolean) => {
        const duration = Date.now() - startTime;

        if (error) {
          console.error(`[CloudStorage] removeItem failed for key ${key} after ${duration}ms:`, error);
          reject(new Error(error));
        } else if (success) {
          console.log(`[CloudStorage] removeItem succeeded for key ${key} in ${duration}ms`);
          resolve();
        } else {
          console.error(`[CloudStorage] removeItem returned false for key ${key} after ${duration}ms`);
          reject(new Error('Failed to remove data'));
        }
      });
    });

    const timeoutPromise = this.createTimeoutPromise(10000, 'removeItem', key); // 10 second timeout

    try {
      await Promise.race([operationPromise, timeoutPromise]);
    } catch (error) {
      console.error(`[CloudStorage] removeItem operation failed or timed out for key ${key}:`, error);
      throw error;
    }
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
    const startTime = Date.now();
    console.log(`[Storage] Starting setItem for key: ${key}, value size: ${value.length} chars`);

    try {
      await this.storage.setItem(key, value);
      const duration = Date.now() - startTime;
      console.log(`[Storage] Saved to storage: ${key} in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Storage] Failed to save ${key} after ${duration}ms:`, error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const value = await this.storage.getItem(key);
      console.log(`Loaded from storage: ${key}`, value ? 'found' : 'not found');
      return value;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.storage.removeItem(key);
      console.log(`Removed from storage: ${key}`);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
      throw error;
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
// Telegram CloudStorage seems to have issues with large values
// Using smaller chunks and localStorage fallback for reliability
const MAX_CHUNK_SIZE = 1500;

import { syncStatus } from './syncStatus';

export async function setChunkedItem(key: string, value: string): Promise<void> {
  console.log(`[ChunkedStorage] Starting optimistic save for key: ${key}, size: ${value.length} chars`);
  
  try {
    // 1. Save to localStorage immediately (optimistic)
    localStorage.setItem(`${key}_local`, value);
    localStorage.setItem(`${key}_local_timestamp`, new Date().toISOString());
    syncStatus.markAsModified();
    console.log(`[ChunkedStorage] ✅ Saved to localStorage immediately`);
    
    // Verify localStorage save
    const verifyValue = localStorage.getItem(`${key}_local`);
    if (verifyValue === null || verifyValue.length !== value.length) {
      console.error(`[ChunkedStorage] LocalStorage verification failed! Expected ${value.length} chars, got ${verifyValue?.length || 0}`);
      throw new Error('LocalStorage save verification failed');
    }
    console.log(`[ChunkedStorage] ✅ LocalStorage save verified: ${verifyValue.length} chars`);

    // 2. Start background sync to CloudStorage (don't await - fire and forget)
    setTimeout(() => syncToCloudBackground(key, value), 0);

    // 3. Return immediately - UI can continue
    return;

  } catch (error) {
    console.error(`[ChunkedStorage] Failed to save locally:`, error);
    throw new Error(`Ошибка сохранения данных: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function syncToCloudBackground(key: string, value: string): Promise<void> {
  console.log(`[ChunkedStorage] Starting background sync to CloudStorage for key: ${key}, size: ${value.length} chars`);
  
  try {
    syncStatus.markAsSyncing();
    
    // If data fits in one chunk, use regular storage
    if (value.length <= MAX_CHUNK_SIZE) {
      console.log(`[ChunkedStorage] Data fits in single chunk (${value.length} <= ${MAX_CHUNK_SIZE}), using regular storage`);
      await storage.setItem(key, value);
      console.log(`[ChunkedStorage] Regular storage save completed, cleaning up old chunks...`);
      // Clean up any existing chunks
      await cleanupChunks(key);
      console.log(`[ChunkedStorage] Cleanup completed, background sync finished`);
      
      // Keep local copy as backup - don't remove it automatically
      // localStorage.removeItem(`${key}_local`);
      // localStorage.removeItem(`${key}_local_timestamp`);
      console.log(`[ChunkedStorage] Keeping local copy as backup for reliability`);
      syncStatus.markAsSynced();
      return;
    }

    console.log(`[ChunkedStorage] Data too large (${value.length} > ${MAX_CHUNK_SIZE}), splitting into chunks...`);

    // Remove old regular item to avoid conflicts
    try {
      console.log(`[ChunkedStorage] Removing old regular item: ${key}`);
      await storage.removeItem(key);
      console.log(`[ChunkedStorage] Old regular item removed successfully`);
    } catch (error) {
      console.log(`[ChunkedStorage] Old regular item removal failed (may not exist):`, error);
    }

    // Split into chunks
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += MAX_CHUNK_SIZE) {
      chunks.push(value.slice(i, i + MAX_CHUNK_SIZE));
    }

    console.log(`[ChunkedStorage] Split into ${chunks.length} chunks:`, chunks.map((chunk, i) => `chunk${i}: ${chunk.length} chars`));

    // Save metadata
    const meta = {
      cardsBatches: chunks.length
    };
    console.log(`[ChunkedStorage] Saving metadata:`, meta);
    
    const startTime = Date.now();
    await storage.setItem(`${key}_meta`, JSON.stringify(meta));
    console.log(`[ChunkedStorage] Metadata saved in ${Date.now() - startTime}ms`);

    // Save chunks with progress feedback
    for (let i = 0; i < chunks.length; i++) {
      const progressMsg = `Синхронизация части ${i + 1} из ${chunks.length}...`;
      console.log(`[ChunkedStorage] ${progressMsg} (size: ${chunks[i].length} chars)`);
      
      const chunkStartTime = Date.now();
      const chunkKey = `${key}_cardsBatch${i}`;
      const chunkContent = chunks[i];
      
      console.log(`[ChunkedStorage] About to call storage.setItem for ${chunkKey}, content size: ${chunkContent.length} chars`);
      
      // Validate chunk size before sending
      if (chunkContent.length > 2000) {
        console.error(`[ChunkedStorage] Chunk too large: ${chunkContent.length} chars > 2000 limit`);
        throw new Error(`Chunk ${i} is too large: ${chunkContent.length} chars`);
      }

      await storage.setItem(chunkKey, chunkContent);
      
      const chunkTime = Date.now() - chunkStartTime;
      console.log(`[ChunkedStorage] ✅ Chunk ${i + 1}/${chunks.length} synced successfully in ${chunkTime}ms`);
      
      // Progress feedback
      const progress = Math.round(((i + 1) / chunks.length) * 100);
      console.log(`[ChunkedStorage] 📊 Sync Progress: ${progress}% (${i + 1}/${chunks.length} chunks)`);
      
      // Add delay between chunks to prevent API overload
      if (i < chunks.length - 1) {
        console.log(`[ChunkedStorage] ⏳ Waiting 300ms before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log(`[ChunkedStorage] ⏳ Proceeding to chunk ${i + 2}/${chunks.length}`);
      }
    }

    console.log(`[ChunkedStorage] All chunks synced, cleaning up extra chunks...`);
    // Clean up any extra chunks from previous saves
    await cleanupExtraChunks(key, chunks.length);
    
    const totalTime = Date.now() - startTime;
    console.log(`[ChunkedStorage] Background sync completed successfully in ${totalTime}ms`);
    
    // Keep local copy as backup - don't remove it automatically
    // localStorage.removeItem(`${key}_local`);
    // localStorage.removeItem(`${key}_local_timestamp`);
    console.log(`[ChunkedStorage] Keeping local copy as backup for reliability`);
    syncStatus.markAsSynced();

  } catch (error) {
    console.error(`[ChunkedStorage] Background sync failed for key ${key}:`, error);
    syncStatus.markSyncFailed();
    // Don't throw - this is background operation, data is safely in localStorage
  }
}

export async function getChunkedItem(key: string): Promise<string | null> {
  console.log(`[ChunkedStorage] Starting getChunkedItem for key: ${key}`);
  
  try {
    // 1. Check if we have unsaved local changes that are newer than cloud
    const hasUnsavedChanges = syncStatus.getStatus().hasUnsavedChanges;
    console.log(`[ChunkedStorage] Has unsaved changes: ${hasUnsavedChanges}`);
    
    // 2. If we have unsaved changes, use local data
    if (hasUnsavedChanges) {
      const localValue = localStorage.getItem(`${key}_local`);
      if (localValue !== null) {
        console.log(`[ChunkedStorage] ✅ Using local data (has unsaved changes), size: ${localValue.length} chars`);
        return localValue;
      }
    }
    
    // 3. Try to get data from cloud first (most authoritative)
    console.log(`[ChunkedStorage] No unsaved changes, checking cloud data first...`);
    
    const cloudData = await getChunkedItemFromCloud(key);
    if (cloudData !== null) {
      console.log(`[ChunkedStorage] ✅ Found cloud data, size: ${cloudData.length} chars (authoritative)`);
      
      // Update local cache with cloud data
      localStorage.setItem(`${key}_local`, cloudData);
      localStorage.setItem(`${key}_local_timestamp`, new Date().toISOString());
      console.log(`[ChunkedStorage] Updated local cache with cloud data`);
      
      return cloudData;
    }
    
    // 4. Fallback to local data if cloud is unavailable
    const localValue = localStorage.getItem(`${key}_local`);
    if (localValue !== null) {
      console.log(`[ChunkedStorage] ✅ Using local data (cloud unavailable), size: ${localValue.length} chars`);
      return localValue;
    }

    // 5. No data found anywhere
    console.log(`[ChunkedStorage] No data found in cloud or local storage`);
    return null;

  } catch (error) {
    console.error(`[ChunkedStorage] Failed to load chunked item ${key}:`, error);
    throw new Error(`Ошибка загрузки данных: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function cleanupChunks(key: string): Promise<void> {
  console.log(`[ChunkedStorage] Starting cleanup for key: ${key}`);

  try {
    const metaValue = await storage.getItem(`${key}_meta`);
    if (metaValue) {
      console.log(`[ChunkedStorage] Found metadata to cleanup:`, metaValue);

      await storage.removeItem(`${key}_meta`);
      console.log(`[ChunkedStorage] Removed metadata`);

      let meta;
      try {
        meta = JSON.parse(metaValue);
      } catch {
        console.error(`[ChunkedStorage] Failed to parse metadata during cleanup`);
        return;
      }

      if (meta.cardsBatches && typeof meta.cardsBatches === 'number') {
        console.log(`[ChunkedStorage] Removing ${meta.cardsBatches} chunk(s)`);

        for (let i = 0; i < meta.cardsBatches; i++) {
          await storage.removeItem(`${key}_cardsBatch${i}`);
          console.log(`[ChunkedStorage] Removed chunk ${i}`);
        }
      }
    } else {
      console.log(`[ChunkedStorage] No metadata found for cleanup`);
    }

    console.log(`[ChunkedStorage] Cleanup completed for key: ${key}`);
  } catch (error) {
    console.error(`[ChunkedStorage] Cleanup error for key ${key}:`, error);
    // Ignore cleanup errors
  }
}

async function cleanupExtraChunks(key: string, currentBatchCount: number): Promise<void> {
  console.log(`[ChunkedStorage] Starting extra chunks cleanup for key: ${key}, keeping ${currentBatchCount} chunks`);

  try {
    let removedCount = 0;
    // Try to remove chunks beyond the current count
    for (let i = currentBatchCount; i < currentBatchCount + 10; i++) {
      try {
        console.log(`[ChunkedStorage] Trying to remove extra chunk ${i}...`);
        await storage.removeItem(`${key}_cardsBatch${i}`);
        removedCount++;
        console.log(`[ChunkedStorage] Removed extra chunk ${i}`);
      } catch {
        // Stop when we can't find more chunks
        console.log(`[ChunkedStorage] No more extra chunks to remove after chunk ${i - 1}`);
        break;
      }
    }

    console.log(`[ChunkedStorage] Extra chunks cleanup completed, removed ${removedCount} chunks`);
  } catch (error) {
    console.error(`[ChunkedStorage] Extra chunks cleanup error:`, error);
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
    console.error(`[ChunkedStorage] Failed to get chunked data:`, error);
    throw error;
  }
}

// Function to manually clean up old localStorage data
export function clearLocalStorage(key: string): void {
  console.log(`[ChunkedStorage] Manually clearing localStorage for key: ${key}`);
  try {
    localStorage.removeItem(`${key}_local`);
    localStorage.removeItem(`${key}_local_timestamp`);
    console.log(`[ChunkedStorage] LocalStorage cleared successfully`);
  } catch (error) {
    console.error(`[ChunkedStorage] Failed to clear localStorage:`, error);
  }
}

// Function to get localStorage info for debugging
export function getLocalStorageInfo(key: string): {hasLocal: boolean, timestamp: string | null, size: number} {
  try {
    const localValue = localStorage.getItem(`${key}_local`);
    const timestamp = localStorage.getItem(`${key}_local_timestamp`);
    return {
      hasLocal: localValue !== null,
      timestamp,
      size: localValue ? localValue.length : 0
    };
  } catch (error) {
    console.error(`[ChunkedStorage] Failed to get localStorage info:`, error);
    return {hasLocal: false, timestamp: null, size: 0};
  }
}

// Function to get chunked data directly from CloudStorage (bypassing localStorage)
export async function getChunkedItemFromCloud(key: string): Promise<string | null> {
  console.log(`[ChunkedStorage] Starting getChunkedItemFromCloud for key: ${key} (bypassing localStorage)`);
  
  try {
    // 1. Try to get regular item from CloudStorage first
    console.log(`[ChunkedStorage] Step 1: Trying CloudStorage regular item...`);
    const regularValue = await storage.getItem(key);
    console.log(`[ChunkedStorage] Regular item result:`, regularValue ? `Found (${regularValue.length} chars)` : 'Not found');
    
    if (regularValue !== null) {
      console.log(`[ChunkedStorage] ✅ Found regular item in CloudStorage, size: ${regularValue.length} chars`);
      return regularValue;
    }

    console.log(`[ChunkedStorage] Step 2: Regular item not found, trying chunked data...`);

    // 2. Try to get chunked data from CloudStorage
    console.log(`[ChunkedStorage] Looking for metadata key: ${key}_meta`);
    const metaValue = await storage.getItem(`${key}_meta`);
    console.log(`[ChunkedStorage] Metadata result:`, metaValue ? `Found: ${metaValue}` : 'Not found');
    
    if (!metaValue) {
      console.log(`[ChunkedStorage] ❌ No metadata found in CloudStorage for key: ${key}_meta`);
      return null;
    }

    console.log(`[ChunkedStorage] ✅ Found metadata in CloudStorage:`, metaValue);

    let meta;
    try {
      meta = JSON.parse(metaValue);
    } catch (parseError) {
      console.error(`[ChunkedStorage] Failed to parse metadata JSON:`, parseError);
      return null;
    }

    console.log(`[ChunkedStorage] Parsed metadata:`, meta);

    if (!meta.cardsBatches || typeof meta.cardsBatches !== 'number') {
      console.error(`[ChunkedStorage] Invalid metadata structure:`, meta);
      return null;
    }

    console.log(`[ChunkedStorage] ✅ Metadata parsed successfully, expecting ${meta.cardsBatches} chunks`);

    // Load all chunks from CloudStorage
    const chunks: string[] = [];
    for (let i = 0; i < meta.cardsBatches; i++) {
      const chunkKey = `${key}_cardsBatch${i}`;
      console.log(`[ChunkedStorage] Step 2.${i+1}: Loading chunk ${i}/${meta.cardsBatches - 1} with key: ${chunkKey}...`);
      
      const chunkContent = await storage.getItem(chunkKey);
      console.log(`[ChunkedStorage] Chunk ${i} result:`, chunkContent ? `Found (${chunkContent.length} chars)` : 'Missing!');
      
      if (!chunkContent) {
        console.error(`[ChunkedStorage] ❌ Missing chunk ${i} of ${meta.cardsBatches} in CloudStorage (key: ${chunkKey})`);
        return null;
      }

      console.log(`[ChunkedStorage] ✅ Chunk ${i} loaded from CloudStorage, content size: ${chunkContent.length} chars`);
      chunks.push(chunkContent);
    }

    const result = chunks.join('');
    console.log(`[ChunkedStorage] ✅ All ${chunks.length} chunks loaded from CloudStorage and joined`);
    console.log(`[ChunkedStorage] Final result size: ${result.length} chars`);
    return result;

  } catch (error) {
    console.error(`[ChunkedStorage] ❌ Failed to load chunked item ${key} from CloudStorage:`, error);
    return null;
  }
}

// Function to manually cleanup old regular items that conflict with chunked storage
export async function cleanupOldRegularItem(key: string): Promise<void> {
  console.log(`[ChunkedStorage] Starting cleanup of old regular item: ${key}`);
  
  try {
    // Check if chunked data exists
    const metaValue = await storage.getItem(`${key}_meta`);
    if (!metaValue) {
      console.log(`[ChunkedStorage] No chunked metadata found, no cleanup needed`);
      return;
    }

    console.log(`[ChunkedStorage] Chunked metadata found, checking for conflicting regular item...`);
    
    // Check if regular item exists
    const regularValue = await storage.getItem(key);
    if (!regularValue) {
      console.log(`[ChunkedStorage] No regular item found, no cleanup needed`);
      return;
    }

    console.log(`[ChunkedStorage] Found conflicting regular item (${regularValue.length} chars), removing...`);
    
    // Remove the old regular item
    await storage.removeItem(key);
    console.log(`[ChunkedStorage] Old regular item removed successfully`);
    
  } catch (error) {
    console.error(`[ChunkedStorage] Failed to cleanup old regular item:`, error);
    throw new Error(`Ошибка очистки старых данных: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to inspect all CloudStorage keys for debugging
export async function inspectCloudStorage(): Promise<string> {
  console.log(`[ChunkedStorage] Starting CloudStorage inspection...`);
  
  try {
    const keysToCheck = [
      'cards',
      'cards_meta',
      'cards_cardsBatch0',
      'cards_cardsBatch1', 
      'cards_cardsBatch2',
      'cards_cardsBatch3',
      'cards_cardsBatch4',
      'cards_cardsBatch5'
    ];

    const results: string[] = [];
    results.push('=== CloudStorage Inspection ===\n');

    for (const key of keysToCheck) {
      console.log(`[ChunkedStorage] Checking key: ${key}`);
      try {
        const value = await storage.getItem(key);
        if (value) {
          results.push(`✅ ${key}: Found (${value.length} chars)`);
          results.push(`   Preview: ${value.substring(0, 100)}...`);
        } else {
          results.push(`❌ ${key}: Not found`);
        }
      } catch (error) {
        results.push(`⚠️  ${key}: Error - ${error}`);
      }
    }

    const report = results.join('\n');
    console.log(`[ChunkedStorage] CloudStorage inspection completed`);
    return report;

  } catch (error) {
    const errorMsg = `Ошибка инспекции CloudStorage: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`[ChunkedStorage] ${errorMsg}`);
    return errorMsg;
  }
}
