import type { DbNodeData } from "@/shared/components/settings-modal/types";
import { useNodeStore } from "@/shared/store/use-node-store";
import { useLogStore } from "@/shared/store/use-log-store";
import { invoke } from '@tauri-apps/api/core';

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
      if (!data.query || data.query.trim() === '') {
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
          query: data.query,
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
