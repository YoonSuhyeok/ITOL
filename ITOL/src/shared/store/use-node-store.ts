import { create } from 'zustand';

interface NodeStoreState {
  nodeResults: Record<string, any>;
  setNodeResult: (nodeId: string, result: any) => void;
  removeNodeResult: (nodeId: string) => void;
  clearNodeResults: () => void;
}

export const useNodeStore = create<NodeStoreState>((set) => ({
  nodeResults: {},
  setNodeResult: (nodeId, result) =>
    set((state) => ({
      nodeResults: { ...state.nodeResults, [nodeId]: result },
    })),
  removeNodeResult: (nodeId) =>
    set((state) => {
      const { [nodeId]: _, ...rest } = state.nodeResults;
      return { nodeResults: rest };
    }),
  clearNodeResults: () => set({ nodeResults: {} }),
}));