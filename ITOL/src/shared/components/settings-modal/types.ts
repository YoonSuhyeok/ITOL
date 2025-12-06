export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFileNode: (filePath: string, fileName: string, fileExtension: string) => string;
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

export type MenuSection = 'projects' | 'node-creation' | 'general' | 'appearance' | 'editor' | 'shortcuts' | 'about';
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
  url: string;
  method: string;
  description?: string;
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
