import { useNodeStore } from "@/shared/store/use-node-store";
import { NodeReference, ParameterWithReference } from "../types/node-connection.types";

/**
 * JSON path를 사용하여 객체에서 값을 추출하는 유틸리티
 */
export function extractValueFromPath(obj: any, path: string): any {
  if (!path || !obj) return obj;
  
  // path가 "result.sum" 형태인 경우
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    // 배열 인덱스 처리 (예: data[0])
    if (part.includes('[') && part.includes(']')) {
      const arrayMatch = part.match(/(.+)\[(\d+)\]/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        current = current[arrayName];
        if (Array.isArray(current)) {
          current = current[parseInt(index)];
        }
      }
    } else {
      current = current[part];
    }
    
    if (current === undefined || current === null) {
      return null;
    }
  }
  
  return current;
}

/**
 * 노드의 결과에서 특정 경로의 값을 가져오는 함수
 */
export function getNodeResultValue(nodeId: string, path?: string): any {
  const nodeResults = useNodeStore.getState().nodeResults;
  const nodeResult = nodeResults[nodeId];
  
  console.log(`[getNodeResultValue] Getting value from node ${nodeId}, path: ${path}`);
  console.log(`[getNodeResultValue] All node results:`, nodeResults);
  console.log(`[getNodeResultValue] Target node result:`, nodeResult);
  
  // 노드가 실행되지 않았거나 실패한 경우 null 반환 (대신 에러를 발생시키지 않음)
  if (!nodeResult) {
    console.warn(`[getNodeResultValue] Node ${nodeId} has not been executed yet`);
    return null;
  }
  
  if (nodeResult.status !== 'success') {
    console.warn(`[getNodeResultValue] Node ${nodeId} execution was not successful (status: ${nodeResult.status})`);
    return null;
  }
  
  if (!path) {
    console.log(`[getNodeResultValue] Returning full result:`, nodeResult.result);
    return nodeResult.result;
  }
  
  const extractedValue = extractValueFromPath(nodeResult, path);
  console.log(`[getNodeResultValue] Extracted value from path '${path}':`, extractedValue);
  return extractedValue;
}

/**
 * 파라미터의 참조를 실제 값으로 해석하는 함수
 */
export function resolveParameterValue(param: ParameterWithReference): any {
  console.log(`[resolveParameterValue] Resolving parameter:`, param);
  
  if (param.valueSource === 'reference' && param.referenceNodeId && param.referencePath) {
    console.log(`[resolveParameterValue] Getting reference value from ${param.referenceNodeId} at ${param.referencePath}`);
    const result = getNodeResultValue(param.referenceNodeId, param.referencePath);
    console.log(`[resolveParameterValue] Reference resolved to:`, result);
    return result;
  }
  
  console.log(`[resolveParameterValue] Using manual value:`, param.value);
  return param.value;
}

/**
 * 모든 파라미터의 참조를 해석하여 실행 가능한 형태로 변환
 */
export function resolveAllParameters(parameters: ParameterWithReference[]): Record<string, any> {
  const resolved: Record<string, any> = {};
  
  for (const param of parameters) {
    if (param.key) {
      resolved[param.key] = resolveParameterValue(param);
    }
  }
  
  return resolved;
}

/**
 * 사용 가능한 노드 참조 목록을 가져오는 함수
 */
