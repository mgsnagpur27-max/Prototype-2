import { create } from 'zustand';
import type { ContainerStatus } from '@/lib/webcontainer';

export type BootStage = 
  | 'initializing'
  | 'downloading'
  | 'starting'
  | 'ready';

interface WebContainerState {
  status: ContainerStatus;
  bootStage: BootStage;
  bootProgress: number;
  previewUrl: string | null;
  error: string | null;
  terminalOutput: string[];
  isInstalling: boolean;
  isServerRunning: boolean;
  
  setStatus: (status: ContainerStatus) => void;
  setBootStage: (stage: BootStage) => void;
  setBootProgress: (progress: number) => void;
  setPreviewUrl: (url: string | null) => void;
  setError: (error: string | null) => void;
  appendOutput: (output: string) => void;
  clearOutput: () => void;
  setInstalling: (installing: boolean) => void;
  setServerRunning: (running: boolean) => void;
}

export const useWebContainerStore = create<WebContainerState>((set) => ({
  status: 'idle',
  bootStage: 'initializing',
  bootProgress: 0,
  previewUrl: null,
  error: null,
  terminalOutput: [],
  isInstalling: false,
  isServerRunning: false,

  setStatus: (status) => {
    if (status === 'booting') {
      set({ status, bootStage: 'initializing', bootProgress: 0 });
    } else if (status === 'ready') {
      set({ status, bootStage: 'ready', bootProgress: 100 });
    } else {
      set({ status });
    }
  },
  setBootStage: (bootStage) => {
    const progressMap: Record<BootStage, number> = {
      initializing: 10,
      downloading: 40,
      starting: 70,
      ready: 100,
    };
    set({ bootStage, bootProgress: progressMap[bootStage] });
  },
  setBootProgress: (bootProgress) => set({ bootProgress }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setError: (error) => set({ error }),
  appendOutput: (output) => set((state) => ({ 
    terminalOutput: [...state.terminalOutput.slice(-500), output] 
  })),
  clearOutput: () => set({ terminalOutput: [] }),
  setInstalling: (installing) => set({ isInstalling: installing }),
  setServerRunning: (running) => set({ isServerRunning: running }),
}));
