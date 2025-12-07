import type { NodeType, ApiNodeData, DbNodeData, Project } from './types';
import { getFileExtension, getFileNameWithoutExtension } from './file-system';

/**
 * 노드 생성 관련 로직
 */

/**
 * 파일 노드 생성 데이터 검증
 */
export function validateFileNodeData(
  fileName: string,
  selectedProject: Project | undefined
): string[] {
  const errors: string[] = [];
  
  if (!fileName.trim()) {
    errors.push('파일 이름을 입력해야 합니다.');
  }
  
  if (!selectedProject) {
    errors.push('프로젝트를 선택해야 합니다.');
  }
  
  return errors;
}

/**
 * API 노드 생성 데이터 검증
 */
export function validateApiNodeData(apiData: ApiNodeData): string[] {
  const errors: string[] = [];
  
  if (!apiData.url.trim()) {
    errors.push('API URL을 입력해야 합니다.');
  } else {
    try {
      new URL(apiData.url);
    } catch {
      errors.push('유효하지 않은 URL 형식입니다.');
    }
  }
  
  if (!apiData.method) {
    errors.push('HTTP 메서드를 선택해야 합니다.');
  }
  
  return errors;
}

/**
 * DB 노드 생성 데이터 검증
 */
export function validateDbNodeData(dbData: DbNodeData): string[] {
  const errors: string[] = [];
  
  if (!dbData.query?.trim()) {
    errors.push('SQL 쿼리를 입력해야 합니다.');
  }
  
  // Connection validation
  if (dbData.connection.type === 'sqlite') {
    if (!dbData.connection.filePath?.trim()) {
      errors.push('SQLite 파일 경로를 입력해야 합니다.');
    }
  } else if (dbData.connection.type === 'postgresql') {
    if (!dbData.connection.host?.trim()) {
      errors.push('호스트를 입력해야 합니다.');
    }
    if (!dbData.connection.database?.trim()) {
      errors.push('데이터베이스 이름을 입력해야 합니다.');
    }
    if (!dbData.connection.username?.trim()) {
      errors.push('사용자 이름을 입력해야 합니다.');
    }
  } else if (dbData.connection.type === 'oracle') {
    if (!dbData.connection.host?.trim()) {
      errors.push('호스트를 입력해야 합니다.');
    }
    if (!dbData.connection.serviceName?.trim() && !dbData.connection.sid?.trim()) {
      errors.push('Service Name 또는 SID를 입력해야 합니다.');
    }
    if (!dbData.connection.username?.trim()) {
      errors.push('사용자 이름을 입력해야 합니다.');
    }
  }
  
  return errors;
}

/**
 * 파일 노드 생성
 */
export function createFileNode(
  filePath: string,
  onCreateFileNode: (filePath: string, fileName: string, fileExtension: string) => string
): string {
  const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown';
  const fileExtension = getFileExtension(fileName);
  
  return onCreateFileNode(filePath, fileName, fileExtension);
}

/**
 * 새 파일 노드 생성 (파일 생성 모드)
 */
export function createNewFileNode(
  fileName: string,
  folderPath: string,
  onCreateFileNode: (filePath: string, fileName: string, fileExtension: string) => string
): string {
  const separator = folderPath.includes('/') ? '/' : '\\';
  const fullPath = folderPath + separator + fileName;
  const fileExtension = getFileExtension(fileName);
  const fileNameWithoutExt = getFileNameWithoutExtension(fileName);
  
  return onCreateFileNode(fullPath, fileNameWithoutExt, fileExtension);
}

/**
 * API 노드 생성을 위한 데이터 정리
 */
export function prepareApiNodeData(apiData: ApiNodeData): {
  name: string;
  type: 'api';
  data: ApiNodeData;
} {
  const urlObj = new URL(apiData.url);
  const name = `${apiData.method} ${urlObj.pathname}`;
  
  return {
    name,
    type: 'api',
    data: {
      ...apiData,
      url: apiData.url.trim(),
      description: apiData.description?.trim() || undefined
    }
  };
}

/**
 * DB 노드 생성을 위한 데이터 정리
 */
export function prepareDbNodeData(dbData: DbNodeData): {
  name: string;
  type: 'db';
  data: DbNodeData;
} {
  // Generate name from query or use provided name
  const name = dbData.name || 'Database Query';
  
  return {
    name,
    type: 'db',
    data: {
      ...dbData,
      query: dbData.query.trim(),
      description: dbData.description?.trim() || undefined
    }
  };
}

/**
 * 노드 타입별 기본 데이터 반환
 */
export function getDefaultNodeData(nodeType: NodeType): any {
  switch (nodeType) {
    case 'api':
      return {
        type: 'rest',
        url: '',
        method: 'GET',
        description: ''
      };
    case 'db':
      return {
        type: 'mysql',
        connectionString: '',
        schema: '',
        table: '',
        description: ''
      };
    case 'file':
    default:
      return {};
  }
}

/**
 * HTTP 메서드 목록
 */
export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS'
] as const;

/**
 * API 타입 목록
 */
export const API_TYPES = [
  { value: 'rest', label: 'REST API' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'soap', label: 'SOAP' },
  { value: 'websocket', label: 'WebSocket' }
] as const;

/**
 * 데이터베이스 타입 목록
 */
export const DB_TYPES = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'redis', label: 'Redis' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'mssql', label: 'SQL Server' }
] as const;
