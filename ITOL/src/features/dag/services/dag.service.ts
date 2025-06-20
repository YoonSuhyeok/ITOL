import FileNodeData from "@/entities/language/model/file-type";
import { useNodeStore } from "@/shared/store/node-store";
import NodeType from "@/shared/types/node-type";
import { Node } from "@xyflow/react";

/**
 * DagService is a singleton service that manages the Directed Acyclic Graph (DAG) data.
 * It provides methods to retrieve and update DAG data.
 * This service is designed to be used across the application to ensure consistent access to DAG data.
 */
class DagService {
  private static instance: DagService;

  private graphAdjacencyList = new Map<string, string[]>();

  private graphNodeData: Node<FileNodeData>[] = [];

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

  public updateDagData(data: any): void {
    // Logic to update DAG data
  }
}

export const DagServiceInstance = DagService.getInstance();