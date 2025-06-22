import FileNodeData from "@/entities/language/model/file-type";
import { useNodeStore } from "@/shared/store/use-node-store";
import NodeType from "@/shared/types/node-type";
import { Edge, MarkerType, Node } from "@xyflow/react";

/**
 * DagService is a singleton service that manages the Directed Acyclic Graph (DAG) data.
 * It provides methods to retrieve and update DAG data.
 * This service is designed to be used across the application to ensure consistent access to DAG data.
 */
class DagService {
  private static instance: DagService;

  private graphAdjacencyList = new Map<string, string[]>();

  private indgreeMap = new Map<string, number>();
  private nextNodeQueue: string[] = [];

  private resultFlows: string[] = [];

  private graphNodeData: Node<FileNodeData>[] = [];
  private graphEdgeData: Edge[] = [

  ];

  private constructor() {
    // Initialize the service, possibly loading initial data or setting up listeners
    this.loadInitialData();
  }

  private loadInitialData() {
    this.graphNodeData = [
      	{
          type: "languageNode",
          id: "1",
          position: { x: 0, y: 0 },
          data: {
            filePath: "1",
            fileName: "example",
            fileExtension: "ts",
          },
        },
        {
          type: "languageNode",
          id: "2",
          position: { x: 500, y: 0 },
          data: {
            filePath: "1",
            fileName: "example2",
            fileExtension: "ts",
          },
        },
        {
          type: "languageNode",
          id: "3",
          position: { x: 500, y: 300 },
          data: {
            filePath: "1",
            fileName: "example2-2",
            fileExtension: "ts",
          },
        },
        {
          type: "languageNode",
          id: "4",
          position: { x: 1000, y: 0 },
          data: {
            filePath: "1",
            fileName: "example3",
            fileExtension: "ts",
          },
        }
    ];

    this.graphEdgeData = [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        type: "default",
        animated: true,
        label: "Edge from 1 to 2",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "e1-3",
        source: "1",
        target: "3",
        type: "default",
        animated: true,
        label: "Edge from 1 to 3",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "e2-4",
        source: "2",
        target: "4",
        type: "default",
        animated: true,
        label: "Edge from 2 to 4",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
    ];

    for (const edge of this.graphEdgeData) {
      console.log("Processing edge:", edge);
      if (!this.indgreeMap.has(edge.target)) {
        this.indgreeMap.set(edge.target, 0);
      }
      this.indgreeMap.set(edge.target, this.indgreeMap.get(edge.target)! + 1);
    }
    console.log("Indegree Map:", this.indgreeMap);
    for (const node of this.graphNodeData) {
      if (this.indgreeMap.get(node.id) === undefined) {
        this.nextNodeQueue.push(node.id);
      }
    }
    console.log("Initial Node Queue:", this.nextNodeQueue);
    
    while(this.nextNodeQueue.length > 0) {
      this.resultFlows.push(this.nextNodeQueue[0])
      const currentNodeId = this.nextNodeQueue.shift();
      // edge 조회
      const outgoingEdges = this.graphEdgeData.filter(edge => edge.source === currentNodeId);
      for (const edge of outgoingEdges) {
        if (!this.indgreeMap.has(edge.target)) {
          this.indgreeMap.set(edge.target, 0);
        }
        this.indgreeMap.set(edge.target, this.indgreeMap.get(edge.target)! + 1);
      }
      for (const node of this.graphNodeData) {
        if (this.indgreeMap.get(node.id) === undefined) {
          this.nextNodeQueue.push(node.id);
        }
      }
    }

  }

  public static getInstance(): DagService {
    if (!DagService.instance) {
      DagService.instance = new DagService();
    }
    return DagService.instance;
  }

  public getDagData(): any {
    // Logic to retrieve DAG data
    return {};
  }

  public getNodeData(): Node<FileNodeData>[] {
    // Logic to retrieve node data
    return this.graphNodeData;
  }

