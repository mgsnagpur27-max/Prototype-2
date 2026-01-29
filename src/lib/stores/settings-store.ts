import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontSize = 12 | 14 | 16 | 18;

interface SettingsState {
  fontSize: FontSize;
  autoSaveEnabled: boolean;
  autoSaveDelay: 500 | 1000 | 2000;
  lineNumbers: boolean;
  minimap: boolean;
  wordWrap: boolean;
  geminiApiKey: string;
  groqApiKey: string;
  setFontSize: (size: FontSize) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setAutoSaveDelay: (delay: 500 | 1000 | 2000) => void;
  setLineNumbers: (enabled: boolean) => void;
  setMinimap: (enabled: boolean) => void;
  setWordWrap: (enabled: boolean) => void;
  setGeminiApiKey: (key: string) => void;
  setGroqApiKey: (key: string) => void;
  hasRequiredApiKeys: () => boolean;
  hasAnyApiKey: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      fontSize: 14,
      autoSaveEnabled: true,
      autoSaveDelay: 1000,
      lineNumbers: true,
      minimap: true,
      wordWrap: true,
      geminiApiKey: '',
      groqApiKey: '',

      setFontSize: (fontSize) => set({ fontSize }),
      setAutoSaveEnabled: (autoSaveEnabled) => set({ autoSaveEnabled }),
      setAutoSaveDelay: (autoSaveDelay) => set({ autoSaveDelay }),
      setLineNumbers: (lineNumbers) => set({ lineNumbers }),
      setMinimap: (minimap) => set({ minimap }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setGroqApiKey: (groqApiKey) => set({ groqApiKey }),
      hasRequiredApiKeys: () => {
        const state = get();
        return state.geminiApiKey.trim() !== '' && state.groqApiKey.trim() !== '';
      },
      hasAnyApiKey: () => {
        const state = get();
        return state.geminiApiKey.trim() !== '' || state.groqApiKey.trim() !== '';
      },
    }),
    {
      name: 'beesto-settings',
    }
  )
);
