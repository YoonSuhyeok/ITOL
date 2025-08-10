import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "@/shared/lib/utils";
import { 
  Settings, 
  Palette, 
  Keyboard, 
  Info, 
  FolderOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  PlusSquare, 
  Database, 
  Globe, 
  FileText, 
  File, 
  Folder, 
  ChevronDown, 
  ChevronRight as ChevronRightIcon 
} from "lucide-react";
import type { 
  Project, 
  MenuSection, 
  NodeType, 
  FileSystemItem,
  ProjectFormData,
  FileCreationMode
} from './types';
import { PROJECT_TYPES } from './types';

interface ProjectManagementSectionProps {
  projects: Project[];
  editingProject: Project | null;
  isAddingNew: boolean;
  formData: ProjectFormData;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onAddNew: () => void;
  onQuickAdd: () => void;
  onFolderSelect: () => void;
  onFormDataChange: (field: keyof ProjectFormData, value: string) => void;
}

export const ProjectManagementSection: React.FC<ProjectManagementSectionProps> = ({
  projects,
  editingProject,
  isAddingNew,
  formData,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onAddNew,
  onQuickAdd,
  onFolderSelect,
  onFormDataChange
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">프로젝트 관리</h3>
        <Button variant="outline" size="sm" onClick={onAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          새 프로젝트
        </Button>
      </div>

      {/* 프로젝트 목록 */}
      <div className="space-y-3">
        {projects.map((project) => (
          <div key={project.id} className="border rounded-lg p-4">
            {editingProject?.id === project.id ? (
              // 편집 모드
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">프로젝트 이름</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => onFormDataChange('name', e.target.value)}
                    placeholder="프로젝트 이름"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">타입</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={formData.type}
                    onChange={(e) => onFormDataChange('type', e.target.value)}
                  >
                    {PROJECT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">경로</label>
                  <div className="flex space-x-2">
                    <Input
                      value={formData.path}
                      onChange={(e) => onFormDataChange('path', e.target.value)}
                      placeholder="프로젝트 경로"
                    />
                    <Button variant="outline" onClick={onFolderSelect}>
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">설명</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => onFormDataChange('description', e.target.value)}
                    placeholder="프로젝트 설명 (선택사항)"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={onSave} size="sm">저장</Button>
                  <Button variant="outline" onClick={onCancel} size="sm">취소</Button>
                </div>
              </div>
            ) : (
              // 보기 모드
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{project.name}</h4>
                    <Badge 
                      className={cn(
                        "text-xs text-white",
                        PROJECT_TYPES.find(t => t.value === project.type)?.color || "bg-gray-400"
                      )}
                    >
                      {PROJECT_TYPES.find(t => t.value === project.type)?.label || project.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{project.path}</p>
                  {project.description && (
                    <p className="text-xs text-gray-500 mt-1">{project.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(project)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {projects.length === 0 && !isAddingNew && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">프로젝트가 없습니다</h4>
            <p className="text-gray-600 mb-4">새 프로젝트를 추가하여 시작하세요.</p>
            <Button onClick={onAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              첫 번째 프로젝트 추가
            </Button>
          </div>
        )}
      </div>

      {/* 새 프로젝트 추가 폼 */}
      {isAddingNew && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-3">새 프로젝트 추가</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">프로젝트 이름</label>
              <Input
                value={formData.name}
                onChange={(e) => onFormDataChange('name', e.target.value)}
                placeholder="프로젝트 이름"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">타입</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={formData.type}
                onChange={(e) => onFormDataChange('type', e.target.value)}
              >
                {PROJECT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">경로</label>
              <div className="flex space-x-2">
                <Input
                  value={formData.path}
                  onChange={(e) => onFormDataChange('path', e.target.value)}
                  placeholder="프로젝트 경로"
                />
                <Button variant="outline" onClick={onFolderSelect}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">설명</label>
              <Input
                value={formData.description}
                onChange={(e) => onFormDataChange('description', e.target.value)}
                placeholder="프로젝트 설명 (선택사항)"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={onSave} size="sm">저장</Button>
              <Button variant="outline" onClick={onQuickAdd} size="sm">빠른 추가</Button>
              <Button variant="outline" onClick={onCancel} size="sm">취소</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FileTreeProps {
  items: FileSystemItem[];
  selectedFile: string;
  onFileSelect: (filePath: string) => void;
  onFolderToggle: (folderPath: string) => void;
  isLoading?: boolean;
  level?: number;
  maxDisplayLevel?: number;
}

export const FileTree: React.FC<FileTreeProps> = ({
  items,
  selectedFile,
  onFileSelect,
  onFolderToggle,
  isLoading = false,
  level = 0,
  maxDisplayLevel = 5
}) => {
  if (isLoading && level === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>파일을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-gray-500">
        {level === 0 ? "파일을 찾을 수 없습니다." : "폴더가 비어있습니다."}
      </div>
    );
  }

  // 최대 표시 레벨을 초과하면 더 이상 렌더링하지 않음
  if (level > maxDisplayLevel) {
    return (
      <div 
        className="text-xs text-gray-400 italic p-2"
        style={{ paddingLeft: `${(level * 16) + 8}px` }}
      >
        ... (더 많은 하위 항목들)
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <div key={item.path}>
          <div
            className={cn(
              "flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer text-sm rounded-sm transition-colors",
              selectedFile === item.path && !item.isDirectory && "bg-blue-100 text-blue-800 border border-blue-200",
              item.isDirectory && "hover:bg-gray-50"
            )}
            onClick={() => {
              if (item.isDirectory) {
                onFolderToggle(item.path);
              } else {
                onFileSelect(item.path);
              }
            }}
            style={{ paddingLeft: `${(level * 16) + 8}px` }}
          >
            {/* 폴더/파일 아이콘과 확장/축소 아이콘 */}
            <div className="flex items-center min-w-0 flex-1">
              {item.isDirectory ? (
                <div className="flex items-center">
                  {item.isChildrenLoaded && item.children && item.children.length > 0 ? (
                    item.isExpanded ? (
                      <ChevronDown className="h-3 w-3 mr-1 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRightIcon className="h-3 w-3 mr-1 text-gray-500 flex-shrink-0" />
                    )
                  ) : (
                    <div className="w-4 mr-1 flex-shrink-0" />
                  )}
                  <Folder 
                    className={cn(
                      "h-4 w-4 mr-2 flex-shrink-0",
                      item.isExpanded ? "text-blue-600" : "text-blue-500"
                    )} 
                  />
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-4 mr-1 flex-shrink-0" />
                  <FileText className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                </div>
              )}
              
              {/* 파일/폴더 이름 */}
              <span 
                className={cn(
                  "truncate text-sm",
                  item.isDirectory ? "font-medium text-gray-700" : "text-gray-600"
                )}
                title={item.name}
              >
                {item.name}
              </span>
              
              {/* 폴더인 경우 하위 항목 개수 표시 */}
              {item.isDirectory && (
                <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
                  {item.isChildrenLoaded ? 
                    `(${item.children?.length || 0})` : 
                    '(?)'
                  }
                </span>
              )}
            </div>
          </div>
          
          {/* 하위 항목들 재귀 렌더링 */}
          {item.isDirectory && item.isExpanded && item.children && item.children.length > 0 && (
            <FileTree
              items={item.children}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              onFolderToggle={onFolderToggle}
              level={level + 1}
              maxDisplayLevel={maxDisplayLevel}
            />
          )}
        </div>
      ))}
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button onClick={onConfirm}>
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface NodeCreationTabsProps {
  activeTab: NodeType;
  onTabChange: (tab: NodeType) => void;
}

export const NodeCreationTabs: React.FC<NodeCreationTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [
    { id: 'file' as NodeType, label: '파일', icon: File },
    { id: 'api' as NodeType, label: 'API', icon: Globe },
    { id: 'db' as NodeType, label: 'DB', icon: Database }
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === tab.id
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <tab.icon className="h-4 w-4 mr-2" />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

interface MenuSidebarProps {
  activeSection: MenuSection;
  onSectionChange: (section: MenuSection) => void;
}

export const MenuSidebar: React.FC<MenuSidebarProps> = ({
  activeSection,
  onSectionChange
}) => {
  const menuItems = [
    { id: 'projects' as MenuSection, label: '프로젝트 관리', icon: FolderOpen },
    { id: 'node-creation' as MenuSection, label: '노드 생성', icon: PlusSquare },
    { id: 'general' as MenuSection, label: '일반', icon: Settings },
    { id: 'appearance' as MenuSection, label: '모양', icon: Palette },
    { id: 'editor' as MenuSection, label: '에디터', icon: Edit2 },
    { id: 'shortcuts' as MenuSection, label: '단축키', icon: Keyboard },
    { id: 'about' as MenuSection, label: '정보', icon: Info }
  ];

  return (
    <div className="w-48 border-r bg-gray-50 p-4">
      <div className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
              activeSection === item.id
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <item.icon className="h-4 w-4 mr-3" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

interface FileExplorerProps {
  projectPath: string;
  selectedFile: string;
  onFileSelect: (filePath: string) => void;
  autoExpand?: boolean;
  maxDepth?: number;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  projectPath,
  selectedFile,
  onFileSelect,
  autoExpand = false,
  maxDepth = 3
}) => {
  const [fileSystemItems, setFileSystemItems] = React.useState<FileSystemItem[]>([]);
  const [filteredItems, setFilteredItems] = React.useState<FileSystemItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>('');

  // 파일 시스템 로드
  React.useEffect(() => {
    const loadFileSystem = async () => {
      if (!projectPath) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { loadProjectFiles, preloadSubdirectories } = await import('./file-system');
        
        console.log(`🚀 FileExplorer: Starting to load project files for: ${projectPath}`);
        console.log(`📋 FileExplorer: Settings - autoExpand=${autoExpand}, maxDepth=${maxDepth}`);
        
        // 디버깅을 위해 임시로 필터링 없이 로드
        const items = await loadProjectFiles(projectPath, false); // 필터링 비활성화
        console.log(`🔍 FileExplorer: Loaded ${items.length} items without filtering`);
        
        if (autoExpand && items.length > 0) {
          console.log(`🔄 FileExplorer: Auto-expanding subdirectories with maxDepth=${maxDepth}...`);
          const expandedItems = await preloadSubdirectories(items, maxDepth, 0, true, false); // 필터링 비활성화
          console.log(`✅ FileExplorer: Auto-expansion completed`);
          setFileSystemItems(expandedItems);
        } else {
          console.log(`📁 FileExplorer: Loading without auto-expansion`);
          setFileSystemItems(items);
        }
        
        console.log(`🎉 FileExplorer: File system loaded successfully with ${items.length} root items`);
      } catch (err) {
        console.error(`❌ FileExplorer: Error loading file system for ${projectPath}:`, err);
        setError(err instanceof Error ? err.message : '파일 시스템을 로드할 수 없습니다.');
        setFileSystemItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFileSystem();
  }, [projectPath, autoExpand, maxDepth]);

  // 검색 필터링
  React.useEffect(() => {
    const applySearch = async () => {
      if (!searchTerm.trim()) {
        console.log(`🔍 FileExplorer: Clearing search, showing all ${fileSystemItems.length} items`);
        setFilteredItems(fileSystemItems);
        return;
      }

      try {
        console.log(`🔍 FileExplorer: Searching for "${searchTerm}" in ${fileSystemItems.length} items...`);
        const { searchFilesByName } = await import('./file-system');
        const searchResults = searchFilesByName(fileSystemItems, searchTerm);
        console.log(`🔍 FileExplorer: Search found ${searchResults.length} matching items`);
        setFilteredItems(searchResults);
      } catch (err) {
        console.error(`❌ FileExplorer: Error searching files for "${searchTerm}":`, err);
        setFilteredItems(fileSystemItems);
      }
    };

    applySearch();
  }, [fileSystemItems, searchTerm]);

  // 폴더 토글 핸들러
  const handleFolderToggle = React.useCallback(async (folderPath: string) => {
    console.log(`🔄 FileExplorer: User clicked folder: ${folderPath}`);
    try {
      const { toggleFolder } = await import('./file-system');
      const updatedItems = await toggleFolder(filteredItems.length > 0 ? filteredItems : fileSystemItems, folderPath, true, maxDepth);
      
      if (searchTerm.trim()) {
        console.log(`🔍 FileExplorer: Updating search results after folder toggle`);
        // 검색 중이면 검색 결과 업데이트
        const { searchFilesByName } = await import('./file-system');
        const searchResults = searchFilesByName(updatedItems, searchTerm);
        setFilteredItems(searchResults);
      } else {
        console.log(`📁 FileExplorer: Updating file system after folder toggle`);
        setFileSystemItems(updatedItems);
      }
    } catch (err) {
      console.error(`❌ FileExplorer: Error toggling folder ${folderPath}:`, err);
    }
  }, [filteredItems, fileSystemItems, maxDepth, searchTerm]);

  const displayItems = searchTerm.trim() ? filteredItems : fileSystemItems;

  if (error) {
    return (
      <div className="border rounded-md bg-red-50 border-red-200 p-4 text-center">
        <div className="text-red-600 text-sm mb-2">파일 시스템 로드 오류</div>
        <div className="text-red-500 text-xs">{error}</div>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-md bg-white">
      {/* 검색 입력 */}
      <div className="p-3 border-b bg-gray-50">
        <Input
          type="text"
          placeholder="파일 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm"
        />
        {searchTerm.trim() && (
          <div className="mt-2 text-xs text-gray-500">
            검색 결과: {displayItems.length}개 항목
          </div>
        )}
        <div className="mt-2 text-xs text-gray-400">
          💡 Tips: .ts, .js, .tsx 등 개발 파일만 표시됩니다. 숨김 폴더는 제외됩니다.
        </div>
      </div>
      
      {/* 파일 트리 */}
      <div className="max-h-80 overflow-y-auto">
        <FileTree
          items={displayItems}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          onFolderToggle={handleFolderToggle}
          isLoading={isLoading}
          maxDisplayLevel={maxDepth + 1}
        />
      </div>
    </div>
  );
};

interface NodeCreationFormProps {
  activeTab: NodeType;
  projects: Project[];
  selectedProjectId: string;
  selectedFile: string;
  fileCreationMode: FileCreationMode;
  onProjectChange: (projectId: string) => void;
  onFileSelect: (filePath: string) => void;
  onFileCreationModeChange: (mode: FileCreationMode) => void;
  onCreateFileNode: () => void;
}

export const NodeCreationForm: React.FC<NodeCreationFormProps> = ({
  activeTab,
  projects,
  selectedProjectId,
  selectedFile,
  fileCreationMode,
  onProjectChange,
  onFileSelect,
  onFileCreationModeChange,
  onCreateFileNode
}) => {
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (activeTab !== 'file') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-3">FILE 노드 생성 방법</h4>
        
        {/* 생성 방법 선택 */}
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={() => onFileCreationModeChange('select-existing')}
              className={cn(
                "flex-1 p-4 border rounded-lg text-left transition-colors",
                fileCreationMode === 'select-existing'
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center mb-2">
                <File className="h-5 w-5 mr-2 text-blue-600" />
                <span className="font-medium">기존 파일 선택</span>
              </div>
              <p className="text-sm text-gray-600">
                프로젝트에서 기존 파일을 선택하여 노드를 생성합니다.
              </p>
            </button>
            
            <button
              onClick={() => onFileCreationModeChange('create-new')}
              className={cn(
                "flex-1 p-4 border rounded-lg text-left transition-colors",
                fileCreationMode === 'create-new'
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center mb-2">
                <Plus className="h-5 w-5 mr-2 text-green-600" />
                <span className="font-medium">새 파일 생성</span>
              </div>
              <p className="text-sm text-gray-600">
                프로젝트 폴더에 새 파일을 생성하고 노드를 만듭니다.
              </p>
            </button>
          </div>

          {/* 프로젝트 선택 */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">프로젝트 선택</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedProjectId}
                  onChange={(e) => onProjectChange(e.target.value)}
                >
                  <option value="">프로젝트를 선택하세요</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.type})
                    </option>
                  ))}
                </select>
                
                {projects.length === 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-center">
                    <p className="text-sm text-yellow-700 mb-2">등록된 프로젝트가 없습니다.</p>
                    <p className="text-xs text-yellow-600">프로젝트 관리 탭에서 프로젝트를 먼저 추가해주세요.</p>
                  </div>
                )}
              </div>
              
              {/* 파일 탐색기 */}
              {selectedProject && fileCreationMode === 'select-existing' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    파일 선택
                    {selectedFile && (
                      <span className="ml-2 text-xs text-blue-600 font-normal">
                        ({selectedFile.split('/').pop() || selectedFile.split('\\').pop()})
                      </span>
                    )}
                  </label>
                  
                  <div className="border rounded-md bg-white">
                    <FileExplorer
                      projectPath={selectedProject.path}
                      selectedFile={selectedFile}
                      onFileSelect={onFileSelect}
                      autoExpand={true}
                      maxDepth={4}
                    />
                  </div>
                  
                  {selectedFile && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <div className="font-medium text-blue-800">선택된 파일:</div>
                      <div className="text-blue-600 font-mono text-xs mt-1 break-all">
                        {selectedFile}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <Button 
                className="w-full"
                onClick={onCreateFileNode}
                disabled={!selectedProjectId || (fileCreationMode === 'select-existing' && !selectedFile)}
              >
                <FileText className="h-4 w-4 mr-2" />
                FILE 노드 생성
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
