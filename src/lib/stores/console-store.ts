import { create } from 'zustand';

export type LogLevel = 'log' | 'info' | 'warn' | 'error';

export interface ConsoleLogEntry {
  id: string;
  type: LogLevel;
  message: string;
  timestamp: number;
  stack?: string;
  source?: string;
}

export type ConsoleFilter = 'all' | 'errors' | 'warnings';

interface ConsoleState {
  logs: ConsoleLogEntry[];
  filter: ConsoleFilter;
  isAutoScroll: boolean;
  addLog: (entry: Omit<ConsoleLogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  setFilter: (filter: ConsoleFilter) => void;
  toggleAutoScroll: () => void;
  getFilteredLogs: () => ConsoleLogEntry[];
}

let logIdCounter = 0;

export const useConsoleStore = create<ConsoleState>((set, get) => ({
  logs: [],
  filter: 'all',
  isAutoScroll: true,

  addLog: (entry) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          ...entry,
          id: `log-${++logIdCounter}`,
          timestamp: Date.now(),
        },
      ].slice(-500),
    })),

  clearLogs: () => set({ logs: [] }),

  setFilter: (filter) => set({ filter }),

  toggleAutoScroll: () => set((state) => ({ isAutoScroll: !state.isAutoScroll })),

  getFilteredLogs: () => {
    const { logs, filter } = get();
    switch (filter) {
      case 'errors':
        return logs.filter((l) => l.type === 'error');
      case 'warnings':
        return logs.filter((l) => l.type === 'warn');
      default:
        return logs;
    }
  },
}));
