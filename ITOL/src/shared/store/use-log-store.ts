import { create } from 'zustand';

export interface LogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeName: string;
  type: 'stdout' | 'stderr' | 'info' | 'error' | 'success' | 'warning';
  message: string;
  runId?: string;
}

interface LogStore {
  logs: LogEntry[];
  isOpen: boolean;
  height: number;
  
  // Actions
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  clearNodeLogs: (nodeId: string) => void;
  setIsOpen: (isOpen: boolean) => void;
  setHeight: (height: number) => void;
  
  // Helpers
  getNodeLogs: (nodeId: string) => LogEntry[];
  getRunLogs: (runId: string) => LogEntry[];
}

export const useLogStore = create<LogStore>((set, get) => ({
  logs: [],
  isOpen: true,
  height: 250,
  
  addLog: (log) => {
    const newLog: LogEntry = {
      ...log,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    };
    
    set((state) => ({
      logs: [...state.logs, newLog]
    }));
  },
  
  clearLogs: () => set({ logs: [] }),
  
  clearNodeLogs: (nodeId) => set((state) => ({
    logs: state.logs.filter(log => log.nodeId !== nodeId)
  })),
  
  setIsOpen: (isOpen) => set({ isOpen }),
  
  setHeight: (height) => set({ height: Math.max(100, Math.min(height, 600)) }),
  
  getNodeLogs: (nodeId) => {
    return get().logs.filter(log => log.nodeId === nodeId);
  },
  
  getRunLogs: (runId) => {
    return get().logs.filter(log => log.runId === runId);
  }
}));
