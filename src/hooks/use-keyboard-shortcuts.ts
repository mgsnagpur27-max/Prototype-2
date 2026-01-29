"use client";

import { useEffect, useCallback } from "react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useEditorStore } from "@/lib/stores/editor-store";
import { useSyncStore } from "@/lib/stores/sync-store";
import { webContainerManager } from "@/lib/webcontainer";

export function useKeyboardShortcuts() {
  const { toggleChat, toggleTerminal, setActiveTab } = useUIStore();
  const { 
    activeTabId, 
    saveFile, 
    closeTab, 
    switchToNextTab, 
    switchToPrevTab,
    closeDiffViewer,
    diffViewer 
  } = useEditorStore();
  const { setSyncStatus, setFileMetadata } = useSyncStore();

  const handleSaveFile = useCallback(async () => {
    if (!activeTabId) return;
    
    const tab = useEditorStore.getState().openTabs.find(t => t.id === activeTabId);
    if (!tab) return;

    try {
      setSyncStatus("syncing");
      const normalizedPath = tab.filePath.startsWith("/")
        ? tab.filePath.slice(1)
        : tab.filePath;
      await webContainerManager.writeFile(normalizedPath, tab.content);
      
      const hash = tab.content.length.toString(16);
      const now = Date.now();
      setFileMetadata(tab.filePath, {
        path: tab.filePath,
        hash,
        lastModified: now,
        lastSynced: now,
      });
      
      saveFile(activeTabId);
      setSyncStatus("idle");
    } catch (error) {
      console.error("Save failed:", error);
      setSyncStatus("error");
    }
  }, [activeTabId, saveFile, setSyncStatus, setFileMetadata]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      if (isMod && e.key === "s") {
        e.preventDefault();
        handleSaveFile();
        return;
      }

      if (isMod && e.key === "k") {
        e.preventDefault();
        toggleChat();
        return;
      }

      if (isMod && e.key === "`") {
        e.preventDefault();
        toggleTerminal();
        return;
      }

      if (isMod && e.key === "b") {
        e.preventDefault();
        setActiveTab("code");
        return;
      }

      if (isMod && e.key === "p" && !isShift) {
        e.preventDefault();
        setActiveTab("code");
        return;
      }

      if (isMod && e.key === "w") {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
        return;
      }

      if (isMod && isShift && e.key === "Tab") {
        e.preventDefault();
        switchToPrevTab();
        return;
      }

      if (isMod && e.key === "Tab") {
        e.preventDefault();
        switchToNextTab();
        return;
      }

      if (e.key === "Escape") {
        if (diffViewer.isOpen) {
          closeDiffViewer();
        }
        return;
      }

      if (isMod && e.key === "1") {
        e.preventDefault();
        setActiveTab("app");
        return;
      }

      if (isMod && e.key === "2") {
        e.preventDefault();
        setActiveTab("code");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleSaveFile,
    toggleChat,
    toggleTerminal,
    setActiveTab,
    activeTabId,
    closeTab,
    switchToNextTab,
    switchToPrevTab,
    closeDiffViewer,
    diffViewer.isOpen,
  ]);
}
