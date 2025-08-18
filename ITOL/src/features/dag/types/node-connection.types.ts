/**
 * 노드 간 연결과 값 전달을 위한 타입 정의
 */

export interface NodeConnection {
  sourceNodeId: string;
  targetNodeId: string;
  sourceField?: string; // 소스 노드의 특정 필드
  targetField: string;  // 타겟 노드의 파라미터 필드
}

export interface NodeOutput {
  nodeId: string;
  status: 'running' | 'success' | 'error' | 'pending';
  result?: any;
  executionTime?: number;
  timestamp?: number;
}

export interface NodeReference {
  nodeId: string;
  nodeName: string;
  field?: string; // 결과의 특정 필드를 참조 (예: "result.sum", "result.data[0].name")
  displayPath: string; // UI에 표시될 경로 (예: "Node1 → result.sum")
}

export interface ParameterWithReference {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  valueSource: 'manual' | 'linked' | 'reference';
  
  // 참조 관련 필드들
  referenceNodeId?: string;
  referencePath?: string; // JSON path 형태로 저장 (예: "result.sum", "result.data[0]")
  displayReference?: string; // UI에 표시될 참조 경로
}
