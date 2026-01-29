import { create } from 'zustand';
import type { EditorTab, FileNode, CursorPosition, DiffViewerState } from '@/types';

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  json: 'json',
  css: 'css',
  scss: 'scss',
  html: 'html',
  md: 'markdown',
  mdx: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  txt: 'plaintext',
  env: 'plaintext',
  gitignore: 'plaintext',
  dockerfile: 'dockerfile',
  prisma: 'prisma',
  graphql: 'graphql',
  gql: 'graphql',
  vue: 'vue',
  svelte: 'svelte',
  php: 'php',
  rb: 'ruby',
  swift: 'swift',
  kt: 'kotlin',
};

export function getLanguageFromPath(path: string): string {
  const fileName = path.split('/').pop() ?? '';
  if (fileName === 'Dockerfile') return 'dockerfile';
  if (fileName === '.env' || fileName.startsWith('.env.')) return 'plaintext';
  if (fileName === '.gitignore') return 'plaintext';
  
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_LANGUAGE_MAP[ext] ?? 'plaintext';
}

interface EditorState {
  files: FileNode[];
  openTabs: EditorTab[];
  activeTabId: string | null;
  selectedFilePath: string | null;
  cursorPosition: CursorPosition;
  diffViewer: DiffViewerState;
  
  setFiles: (files: FileNode[]) => void;
  addFile: (path: string, content: string, name?: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  openFile: (file: FileNode) => void;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  closeFile: (filePath: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveFile: (tabId: string) => void;
  saveAllFiles: () => void;
  setSelectedFile: (path: string | null) => void;
  setCursorPosition: (position: CursorPosition) => void;
  getActiveTab: () => EditorTab | null;
  switchToNextTab: () => void;
  switchToPrevTab: () => void;
  openDiffViewer: (original: string, modified: string, filePath: string, language?: string) => void;
  closeDiffViewer: () => void;
  applyDiff: () => void;
  rejectDiff: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  files: [],
  openTabs: [],
  activeTabId: null,
  selectedFilePath: null,
  cursorPosition: { line: 1, column: 1 },
  diffViewer: {
    isOpen: false,
    original: '',
    modified: '',
    filePath: '',
    language: 'plaintext',
  },

  setFiles: (files) => set({ files }),

  addFile: (path, content, name) => {
    const fileName = name ?? path.split('/').pop() ?? 'untitled';
    const language = getLanguageFromPath(path);
    
    const newFile: FileNode = {
      id: crypto.randomUUID(),
      name: fileName,
      type: 'file',
      path,
      content,
      language,
    };

    set((state) => ({ files: [...state.files, newFile] }));
  },

  deleteFile: (path) => {
    set((state) => ({
      files: state.files.filter((f) => f.path !== path),
      openTabs: state.openTabs.filter((t) => t.filePath !== path),
    }));
  },

  renameFile: (oldPath, newPath) => {
    const newName = newPath.split('/').pop() ?? 'untitled';
    const newLanguage = getLanguageFromPath(newPath);
    
    set((state) => ({
      files: state.files.map((f) =>
        f.path === oldPath
          ? { ...f, path: newPath, name: newName, language: newLanguage }
          : f
      ),
      openTabs: state.openTabs.map((t) =>
        t.filePath === oldPath
          ? { ...t, filePath: newPath, fileName: newName, language: newLanguage }
          : t
      ),
    }));
  },

  openFile: (file) => {
    if (file.type === 'directory') return;
    
    const { openTabs } = get();
    const existingTab = openTabs.find((tab) => tab.filePath === file.path);

    if (existingTab) {
      set({ activeTabId: existingTab.id, selectedFilePath: file.path });
      return;
    }

    const content = file.content ?? '';
    const language = file.language ?? getLanguageFromPath(file.path);
    
    const newTab: EditorTab = {
      id: crypto.randomUUID(),
      filePath: file.path,
      fileName: file.name,
      content,
      originalContent: content,
      language,
      isDirty: false,
    };

    set({
      openTabs: [...openTabs, newTab],
      activeTabId: newTab.id,
      selectedFilePath: file.path,
    });
  },

  closeTab: (tabId) => {
    const { openTabs, activeTabId } = get();
    const tabIndex = openTabs.findIndex((tab) => tab.id === tabId);
    const newTabs = openTabs.filter((tab) => tab.id !== tabId);
    
    let newActiveId = activeTabId;
    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        const newIndex = Math.min(tabIndex, newTabs.length - 1);
        newActiveId = newTabs[newIndex].id;
      } else {
        newActiveId = null;
      }
    }

    set({ 
      openTabs: newTabs, 
      activeTabId: newActiveId,
      selectedFilePath: newActiveId 
        ? newTabs.find(t => t.id === newActiveId)?.filePath ?? null 
        : null
    });
  },

