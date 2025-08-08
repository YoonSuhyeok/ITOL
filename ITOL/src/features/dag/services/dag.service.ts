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
      // 엣지 데이터가 변경될 때마다 그래프 구조를 재구성
      this.initDagGraph();
      console.log("Graph updated. New Adjacency List:", this.graphAdjacencyList);
    }
  }

  public addNode(nodeData: Node<FileNodeData>): void {
    this.graphNodeData.push(nodeData);
    this.graphAdjacencyList.set(nodeData.id, []);
    console.log(`Node added: ${nodeData.id}`, nodeData);
    // 노드 추가 후 그래프 구조 재구성
    this.initDagGraph();
  }

  public removeNode(nodeId: string): void {
    // 노드 데이터에서 제거
    this.graphNodeData = this.graphNodeData.filter(node => node.id !== nodeId);
    
    // 인접 리스트에서 제거
    this.graphAdjacencyList.delete(nodeId);
    
    // 다른 노드들의 인접 리스트에서도 제거
    for (const [key, neighbors] of this.graphAdjacencyList.entries()) {
      this.graphAdjacencyList.set(key, neighbors.filter(neighbor => neighbor !== nodeId));
    }
    
    // 해당 노드와 관련된 엣지들 제거
    this.graphEdgeData = this.graphEdgeData.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );
    
    console.log(`Node removed: ${nodeId}`);
    // 그래프 구조 재구성
    this.initDagGraph();
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
      
      // 실제 노드 실행 로직 시뮬레이션
      setTimeout(() => {
        console.log(`Node ${nodeId} executed successfully.`);
        useNodeStore.getState().setNodeResult(nodeId, {
          status: "success",
          result: `Result of node ${nodeId}`,
        });
        
        // 현재 노드 실행 완료 후 다음 노드들을 실행
        const nextNodeIds = this.getNextNodeIds(nodeId);
        console.log(`Next nodes to execute: ${nextNodeIds}`);
        
        nextNodeIds.forEach(nextNodeId => {
          console.log(`Triggering next node with id: ${nextNodeId}`);
          // 재귀적으로 다음 노드 실행
          DagServiceInstance.runNode(nextNodeId);
        });
      }, 1000); // Simulate async operation
    } else {
      console.error(`Node with id ${nodeId} not found.`);
      useNodeStore.getState().setNodeResult(nodeId, {
        status: "error",
        result: `Node ${nodeId} not found`,
      });
    }
  }

  public getNextNodeIds(nodeId: string): string[] {
    // 현재 노드에서 직접 연결된 다음 노드들을 반환
    const directlyConnectedNodes = this.graphAdjacencyList.get(nodeId) || [];
    console.log(`Direct connections from ${nodeId}:`, directlyConnectedNodes);
    
    // 다음 노드들 중에서 실행 가능한 노드들만 필터링
    const executableNodes: string[] = [];
    
    for (const nextNodeId of directlyConnectedNodes) {
      // 해당 노드로 들어오는 모든 엣지의 source 노드들이 실행 완료되었는지 확인
      const incomingEdges = this.graphEdgeData.filter(edge => edge.target === nextNodeId);
      const allSourcesCompleted = incomingEdges.every(edge => {
        const sourceResult = useNodeStore.getState().nodeResults[edge.source];
        return sourceResult && sourceResult.status === "success";
      });
      
      if (allSourcesCompleted) {
        executableNodes.push(nextNodeId);
      } else {
        console.log(`Node ${nextNodeId} is not ready for execution. Waiting for dependencies.`);
      }
    }
    
    return executableNodes;
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
   * 그래프 실행을 시작합니다. 모든 노드의 결과를 초기화하고 루트 노드부터 실행을 시작합니다.
   */
  public startExecution(startNodeId: string): void {
    console.log(`Starting execution from node: ${startNodeId}`);
    
    // 모든 노드 결과 초기화
    useNodeStore.getState().clearNodeResults();
    
    // 그래프 구조 재구성
    this.initDagGraph();
    
    // 시작 노드 실행
    this.runNode(startNodeId);
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
    console.log("Topological sort initialized. Indegree map:", this.indgreeMap);
  }

  public getFrontNodeParameters(targetNodeId: string) {
    const frontNodes = this.graphEdgeData
      .filter(edge => edge.target === targetNodeId)
      .map(edge => edge.source);
    
    const parameters: any[] = [];
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