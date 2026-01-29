import { create } from 'zustand';
import { ChatMessage } from '@/types';

export type ChatMode = 'chat' | 'agent';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  chatMode: ChatMode;
  pendingMessage: string | null;
  pendingModel: string | null;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateLastMessage: (content: string) => void;
  appendToLastMessage: (chunk: string) => void;
  setLastMessageStreaming: (isStreaming: boolean) => void;
  clearMessages: () => void;
  setChatMode: (mode: ChatMode) => void;
  getRecentMessages: (count?: number) => ChatMessage[];
  exportConversation: () => string;
  setPendingMessage: (message: string | null, model?: string | null) => void;
  clearPendingMessage: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  chatMode: 'chat',
  pendingMessage: null,
  pendingModel: null,

  addMessage: (message) => {
    const id = crypto.randomUUID();
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id,
          timestamp: new Date(),
        },
      ],
    }));
    return id;
  },

  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
        };
      }
      return { messages };
    }),

  appendToLastMessage: (chunk) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content: messages[messages.length - 1].content + chunk,
        };
      }
      return { messages };
    }),

  setLastMessageStreaming: (isStreaming) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          isStreaming,
        };
      }
      return { messages, isStreaming };
    }),

  clearMessages: () => set({ messages: [] }),

  setChatMode: (mode) => set({ chatMode: mode }),

  getRecentMessages: (count = 10) => {
    const { messages } = get();
    return messages.slice(-count);
  },

  exportConversation: () => {
    const { messages } = get();
    return JSON.stringify(messages, null, 2);
  },

  setPendingMessage: (message, model = null) => set({ pendingMessage: message, pendingModel: model }),

  clearPendingMessage: () => set({ pendingMessage: null, pendingModel: null }),
}));
