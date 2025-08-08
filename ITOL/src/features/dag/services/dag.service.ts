import FileNodeData from "@/entities/language/model/file-type";
import { useNodeStore } from "@/shared/store/use-node-store";
import Parameter from "@/shared/types/node-parameter-type";
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

  private resultFlows: {
    id: string;
    indgree: number;
  }[] = [];

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
            requestProperties: [
              {
                nodeName: undefined,
                key: "property1",
                type: "string",
                value: null,
                description: "This is a string property",
              },
              {
                nodeName: undefined,
                key: "property2",
                type: "number",
                value: null,
                description: "This is a number property", 
              },
            ],
          },
        }
    ];

    this.graphEdgeData = [
    ];


    this.initDagGraph();
    console.log("Graph Adjacency List:", this.graphAdjacencyList);
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

  public addNode(nodeData: Node<FileNodeData>): void {
    this.graphNodeData.push(nodeData);
    this.graphAdjacencyList.set(nodeData.id, []);
    console.log(`Node added: ${nodeData.id}`, nodeData);
  }

  public createFileNode(filePath: string, fileName: string, fileExtension: string): string {
    const nodeId = `node-${Date.now()}`;
    const newNode: Node<FileNodeData> = {
      id: nodeId,
      type: 'languageNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 }, // 랜덤 위치
      data: {
        fileName: fileName.split('.')[0], // 확장자 제거
        fileExtension: fileExtension as any,
        filePath: filePath,
        requestProperties: []
      }
    };
    
    this.addNode(newNode);
    return nodeId;
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

    return this.topologicalSort(nodeId);
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

  /**
   * Initializes the topological sort by calculating the indegree of each node.
   */
  public initTopologicalSort() {
    // 1. 모든 노드의 indegree를 0으로 초기화
    this.indgreeMap.clear();
    for (const node of this.graphNodeData) {
      this.indgreeMap.set(node.id, 0);
    }
    // 2. 모든 엣지의 target indegree +1
    for (const edge of this.graphEdgeData) {
      console.log("Processing edge:", edge, "Current Indegree Map:", this.indgreeMap);
      this.indgreeMap.set(edge.target, this.indgreeMap.get(edge.target)! + 1);
    }
  }

  private topologicalSort(startNodeId: string): string[] {
    const childeNodes = this.graphAdjacencyList.get(startNodeId) || [];
    const nextNodeQueue: string[] = [];
    for( const childNodeId of childeNodes) {
      // 현재 노드의 자식 노드의 indegree를 -1
      this.indgreeMap.set(childNodeId, this.indgreeMap.get(childNodeId)! - 1);
      // 자식 노드의 indegree가 0이면 다음 노드 큐에 추가
      if (this.indgreeMap.get(childNodeId) === 0) {
        nextNodeQueue.push(childNodeId);
      }
    }
    return nextNodeQueue;
  }

  public getFrontNodeParameters(targetNodeId: string) {
    const frontNodes = this.graphEdgeData
      .filter(edge => edge.target === targetNodeId)
      .map(edge => edge.source);
    
    const parameters = [];
    for(const frontNode of frontNodes) {
      const node = this.graphNodeData.find(n => n.id === frontNode);
      if (node) {
        node.data.requestProperties.forEach(param => {
          parameters.push({
            ...param,
            nodeName: node.data.fileName,
          });
        });
      }
    }

    console.log("Front Node Parameters:", parameters);
    return parameters;
  }

  public getNodeParameters(nodeId: string): Parameter[] {
    const node = this.graphNodeData.find(n => n.id === nodeId);
    if (!node) {
      console.error(`Node with id ${nodeId} not found.`);
      return [];
    }
    const parameters: Parameter[] = [];
    node.data.requestProperties.forEach((param, index) => {
          parameters.push({
            id: `${nodeId}-param-${index}`,
            enabled: true,
            key: param.key,
            value: param.value?.toString() || null,
            checked: false,
            type: param.type,
            valueSource: "linked",
            sourcePath: "",
            sourceNodeLabel: "",
            sourceNodeId: ""
          });
        });
    return parameters;
  }

}

export const DagServiceInstance = DagService.getInstance(); 