import { create } from 'zustand';
import type { FileNode } from '@/types';

interface FileTreeState {
  rootNodes: FileNode[];
  selectedPath: string | null;
  searchTerm: string;
  expandedPaths: Set<string>;
  isLoading: boolean;
  contextMenuPath: string | null;
  contextMenuPosition: { x: number; y: number } | null;
  renamingPath: string | null;
  newItemParent: string | null;
  newItemType: 'file' | 'folder' | null;
  
  setRootNodes: (nodes: FileNode[]) => void;
  setSelectedPath: (path: string | null) => void;
  setSearchTerm: (term: string) => void;
  toggleExpanded: (path: string) => void;
  setExpanded: (path: string, expanded: boolean) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setLoading: (loading: boolean) => void;
  openContextMenu: (path: string, position: { x: number; y: number }) => void;
  closeContextMenu: () => void;
  refreshTree: () => Promise<void>;
  
  startRename: (path: string) => void;
  cancelRename: () => void;
  startNewItem: (parentPath: string, type: 'file' | 'folder') => void;
  cancelNewItem: () => void;
  
  addNode: (parentPath: string, node: FileNode) => void;
  updateNode: (path: string, updates: Partial<FileNode>) => void;
  deleteNode: (path: string) => void;
  renameNode: (oldPath: string, newName: string) => void;
}

function collectAllPaths(nodes: FileNode[]): string[] {
  const paths: string[] = [];
  function traverse(node: FileNode) {
    if (node.type === 'directory') {
      paths.push(node.path);
      node.children?.forEach(traverse);
    }
  }
  nodes.forEach(traverse);
  return paths;
}

function findNodeByPath(nodes: FileNode[], path: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
}

function getParentPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.length > 0 ? '/' + parts.join('/') : '/';
}

function getLanguageFromFileName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', css: 'css', scss: 'scss', html: 'html', md: 'markdown',
    py: 'python', prisma: 'prisma', sql: 'sql',
  };
  return langMap[ext] ?? 'plaintext';
}

function updateNodesRecursively(
  nodes: FileNode[],
  path: string,
  updater: (node: FileNode) => FileNode | null
): FileNode[] {
  return nodes
    .map((node) => {
      if (node.path === path) {
        return updater(node);
      }
      if (node.children) {
        return { ...node, children: updateNodesRecursively(node.children, path, updater) };
      }
      return node;
    })
    .filter((n): n is FileNode => n !== null);
}

function addNodeToParent(nodes: FileNode[], parentPath: string, newNode: FileNode): FileNode[] {
  if (parentPath === '/' || parentPath === '') {
    return [...nodes, newNode];
  }
  return nodes.map((node) => {
    if (node.path === parentPath && node.type === 'directory') {
      return { ...node, children: [...(node.children ?? []), newNode] };
    }
    if (node.children) {
      return { ...node, children: addNodeToParent(node.children, parentPath, newNode) };
    }
    return node;
  });
}

function updatePathsRecursively(node: FileNode, oldBasePath: string, newBasePath: string): FileNode {
  const newPath = node.path.replace(oldBasePath, newBasePath);
  const updatedNode: FileNode = { ...node, path: newPath };
  if (node.children) {
    updatedNode.children = node.children.map((child) =>
      updatePathsRecursively(child, oldBasePath, newBasePath)
    );
  }
  return updatedNode;
}

export const useFileTreeStore = create<FileTreeState>((set, get) => ({
  rootNodes: [],
  selectedPath: null,
  searchTerm: '',
  expandedPaths: new Set(['/src', '/src/app']),
  isLoading: false,
  contextMenuPath: null,
  contextMenuPosition: null,
  renamingPath: null,
  newItemParent: null,
  newItemType: null,

  setRootNodes: (nodes) => set({ rootNodes: nodes }),

  setSelectedPath: (path) => set({ selectedPath: path }),

  setSearchTerm: (term) => set({ searchTerm: term }),

  toggleExpanded: (path) => {
    set((state) => {
      const newExpanded = new Set(state.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedPaths: newExpanded };
    });
  },

  setExpanded: (path, expanded) => {
    set((state) => {
      const newExpanded = new Set(state.expandedPaths);
      if (expanded) {
        newExpanded.add(path);
      } else {
        newExpanded.delete(path);
      }
      return { expandedPaths: newExpanded };
    });
  },

  expandAll: () => {
    const { rootNodes } = get();
    const allPaths = collectAllPaths(rootNodes);
    set({ expandedPaths: new Set(allPaths) });
  },

  collapseAll: () => {
    set({ expandedPaths: new Set() });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  openContextMenu: (path, position) => {
    set({ contextMenuPath: path, contextMenuPosition: position });
  },

  closeContextMenu: () => {
    set({ contextMenuPath: null, contextMenuPosition: null });
  },

  refreshTree: async () => {
    const { expandedPaths } = get();
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ isLoading: false, expandedPaths });
  },

  startRename: (path) => {
    set({ renamingPath: path });
  },

  cancelRename: () => {
    set({ renamingPath: null });
  },

  startNewItem: (parentPath, type) => {
    const { setExpanded } = get();
    setExpanded(parentPath, true);
    set({ newItemParent: parentPath, newItemType: type });
  },

  cancelNewItem: () => {
    set({ newItemParent: null, newItemType: null });
  },

  addNode: (parentPath, node) => {
    set((state) => ({
      rootNodes: addNodeToParent(state.rootNodes, parentPath, node),
      newItemParent: null,
      newItemType: null,
    }));
  },

  updateNode: (path, updates) => {
    set((state) => ({
      rootNodes: updateNodesRecursively(state.rootNodes, path, (node) => ({
        ...node,
        ...updates,
      })),
    }));
  },

  deleteNode: (path) => {
    set((state) => ({
      rootNodes: updateNodesRecursively(state.rootNodes, path, () => null),
      selectedPath: state.selectedPath === path ? null : state.selectedPath,
    }));
  },

  renameNode: (oldPath, newName) => {
    const { rootNodes, expandedPaths } = get();
    const node = findNodeByPath(rootNodes, oldPath);
    if (!node) return;

    const parentPath = getParentPath(oldPath);
    const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;

    set((state) => {
      const newExpandedPaths = new Set(state.expandedPaths);
      if (newExpandedPaths.has(oldPath)) {
        newExpandedPaths.delete(oldPath);
        newExpandedPaths.add(newPath);
      }

      return {
        rootNodes: updateNodesRecursively(state.rootNodes, oldPath, (n) => {
          const updated = updatePathsRecursively(n, oldPath, newPath);
          return {
            ...updated,
            name: newName,
            path: newPath,
            language: n.type === 'file' ? getLanguageFromFileName(newName) : undefined,
          };
        }),
        renamingPath: null,
        selectedPath: state.selectedPath === oldPath ? newPath : state.selectedPath,
        expandedPaths: newExpandedPaths,
      };
    });
  },
}));
