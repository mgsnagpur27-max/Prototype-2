"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useSyncStore, computeHash } from '@/lib/stores/sync-store';
import { useEditorStore } from '@/lib/stores/editor-store';
import { useFileTreeStore } from '@/lib/stores/file-tree-store';
import { webContainerManager } from '@/lib/webcontainer';

interface UseFileSyncOptions {
  debounceMs?: number;
  enabled?: boolean;
}

export function useFileSync(options: UseFileSyncOptions = {}) {
  const { debounceMs = 500, enabled = true } = options;
  
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastSyncedContent = useRef<Map<string, string>>(new Map());
  
  const {
    syncStatus,
    autoSaveEnabled,
    pendingChanges,
    conflicts,
    addPendingChange,
    removePendingChange,
    setSyncStatus,
    setFileMetadata,
    addConflict,
    resolveConflict,
    updateLastSyncTime,
    hasConflict,
  } = useSyncStore();

  const { openTabs, updateTabContent } = useEditorStore();
  const { refreshTree } = useFileTreeStore();

  const syncFileToContainer = useCallback(async (path: string, content: string): Promise<boolean> => {
    try {
      setSyncStatus('syncing');
      
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
      await webContainerManager.writeFile(normalizedPath, content);
      
      const hash = computeHash(content);
      const now = Date.now();
      
      setFileMetadata(path, {
        path,
        hash,
        lastModified: now,
        lastSynced: now,
      });
      
      lastSyncedContent.current.set(path, content);
      removePendingChange(path);
      updateLastSyncTime();
      setSyncStatus('idle');
      
      return true;
    } catch (error) {
      console.error(`Failed to sync file ${path}:`, error);
      setSyncStatus('error');
      return false;
    }
  }, [setSyncStatus, setFileMetadata, removePendingChange, updateLastSyncTime]);

  const syncFileFromContainer = useCallback(async (path: string): Promise<string | null> => {
    try {
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
      const content = await webContainerManager.readFile(normalizedPath);
      
      const hash = computeHash(content);
      const now = Date.now();
      
      setFileMetadata(path, {
        path,
        hash,
        lastModified: now,
        lastSynced: now,
      });
      
      lastSyncedContent.current.set(path, content);
      
      return content;
    } catch (error) {
      console.error(`Failed to read file ${path} from container:`, error);
      return null;
    }
  }, [setFileMetadata]);

  const checkForConflict = useCallback(async (path: string, localContent: string): Promise<boolean> => {
    try {
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
      const remoteContent = await webContainerManager.readFile(normalizedPath);
      const lastSynced = lastSyncedContent.current.get(path);
      
      if (lastSynced && remoteContent !== lastSynced && localContent !== lastSynced) {
        addConflict({
          path,
          localContent,
          remoteContent,
          localTimestamp: Date.now(),
          remoteTimestamp: Date.now(),
          detectedAt: new Date(),
        });
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }, [addConflict]);

  const debouncedSync = useCallback((path: string, content: string) => {
    if (!enabled || !autoSaveEnabled) return;
    
    const existingTimer = debounceTimers.current.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    addPendingChange({
      path,
      type: 'modify',
      timestamp: Date.now(),
      source: 'editor',
      content,
      hash: computeHash(content),
    });
    
    const timer = setTimeout(async () => {
      debounceTimers.current.delete(path);
      
      const hasConflictNow = await checkForConflict(path, content);
      if (!hasConflictNow) {
        await syncFileToContainer(path, content);
      }
    }, debounceMs);
    
    debounceTimers.current.set(path, timer);
  }, [enabled, autoSaveEnabled, debounceMs, addPendingChange, checkForConflict, syncFileToContainer]);

  const syncFileTree = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      await refreshTree();
      updateLastSyncTime();
      setSyncStatus('idle');
    } catch (error) {
      console.error('Failed to sync file tree:', error);
      setSyncStatus('error');
    }
  }, [refreshTree, setSyncStatus, updateLastSyncTime]);

  const resolveConflictWith = useCallback(async (
    path: string, 
    resolution: 'keep_local' | 'use_remote' | 'merge'
  ): Promise<boolean> => {
    const conflict = resolveConflict(path, resolution);
    if (!conflict) return false;
    
    let contentToUse: string;
    
    switch (resolution) {
      case 'keep_local':
        contentToUse = conflict.localContent;
        break;
      case 'use_remote':
        contentToUse = conflict.remoteContent;
        const tab = openTabs.find(t => t.filePath === path);
        if (tab) {
          updateTabContent(tab.id, conflict.remoteContent);
        }
        break;
      case 'merge':
        contentToUse = conflict.localContent;
        break;
      default:
        contentToUse = conflict.localContent;
    }
    
    return syncFileToContainer(path, contentToUse);
  }, [resolveConflict, openTabs, updateTabContent, syncFileToContainer]);

  const createFile = useCallback(async (path: string, content: string = ''): Promise<boolean> => {
    try {
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
      
      const dirPath = normalizedPath.split('/').slice(0, -1).join('/');
      if (dirPath) {
        await webContainerManager.mkdir(dirPath);
      }
      
      await webContainerManager.writeFile(normalizedPath, content);
      
      const hash = computeHash(content);
      const now = Date.now();
      
      setFileMetadata(path, {
        path,
        hash,
        lastModified: now,
        lastSynced: now,
      });
      
      lastSyncedContent.current.set(path, content);
      await syncFileTree();
      
      return true;
    } catch (error) {
      console.error(`Failed to create file ${path}:`, error);
      return false;
    }
  }, [setFileMetadata, syncFileTree]);

  const deleteFile = useCallback(async (path: string): Promise<boolean> => {
    try {
      const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
      await webContainerManager.rm(normalizedPath);
      
      lastSyncedContent.current.delete(path);
      removePendingChange(path);
      await syncFileTree();
      
      return true;
    } catch (error) {
      console.error(`Failed to delete file ${path}:`, error);
      return false;
    }
  }, [removePendingChange, syncFileTree]);

  const renameFile = useCallback(async (oldPath: string, newPath: string): Promise<boolean> => {
    try {
      const oldNormalized = oldPath.startsWith('/') ? oldPath.slice(1) : oldPath;
      const newNormalized = newPath.startsWith('/') ? newPath.slice(1) : newPath;
      
      const content = await webContainerManager.readFile(oldNormalized);
      
      const dirPath = newNormalized.split('/').slice(0, -1).join('/');
      if (dirPath) {
        await webContainerManager.mkdir(dirPath);
      }
      
      await webContainerManager.writeFile(newNormalized, content);
      await webContainerManager.rm(oldNormalized);
      
      const hash = computeHash(content);
      const now = Date.now();
      
      lastSyncedContent.current.delete(oldPath);
      lastSyncedContent.current.set(newPath, content);
      
      setFileMetadata(newPath, {
        path: newPath,
        hash,
        lastModified: now,
        lastSynced: now,
      });
      
      await syncFileTree();
      
      return true;
    } catch (error) {
      console.error(`Failed to rename file ${oldPath} to ${newPath}:`, error);
      return false;
    }
  }, [setFileMetadata, syncFileTree]);

  const flushPendingChanges = useCallback(async (): Promise<boolean> => {
    const changes = Array.from(pendingChanges.values());
    
    for (const change of changes) {
      if (change.content) {
        const success = await syncFileToContainer(change.path, change.content);
        if (!success) return false;
      }
    }
    
    return true;
  }, [pendingChanges, syncFileToContainer]);

  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, []);

  return {
    syncStatus,
    pendingChanges,
    conflicts,
    hasConflict,
    
    syncFileToContainer,
    syncFileFromContainer,
    debouncedSync,
    syncFileTree,
    
    createFile,
    deleteFile,
    renameFile,
    
    resolveConflictWith,
    flushPendingChanges,
    
    checkForConflict,
  };
}
