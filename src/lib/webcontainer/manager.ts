import type { WebContainer, FileSystemTree, WebContainerProcess } from '@webcontainer/api';

export type ContainerStatus = 'idle' | 'booting' | 'ready' | 'error' | 'installing' | 'starting';

export interface ProcessInfo {
  id: string;
  command: string;
  args: string[];
  process: WebContainerProcess;
  startedAt: Date;
}

export interface WebContainerEvents {
  onStatusChange?: (status: ContainerStatus) => void;
  onServerReady?: (port: number, url: string) => void;
  onError?: (error: string) => void;
  onOutput?: (output: string) => void;
  onPortChange?: (port: number, type: 'open' | 'close', url: string) => void;
}

class WebContainerManager {
  private static instance: WebContainerManager | null = null;
  private container: WebContainer | null = null;
  private bootPromise: Promise<WebContainer> | null = null;
  private status: ContainerStatus = 'idle';
  private processes: Map<string, ProcessInfo> = new Map();
  private listeners: WebContainerEvents = {};
  private retryCount = 0;
  private maxRetries = 3;

  private constructor() {}

  static getInstance(): WebContainerManager {
    if (!WebContainerManager.instance) {
      WebContainerManager.instance = new WebContainerManager();
    }
    return WebContainerManager.instance;
  }

  setListeners(listeners: WebContainerEvents) {
    this.listeners = { ...this.listeners, ...listeners };
  }

  getStatus(): ContainerStatus {
    return this.status;
  }

  private setStatus(status: ContainerStatus) {
    this.status = status;
    this.listeners.onStatusChange?.(status);
  }

  async getContainer(): Promise<WebContainer> {
    if (this.container) return this.container;
    if (this.bootPromise) return this.bootPromise;
    return this.boot();
  }

  async boot(): Promise<WebContainer> {
    if (this.container) return this.container;
    if (this.bootPromise) return this.bootPromise;

    this.setStatus('booting');

    this.bootPromise = (async () => {
      try {
        const { WebContainer } = await import('@webcontainer/api');
        const container = await WebContainer.boot({ coep: 'require-corp' });

        container.on('server-ready', (port, url) => {
          this.listeners.onServerReady?.(port, url);
        });

        container.on('error', ({ message }) => {
          this.listeners.onError?.(message);
        });

        container.on('port', (port, type, url) => {
          this.listeners.onPortChange?.(port, type, url);
        });

        this.container = container;
        this.setStatus('ready');
        this.retryCount = 0;
        return container;
      } catch (error) {
        this.bootPromise = null;

        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = Math.pow(2, this.retryCount) * 1000;
          this.listeners.onError?.(`Boot failed, retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
          return this.boot();
        }

        this.setStatus('error');
        const msg = error instanceof Error ? error.message : 'Failed to boot WebContainer';
        this.listeners.onError?.(msg);
        throw error;
      }
    })();

    return this.bootPromise;
  }

  async mountFiles(files: FileSystemTree): Promise<void> {
    const container = await this.getContainer();
    await container.mount(files);
  }

  async writeFile(path: string, content: string): Promise<void> {
    const container = await this.getContainer();
    await container.fs.writeFile(path, content);
  }

  async readFile(path: string): Promise<string> {
    const container = await this.getContainer();
    return container.fs.readFile(path, 'utf-8');
  }

  async readDir(path: string): Promise<{ name: string; isDirectory: boolean }[]> {
    const container = await this.getContainer();
    const entries = await container.fs.readdir(path, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }));
  }

  async mkdir(path: string): Promise<void> {
    const container = await this.getContainer();
    await container.fs.mkdir(path, { recursive: true });
  }

  async rm(path: string): Promise<void> {
    const container = await this.getContainer();
    await container.fs.rm(path, { recursive: true, force: true });
  }

  async spawn(
    command: string,
    args: string[] = [],
    options?: { cwd?: string; env?: Record<string, string>; terminal?: { cols: number; rows: number } }
  ): Promise<{
    process: WebContainerProcess;
    id: string;
    output: ReadableStream<string>;
    input: WritableStreamDefaultWriter<string>;
    exit: Promise<number>;
    kill: () => void;
    resize: (size: { cols: number; rows: number }) => void;
  }> {
    const container = await this.getContainer();
    const proc = await container.spawn(command, args, options);
    const id = crypto.randomUUID();

    const processInfo: ProcessInfo = {
      id,
      command,
      args,
      process: proc,
      startedAt: new Date(),
    };

    this.processes.set(id, processInfo);

    return {
      process: proc,
      id,
      output: proc.output,
      input: proc.input.getWriter(),
      exit: proc.exit.then((code) => {
        this.processes.delete(id);
        return code;
      }),
      kill: () => {
        proc.kill();
        this.processes.delete(id);
      },
      resize: (size) => proc.resize?.(size),
    };
  }

  async installDependencies(
    onProgress?: (output: string) => void
  ): Promise<{ success: boolean; exitCode: number }> {
    this.setStatus('installing');

    const { output, exit } = await this.spawn('npm', ['install']);

    output.pipeTo(
      new WritableStream({
        write: (chunk) => {
          onProgress?.(chunk);
          this.listeners.onOutput?.(chunk);
        },
      })
    );

    const exitCode = await exit;
    const success = exitCode === 0;

    if (success) {
      this.setStatus('ready');
    } else {
      this.setStatus('error');
      this.listeners.onError?.(`npm install failed with exit code ${exitCode}`);
    }

    return { success, exitCode };
  }

  async startDevServer(onOutput?: (output: string) => void): Promise<{
    kill: () => void;
    resize: (size: { cols: number; rows: number }) => void;
    input: WritableStreamDefaultWriter<string>;
  }> {
    this.setStatus('starting');

    const { output, input, kill, resize } = await this.spawn('npm', ['run', 'dev']);

    output.pipeTo(
      new WritableStream({
        write: (chunk) => {
          onOutput?.(chunk);
          this.listeners.onOutput?.(chunk);
        },
      })
    );

    this.setStatus('ready');

    return { kill, resize, input };
  }

  async executeCommand(
    command: string,
    args: string[] = [],
    onOutput?: (output: string) => void
  ): Promise<number> {
    const { output, exit } = await this.spawn(command, args);

    output.pipeTo(
      new WritableStream({
        write: (chunk) => {
          onOutput?.(chunk);
          this.listeners.onOutput?.(chunk);
        },
      })
    );

    return exit;
  }

  killAllProcesses() {
    this.processes.forEach((info) => {
      info.process.kill();
    });
    this.processes.clear();
  }

  teardown() {
    this.killAllProcesses();
    this.container?.teardown();
    this.container = null;
    this.bootPromise = null;
    this.setStatus('idle');
  }

  isReady(): boolean {
    return this.status === 'ready';
  }

  async readAllFiles(
    dir: string = '',
    files: Record<string, string> = {}
  ): Promise<Record<string, string>> {
    try {
      const container = await this.getContainer();
      const entries = await container.fs.readdir(dir || '/', { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = dir ? `${dir}/${entry.name}` : entry.name;

        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }

        if (entry.isDirectory()) {
          await this.readAllFiles(fullPath, files);
        } else {
          try {
            const content = await container.fs.readFile(
              dir ? `${dir}/${entry.name}` : entry.name,
              'utf-8'
            );
            files[fullPath] = content;
          } catch {
            // Skip binary or unreadable files
          }
        }
      }

      return files;
    } catch (error) {
      console.error('Failed to read files:', error);
      return files;
    }
  }
}

export const webContainerManager = WebContainerManager.getInstance();