export function getAvailableNodeReferences(
  currentNodeId: string, 
  graphNodes: any[], 
  graphEdges: any[]
): NodeReference[] {
  const nodeResults = useNodeStore.getState().nodeResults;
  const references: NodeReference[] = [];
  
  console.log(`[getAvailableNodeReferences] Current node: ${currentNodeId}`);
  console.log(`[getAvailableNodeReferences] Graph nodes:`, graphNodes);
  console.log(`[getAvailableNodeReferences] Graph edges:`, graphEdges);
  console.log(`[getAvailableNodeReferences] Node results:`, nodeResults);
  
  // 현재 노드로 들어오는 엣지들의 소스 노드들 찾기
  const incomingEdges = graphEdges.filter(edge => edge.target === currentNodeId);
  const sourceNodeIds = incomingEdges.map(edge => edge.source);
  
  console.log(`[getAvailableNodeReferences] Incoming edges:`, incomingEdges);
  console.log(`[getAvailableNodeReferences] Source node IDs:`, sourceNodeIds);
  
  // 만약 직접 연결된 노드가 없다면, 모든 성공한 노드를 이전 노드로 간주할지 확인
  if (sourceNodeIds.length === 0) {
    console.log(`[getAvailableNodeReferences] No direct connections found. Checking all successful nodes...`);
    const allSuccessfulNodes = Object.entries(nodeResults)
      .filter(([nodeId, result]) => nodeId !== currentNodeId && result.status === 'success')
      .map(([nodeId]) => nodeId);
    console.log(`[getAvailableNodeReferences] All successful nodes:`, allSuccessfulNodes);
  }
  
  for (const sourceNodeId of sourceNodeIds) {
    const sourceNode = graphNodes.find(node => node.id === sourceNodeId);
    const nodeResult = nodeResults[sourceNodeId];
    
    console.log(`[getAvailableNodeReferences] Processing source node ${sourceNodeId}:`, sourceNode);
    console.log(`[getAvailableNodeReferences] Node result for ${sourceNodeId}:`, nodeResult);
    
  for (const sourceNodeId of sourceNodeIds) {
    const sourceNode = graphNodes.find(node => node.id === sourceNodeId);
    const nodeResult = nodeResults[sourceNodeId];
    
    console.log(`[getAvailableNodeReferences] Processing source node ${sourceNodeId}:`, sourceNode);
    console.log(`[getAvailableNodeReferences] Node result for ${sourceNodeId}:`, nodeResult);
    
    // 연결된 노드는 실행 상태와 관계없이 무조건 참조 가능하도록 변경
    if (sourceNode) {
      // 전체 결과 참조 (실행되지 않은 경우 placeholder로 표시)
      const resultStatus = nodeResult?.status || 'not-executed';
      const displaySuffix = resultStatus === 'success' ? '' : ` (${resultStatus})`;
      
      references.push({
        nodeId: sourceNodeId,
        nodeName: sourceNode.data?.fileName || sourceNode.id,
        field: 'result',
        displayPath: `${sourceNode.data?.fileName || sourceNode.id} → result${displaySuffix}`
      });
      
      // 결과가 객체인 경우에만 각 필드에 대한 참조 추가 (성공한 경우만)
      if (nodeResult && nodeResult.status === 'success' && nodeResult.result && typeof nodeResult.result === 'object') {
        addObjectFieldReferences(
          references, 
          sourceNodeId, 
          sourceNode.data?.fileName || sourceNode.id,
          nodeResult.result, 
          'result'
        );
      }
    }
  }
  }
  
  return references;
}

/**
 * 객체의 필드들을 재귀적으로 탐색하여 참조 추가
 */
function addObjectFieldReferences(
  references: NodeReference[], 
  nodeId: string, 
  nodeName: string,
  obj: any, 
  path: string,
  depth: number = 0
): void {
  // 깊이 제한 (무한 재귀 방지)
  if (depth > 2) return;
  
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = `${path}.${key}`;
      const displayPath = `${nodeName} → ${fieldPath}`;
      
      references.push({
        nodeId,
        nodeName,
        field: fieldPath,
        displayPath
      });
      
      // 중첩 객체인 경우 재귀적으로 처리
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        addObjectFieldReferences(references, nodeId, nodeName, value, fieldPath, depth + 1);
      }
    }
  } else if (Array.isArray(obj) && obj.length > 0) {
    // 배열의 첫 번째 요소 구조 기반으로 참조 생성
    const firstItem = obj[0];
    if (firstItem && typeof firstItem === 'object') {
      for (const key of Object.keys(firstItem)) {
        const fieldPath = `${path}[0].${key}`;
        const displayPath = `${nodeName} → ${fieldPath}`;
        
        references.push({
          nodeId,
          nodeName,
          field: fieldPath,
          displayPath
        });
      }
    }
  }
}

