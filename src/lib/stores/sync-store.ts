import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'conflict' | 'error';
export type ConflictResolution = 'keep_local' | 'use_remote' | 'merge';

export interface FileChange {
  path: string;
  type: 'create' | 'modify' | 'delete';
  timestamp: number;
  source: 'editor' | 'webcontainer' | 'file_tree';
  content?: string;
  hash?: string;
}

export interface FileConflict {
  path: string;
  localContent: string;
  remoteContent: string;
  localTimestamp: number;
  remoteTimestamp: number;
  detectedAt: Date;
}

export interface FileMetadata {
  path: string;
  hash: string;
  lastModified: number;
  lastSynced: number;
}

interface SyncState {
  syncStatus: SyncStatus;
  pendingChanges: Map<string, FileChange>;
  conflicts: FileConflict[];
  fileMetadata: Map<string, FileMetadata>;
  autoSaveEnabled: boolean;
  autoSaveDelay: number;
  lastSyncTime: number | null;
  syncQueue: string[];
  isWatching: boolean;

  setSyncStatus: (status: SyncStatus) => void;
  addPendingChange: (change: FileChange) => void;
  removePendingChange: (path: string) => void;
  clearPendingChanges: () => void;
  addConflict: (conflict: FileConflict) => void;
  resolveConflict: (path: string, resolution: ConflictResolution) => FileConflict | undefined;
  clearConflicts: () => void;
  setFileMetadata: (path: string, metadata: FileMetadata) => void;
  getFileMetadata: (path: string) => FileMetadata | undefined;
  removeFileMetadata: (path: string) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveDelay: (delay: number) => void;
  addToSyncQueue: (path: string) => void;
  removeFromSyncQueue: (path: string) => void;
  clearSyncQueue: () => void;
  setWatching: (watching: boolean) => void;
  updateLastSyncTime: () => void;
  hasConflict: (path: string) => boolean;
  getPendingChange: (path: string) => FileChange | undefined;
  resetSync: () => void;
}

function computeHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export const useSyncStore = create<SyncState>((set, get) => ({
  syncStatus: 'idle',
  pendingChanges: new Map(),
  conflicts: [],
  fileMetadata: new Map(),
  autoSaveEnabled: true,
  autoSaveDelay: 500,
  lastSyncTime: null,
  syncQueue: [],
  isWatching: false,

  setSyncStatus: (status) => set({ syncStatus: status }),

  addPendingChange: (change) => {
    set((state) => {
      const newPending = new Map(state.pendingChanges);
      newPending.set(change.path, change);
      return { pendingChanges: newPending };
    });
  },

  removePendingChange: (path) => {
    set((state) => {
      const newPending = new Map(state.pendingChanges);
      newPending.delete(path);
      return { pendingChanges: newPending };
    });
  },

  clearPendingChanges: () => set({ pendingChanges: new Map() }),

  addConflict: (conflict) => {
    set((state) => ({
      conflicts: [...state.conflicts.filter((c) => c.path !== conflict.path), conflict],
      syncStatus: 'conflict',
    }));
  },

  resolveConflict: (path, _resolution) => {
    const { conflicts } = get();
    const conflict = conflicts.find((c) => c.path === path);
    
    set((state) => ({
      conflicts: state.conflicts.filter((c) => c.path !== path),
      syncStatus: state.conflicts.length <= 1 ? 'idle' : 'conflict',
    }));

    return conflict;
  },

  clearConflicts: () => set({ conflicts: [], syncStatus: 'idle' }),

  setFileMetadata: (path, metadata) => {
    set((state) => {
      const newMetadata = new Map(state.fileMetadata);
      newMetadata.set(path, metadata);
      return { fileMetadata: newMetadata };
    });
  },

  getFileMetadata: (path) => {
    return get().fileMetadata.get(path);
  },

  removeFileMetadata: (path) => {
    set((state) => {
      const newMetadata = new Map(state.fileMetadata);
      newMetadata.delete(path);
      return { fileMetadata: newMetadata };
    });
  },

  setAutoSave: (enabled) => set({ autoSaveEnabled: enabled }),

  setAutoSaveDelay: (delay) => set({ autoSaveDelay: delay }),

  addToSyncQueue: (path) => {
    set((state) => ({
      syncQueue: state.syncQueue.includes(path) 
        ? state.syncQueue 
        : [...state.syncQueue, path],
    }));
  },

  removeFromSyncQueue: (path) => {
    set((state) => ({
      syncQueue: state.syncQueue.filter((p) => p !== path),
    }));
  },

  clearSyncQueue: () => set({ syncQueue: [] }),

  setWatching: (watching) => set({ isWatching: watching }),

  updateLastSyncTime: () => set({ lastSyncTime: Date.now() }),

  hasConflict: (path) => {
    return get().conflicts.some((c) => c.path === path);
  },

  getPendingChange: (path) => {
    return get().pendingChanges.get(path);
  },

  resetSync: () => set({
    syncStatus: 'idle',
    pendingChanges: new Map(),
    conflicts: [],
    syncQueue: [],
    lastSyncTime: null,
  }),
}));

export { computeHash };