  public getEdgeData(): Edge[] {
    // Logic to retrieve edge data
    return this.graphEdgeData;
  }

  private isCyclic(edges: any): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();
  
    const hasCycle = (nodeId: string, edges: any): boolean => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        recStack.add(nodeId);
  
        // 현재 노드에서 나가는 모든 엣지의 target(다음 노드) 검사
        const nextNodeIds = edges
          .filter(edge => edge.source === nodeId)
          .map(edge => edge.target);
  
        for (const nextId of nextNodeIds) {
          if (!visited.has(nextId) && hasCycle(nextId, edges)) {
            return true;
          } else if (recStack.has(nextId)) {
            return true;
          }
        }
      }
      recStack.delete(nodeId);
      return false;
    };
  
    // 모든 노드에 대해 검사 (그래프가 연결되어 있지 않을 수도 있으므로)
    for (const node of this.graphNodeData) {
      if (hasCycle(node.id, edges)) {
        return true;
      }
    }
    return false;
  }

  public setEdgeData(edges: any): void {
    if(this.isCyclic(edges)) {
      throw Error("Cyclic dependency detected in the edges. Please check the graph structure.");
    } else {
      this.graphEdgeData = edges;
    }
  }

  public runNode(nodeId: string): void {
    // Logic to run a specific node in the DAG
    const node = this.graphNodeData.find((n) => n.id === nodeId);
    if (node) {
      useNodeStore.getState().setNodeResult(nodeId,
        { status: "running" }
      );
      console.log(
        `Running node with id: ${nodeId}, filePath: ${node.data.filePath}, fileName: ${node.data.fileName}, fileExtension: ${node.data.fileExtension}` 
      );
      setTimeout(() => {
        console.log(`Node ${nodeId} executed successfully.`);
        useNodeStore.getState().setNodeResult(nodeId, {
          status: "success",
          result: `Result of node ${nodeId}`,
        });
        const nextNodeIds = this.getNextNodeIds(nodeId);
        nextNodeIds.forEach(nextNodeId => {
          console.log(`Triggering next node with id: ${nextNodeId}`);
          DagServiceInstance.runNode(nextNodeId);
        });
      }, 1000); // Simulate async operation
    } else {
      console.error(`Node with id ${nodeId} not found.`);
    }
  
  }

  public getNextNodeIds(nodeId: string): string[] {
    // 위상 정렬을 통해 다음 노드 ID를 가져오는 메소드
    const nextNodeIds: string[] = [];
    const visited = new Set<string>();
    const dfs = (currentNodeId: string) => {
      if (!visited.has(currentNodeId)) {
        visited.add(currentNodeId);
        const edgesFromCurrent = this.graphEdgeData.filter(edge => edge.source === currentNodeId);
        edgesFromCurrent.forEach(edge => {
          nextNodeIds.push(edge.target);
          dfs(edge.target);
        });
      }
    };
    dfs(nodeId);
    console.log(`Next node IDs for node ${nodeId}: ${nextNodeIds.join(", ")}`);
    return nextNodeIds;
  }

  private initDagGraph() {
    // Initialize the DAG graph structure
    this.graphAdjacencyList.clear();
    this.graphNodeData.forEach(node => {
      this.graphAdjacencyList.set(node.id, []);
    });
    this.graphEdgeData.forEach(edge => {
      if (this.graphAdjacencyList.has(edge.source)) {
        this.graphAdjacencyList.get(edge.source)?.push(edge.target);
      }
    });
  }

  private topologicalSort() {
    // Perform topological sort on the DAG
    const sortedNodes: string[] = [];
    const visited = new Set<string>();

    const visitNode = (nodeId: string) => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        this.graphAdjacencyList.get(nodeId)?.forEach(visitNode);
        sortedNodes.push(nodeId);
      }
    };

    this.graphNodeData.forEach(node => visitNode(node.id));
    return sortedNodes.reverse(); // Reverse to get the correct order
  }
}

export const DagServiceInstance = DagService.getInstance();