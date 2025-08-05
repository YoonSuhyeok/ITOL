import { create } from 'zustand';

interface NodeStoreState {
  nodeResults: Record<string, any>;
  setNodeResult: (nodeId: string, result: any) => void;
  clearNodeResults: () => void;
}

export const useNodeStore = create<NodeStoreState>((set) => ({
  nodeResults: {},
  setNodeResult: (nodeId, result) =>
    set((state) => ({
      nodeResults: { ...state.nodeResults, [nodeId]: result },
    })),
  clearNodeResults: () => set({ nodeResults: {} }),
}));