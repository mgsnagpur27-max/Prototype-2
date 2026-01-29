import { SUPPORTED_LANGUAGES, FILE_ICONS } from '@/config/constants';
import type { FileNode } from '@/types';

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()! : '';
}

export function getLanguageFromFilename(filename: string): string {
  const ext = getFileExtension(filename);
  return SUPPORTED_LANGUAGES[ext] ?? 'plaintext';
}

export function getFileIcon(filename: string, isDirectory: boolean): string {
  if (isDirectory) return FILE_ICONS.folder;
  const ext = getFileExtension(filename);
  return FILE_ICONS[ext] ?? FILE_ICONS.default;
}

export function sortFileNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export function findFileByPath(
  nodes: FileNode[],
  path: string
): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findFileByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
}

export function generateId(): string {
  return crypto.randomUUID();
}