/**
 * 사용 가능한 노드 참조 목록을 가져오는 함수 (확장된 버전)
 * 직접 연결된 노드가 없을 경우 모든 성공한 노드를 고려합니다.
 */
export function getAvailableNodeReferencesExtended(
  currentNodeId: string, 
  graphNodes: any[], 
  graphEdges: any[],
  includeAllSuccessful: boolean = true
): NodeReference[] {
  const nodeResults = useNodeStore.getState().nodeResults;
  const references: NodeReference[] = [];
  
  console.log(`[getAvailableNodeReferencesExtended] Current node: ${currentNodeId}`);
  console.log(`[getAvailableNodeReferencesExtended] Graph nodes:`, graphNodes.map(n => ({ id: n.id, fileName: n.data?.fileName })));
  console.log(`[getAvailableNodeReferencesExtended] Graph edges:`, graphEdges);
  console.log(`[getAvailableNodeReferencesExtended] Node results:`, nodeResults);
  
  // 1. 먼저 직접 연결된 노드들을 찾습니다
  const incomingEdges = graphEdges.filter(edge => edge.target === currentNodeId);
  let sourceNodeIds = incomingEdges.map(edge => edge.source);
  
  console.log(`[getAvailableNodeReferencesExtended] Direct source nodes:`, sourceNodeIds);
  
  // 2. 직접 연결된 노드가 없고 includeAllSuccessful이 true라면, 모든 노드를 포함 (실행 상태 무관)
  if (sourceNodeIds.length === 0 && includeAllSuccessful) {
    // 현재 노드를 제외한 모든 노드를 포함
    sourceNodeIds = graphNodes
      .filter(node => node.id !== currentNodeId)
      .map(node => node.id);
    console.log(`[getAvailableNodeReferencesExtended] Using all nodes (execution status ignored):`, sourceNodeIds);
  }
  
  // 3. 각 소스 노드에 대해 참조 생성
  for (const sourceNodeId of sourceNodeIds) {
    const sourceNode = graphNodes.find(node => node.id === sourceNodeId);
    const nodeResult = nodeResults[sourceNodeId];
    
    console.log(`[getAvailableNodeReferencesExtended] Processing source node ${sourceNodeId}:`, sourceNode);
    console.log(`[getAvailableNodeReferencesExtended] Node result for ${sourceNodeId}:`, nodeResult);
    
    // 연결된 노드는 실행 상태와 관계없이 무조건 참조 가능하도록 변경
    if (sourceNode) {
      // 전체 결과 참조 (실행되지 않은 경우 placeholder로 표시)
      const resultStatus = nodeResult?.status || 'not-executed';
      const displaySuffix = resultStatus === 'success' ? '' : ` (${resultStatus})`;
      
      references.push({
        nodeId: sourceNodeId,
        nodeName: sourceNode.data?.fileName || sourceNode.id,
        field: 'result',
        displayPath: `${sourceNode.data?.fileName || sourceNode.id} → result${displaySuffix}`
      });
      
      // 결과가 객체인 경우에만 각 필드에 대한 참조 추가 (성공한 경우만)
      if (nodeResult && nodeResult.status === 'success' && nodeResult.result && typeof nodeResult.result === 'object') {
        addObjectFieldReferences(
          references, 
          sourceNodeId, 
          sourceNode.data?.fileName || sourceNode.id,
          nodeResult.result, 
          'result'
        );
      }
    }
  }
  
  console.log(`[getAvailableNodeReferencesExtended] Final references:`, references);
  return references;
}
