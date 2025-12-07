export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFileNode: (filePath: string, fileName: string, fileExtension: string) => string;
  onCreateApiNode?: () => void;
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

export type MenuSection = 'projects' | 'node-creation' | 'connections' | 'general' | 'appearance' | 'editor' | 'shortcuts' | 'about';
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

// HTTP Methods supported by API nodes
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// Authentication types
export type AuthType = 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2';

export interface AuthConfig {
  type: AuthType;
  token?: string; // Bearer token
  username?: string; // Basic auth
  password?: string; // Basic auth
  apiKey?: string;
  apiKeyHeader?: string; // Header name for API key
  oauth2?: {
    accessToken?: string;
    tokenType?: string;
  };
}

// Body types for requests
export type BodyType = 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary';

export interface KeyValuePair {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface FormDataItem extends KeyValuePair {
  type: 'text' | 'file';
}

export interface RequestBody {
  type: BodyType;
  raw?: string; // For JSON, XML, Text, etc.
  formData?: FormDataItem[];
  urlEncoded?: KeyValuePair[];
}

// Complete API Node Data matching Postman features
// Database types
export type DatabaseType = 'sqlite' | 'oracle' | 'postgresql';

export interface DatabaseConnection {
  type: DatabaseType;
  
  // SQLite
  filePath?: string;
  
  // Oracle & PostgreSQL
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  
  // Oracle specific
  serviceName?: string;
  sid?: string;
  
  // PostgreSQL specific
  schema?: string;
  sslMode?: boolean;
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  query: string;
  databaseType: DatabaseType;
  createdAt: string;
  updatedAt?: string;
}

export interface SavedConnection {
  id: string;
  name: string;
  description?: string;
  connection: DatabaseConnection;
  createdAt: string;
  updatedAt?: string;
}

export interface ColumnSelection {
  columnName: string;
  alias?: string;
  enabled: boolean;
}

export interface PostProcessScript {
  type: 'javascript' | 'typescript';
  code: string;
}

export interface DbNodeData {
  type: 'db';
  name: string;
  description?: string;
  
  // Connection configuration
  connection: DatabaseConnection;
  
  // Query
  query: string;
  savedQueryId?: string; // Reference to saved query
  
  // Column selection for output
  columnSelection: ColumnSelection[];
  selectAllColumns: boolean;
  
  // Post-processing
  postProcessScript?: PostProcessScript;
  
  // Execution settings
  timeout?: number; // in milliseconds
  maxRows?: number; // Limit result rows
}

export interface FileNodeData {
  type: 'file';
  name: string;
  description?: string;
  content?: string;
}

export interface ApiNodeData {
  type: 'api';
  name: string;
  description?: string;
  
  // Request configuration
  method: HttpMethod;
  url: string;
  
  // Path parameters (e.g., {petId} in /pet/{petId})
  pathParams: KeyValuePair[];
  
  // Query parameters
  queryParams: KeyValuePair[];
  
  // Headers
  headers: KeyValuePair[];
  
  // Authorization
  auth: AuthConfig;
  
  // Request Body
  body: RequestBody;
  
  // Scripts (using JavaScript)
  preRequestScript?: string;
  testScript?: string;
  
  // Timeout settings
  timeout?: number; // in milliseconds
  
  // Response handling
  followRedirects?: boolean;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFileNode: (filePath: string, fileName: string, fileExtension: string) => string;
  onCreateApiNode?: () => void;
  onCreateDbNode?: () => void;
}

export interface DbNodeData_Old {
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

// Saved Swagger/OpenAPI specifications
export interface SavedSwagger {
  id: string;
  name: string;
  url?: string; // URL if fetched from remote
  spec: unknown; // The actual OpenAPI/Swagger JSON
  createdAt: string;
  updatedAt?: string;
}
