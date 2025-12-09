// Sync status management for tracking unsaved changes
export interface SyncStatus {
  hasUnsavedChanges: boolean;
  lastSaved?: Date;
  lastModified?: Date;
  isSyncing: boolean;
}

class SyncStatusManager {
  private status: SyncStatus = {
    hasUnsavedChanges: false,
    isSyncing: false,
  };
  
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    // Check for unsaved changes on startup
    this.checkForUnsavedChanges();
  }

  private checkForUnsavedChanges() {
    try {
      const localData = localStorage.getItem('cards_local');
      const localTimestamp = localStorage.getItem('cards_local_timestamp');
      const lastCloudSync = localStorage.getItem('cards_last_cloud_sync');
      
      console.log('[SyncStatus] Checking for unsaved changes:', {
        hasLocalData: !!localData,
        localTimestamp,
        lastCloudSync
      });
      
      if (localData) {
        if (!lastCloudSync) {
          // Have local data but no cloud sync record
          console.log('[SyncStatus] Found local data with no cloud sync record');
          this.status.hasUnsavedChanges = true;
          this.notifyListeners();
        } else if (localTimestamp && new Date(localTimestamp) > new Date(lastCloudSync)) {
          // Local data is newer than last cloud sync
          console.log('[SyncStatus] Local data is newer than cloud sync');
          this.status.hasUnsavedChanges = true;
          this.notifyListeners();
        } else {
          // Local data exists but is synced
          console.log('[SyncStatus] Local data is synced');
        }
      } else {
        console.log('[SyncStatus] No local data found');
      }
    } catch (error) {
      console.error('[SyncStatus] Error checking for unsaved changes:', error);
    }
  }

  public markAsModified() {
    this.status.hasUnsavedChanges = true;
    this.status.lastModified = new Date();
    
    // Update local timestamp
    localStorage.setItem('cards_local_timestamp', this.status.lastModified.toISOString());
    
    console.log('[SyncStatus] Marked as modified');
    this.notifyListeners();
  }

  public markAsSyncing() {
    this.status.isSyncing = true;
    console.log('[SyncStatus] Started syncing');
    this.notifyListeners();
  }

  public markAsSynced() {
    this.status.hasUnsavedChanges = false;
    this.status.isSyncing = false;
    this.status.lastSaved = new Date();
    
    // Update last cloud sync timestamp
    localStorage.setItem('cards_last_cloud_sync', this.status.lastSaved.toISOString());
    
    console.log('[SyncStatus] Marked as synced');
    this.notifyListeners();
  }

  public markSyncFailed() {
    this.status.isSyncing = false;
    // Keep hasUnsavedChanges = true since sync failed
    console.log('[SyncStatus] Sync failed');
    this.notifyListeners();
  }

  public getStatus(): SyncStatus {
    return { ...this.status };
  }

  public subscribe(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current status
    callback(this.getStatus());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const currentStatus = this.getStatus();
    this.listeners.forEach(callback => {
      try {
        callback(currentStatus);
      } catch (error) {
        console.error('[SyncStatus] Error in listener callback:', error);
      }
    });
  }

  public reset() {
    this.status = {
      hasUnsavedChanges: false,
      isSyncing: false,
    };
    
    // Clear local timestamps
    localStorage.removeItem('cards_local_timestamp');
    localStorage.removeItem('cards_last_cloud_sync');
    
    console.log('[SyncStatus] Reset sync status');
    this.notifyListeners();
  }
}

export const syncStatus = new SyncStatusManager();