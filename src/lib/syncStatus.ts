// Sync status management with revision-based tracking
export interface SyncStatus {
  hasUnsavedChanges: boolean;
  lastSaved?: Date;
  lastModified?: Date;
  isSyncing: boolean;
  revisionLocal: number;
  revisionServer: number;
  lastSyncAttempt?: Date;
  lastSyncError?: string;
}

class SyncStatusManager {
  private status: SyncStatus = {
    hasUnsavedChanges: false,
    isSyncing: false,
    revisionLocal: 0,
    revisionServer: 0,
  };
  
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    // Load revision info from localStorage on startup
    this.loadRevisions();
  }

  private loadRevisions() {
    try {
      const localRevision = localStorage.getItem('cards_revision');
      const serverRevision = localStorage.getItem('cards_server_revision');
      
      // Parse revisions with proper validation
      this.status.revisionLocal = localRevision ? parseInt(localRevision, 10) || 0 : 0;
      this.status.revisionServer = serverRevision ? parseInt(serverRevision, 10) || 0 : 0;
      
      // Ensure we have valid numbers
      if (isNaN(this.status.revisionLocal)) this.status.revisionLocal = 0;
      if (isNaN(this.status.revisionServer)) this.status.revisionServer = 0;
      
      // Determine if we have unsaved changes
      this.status.hasUnsavedChanges = this.status.revisionLocal > this.status.revisionServer;
      
      console.log('[SyncStatus] Loaded revisions:', {
        local: this.status.revisionLocal,
        server: this.status.revisionServer,
        hasUnsavedChanges: this.status.hasUnsavedChanges
      });
      
    } catch (error) {
      console.error('[SyncStatus] Error loading revisions:', error);
      // Reset to safe defaults
      this.status.revisionLocal = 0;
      this.status.revisionServer = 0;
      this.status.hasUnsavedChanges = false;
    }
  }

  public setLocalRevision(revision: number) {
    const oldRevision = this.status.revisionLocal;
    
    // Validate revision number
    this.status.revisionLocal = (typeof revision === 'number' && !isNaN(revision)) ? revision : 0;
    this.status.hasUnsavedChanges = this.status.revisionLocal > this.status.revisionServer;
    
    // Save to localStorage
    localStorage.setItem('cards_revision', this.status.revisionLocal.toString());
    
    console.log(`[SyncStatus] Set local revision: ${oldRevision} → ${this.status.revisionLocal}`);
    console.log(`[SyncStatus] Has unsaved changes: ${this.status.hasUnsavedChanges} (local: ${this.status.revisionLocal}, server: ${this.status.revisionServer})`);
    this.notifyListeners();
  }

  public setServerRevision(revision: number) {
    const oldRevision = this.status.revisionServer;
    
    // Validate revision number
    this.status.revisionServer = (typeof revision === 'number' && !isNaN(revision)) ? revision : 0;
    this.status.hasUnsavedChanges = this.status.revisionLocal > this.status.revisionServer;
    
    // Save to localStorage for persistence
    localStorage.setItem('cards_server_revision', this.status.revisionServer.toString());
    
    console.log(`[SyncStatus] Set server revision: ${oldRevision} → ${this.status.revisionServer}`);
    console.log(`[SyncStatus] Has unsaved changes: ${this.status.hasUnsavedChanges} (local: ${this.status.revisionLocal}, server: ${this.status.revisionServer})`);
    this.notifyListeners();
  }

  public incrementLocalRevision() {
    const oldRevision = this.status.revisionLocal;
    this.setLocalRevision(this.status.revisionLocal + 1);
    this.status.lastModified = new Date();
    console.log(`[SyncStatus] ✅ INCREMENTED local revision: ${oldRevision} → ${this.status.revisionLocal}`);
    console.log(`[SyncStatus] Now needs cloud write: ${this.needsCloudWrite()}`);
  }

  public markAsSyncing() {
    this.status.isSyncing = true;
    this.status.lastSyncAttempt = new Date();
    this.status.lastSyncError = undefined;
    console.log(`[SyncStatus] 🔄 Started syncing (local: ${this.status.revisionLocal}, server: ${this.status.revisionServer})`);
    this.notifyListeners();
  }

  public markAsSynced(serverRevision?: number) {
    if (serverRevision !== undefined) {
      this.setServerRevision(serverRevision);
    }
    
    this.status.isSyncing = false;
    this.status.lastSaved = new Date();
    this.status.lastSyncError = undefined;
    this.status.hasUnsavedChanges = this.status.revisionLocal > this.status.revisionServer;
    
    console.log(`[SyncStatus] ✅ Marked as synced - local: ${this.status.revisionLocal}, server: ${this.status.revisionServer}, unsaved: ${this.status.hasUnsavedChanges}`);
    this.notifyListeners();
  }

  public markSyncFailed(error?: string) {
    this.status.isSyncing = false;
    this.status.lastSyncError = error;
    // Keep hasUnsavedChanges = true since sync failed
    console.log(`[SyncStatus] ❌ Sync failed: ${error} (local: ${this.status.revisionLocal}, server: ${this.status.revisionServer})`);
    this.notifyListeners();
  }

  public markDataUpdatedFromServer(serverRevision: number) {
    // When we get data from server, both revisions become equal
    this.status.revisionLocal = serverRevision;
    this.status.revisionServer = serverRevision;
    this.status.hasUnsavedChanges = false;
    this.status.lastSaved = new Date();
    
    // Save both revisions to localStorage
    localStorage.setItem('cards_revision', serverRevision.toString());
    localStorage.setItem('cards_server_revision', serverRevision.toString());
    
    console.log(`[SyncStatus] 📥 Data updated from server, both revisions now: ${serverRevision}`);
    this.notifyListeners();
  }

  public getRevisions() {
    return {
      local: this.status.revisionLocal,
      server: this.status.revisionServer
    };
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
      revisionLocal: 0,
      revisionServer: 0,
    };
    
    // Clear localStorage
    localStorage.removeItem('cards_revision');
    localStorage.removeItem('cards_server_revision');
    
    console.log('[SyncStatus] Reset sync status');
    this.notifyListeners();
  }

  // Check if we need to read from cloud (server is newer or equal)
  public needsCloudRead(): boolean {
    return this.status.revisionLocal <= this.status.revisionServer;
  }

  // Check if we need to write to cloud (local is newer)
  public needsCloudWrite(): boolean {
    return this.status.revisionLocal > this.status.revisionServer;
  }
}

export const syncStatus = new SyncStatusManager();