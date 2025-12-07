import type { ApiNodeData } from "@/shared/components/settings-modal/types";
import { useNodeStore } from "@/shared/store/use-node-store";
import { useLogStore } from "@/shared/store/use-log-store";
import { invoke } from '@tauri-apps/api/core';

/**
 * API 노드를 실행하는 서비스
 */
export class ApiExecutionService {
  
  /**
   * API 노드를 실행합니다.
   * @param nodeId 노드 ID
   * @param data API 노드 데이터
   * @returns 실행 결과
   */
  static async executeApiNode(nodeId: string, data: ApiNodeData): Promise<any> {
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
      message: `🚀 Starting API request: ${data.method} ${data.url}`,
    });

    try {
      // Build URL with query parameters
      const url = new URL(data.url);
      const queryParams: Record<string, string> = {};
      data.queryParams
        .filter(param => param.enabled)
        .forEach(param => {
          queryParams[param.key] = param.value;
          url.searchParams.append(param.key, param.value);
        });

      // Build headers
      const headers: Record<string, string> = {};
      data.headers
        .filter(header => header.enabled)
        .forEach(header => {
          headers[header.key] = header.value;
        });

      // Build authentication
      const auth: Record<string, string> = { type: data.auth.type };
      if (data.auth.type === 'bearer' && data.auth.token) {
        auth.token = data.auth.token;
      } else if (data.auth.type === 'basic' && data.auth.username && data.auth.password) {
        auth.username = data.auth.username;
        auth.password = data.auth.password;
      } else if (data.auth.type === 'api-key' && data.auth.apiKey && data.auth.apiKeyHeader) {
        headers[data.auth.apiKeyHeader] = data.auth.apiKey;
      }

      // Build request body
      let body: string | undefined;
      if (data.body.type === 'json' && data.body.raw) {
        headers['Content-Type'] = 'application/json';
        body = data.body.raw;
      } else if (data.body.type === 'raw' && data.body.raw) {
        body = data.body.raw;
      } else if (data.body.type === 'x-www-form-urlencoded' && data.body.urlEncoded) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        const params = new URLSearchParams();
        data.body.urlEncoded
          .filter(item => item.enabled)
          .forEach(item => params.append(item.key, item.value));
        body = params.toString();
      } else if (data.body.type === 'form-data' && data.body.formData) {
        // Form-data는 문자열로 직렬화
        const formParts = data.body.formData
          .filter(item => item.enabled)
          .map(item => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`)
          .join('&');
        body = formParts;
        headers['Content-Type'] = 'multipart/form-data';
      }

      useLogStore.getState().addLog({
        nodeId: nodeId,
        nodeName: data.name,
        type: 'info',
        message: `📤 Sending ${data.method} request to ${url.toString()}`,
      });

      // Execute pre-request script if exists
      if (data.preRequestScript) {
        try {
          useLogStore.getState().addLog({
            nodeId: nodeId,
            nodeName: data.name,
            type: 'info',
            message: '📝 Executing pre-request script...',
          });
          // Note: In a real implementation, you'd execute this in a safe sandbox
          eval(data.preRequestScript);
        } catch (scriptError: any) {
          useLogStore.getState().addLog({
            nodeId: nodeId,
            nodeName: data.name,
            type: 'error',
            message: `❌ Pre-request script error: ${scriptError.message}`,
          });
        }
      }

      // Rust 커맨드를 통해 API 호출 실행
      const runId = `run_${Date.now()}`;
      const responseText = await invoke<string>('execute_api_command', {
        params: {
          method: data.method,
          base_url: url.toString(),
          query: Object.keys(queryParams).length > 0 ? JSON.stringify(queryParams) : undefined,
          headers: Object.keys(headers).length > 0 ? JSON.stringify(headers) : undefined,
          body: body,
          auth: auth.type !== 'none' ? JSON.stringify(auth) : undefined,
          timeout: data.timeout ? Math.floor(data.timeout / 1000) : 30,
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
        // If not JSON, treat as text response
        result = {
          status: 200,
          statusText: 'OK',
          headers: {},
          data: responseText
        };
      }

      const isSuccess = result.status >= 200 && result.status < 300;

      useLogStore.getState().addLog({
        nodeId: nodeId,
        nodeName: data.name,
        type: isSuccess ? 'success' : 'error',
        message: `${isSuccess ? '✅' : '❌'} Response: ${result.status} ${result.statusText} (${executionTime}ms)`,
      });

      // Execute test script if exists
      if (data.testScript) {
        try {
          useLogStore.getState().addLog({
            nodeId: nodeId,
            nodeName: data.name,
            type: 'info',
            message: '🧪 Running test script...',
          });
          // Note: In a real implementation, provide a test context
          // const pm = { response: { status: result.status, data: result.data } };
          // eval(data.testScript);
        } catch (scriptError: any) {
          useLogStore.getState().addLog({
            nodeId: nodeId,
            nodeName: data.name,
            type: 'error',
            message: `❌ Test script error: ${scriptError.message}`,
          });
        }
      }

      // Set success result
      const finalResult = {
        nodeId: nodeId,
        nodeName: data.name,
        status: isSuccess ? 'success' : 'error',
        data: result,
        error: isSuccess ? null : `HTTP ${result.status}: ${result.statusText}`,
        executionTime,
        stdout: JSON.stringify(result, null, 2),
      };

      useNodeStore.getState().setNodeResult(nodeId, finalResult);
      
      return result;

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      useLogStore.getState().addLog({
        nodeId: nodeId,
        nodeName: data.name,
        type: 'error',
        message: `❌ Request failed: ${error.message || error}`,
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
