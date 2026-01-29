import { create } from 'zustand';
import type {
  AgentState,
  AgentPlan,
  AgentStep,
  AgentAnalysis,
  AgentReport,
  AgentFileChange,
} from '@/types';

interface AgentStoreState {
  state: AgentState;
  currentPlan: AgentPlan | null;
  analysis: AgentAnalysis | null;
  report: AgentReport | null;
  currentStepIndex: number;
  retryCount: number;
  maxRetries: number;
  rollbackStack: AgentFileChange[];
  logs: AgentLog[];
  error: string | null;
  isProcessing: boolean;

  setState: (state: AgentState) => void;
  setAnalysis: (analysis: AgentAnalysis) => void;
  setPlan: (plan: AgentPlan) => void;
  setReport: (report: AgentReport) => void;
  updateStep: (stepId: string, updates: Partial<AgentStep>) => void;
  nextStep: () => void;
  addLog: (message: string, type?: AgentLogType) => void;
  addToRollback: (change: AgentFileChange) => void;
  clearRollback: () => void;
  incrementRetry: () => boolean;
  resetRetries: () => void;
  setError: (error: string | null) => void;
  setProcessing: (processing: boolean) => void;
  reset: () => void;
  getCurrentStep: () => AgentStep | null;
  getProgress: () => { current: number; total: number; percentage: number };
}

type AgentLogType = 'info' | 'success' | 'warning' | 'error' | 'step';

interface AgentLog {
  id: string;
  message: string;
  type: AgentLogType;
  timestamp: Date;
}

const initialState = {
  state: 'IDLE' as AgentState,
  currentPlan: null,
  analysis: null,
  report: null,
  currentStepIndex: 0,
  retryCount: 0,
  maxRetries: 3,
  rollbackStack: [] as AgentFileChange[],
  logs: [] as AgentLog[],
  error: null,
  isProcessing: false,
};

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  ...initialState,

  setState: (state) => {
    set({ state });
    get().addLog(`State changed to ${state}`, 'info');
  },

  setAnalysis: (analysis) => set({ analysis }),

  setPlan: (plan) => {
    set({ currentPlan: plan, currentStepIndex: 0 });
    get().addLog(`Plan created: ${plan.summary}`, 'info');
  },

  setReport: (report) => set({ report }),

  updateStep: (stepId, updates) => {
    set((state) => {
      if (!state.currentPlan) return state;
      
      const steps = state.currentPlan.steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      );
      
      return {
        currentPlan: { ...state.currentPlan, steps },
      };
    });
  },

  nextStep: () => {
    const { currentPlan, currentStepIndex } = get();
    if (!currentPlan) return;
    
    if (currentStepIndex < currentPlan.steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  addLog: (message, type = 'info') => {
    const log: AgentLog = {
      id: crypto.randomUUID(),
      message,
      type,
      timestamp: new Date(),
    };
    set((state) => ({ logs: [...state.logs, log] }));
  },

  addToRollback: (change) => {
    set((state) => ({ rollbackStack: [...state.rollbackStack, change] }));
  },

  clearRollback: () => set({ rollbackStack: [] }),

  incrementRetry: () => {
    const { retryCount, maxRetries } = get();
    if (retryCount >= maxRetries) {
      get().addLog(`Max retries (${maxRetries}) reached`, 'error');
      return false;
    }
    set({ retryCount: retryCount + 1 });
    get().addLog(`Retry attempt ${retryCount + 1}/${maxRetries}`, 'warning');
    return true;
  },

  resetRetries: () => set({ retryCount: 0 }),

  setError: (error) => {
    set({ error });
    if (error) get().addLog(error, 'error');
  },

  setProcessing: (isProcessing) => set({ isProcessing }),

  reset: () => {
    set({
      ...initialState,
      logs: get().logs,
    });
  },

  getCurrentStep: () => {
    const { currentPlan } = get();
    const currentStepIndex = get().currentStepIndex;
    if (!currentPlan || currentStepIndex >= currentPlan.steps.length) return null;
    return currentPlan.steps[currentStepIndex];
  },

  getProgress: () => {
    const { currentPlan } = get();
    if (!currentPlan) return { current: 0, total: 0, percentage: 0 };
    
    const total = currentPlan.steps.length;
    const completed = currentPlan.steps.filter((s) => s.status === 'completed').length;
    
    return {
      current: completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },
}));
