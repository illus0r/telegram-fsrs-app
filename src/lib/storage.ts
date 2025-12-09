// New storage system with revision-based synchronization
import { syncStatus } from './syncStatus';

interface StorageInterface {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

class TelegramCloudStorage implements StorageInterface {
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    );
  }

  async setItem(key: string, value: string): Promise<void> {
    const startTime = performance.now();
    
    const operationPromise = new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.Telegram?.WebApp?.CloudStorage) {
        reject(new Error('Telegram CloudStorage not available'));
        return;
      }

      const tg = window.Telegram.WebApp.CloudStorage;
      
      console.log(`[TelegramCloudStorage] Setting item: ${key} (${value.length} chars)`);
      
      tg.setItem(key, value, (error: string | null) => {
        const duration = performance.now() - startTime;
        
        if (error) {
          console.error(`[TelegramCloudStorage] Failed to set ${key} in ${duration.toFixed(0)}ms:`, error);
          reject(new Error(error));
        } else {
          console.log(`[TelegramCloudStorage] Successfully set ${key} in ${duration.toFixed(0)}ms`);
          resolve();
        }
      });
    });

    const timeoutPromise = this.createTimeoutPromise(10000);
    await Promise.race([operationPromise, timeoutPromise]);
  }

  async getItem(key: string): Promise<string | null> {
    const startTime = performance.now();
    
    const operationPromise = new Promise<string | null>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.Telegram?.WebApp?.CloudStorage) {
        reject(new Error('Telegram CloudStorage not available'));
        return;
      }

      const tg = window.Telegram.WebApp.CloudStorage;
      
      tg.getItem(key, (error: string | null, result: string | null) => {
        const duration = performance.now() - startTime;
        
        if (error) {
          console.error(`[TelegramCloudStorage] Failed to get ${key} in ${duration.toFixed(0)}ms:`, error);
          reject(new Error(error));
        } else {
          const size = result ? result.length : 0;
          console.log(`[TelegramCloudStorage] Successfully got ${key} in ${duration.toFixed(0)}ms (${size} chars)`);
          resolve(result || null);
        }
      });
    });

    const timeoutPromise = this.createTimeoutPromise(10000);
    return await Promise.race([operationPromise, timeoutPromise]);
  }

  async removeItem(key: string): Promise<void> {
    const startTime = performance.now();
    
    const operationPromise = new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.Telegram?.WebApp?.CloudStorage) {
        reject(new Error('Telegram CloudStorage not available'));
        return;
      }

      const tg = window.Telegram.WebApp.CloudStorage;
      
      tg.removeItem(key, (error: string | null) => {
        const duration = performance.now() - startTime;
        
        if (error) {
          console.error(`[TelegramCloudStorage] Failed to remove ${key} in ${duration.toFixed(0)}ms:`, error);
          reject(new Error(error));
        } else {
          console.log(`[TelegramCloudStorage] Successfully removed ${key} in ${duration.toFixed(0)}ms`);
          resolve();
        }
      });
    });

    const timeoutPromise = this.createTimeoutPromise(10000);
    await Promise.race([operationPromise, timeoutPromise]);
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined' || !window.Telegram?.WebApp?.CloudStorage) {
      throw new Error('Telegram CloudStorage not available');
    }

    const tg = window.Telegram.WebApp.CloudStorage;
    
    return new Promise((resolve, reject) => {
      tg.getKeys((error: string | null, keys: string[] | null) => {
        if (error) {
          reject(new Error(error));
          return;
        }

        if (keys && keys.length > 0) {
          Promise.all(keys.map(key => this.removeItem(key)))
            .then(() => resolve())
            .catch(reject);
        } else {
          resolve();
        }
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
    // Determine which storage to use based on availability
    const telegramAvailable = typeof window !== 'undefined' && !!window.Telegram?.WebApp?.CloudStorage;
    const cloudStorageAvailable = telegramAvailable;
    
    this.storage = cloudStorageAvailable ? this.cloudStorage : this.localStorage;
    
    console.log('StorageManager initialized:', {
      type: cloudStorageAvailable ? 'CloudStorage' : 'LocalStorage',
      telegramAvailable,
      cloudStorageAvailable
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    const startTime = performance.now();
    try {
      await this.storage.setItem(key, value);
      const duration = performance.now() - startTime;
      console.log(`StorageManager.setItem completed in ${duration.toFixed(0)}ms`);
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`StorageManager.setItem failed in ${duration.toFixed(0)}ms:`, error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const value = await this.storage.getItem(key);
      return value;
    } catch (error) {
      console.error(`StorageManager.getItem failed for ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.storage.removeItem(key);
    } catch (error) {
      console.error(`StorageManager.removeItem failed for ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.storage.clear();
    } catch (error) {
      console.error('StorageManager.clear failed:', error);
      throw error;
    }
  }

  getStorageType(): string {
    return this.storage === this.cloudStorage ? 'CloudStorage' : 'LocalStorage';
  }
}

export const storage = new StorageManager();

// Constants
const MAX_CHUNK_SIZE = 2000; // Safe limit for Telegram CloudStorage
const STORAGE_KEY = 'cards';
const DEMO_TSV = [
  'question\tanswer\tdue\tstability\tdifficulty\telapsed_days\tscheduled_days\treps\tlapses\tstate\tlast_review',
  'Hello\tПривет\t' + new Date().toISOString() + '\t0\t0\t0\t0\t0\t0\t0\t',
  'World\tМир\t' + new Date().toISOString() + '\t0\t0\t0\t0\t0\t0\t0\t',
  'Cat\tКот\t' + new Date().toISOString() + '\t0\t0\t0\t0\t0\t0\t0\t',
  'How to cook pasta?\t1. Boil water\\n2. Add pasta\\n3. Cook for 8-10 minutes\\n4. Drain and serve\t' + new Date().toISOString() + '\t0\t0\t0\t0\t0\t0\t0\t',
].join('\n');

// Interfaces
interface CloudMetadata {
  version: number;
  revision: number;
  batches: number;
}

// Global state
let periodicSyncInterval: ReturnType<typeof setInterval> | null = null;
let lastSyncAttempt = 0;

// Initialize storage system - call this on app startup
export async function initializeStorage(): Promise<string | null> {
  console.log('[Storage] Initializing storage system...');
  
  try {
    // 1. Check local data
    const localData = localStorage.getItem('cards_data');
    const localRevision = localStorage.getItem('cards_revision');
    const parsedLocalRevision = localRevision ? parseInt(localRevision, 10) : 0;
    
    console.log('[Storage] Local state:', {
      hasData: !!localData,
      revision: parsedLocalRevision
    });
    
    // 2. Try to read cloud metadata to get server revision
    let cloudMeta: CloudMetadata | null = null;
    try {
      const metaStr = await storage.getItem(`${STORAGE_KEY}_meta`);
      if (metaStr) {
        const parsedMeta = JSON.parse(metaStr);
        console.log('[Storage] Raw cloud metadata:', parsedMeta);
        
        // Check if migration is needed
        if (parsedMeta.cardsBatches && !parsedMeta.revision) {
          console.log('[Storage] Old format detected, attempting migration...');
          const migrated = await migrateOldDataToNewFormat();
          if (migrated) {
            // Re-read metadata after migration
            const newMetaStr = await storage.getItem(`${STORAGE_KEY}_meta`);
            if (newMetaStr) {
              cloudMeta = JSON.parse(newMetaStr);
              console.log('[Storage] Metadata after migration:', cloudMeta);
            }
          } else {
            // Migration failed, treat as old format
            console.log('[Storage] Migration failed, using old format compatibility');
            cloudMeta = {
              version: 1,
              revision: 1,
              batches: parsedMeta.cardsBatches
            };
          }
        } else if (parsedMeta.revision !== undefined) {
          // New format
          cloudMeta = parsedMeta;
        } else {
          console.log('[Storage] Invalid metadata format');
          cloudMeta = null;
        }
        
        if (cloudMeta) {
          syncStatus.setServerRevision(cloudMeta.revision || 0);
          console.log('[Storage] Processed cloud metadata:', cloudMeta);
        } else {
          syncStatus.setServerRevision(0);
        }
      } else {
        console.log('[Storage] No cloud metadata found');
        syncStatus.setServerRevision(0);
      }
    } catch (error) {
      console.log('[Storage] Failed to read cloud metadata:', error);
      syncStatus.setServerRevision(0);
    }
    
    // Always update local revision in syncStatus (including 0)
    syncStatus.setLocalRevision(parsedLocalRevision);
    
    const revisions = syncStatus.getRevisions();
    console.log('[Storage] Revisions after initialization:', revisions);
    
    // 3. Decide what to do based on data availability and revisions
    if (!localData && (!cloudMeta || cloudMeta?.revision === 0)) {
      // No data anywhere - create demo data
      console.log('[Storage] No data found anywhere, creating demo data');
      await saveDataLocally(DEMO_TSV, true);
      startPeriodicSync();
      return DEMO_TSV;
    } else if (!localData || revisions.local <= revisions.server) {
      // No local data OR server is newer/equal - read from cloud
      console.log('[Storage] Reading from cloud (no local data or server is newer)');
      const cloudData = await tryReadFromCloud();
      if (cloudData) {
        startPeriodicSync();
        return cloudData;
      } else if (localData) {
        // Cloud read failed but we have local data
        console.log('[Storage] Cloud read failed, using local data');
        startPeriodicSync();
        return localData;
      } else {
        // No cloud data and no local data - create demo
        console.log('[Storage] No cloud data available, creating demo data');
        await saveDataLocally(DEMO_TSV, true);
        startPeriodicSync();
        return DEMO_TSV;
      }
    } else {
      // Local data exists and is newer than server - use local
      console.log('[Storage] Using local data (newer than server)');
      startPeriodicSync();
      return localData;
    }
    
  } catch (error) {
    console.error('[Storage] Failed to initialize storage:', error);
    
    // Fallback to local data if available
    const localData = localStorage.getItem('cards_data');
    if (localData) {
      console.log('[Storage] Falling back to local data');
      startPeriodicSync();
      return localData;
    }
    
    // Last resort - create demo data
    console.log('[Storage] Last resort: creating demo data');
    await saveDataLocally(DEMO_TSV, true);
    startPeriodicSync();
    return DEMO_TSV;
  }
}

// Save data locally and optionally increment revision
export async function saveDataLocally(data: string, incrementRevision = true): Promise<void> {
  console.log('[Storage] Saving data locally, size:', data.length);
  
  try {
    // Save data to localStorage
    localStorage.setItem('cards_data', data);
    
    // Update revision
    if (incrementRevision) {
      console.log('[Storage] Incrementing local revision...');
      syncStatus.incrementLocalRevision();
      const newRevisions = syncStatus.getRevisions();
      console.log('[Storage] Local revision updated:', newRevisions);
    } else {
      console.log('[Storage] Saving without revision increment');
    }
    
    console.log('[Storage] Data saved locally successfully');
    
    // Trigger immediate sync attempt if we have unsaved changes
    const needsWrite = syncStatus.needsCloudWrite();
    console.log('[Storage] Needs cloud write?', needsWrite);
    if (needsWrite) {
      console.log('[Storage] Starting background cloud write...');
      // Don't await - let it happen in background
      setTimeout(() => tryWriteToCloud(), 0);
    }
    
  } catch (error) {
    console.error('[Storage] Failed to save data locally:', error);
    throw error;
  }
}

// Try to read data from cloud storage
export async function tryReadFromCloud(): Promise<string | null> {
  console.log('[Storage] Attempting to read from cloud...');
  
  try {
    // 1. Read metadata
    const metaStr = await storage.getItem(`${STORAGE_KEY}_meta`);
    if (!metaStr) {
      console.log('[Storage] No cloud metadata found');
      return null;
    }
    
    const parsedMeta = JSON.parse(metaStr);
    console.log('[Storage] Raw cloud metadata:', parsedMeta);
    
    let meta: CloudMetadata;
    let batchKeyPrefix: string;
    
    // Handle old format: {cardsBatches: N}
    if (parsedMeta.cardsBatches && !parsedMeta.revision) {
      console.log('[Storage] Reading old format data');
      meta = {
        version: 1,
        revision: 1,
        batches: parsedMeta.cardsBatches
      };
      batchKeyPrefix = `${STORAGE_KEY}_cardsBatch`; // Old format key
    } else if (parsedMeta.revision !== undefined) {
      // New format
      meta = parsedMeta;
      batchKeyPrefix = `${STORAGE_KEY}_batch_`; // New format key
    } else {
      console.error('[Storage] Invalid metadata format');
      return null;
    }
    
    console.log('[Storage] Using metadata:', meta);
    
    // 2. Read all batches
    const batches: string[] = [];
    for (let i = 0; i < meta.batches; i++) {
      const batchKey = `${batchKeyPrefix}${i}`;
      console.log(`[Storage] Reading batch ${i}: ${batchKey}`);
      const batch = await storage.getItem(batchKey);
      if (batch === null) {
        console.error(`[Storage] Missing batch ${i}, cloud data is corrupted`);
        return null;
      }
      batches.push(batch);
      console.log(`[Storage] Batch ${i} size: ${batch.length} chars`);
    }
    
    // 3. Combine batches
    const fullData = batches.join('');
    console.log('[Storage] Successfully read cloud data, size:', fullData.length);
    
    // 4. Save to local storage and update revisions
    localStorage.setItem('cards_data', fullData);
    syncStatus.markDataUpdatedFromServer(meta.revision);
    
    return fullData;
    
  } catch (error) {
    console.error('[Storage] Failed to read from cloud:', error);
    return null;
  }
}

// Try to write data to cloud storage
export async function tryWriteToCloud(): Promise<boolean> {
  // Prevent too frequent sync attempts
  const now = Date.now();
  if (now - lastSyncAttempt < 5000) {
    console.log('[Storage] Skipping write attempt (too recent)');
    return false;
  }
  lastSyncAttempt = now;
  
  const currentRevisions = syncStatus.getRevisions();
  console.log('[Storage] Attempting to write to cloud, current revisions:', currentRevisions);
  syncStatus.markAsSyncing();
  
  try {
    // 1. Check if we need to write
    const needsWrite = syncStatus.needsCloudWrite();
    console.log('[Storage] Needs cloud write?', needsWrite);
    if (!needsWrite) {
      console.log('[Storage] No cloud write needed - already synced');
      syncStatus.markAsSynced();
      return true;
    }
    
    // 2. Read current server revision to check for conflicts
    let serverRevision = 0;
    try {
      const metaStr = await storage.getItem(`${STORAGE_KEY}_meta`);
      if (metaStr) {
        const meta: CloudMetadata = JSON.parse(metaStr);
        serverRevision = meta.revision;
        syncStatus.setServerRevision(serverRevision);
      }
    } catch (error) {
      console.log('[Storage] Could not read server revision, assuming 0:', error);
    }
    
    const revisions = syncStatus.getRevisions();
    console.log('[Storage] Current revisions after server check:', revisions);
    
    // 3. Check for conflicts
    if (revisions.server > revisions.local) {
      console.log(`[Storage] CONFLICT! Server revision ${revisions.server} > local ${revisions.local}`);
      syncStatus.markSyncFailed('Server has newer data');
      
      // Read server data (this will update local data and lose local changes)
      const cloudData = await tryReadFromCloud();
      return cloudData !== null;
    }
    
    // 4. Get local data
    const localData = localStorage.getItem('cards_data');
    if (!localData) {
      console.error('[Storage] No local data to write');
      syncStatus.markSyncFailed('No local data');
      return false;
    }
    
    // 5. Split into batches
    const batches: string[] = [];
    for (let i = 0; i < localData.length; i += MAX_CHUNK_SIZE) {
      batches.push(localData.slice(i, i + MAX_CHUNK_SIZE));
    }
    
    console.log('[Storage] Split data into', batches.length, 'batches');
    
    // 6. Write metadata first
    const newRevision = revisions.local;
    console.log('[Storage] Writing with new revision:', newRevision);
    const meta: CloudMetadata = {
      version: 1,
      revision: newRevision,
      batches: batches.length
    };
    
    await storage.setItem(`${STORAGE_KEY}_meta`, JSON.stringify(meta));
    console.log('[Storage] Metadata written successfully');
    
    // 7. Write batches
    for (let i = 0; i < batches.length; i++) {
      const batchKey = `${STORAGE_KEY}_batch_${i}`;
      await storage.setItem(batchKey, batches[i]);
      console.log(`[Storage] Batch ${i + 1}/${batches.length} written`);
      
      // Small delay between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 8. Clean up old batches if we have fewer now
    await cleanupExtraBatches(batches.length);
    
    // 9. Mark as synced
    syncStatus.markAsSynced(newRevision);
    const finalRevisions = syncStatus.getRevisions();
    console.log('[Storage] Cloud write completed successfully, final revisions:', finalRevisions);
    return true;
    
  } catch (error) {
    console.error('[Storage] Failed to write to cloud:', error);
    syncStatus.markSyncFailed(error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// Clean up extra batches that are no longer needed
async function cleanupExtraBatches(currentBatchCount: number): Promise<void> {
  console.log('[Storage] Cleaning up extra batches, current count:', currentBatchCount);
  
  try {
    // Try to remove up to 10 extra batches (reasonable upper limit)
    for (let i = currentBatchCount; i < currentBatchCount + 10; i++) {
      const batchKey = `${STORAGE_KEY}_batch_${i}`;
      try {
        await storage.removeItem(batchKey);
        console.log(`[Storage] Removed extra batch ${i}`);
      } catch (error) {
        // Batch doesn't exist, which is expected
        break;
      }
    }
  } catch (error) {
    console.log('[Storage] Error during cleanup (non-critical):', error);
  }
}

// Start periodic synchronization
export function startPeriodicSync(): void {
  if (periodicSyncInterval) {
    console.log('[Storage] Periodic sync already running');
    return;
  }
  
  console.log('[Storage] Starting periodic sync (every 10 seconds)');
  
  periodicSyncInterval = setInterval(async () => {
    if (syncStatus.needsCloudWrite() && !syncStatus.getStatus().isSyncing) {
      console.log('[Storage] Periodic sync: attempting to write to cloud...');
      await tryWriteToCloud();
    }
  }, 10000);
}

// Stop periodic synchronization
export function stopPeriodicSync(): void {
  if (periodicSyncInterval) {
    clearInterval(periodicSyncInterval);
    periodicSyncInterval = null;
    console.log('[Storage] Periodic sync stopped');
  }
}

// Get current data (for backward compatibility)
export async function getChunkedItem(_key: string): Promise<string | null> {
  console.log('[Storage] getChunkedItem called (deprecated, use initializeStorage instead)');
  
  // Try to get from localStorage first
  const localData = localStorage.getItem('cards_data');
  if (localData) {
    return localData;
  }
  
  // Fallback to initialization logic
  return await initializeStorage();
}

// Set current data (for backward compatibility)
export async function setChunkedItem(_key: string, value: string): Promise<void> {
  console.log('[Storage] setChunkedItem called (deprecated, use saveDataLocally instead)');
  await saveDataLocally(value, true);
}

// Utility functions
export function clearLocalStorage(): void {
  localStorage.removeItem('cards_data');
  localStorage.removeItem('cards_revision');
  localStorage.removeItem('cards_server_revision');
  syncStatus.reset();
  console.log('[Storage] Local storage cleared');
}

export function getLocalStorageInfo() {
  const data = localStorage.getItem('cards_data');
  const revision = localStorage.getItem('cards_revision');
  const serverRevision = localStorage.getItem('cards_server_revision');
  
  return {
    hasData: !!data,
    size: data?.length || 0,
    revision: revision ? parseInt(revision, 10) : 0,
    serverRevision: serverRevision ? parseInt(serverRevision, 10) : 0
  };
}

// Migrate old format data to new format
export async function migrateOldDataToNewFormat(): Promise<boolean> {
  console.log('[Storage] Starting migration from old format to new format...');
  
  try {
    // 1. Check if we have old format metadata
    const metaStr = await storage.getItem(`${STORAGE_KEY}_meta`);
    if (!metaStr) {
      console.log('[Storage] No metadata to migrate');
      return false;
    }
    
    const parsedMeta = JSON.parse(metaStr);
    
    // Only migrate if it's old format
    if (!parsedMeta.cardsBatches || parsedMeta.revision !== undefined) {
      console.log('[Storage] Data is already in new format or invalid');
      return false;
    }
    
    console.log('[Storage] Found old format metadata:', parsedMeta);
    
    // 2. Read all old format batches
    const batches: string[] = [];
    for (let i = 0; i < parsedMeta.cardsBatches; i++) {
      const oldBatchKey = `${STORAGE_KEY}_cardsBatch${i}`;
      console.log(`[Storage] Reading old batch ${i}: ${oldBatchKey}`);
      
      const batch = await storage.getItem(oldBatchKey);
      if (batch === null) {
        console.error(`[Storage] Missing old batch ${i}, cannot migrate`);
        return false;
      }
      batches.push(batch);
    }
    
    // 3. Combine all data
    const fullData = batches.join('');
    console.log(`[Storage] Combined old data size: ${fullData.length} chars`);
    
    // 4. Write in new format
    const newBatches: string[] = [];
    for (let i = 0; i < fullData.length; i += MAX_CHUNK_SIZE) {
      newBatches.push(fullData.slice(i, i + MAX_CHUNK_SIZE));
    }
    
    // 5. Write new format metadata
    const newMeta: CloudMetadata = {
      version: 1,
      revision: 1, // Start with revision 1
      batches: newBatches.length
    };
    
    await storage.setItem(`${STORAGE_KEY}_meta`, JSON.stringify(newMeta));
    console.log('[Storage] Wrote new metadata:', newMeta);
    
    // 6. Write new format batches
    for (let i = 0; i < newBatches.length; i++) {
      const newBatchKey = `${STORAGE_KEY}_batch_${i}`;
      await storage.setItem(newBatchKey, newBatches[i]);
      console.log(`[Storage] Wrote new batch ${i}: ${newBatchKey} (${newBatches[i].length} chars)`);
    }
    
    // 7. Clean up old format batches
    for (let i = 0; i < parsedMeta.cardsBatches; i++) {
      const oldBatchKey = `${STORAGE_KEY}_cardsBatch${i}`;
      try {
        await storage.removeItem(oldBatchKey);
        console.log(`[Storage] Removed old batch: ${oldBatchKey}`);
      } catch (error) {
        console.log(`[Storage] Failed to remove old batch ${oldBatchKey}:`, error);
      }
    }
    
    // 8. Update sync status
    syncStatus.setServerRevision(1);
    
    console.log('[Storage] ✅ Migration completed successfully!');
    return true;
    
  } catch (error) {
    console.error('[Storage] Failed to migrate old data:', error);
    return false;
  }
}

// Get cloud metadata information
export async function getCloudMetadata(): Promise<CloudMetadata | null> {
  try {
    const metaStr = await storage.getItem(`${STORAGE_KEY}_meta`);
    if (!metaStr) {
      return null;
    }
    
    const parsedMeta = JSON.parse(metaStr);
    
    // Check if migration is needed
    if (parsedMeta.cardsBatches && !parsedMeta.revision) {
      console.log('[Storage] Old format detected, attempting migration...');
      const migrated = await migrateOldDataToNewFormat();
      if (migrated) {
        // Re-read metadata after migration
        const newMetaStr = await storage.getItem(`${STORAGE_KEY}_meta`);
        return newMetaStr ? JSON.parse(newMetaStr) : null;
      }
    }
    
    return parsedMeta;
  } catch (error) {
    console.error('[Storage] Failed to get cloud metadata:', error);
    return null;
  }
}

// Get raw cloud data without updating local state
export async function inspectCloudData(): Promise<{
  metadata: CloudMetadata | null;
  batches: string[];
  fullData: string | null;
  error?: string;
}> {
  const result = {
    metadata: null as CloudMetadata | null,
    batches: [] as string[],
    fullData: null as string | null,
    error: undefined as string | undefined
  };

  try {
    // 1. Read metadata
    console.log('[Storage] Inspecting cloud data - reading metadata...');
    const metaStr = await storage.getItem(`${STORAGE_KEY}_meta`);
    if (!metaStr) {
      result.error = 'No cloud metadata found';
      return result;
    }

    const parsedMeta = JSON.parse(metaStr);
    console.log('[Storage] Raw cloud metadata:', parsedMeta);

    let batchKeyPrefix: string;
    
    // Handle old format: {cardsBatches: N}
    if (parsedMeta.cardsBatches && !parsedMeta.revision) {
      console.log('[Storage] Inspecting old format data');
      result.metadata = {
        version: 1,
        revision: 1,
        batches: parsedMeta.cardsBatches
      };
      batchKeyPrefix = `${STORAGE_KEY}_cardsBatch`; // Old format key
    } else if (parsedMeta.revision !== undefined) {
      // New format
      result.metadata = parsedMeta;
      batchKeyPrefix = `${STORAGE_KEY}_batch_`; // New format key
    } else {
      result.error = 'Invalid metadata format';
      return result;
    }

    console.log('[Storage] Using metadata:', result.metadata);

    // 2. Read all batches
    const batchData: string[] = [];
    for (let i = 0; i < result.metadata!.batches; i++) {
      const batchKey = `${batchKeyPrefix}${i}`;
      console.log(`[Storage] Reading batch ${i}: ${batchKey}`);
      
      try {
        const batch = await storage.getItem(batchKey);
        if (batch === null) {
          result.error = `Missing batch ${i}`;
          return result;
        }
        batchData.push(batch);
        result.batches.push(`Batch ${i} (${batch.length} chars): ${batch.substring(0, 100)}...`);
      } catch (error) {
        result.error = `Error reading batch ${i}: ${error}`;
        return result;
      }
    }

    // 3. Combine batches
    result.fullData = batchData.join('');
    console.log('[Storage] Successfully inspected cloud data, total size:', result.fullData.length);

    return result;

  } catch (error) {
    console.error('[Storage] Failed to inspect cloud data:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

// Force download cloud data and show it (for debugging)
export async function downloadAndShowCloudData(): Promise<string> {
  console.log('[Storage] Starting cloud data download for inspection...');
  
  try {
    const inspection = await inspectCloudData();
    
    if (inspection.error) {
      return `❌ Error: ${inspection.error}`;
    }

    if (!inspection.metadata || !inspection.fullData) {
      return '❌ No cloud data found';
    }

    let report = '=== CLOUD DATA INSPECTION ===\n\n';
    
    // Metadata info
    report += '📊 METADATA:\n';
    report += `  Version: ${inspection.metadata.version}\n`;
    report += `  Revision: ${inspection.metadata.revision}\n`;
    report += `  Batches: ${inspection.metadata.batches}\n\n`;
    
    // Batches info
    report += '📦 BATCHES:\n';
    inspection.batches.forEach(batch => {
      report += `  ${batch}\n`;
    });
    report += '\n';
    
    // Full data
    report += `📄 FULL DATA (${inspection.fullData.length} characters):\n`;
    report += '=' .repeat(50) + '\n';
    report += inspection.fullData;
    report += '\n' + '='.repeat(50);

    return report;

  } catch (error) {
    console.error('[Storage] Failed to download and show cloud data:', error);
    return `❌ Error downloading cloud data: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}