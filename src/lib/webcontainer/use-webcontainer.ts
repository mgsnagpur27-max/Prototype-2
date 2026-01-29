"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FileSystemTree } from '@webcontainer/api';
import { webContainerManager, type ContainerStatus } from './manager';

interface UseWebContainerReturn {
  status: ContainerStatus;
  isBooting: boolean;
  isReady: boolean;
  error: string | null;
  previewUrl: string | null;
  boot: () => Promise<void>;
  mountFiles: (files: FileSystemTree) => Promise<void>;
  writeFile: (path: string, content: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  readDir: (path: string) => Promise<{ name: string; isDirectory: boolean }[]>;
  mkdir: (path: string) => Promise<void>;
  rm: (path: string) => Promise<void>;
  installDependencies: () => Promise<{ success: boolean; exitCode: number }>;
  startDevServer: () => Promise<void>;
  executeCommand: (command: string, args?: string[]) => Promise<number>;
  teardown: () => void;
}

export function useWebContainer(
  onOutput?: (output: string) => void
): UseWebContainerReturn {
  const [status, setStatus] = useState<ContainerStatus>(() => webContainerManager.getStatus());
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const devServerRef = useRef<{ kill: () => void } | null>(null);
  const onOutputRef = useRef(onOutput);
  
  useEffect(() => {
    onOutputRef.current = onOutput;
  }, [onOutput]);

  useEffect(() => {
    const listeners = {
      onStatusChange: setStatus,
      onServerReady: (_: number, url: string) => setPreviewUrl(url),
      onError: setError,
      onOutput: (output: string) => onOutputRef.current?.(output),
    };
    
    webContainerManager.setListeners(listeners);
  }, []);

  const boot = useCallback(async () => {
    setError(null);
    try {
      await webContainerManager.boot();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to boot');
    }
  }, []);

  const mountFiles = useCallback(async (files: FileSystemTree) => {
    await webContainerManager.mountFiles(files);
  }, []);

  const writeFile = useCallback(async (path: string, content: string) => {
    await webContainerManager.writeFile(path, content);
  }, []);

  const readFile = useCallback(async (path: string): Promise<string> => {
    return webContainerManager.readFile(path);
  }, []);

  const readDir = useCallback(async (path: string) => {
    return webContainerManager.readDir(path);
  }, []);

  const mkdir = useCallback(async (path: string) => {
    await webContainerManager.mkdir(path);
  }, []);

  const rm = useCallback(async (path: string) => {
    await webContainerManager.rm(path);
  }, []);

  const installDependencies = useCallback(async () => {
    return webContainerManager.installDependencies((output) => onOutputRef.current?.(output));
  }, []);

  const startDevServer = useCallback(async () => {
    const server = await webContainerManager.startDevServer((output) => onOutputRef.current?.(output));
    devServerRef.current = server;
  }, []);

  const executeCommand = useCallback(
    async (command: string, args: string[] = []) => {
      return webContainerManager.executeCommand(command, args, (output) => onOutputRef.current?.(output));
    },
    []
  );

  const teardown = useCallback(() => {
    devServerRef.current?.kill();
    webContainerManager.teardown();
    setPreviewUrl(null);
    setError(null);
  }, []);

  return {
    status,
    isBooting: status === 'booting',
    isReady: status === 'ready',
    error,
    previewUrl,
    boot,
    mountFiles,
    writeFile,
    readFile,
    readDir,
    mkdir,
    rm,
    installDependencies,
    startDevServer,
    executeCommand,
    teardown,
  };
}
