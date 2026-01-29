import { create } from 'zustand';

export type AIModel = {
  id: string;
  name: string;
  provider: string;
  speed: 'fast' | 'very-fast' | 'ultra-fast';
  contextWindow: string;
  isCustom?: boolean;
};

export const AI_MODELS: AIModel[] = [
  { id: 'llama-3.3-70b', name: 'LLaMA 3.3 70B', provider: 'SambaNova', speed: 'fast', contextWindow: '128K' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'Groq', speed: 'very-fast', contextWindow: '64K' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', speed: 'ultra-fast', contextWindow: '1M' },
];

export const CUSTOM_MODEL: AIModel = {
  id: 'custom-model',
  name: 'Your Model',
  provider: 'Custom',
  speed: 'fast',
  contextWindow: '128K',
  isCustom: true,
};

export type CenterTab = 'app' | 'code' | 'database' | 'payments' | 'analytics';

interface UIState {
  isChatOpen: boolean;
  isTerminalOpen: boolean;
  selectedModel: AIModel;
  aiStatus: 'idle' | 'thinking' | 'streaming' | 'error';
  activeTab: CenterTab;
  previewUrl: string | null;
  chatWidth: number;
  terminalHeight: number;
  toggleChat: () => void;
  toggleTerminal: () => void;
  setSelectedModel: (model: AIModel) => void;
  setAIStatus: (status: UIState['aiStatus']) => void;
  setActiveTab: (tab: CenterTab) => void;
  setPreviewUrl: (url: string | null) => void;
  setChatWidth: (width: number) => void;
  setTerminalHeight: (height: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isChatOpen: true,
  isTerminalOpen: true,
  selectedModel: AI_MODELS[0],
  aiStatus: 'idle',
  activeTab: 'app',
  previewUrl: null,
  chatWidth: 320,
  terminalHeight: 200,

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setAIStatus: (status) => set({ aiStatus: status }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setChatWidth: (width) => set({ chatWidth: Math.max(280, Math.min(500, width)) }),
  setTerminalHeight: (height) => set({ terminalHeight: Math.max(100, Math.min(400, height)) }),
}));
