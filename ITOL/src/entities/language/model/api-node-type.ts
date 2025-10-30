// API Node에서 사용할 데이터 타입 정의

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type BodyType = 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface ApiHeader extends KeyValuePair {}

export interface QueryParam extends KeyValuePair {}

export interface FormDataItem extends KeyValuePair {
  type: 'text' | 'file';
  file?: File;
}

export interface ApiAuth {
  type: 'none' | 'bearer' | 'basic' | 'api-key';
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiKeyHeader?: string;
}

export interface ApiResponse {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: any;
  error?: string;
  timestamp?: number;
  duration?: number; // ms
}

export interface ApiNodeData {
  // Request 정보
  url: string;
  method: HttpMethod;
  headers: ApiHeader[];
  queryParams: QueryParam[];
  
  // Body 정보
  bodyType: BodyType;
  jsonBody?: string;
  formData?: FormDataItem[];
  rawBody?: string;
  
  // Authentication
  auth: ApiAuth;
  
  // Response 정보
  response?: ApiResponse;
  
  // 메타 정보
  name: string;
  description?: string;
  
  // 노드 실행 상태
  isLoading?: boolean;
  lastExecuted?: number;
}

// API Node의 기본 데이터
export const createDefaultApiNodeData = (): ApiNodeData => ({
  url: '',
  method: 'GET',
  headers: [],
  queryParams: [],
  bodyType: 'none',
  auth: {
    type: 'none'
  },
  name: 'API Request',
  description: '',
  isLoading: false
});

// 헬퍼 함수들
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createNewKeyValuePair = (key = '', value = ''): KeyValuePair => ({
  id: generateId(),
  key,
  value,
  enabled: true
});
