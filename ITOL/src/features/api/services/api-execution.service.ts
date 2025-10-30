import type { ApiNodeData, ApiResponse, KeyValuePair } from '../../../entities/language/model/api-node-type';

/**
 * API 요청을 실행하는 서비스
 */
export class ApiExecutionService {
  /**
   * API 요청을 실행합니다
   */
  static async executeRequest(data: ApiNodeData): Promise<ApiResponse> {
    const startTime = Date.now();

    try {
      // URL 구성 (Query Params 포함)
      const url = this.buildUrl(data.url, data.queryParams);

      // Headers 구성
      const headers = this.buildHeaders(data);

      // Body 구성
      const body = this.buildBody(data);

      // Fetch 옵션 구성
      const fetchOptions: RequestInit = {
        method: data.method,
        headers,
      };

      if (body && data.method !== 'GET' && data.method !== 'HEAD') {
        fetchOptions.body = body;
      }

      // 요청 실행
      const response = await fetch(url, fetchOptions);
      const duration = Date.now() - startTime;

      // Response Headers 파싱
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Response Body 파싱
      let responseData: any;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch {
          responseData = await response.text();
        }
      } else {
        responseData = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        timestamp: Date.now(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now(),
        duration,
      };
    }
  }

  /**
   * URL에 Query Parameters를 추가합니다
   */
  private static buildUrl(baseUrl: string, queryParams: KeyValuePair[]): string {
    try {
      const url = new URL(baseUrl);
      
      // 활성화된 파라미터만 추가
      queryParams
        .filter(param => param.enabled && param.key)
        .forEach(param => {
          url.searchParams.append(param.key, param.value);
        });

      return url.toString();
    } catch (error) {
      // URL이 잘못된 경우 그대로 반환
      console.error('Invalid URL:', error);
      return baseUrl;
    }
  }

  /**
   * HTTP Headers를 구성합니다
   */
  private static buildHeaders(data: ApiNodeData): HeadersInit {
    const headers: HeadersInit = {};

    // 사용자 정의 헤더 추가
    data.headers
      .filter((header: KeyValuePair) => header.enabled && header.key)
      .forEach((header: KeyValuePair) => {
        headers[header.key] = header.value;
      });

    // Auth 헤더 추가
    if (data.auth.type === 'bearer' && data.auth.token) {
      headers['Authorization'] = `Bearer ${data.auth.token}`;
    } else if (data.auth.type === 'basic' && data.auth.username && data.auth.password) {
      const credentials = btoa(`${data.auth.username}:${data.auth.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (data.auth.type === 'api-key' && data.auth.apiKey && data.auth.apiKeyHeader) {
      headers[data.auth.apiKeyHeader] = data.auth.apiKey;
    }

    // Body Type에 따른 Content-Type 자동 설정 (사용자가 설정하지 않은 경우)
    if (!headers['Content-Type'] && !headers['content-type']) {
      if (data.bodyType === 'json') {
        headers['Content-Type'] = 'application/json';
      } else if (data.bodyType === 'x-www-form-urlencoded') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    return headers;
  }

  /**
   * Request Body를 구성합니다
   */
  private static buildBody(data: ApiNodeData): string | FormData | null {
    switch (data.bodyType) {
      case 'json':
        return data.jsonBody || null;

      case 'raw':
        return data.rawBody || null;

      case 'form-data': {
        if (!data.formData || data.formData.length === 0) {
          return null;
        }

        const formData = new FormData();
        data.formData
          .filter((item) => item.enabled && item.key)
          .forEach((item) => {
            if (item.type === 'file' && item.file) {
              formData.append(item.key, item.file);
            } else {
              formData.append(item.key, item.value);
            }
          });

        return formData;
      }

      case 'x-www-form-urlencoded': {
        if (!data.formData || data.formData.length === 0) {
          return null;
        }

        const params = new URLSearchParams();
        data.formData
          .filter((item) => item.enabled && item.key && item.type === 'text')
          .forEach((item) => {
            params.append(item.key, item.value);
          });

        return params.toString();
      }

      case 'none':
      default:
        return null;
    }
  }

  /**
   * 요청 정보를 cURL 명령어로 변환합니다
   */
  static toCurl(data: ApiNodeData): string {
    const url = this.buildUrl(data.url, data.queryParams);
    const parts: string[] = [`curl -X ${data.method}`];

    // Headers
    const headers = this.buildHeaders(data);
    Object.entries(headers).forEach(([key, value]) => {
      parts.push(`-H "${key}: ${value}"`);
    });

    // Body
    const body = this.buildBody(data);
    if (body && typeof body === 'string') {
      parts.push(`-d '${body}'`);
    }

    parts.push(`"${url}"`);

    return parts.join(' \\\n  ');
  }
}