  closeAllTabs: () => {
    set({ openTabs: [], activeTabId: null, selectedFilePath: null });
  },

  closeOtherTabs: (tabId) => {
    const { openTabs } = get();
    const tab = openTabs.find((t) => t.id === tabId);
    if (!tab) return;
    
    set({
      openTabs: [tab],
      activeTabId: tabId,
      selectedFilePath: tab.filePath,
    });
  },

  closeFile: (filePath) => {
    const { openTabs } = get();
    const tab = openTabs.find((t) => t.filePath === filePath);
    if (tab) {
      get().closeTab(tab.id);
    }
  },

  setActiveTab: (tabId) => {
    const { openTabs } = get();
    const tab = openTabs.find((t) => t.id === tabId);
    set({ activeTabId: tabId, selectedFilePath: tab?.filePath ?? null });
  },

  updateTabContent: (tabId, content) => {
    set((state) => ({
      openTabs: state.openTabs.map((tab) =>
        tab.id === tabId 
          ? { ...tab, content, isDirty: content !== tab.originalContent } 
          : tab
      ),
    }));
  },

  saveFile: (tabId) => {
    set((state) => ({
      openTabs: state.openTabs.map((tab) =>
        tab.id === tabId
          ? { ...tab, originalContent: tab.content, isDirty: false }
          : tab
      ),
    }));
  },

  saveAllFiles: () => {
    set((state) => ({
      openTabs: state.openTabs.map((tab) => ({
        ...tab,
        originalContent: tab.content,
        isDirty: false,
      })),
    }));
  },

  setSelectedFile: (path) => set({ selectedFilePath: path }),

  setCursorPosition: (position) => set({ cursorPosition: position }),

  getActiveTab: () => {
    const { openTabs, activeTabId } = get();
    return openTabs.find((tab) => tab.id === activeTabId) ?? null;
  },

  switchToNextTab: () => {
    const { openTabs, activeTabId } = get();
    if (openTabs.length <= 1) return;
    
    const currentIndex = openTabs.findIndex((tab) => tab.id === activeTabId);
    const nextIndex = (currentIndex + 1) % openTabs.length;
    set({ 
      activeTabId: openTabs[nextIndex].id,
      selectedFilePath: openTabs[nextIndex].filePath
    });
  },

  switchToPrevTab: () => {
    const { openTabs, activeTabId } = get();
    if (openTabs.length <= 1) return;
    
    const currentIndex = openTabs.findIndex((tab) => tab.id === activeTabId);
    const prevIndex = currentIndex === 0 ? openTabs.length - 1 : currentIndex - 1;
    set({ 
      activeTabId: openTabs[prevIndex].id,
      selectedFilePath: openTabs[prevIndex].filePath
    });
  },

  openDiffViewer: (original, modified, filePath, language) => {
    set({
      diffViewer: {
        isOpen: true,
        original,
        modified,
        filePath,
        language: language ?? getLanguageFromPath(filePath),
      },
    });
  },

  closeDiffViewer: () => {
    set({
      diffViewer: {
        isOpen: false,
        original: '',
        modified: '',
        filePath: '',
        language: 'plaintext',
      },
    });
  },

  applyDiff: () => {
    const { diffViewer, openTabs } = get();
    if (!diffViewer.isOpen) return;

    const tab = openTabs.find((t) => t.filePath === diffViewer.filePath);
    if (tab) {
      set((state) => ({
        openTabs: state.openTabs.map((t) =>
          t.id === tab.id
            ? { ...t, content: diffViewer.modified, isDirty: true }
            : t
        ),
        diffViewer: {
          isOpen: false,
          original: '',
          modified: '',
          filePath: '',
          language: 'plaintext',
        },
      }));
    } else {
      get().closeDiffViewer();
    }
  },

  rejectDiff: () => {
    get().closeDiffViewer();
  },
}));
