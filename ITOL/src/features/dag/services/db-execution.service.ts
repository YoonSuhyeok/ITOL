import type { DbNodeData } from "@/shared/components/settings-modal/types";
import { useNodeStore } from "@/shared/store/use-node-store";
import { useLogStore } from "@/shared/store/use-log-store";
import { invoke } from '@tauri-apps/api/core';
import { extractValueFromPath } from '../utils/node-reference.utils';

/**
 * {{nodeId.field}} 형식의 참조를 실제 값으로 치환합니다.
 */
function resolveReferences(value: string): string {
  if (!value) return value;
  
  const referencePattern = /\{\{([^}]+)\}\}/g;
  const nodeResults = useNodeStore.getState().nodeResults;
  
  return value.replace(referencePattern, (match, reference) => {
    const parts = reference.split('.');
    if (parts.length < 2) return match;
    
    const nodeId = parts[0];
    const path = parts.slice(1).join('.');
    
    const nodeResult = nodeResults[nodeId];
    if (!nodeResult || nodeResult.status !== 'success') {
      console.warn(`[resolveReferences] Node ${nodeId} has not been executed successfully`);
      return match;
    }
    
    const extractedValue = extractValueFromPath(nodeResult, path);
    if (extractedValue === null || extractedValue === undefined) {
      console.warn(`[resolveReferences] Could not extract value from path: ${path}`);
      return match;
    }
    
    // 객체나 배열인 경우 JSON 문자열로 변환
    if (typeof extractedValue === 'object') {
      return JSON.stringify(extractedValue);
    }
    
    return String(extractedValue);
  });
}

/**
 * DB 노드를 실행하는 서비스
 */
export class DbExecutionService {
  
  /**
   * DB 노드를 실행합니다.
   * @param nodeId 노드 ID
   * @param data DB 노드 데이터
   * @returns 실행 결과
   */
  static async executeDbNode(nodeId: string, data: DbNodeData): Promise<any> {
    const startTime = Date.now();
    
    // Set running state
    useNodeStore.getState().setNodeResult(nodeId, {
      nodeId: nodeId,
      nodeName: data.name,
      status: 'running',
      data: null,
      error: null,
    });

    useLogStore.getState().addLog({
      nodeId: nodeId,
      nodeName: data.name,
      type: 'info',
      message: `🗄️ Starting database query: ${data.connection.type}`,
    });

    try {
      // Resolve references in query
      const resolvedQuery = resolveReferences(data.query);
      
      if (!resolvedQuery || resolvedQuery.trim() === '') {
        throw new Error('Query is empty');
      }

      useLogStore.getState().addLog({
        nodeId: nodeId,
        nodeName: data.name,
        type: 'info',
        message: `📤 Executing query on ${data.connection.type}`,
      });

      // Rust 커맨드를 통해 DB 쿼리 실행
      const runId = `run_${Date.now()}`;
      const responseText = await invoke<string>('execute_db_command', {
        params: {
          connection: data.connection,
          query: resolvedQuery,
          timeout: data.timeout ? Math.floor(data.timeout / 1000) : 30,
          max_rows: data.maxRows || 1000,
          project_id: null,
          page_id: 1,
          run_id: runId
        }
      });

      const executionTime = Date.now() - startTime;

      // Parse response from Rust
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Failed to parse query result: ${e}`);
      }

      // 결과 데이터 처리
      let processedData = result.data;

      // 컬럼 필터링
      if (!data.selectAllColumns && data.columnSelection.length > 0) {
        const enabledColumns = data.columnSelection
          .filter(col => col.enabled)
          .map(col => ({ name: col.columnName, alias: col.alias }));

        if (enabledColumns.length > 0) {
          processedData = processedData.map((row: any) => {
            const filteredRow: any = {};
            enabledColumns.forEach(col => {
              if (row.hasOwnProperty(col.name)) {
                const key = col.alias || col.name;
                filteredRow[key] = row[col.name];
              }
            });
            return filteredRow;
          });
        }
      }

      // 후처리 스크립트 실행
      if (data.postProcessScript?.code) {
        try {
          useLogStore.getState().addLog({
            nodeId: nodeId,
            nodeName: data.name,
            type: 'info',
            message: '🔧 Running post-process script...',
          });

          // 스크립트 실행 (주의: eval 사용, 실제 환경에서는 샌드박스 필요)
          const processFunction = new Function('results', `
            ${data.postProcessScript.code}
            return typeof process === 'function' ? process(results) : results;
          `);
          
          processedData = processFunction(processedData);

          useLogStore.getState().addLog({
            nodeId: nodeId,
            nodeName: data.name,
            type: 'success',
            message: '✅ Post-processing completed',
          });
        } catch (scriptError: any) {
          useLogStore.getState().addLog({
            nodeId: nodeId,
            nodeName: data.name,
            type: 'error',
            message: `❌ Post-process script error: ${scriptError.message}`,
          });
          // 스크립트 에러는 경고로 처리하고 계속 진행
        }
      }

      const finalResult = {
        success: true,
        rowCount: processedData.length,
        data: processedData,
        truncated: result.truncated || false,
      };

      useLogStore.getState().addLog({
        nodeId: nodeId,
        nodeName: data.name,
        type: 'success',
        message: `✅ Query completed: ${finalResult.rowCount} rows (${executionTime}ms)`,
      });

      // Set success result
      const nodeResult = {
        nodeId: nodeId,
        nodeName: data.name,
        status: 'success',
        data: finalResult,
        error: null,
        executionTime,
        stdout: JSON.stringify(finalResult, null, 2),
      };

      useNodeStore.getState().setNodeResult(nodeId, nodeResult);
      
      return finalResult;

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      useLogStore.getState().addLog({
        nodeId: nodeId,
        nodeName: data.name,
        type: 'error',
        message: `❌ Query failed: ${error.message || error}`,
      });

      const errorResult = {
        nodeId: nodeId,
        nodeName: data.name,
        status: 'error',
        data: null,
        error: error.message || error.toString() || 'Unknown error occurred',
        executionTime,
        stderr: error.stack || error.message || error.toString(),
      };

      useNodeStore.getState().setNodeResult(nodeId, errorResult);
      
      throw error;
    }
  }
}
