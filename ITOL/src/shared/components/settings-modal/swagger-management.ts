import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { 
  SwaggerSpec, 
  SwaggerEndpoint, 
  SwaggerFormData, 
  SwaggerParameter, 
  SwaggerRequestBody, 
  SwaggerResponse 
} from './types';

// Swagger 파일 선택
export const selectSwaggerFile = async (): Promise<string | null> => {
  try {
    const selected = await open({
      title: 'Swagger/OpenAPI 파일 선택',
      filters: [
        {
          name: 'API 스펙 파일',
          extensions: ['json', 'yaml', 'yml']
        },
        {
          name: 'JSON 파일',
          extensions: ['json']
        },
        {
          name: 'YAML 파일', 
          extensions: ['yaml', 'yml']
        }
      ]
    });
    
    const filePath = Array.isArray(selected) ? selected[0] : selected;
    console.log('선택된 파일 경로:', filePath);
    
    if (filePath) {
      // 경로 정규화
      const normalizedPath = filePath.replace(/\\/g, '/');
      console.log('정규화된 파일 경로:', normalizedPath);
      return normalizedPath;
    }
    
    return null;
  } catch (error) {
    console.error('파일 선택 오류:', error);
    throw new Error('파일 선택에 실패했습니다.');
  }
};

// Swagger 파일 파싱
export const parseSwaggerFile = async (filePath: string): Promise<SwaggerSpec> => {
  try {
    console.log('파싱 시도 중인 파일 경로:', filePath);
    
    // 파일 경로 정규화
    const normalizedPath = filePath.replace(/\\/g, '/');
    console.log('정규화된 파일 경로:', normalizedPath);
    
    // 파일 읽기 - Tauri 백엔드 명령어 사용
    const fileContent = await invoke<string>('read_text_file', { path: normalizedPath });
    console.log('파일 내용 길이:', fileContent.length);
    
    // JSON 또는 YAML 파싱
    let spec: any;
    try {
      if (normalizedPath.toLowerCase().endsWith('.json')) {
        spec = JSON.parse(fileContent);
      } else {
        // YAML 파싱은 간단한 구현으로 대체 (실제로는 yaml 라이브러리 필요)
        // 여기서는 JSON만 지원하도록 제한
        throw new Error('현재는 JSON 형식만 지원됩니다. YAML 지원은 추후 추가될 예정입니다.');
      }
    } catch (parseError) {
      console.error('파싱 오류:', parseError);
      throw new Error(`파일 파싱 오류: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`);
    }

    // OpenAPI/Swagger 스펙 검증
    if (!spec.openapi && !spec.swagger) {
      throw new Error('유효한 OpenAPI/Swagger 스펙이 아닙니다. openapi 또는 swagger 필드가 필요합니다.');
    }

    if (!spec.info) {
      throw new Error('스펙에 info 섹션이 없습니다.');
    }

    if (!spec.paths) {
      throw new Error('스펙에 paths 섹션이 없습니다.');
    }

    // 엔드포인트 추출
    const endpoints = extractEndpoints(spec);
    console.log('추출된 엔드포인트 수:', endpoints.length);

    const swaggerSpec: SwaggerSpec = {
      id: generateId(),
      name: extractNameFromPath(normalizedPath),
      filePath: normalizedPath,
      version: spec.info?.version || '1.0.0',
      baseUrl: getBaseUrl(spec),
      createdAt: new Date(),
      updatedAt: new Date(),
      isValid: true,
      endpoints,
      description: spec.info?.description
    };

    console.log('파싱 완료:', swaggerSpec.name);
    return swaggerSpec;
  } catch (error) {
    console.error('Swagger 파싱 오류:', error);
    throw error;
  }
};

// 엔드포인트 추출 함수
const extractEndpoints = (spec: any): SwaggerEndpoint[] => {
  const endpoints: SwaggerEndpoint[] = [];
  
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem as any)) {
      if (typeof operation === 'object' && operation !== null) {
        const op = operation as any;
        const endpoint: SwaggerEndpoint = {
          id: generateId(),
          path,
          method: method.toUpperCase(),
          operationId: op.operationId,
          summary: op.summary,
          description: op.description,
          tags: op.tags || [],
          parameters: extractParameters(op.parameters || []),
          requestBody: extractRequestBody(op.requestBody),
          responses: extractResponses(op.responses || {})
        };
        endpoints.push(endpoint);
      }
    }
  }
  
  return endpoints;
};

