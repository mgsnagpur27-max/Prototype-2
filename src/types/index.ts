export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
  language?: string;
}

export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  content: string;
  originalContent: string;
  language: string;
  isDirty: boolean;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface TerminalSession {
  id: string;
  output: string[];
  isRunning: boolean;
}

export interface PreviewState {
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ProjectState {
  files: FileNode[];
  openTabs: EditorTab[];
  activeTabId: string | null;
  selectedFilePath: string | null;
}

export interface AIResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface WebContainerState {
  isBooted: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface DiffChange {
  original: string;
  modified: string;
  filePath: string;
}

export interface DiffViewerState {
  isOpen: boolean;
  original: string;
  modified: string;
  filePath: string;
  language: string;
}

export type NextJsSpecialFile = 
  | 'page'
  | 'layout'
  | 'loading'
  | 'error'
  | 'not-found'
  | 'route'
  | 'template'
  | 'default'
  | 'middleware';

export interface FileTreeState {
  rootNodes: FileNode[];
  selectedPath: string | null;
  searchTerm: string;
  expandedPaths: Set<string>;
  isLoading: boolean;
}

export type AgentState = 
  | 'IDLE'
  | 'ANALYZING'
  | 'PLANNING'
  | 'EXECUTING'
  | 'TESTING'
  | 'COMPLETED'
  | 'FAILED';

export type AgentStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface AgentStep {
  id: string;
  title: string;
  description: string;
  status: AgentStepStatus;
  fileChanges?: AgentFileChange[];
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentFileChange {
  filePath: string;
  action: 'create' | 'modify' | 'delete';
  originalContent?: string;
  newContent?: string;
  diff?: string;
}

export interface AgentPlan {
  id: string;
  userRequest: string;
  summary: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: string;
  steps: AgentStep[];
  risks: string[];
  alternatives?: string[];
  createdAt: Date;
}

export interface AgentAnalysis {
  intent: string;
  affectedFiles: string[];
  dependencies: string[];
  complexity: 'simple' | 'medium' | 'complex';
  questions?: string[];
}

export interface AgentReport {
  success: boolean;
  filesModified: string[];
  filesCreated: string[];
  filesDeleted: string[];
  linesAdded: number;
  linesRemoved: number;
  summary: string;
  suggestions: string[];
  errors?: string[];
}

export interface AgentContext {
  fileStructure: FileNode[];
  openFiles: string[];
  cursorPosition?: CursorPosition;
  recentMessages: ChatMessage[];
  consoleErrors: string[];
}
