export interface Shell {
  exec(command: string, args: string[], options?: { timeout?: number }): Promise<{
    exit_code: number;
    stdout: string;
    stderr: string;
  }>;
}

export interface Storage {
  read(): Promise<Record<string, unknown>>;
  write(data: Record<string, unknown>): Promise<void>;
}

export interface PluginActions {
  showToast(message: string, type?: 'info' | 'success' | 'error'): void;
}

export interface PluginContextValue {
  project: { path: string; name: string };
  shell: Shell;
  storage: Storage;
  theme: { mode: 'light' | 'dark' };
  actions: PluginActions;
}