// 파라미터 추출
const extractParameters = (parameters: any[]): SwaggerParameter[] => {
  return parameters.map(param => ({
    name: param.name,
    in: param.in,
    required: param.required || false,
    schema: param.schema || { type: 'string' },
    description: param.description
  }));
};

// 요청 바디 추출
const extractRequestBody = (requestBody: any): SwaggerRequestBody | undefined => {
  if (!requestBody) return undefined;
  
  return {
    required: requestBody.required || false,
    content: requestBody.content || {}
  };
};

// 응답 추출
const extractResponses = (responses: any): SwaggerResponse[] => {
  return Object.entries(responses).map(([statusCode, response]: [string, any]) => ({
    statusCode,
    description: response.description || '',
    content: response.content
  }));
};

// Swagger 스펙 저장
export const saveSwaggerSpec = async (spec: SwaggerSpec): Promise<boolean> => {
  try {
    await invoke('save_swagger_spec', { spec });
    return true;
  } catch (error) {
    console.error('Swagger 스펙 저장 오류:', error);
    return false;
  }
};

// 저장된 Swagger 스펙 로드
export const loadSwaggerSpecs = async (): Promise<SwaggerSpec[]> => {
  try {
    const specs = await invoke<SwaggerSpec[]>('load_swagger_specs');
    return specs.map((spec: any) => ({
      ...spec,
      createdAt: new Date(spec.createdAt),
      updatedAt: new Date(spec.updatedAt)
    }));
  } catch (error) {
    console.error('Swagger 스펙 로드 오류:', error);
    return [];
  }
};

// Swagger 스펙 삭제
export const deleteSwaggerSpec = async (specId: string): Promise<boolean> => {
  try {
    await invoke('delete_swagger_spec', { specId });
    return true;
  } catch (error) {
    console.error('Swagger 스펙 삭제 오류:', error);
    return false;
  }
};

// Swagger 스펙 업데이트
export const updateSwaggerSpec = async (spec: SwaggerSpec): Promise<boolean> => {
  try {
    await invoke('update_swagger_spec', { spec });
    return true;
  } catch (error) {
    console.error('Swagger 스펙 업데이트 오류:', error);
    return false;
  }
};

// Swagger 엔드포인트에서 API 노드 생성
export const createApiNodeFromEndpoint = async (
  endpoint: SwaggerEndpoint,
  spec: SwaggerSpec
): Promise<string> => {
  try {
    const nodeId = await invoke<string>('create_api_node_from_endpoint', {
      endpoint,
      baseUrl: spec.baseUrl,
      specId: spec.id
    });
    return nodeId;
  } catch (error) {
    console.error('API 노드 생성 오류:', error);
    throw error;
  }
};

// 유틸리티 함수들
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

const extractNameFromPath = (filePath: string): string => {
  const fileName = filePath.split(/[/\\]/).pop() || '';
  return fileName.replace(/\.(json|yaml|yml)$/i, '');
};

const getBaseUrl = (spec: any): string => {
  if (spec.servers && spec.servers.length > 0) {
    return spec.servers[0].url;
  }
  
  if (spec.host) {
    const scheme = spec.schemes?.[0] || 'https';
    const basePath = spec.basePath || '';
    return `${scheme}://${spec.host}${basePath}`;
  }
  
  return '';
};

