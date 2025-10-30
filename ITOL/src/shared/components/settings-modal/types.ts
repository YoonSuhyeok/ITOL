export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFileNode: (filePath: string, fileName: string, fileExtension: string) => string;
  onCreateApiNode: (apiData: import('@/entities/language/model/api-node-type').ApiNodeData) => string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  path: string;
  description?: string;
}

export type ProjectType = 
  | "typescript"
  | "javascript" 
  | "python"
  | "java"
  | "csharp"
  | "cpp"
  | "rust"
  | "go"
  | "other";

export const PROJECT_TYPES: { value: ProjectType; label: string; color: string }[] = [
  { value: "typescript", label: "TypeScript", color: "bg-blue-500" },
  { value: "javascript", label: "JavaScript", color: "bg-yellow-500" },
  { value: "python", label: "Python", color: "bg-green-500" },
  { value: "java", label: "Java", color: "bg-red-500" },
  { value: "csharp", label: "C#", color: "bg-purple-500" },
  { value: "cpp", label: "C++", color: "bg-gray-600" },
  { value: "rust", label: "Rust", color: "bg-orange-600" },
  { value: "go", label: "Go", color: "bg-cyan-500" },
  { value: "other", label: "Other", color: "bg-gray-400" }
];

export type MenuSection = 'projects' | 'node-creation' | 'swagger-management' | 'general' | 'appearance' | 'editor' | 'shortcuts' | 'about';
export type NodeType = 'file' | 'api' | 'db';
export type FileCreationMode = 'create-new' | 'select-existing';

export interface FileSystemItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileSystemItem[];
  isExpanded?: boolean;
  isChildrenLoaded?: boolean; // 하위 내용이 로드되었는지 여부
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export interface ApiNodeData {
  type: string;
  method: string;
  url: string;
  description?: string;
  
  // PostMan 스타일 추가 필드들
  headers?: ApiHeader[];
  queryParams?: ApiQueryParam[];
  pathParams?: ApiPathParam[];
  body?: ApiRequestBody;
  auth?: ApiAuth;
  timeout?: number;
  followRedirects?: boolean;
}

export interface ApiHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface ApiQueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface ApiPathParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface ApiRequestBody {
  type: 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary';
  raw?: {
    content: string;
    language: 'json' | 'xml' | 'html' | 'text' | 'javascript';
  };
  formData?: ApiFormDataItem[];
  urlencoded?: ApiUrlencodedItem[];
}

export interface ApiFormDataItem {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
  description?: string;
}

export interface ApiUrlencodedItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface ApiAuth {
  type: 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2';
  bearer?: {
    token: string;
  };
  basic?: {
    username: string;
    password: string;
  };
  apiKey?: {
    key: string;
    value: string;
    addTo: 'header' | 'query';
  };
  oauth2?: {
    accessToken: string;
    headerPrefix?: string;
  };
}

export interface DbNodeData {
  type: string;
  connectionString: string;
  schema: string;
  table: string;
  description?: string;
}

export interface ProjectFormData {
  name: string;
  type: ProjectType;
  path: string;
  description: string;
}

export interface SwaggerSpec {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  version?: string;
  baseUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  isValid: boolean;
  endpoints?: SwaggerEndpoint[];
}

export interface SwaggerEndpoint {
  id: string;
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: SwaggerParameter[];
  requestBody?: SwaggerRequestBody;
  responses?: SwaggerResponse[];
}

export interface SwaggerParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required: boolean;
  schema: SwaggerSchema;
  description?: string;
}

export interface SwaggerRequestBody {
  required: boolean;
  content: Record<string, SwaggerMediaType>;
}

export interface SwaggerMediaType {
  schema: SwaggerSchema;
  example?: any;
}

export interface SwaggerSchema {
  type: string;
  format?: string;
  properties?: Record<string, SwaggerSchema>;
  items?: SwaggerSchema;
  required?: string[];
  example?: any;
}

export interface SwaggerResponse {
  statusCode: string;
  description: string;
  content?: Record<string, SwaggerMediaType>;
}

export interface SwaggerFormData {
  name: string;
  description: string;
  filePath: string;
}
