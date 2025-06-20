import FileNodeData from "@/entities/language/model/file-type";
import { useNodeStore } from "@/shared/store/node-store";
import NodeType from "@/shared/types/node-type";
import { Edge, Node } from "@xyflow/react";

/**
 * DagService is a singleton service that manages the Directed Acyclic Graph (DAG) data.
 * It provides methods to retrieve and update DAG data.
 * This service is designed to be used across the application to ensure consistent access to DAG data.
 */
class DagService {
  private static instance: DagService;

  private graphAdjacencyList = new Map<string, string[]>();

  private graphNodeData: Node<FileNodeData>[] = [];
  private graphEdgeData: Edge[] = [

  ];

  private constructor() {
    // Initialize the service, possibly loading initial data or setting up listeners
    this.loadInitialData();
  }

  loadInitialData() {
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
          position: { x: 0, y: 200 },
          data: {
            filePath: "1",
            fileName: "example2",
            fileExtension: "ts",
          },
        }
    ]
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

  public addEdge(targetId: string, sourceId: string): void {
    console.log("Adding edge from", sourceId, "to", targetId);
    const newEdge: Edge = {
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      type: "default",
      animated: true,
      label: `Edge from ${sourceId} to ${targetId}`,
    };
    // 중복된 id가 있으면 추가하지 않음
    if (!this.graphEdgeData.some(edge => edge.id === newEdge.id)) {
      this.graphEdgeData.push(newEdge);
    }
  }

  public updateDagData(data: any): void {
    // Logic to update DAG data
  }
}

export const DagServiceInstance = DagService.getInstance();