// Swagger 스펙 유효성 검사
export const validateSwaggerSpec = async (filePath: string): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  try {
    console.log('유효성 검사 시도 중인 파일 경로:', filePath);
    
    // 파일 경로 정규화
    const normalizedPath = filePath.replace(/\\/g, '/');
    console.log('정규화된 파일 경로:', normalizedPath);
    
    // 간단한 파싱으로 유효성 검사 - Tauri 백엔드 명령어 사용
    const fileContent = await invoke<string>('read_text_file', { path: normalizedPath });
    console.log('파일 내용 길이:', fileContent.length);
    
    let spec: any;
    try {
      if (normalizedPath.toLowerCase().endsWith('.json')) {
        spec = JSON.parse(fileContent);
      } else {
        return {
          isValid: false,
          errors: ['현재는 JSON 형식만 지원됩니다.'],
          warnings: []
        };
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      return {
        isValid: false,
        errors: ['JSON 파싱 오류: ' + (parseError instanceof Error ? parseError.message : '알 수 없는 오류')],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // 기본 구조 검증
    if (!spec.openapi && !spec.swagger) {
      errors.push('openapi 또는 swagger 필드가 필요합니다.');
    }

    if (!spec.info) {
      errors.push('info 섹션이 없습니다.');
    } else {
      if (!spec.info.title) {
        warnings.push('info.title이 없습니다.');
      }
      if (!spec.info.version) {
        warnings.push('info.version이 없습니다.');
      }
    }

    if (!spec.paths) {
      errors.push('paths 섹션이 없습니다.');
    } else if (Object.keys(spec.paths).length === 0) {
      warnings.push('paths가 비어있습니다.');
    }

    console.log('유효성 검사 완료:', { isValid: errors.length === 0, errorsCount: errors.length, warningsCount: warnings.length });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    console.error('Swagger 유효성 검사 오류:', error);
    
    // 더 구체적인 오류 메시지 제공
    let errorMessage = '파일 읽기 또는 파싱에 실패했습니다.';
    if (error instanceof Error) {
      if (error.message.includes('glob pattern')) {
        errorMessage = '파일 경로에 특수 문자가 포함되어 있어 읽을 수 없습니다. 경로를 확인해주세요.';
      } else if (error.message.includes('not found')) {
        errorMessage = '파일을 찾을 수 없습니다. 경로가 올바른지 확인해주세요.';
      } else if (error.message.includes('permission')) {
        errorMessage = '파일에 접근할 권한이 없습니다.';
      } else {
        errorMessage = `오류: ${error.message}`;
      }
    }
    
    return {
      isValid: false,
      errors: [errorMessage],
      warnings: []
    };
  }
};

// 파일 경로에서 이름 추출
export const extractSwaggerNameFromPath = (filePath: string): string => {
  return extractNameFromPath(filePath);
};

// Swagger 중복 검사
export const checkSwaggerDuplicate = (
  specs: SwaggerSpec[],
  formData: SwaggerFormData,
  excludeId?: string
): string | null => {
  const duplicateByName = specs.find(
    spec => spec.id !== excludeId && 
    spec.name.toLowerCase() === formData.name.toLowerCase()
  );
  
  if (duplicateByName) {
    return `이미 "${formData.name}"이라는 이름의 Swagger 스펙이 존재합니다.`;
  }
  
  const duplicateByPath = specs.find(
    spec => spec.id !== excludeId && 
    spec.filePath === formData.filePath
  );
  
  if (duplicateByPath) {
    return `이미 같은 파일 경로의 Swagger 스펙이 등록되어 있습니다.`;
  }
  
  return null;
};

// Swagger 스펙 검증
export const validateSwaggerFormData = async (formData: SwaggerFormData): Promise<string[]> => {
  const errors: string[] = [];
  
  if (!formData.name.trim()) {
    errors.push('Swagger 스펙 이름을 입력해주세요.');
  }
  
  if (!formData.filePath.trim()) {
    errors.push('Swagger 파일 경로를 선택해주세요.');
  }
  
  if (formData.filePath && !formData.filePath.match(/\.(json|yaml|yml)$/i)) {
    errors.push('지원되는 파일 형식은 JSON, YAML, YML입니다.');
  }
  
  // 파일 존재 여부 및 유효성 검사
  if (formData.filePath && errors.length === 0) {
    try {
      const validation = await validateSwaggerSpec(formData.filePath);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    } catch (error) {
      errors.push('파일을 읽을 수 없습니다.');
    }
  }
  
  return errors;
};
