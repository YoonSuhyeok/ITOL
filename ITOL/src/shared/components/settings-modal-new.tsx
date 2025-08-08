import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { useState, useCallback } from "react";
import { Settings, Palette, Keyboard, Info, ChevronRight, FolderOpen, Plus, Edit2, Trash2, PlusSquare, Database, Globe, FileText, File } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { open } from '@tauri-apps/plugin-dialog';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Project {
  id: string;
  name: string;
  type: ProjectType;
  path: string;
  description?: string;
}

type ProjectType = 
  | "typescript"
  | "javascript" 
  | "python"
  | "java"
  | "csharp"
  | "cpp"
  | "rust"
  | "go"
  | "other";

const PROJECT_TYPES: { value: ProjectType; label: string; color: string }[] = [
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

type MenuSection = 'projects' | 'node-creation' | 'general' | 'appearance' | 'editor' | 'shortcuts' | 'about';
type NodeType = 'file' | 'api' | 'db';
type FileCreationMode = 'create-new' | 'select-existing';

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeSection, setActiveSection] = useState<MenuSection>('projects');
  const [activeNodeTab, setActiveNodeTab] = useState<NodeType>('file');
  const [fileCreationMode, setFileCreationMode] = useState<FileCreationMode>('select-existing');
  
  // 프로젝트 관리 상태
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "ITOL Project",
      type: "typescript",
      path: "d:\\2025\\project\\ITOL\\ITOL",
      description: "Main ITOL application"
    }
  ]);
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "typescript" as ProjectType,
    path: "",
    description: ""
  });

  // 노드 생성 관련 상태
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedFilePath, setSelectedFilePath] = useState("");
  const [selectedFolderPath, setSelectedFolderPath] = useState("");
  const [newFileName, setNewFileName] = useState("");

  // API 노드 생성 상태
  const [apiData, setApiData] = useState({
    type: "rest",
    url: "",
    method: "GET",
    description: ""
  });

  // DB 노드 생성 상태
  const [dbData, setDbData] = useState({
    type: "mysql",
    connectionString: "",
    schema: "",
    table: "",
    description: ""
  });

  // 폴더 선택 기능
  const handleFolderSelect = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '프로젝트 폴더 선택'
      });
      
      if (selected && typeof selected === 'string') {
        setFormData(prev => ({ ...prev, path: selected }));
      }
    } catch (error) {
      console.error('폴더 선택 중 오류 발생:', error);
    }
  }, []);

  const handleQuickAdd = useCallback(() => {
    if (formData.path.trim()) {
      // 경로에서 프로젝트 이름 추출
      const pathParts = formData.path.replace(/\\/g, '/').split('/');
      const projectName = pathParts[pathParts.length - 1] || 'New Project';
      
      const newProject: Project = {
        id: Date.now().toString(),
        name: projectName,
        type: "typescript", // 기본값
        path: formData.path.trim(),
        description: ""
      };
      
      setProjects([...projects, newProject]);
      setFormData({ name: "", type: "typescript", path: "", description: "" });
    }
  }, [formData.path, projects]);

  const handleEditProject = useCallback((project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      type: project.type,
      path: project.path,
      description: project.description || ""
    });
  }, []);

  const handleSaveProject = useCallback(() => {
    if (isAddingNew) {
      const newProject: Project = {
        id: Date.now().toString(),
        ...formData
      };
      setProjects([...projects, newProject]);
    } else if (editingProject) {
      setProjects(projects.map(p => 
        p.id === editingProject.id ? { ...editingProject, ...formData } : p
      ));
    }
    setIsAddingNew(false);
    setEditingProject(null);
    setFormData({ name: "", type: "typescript", path: "", description: "" });
  }, [isAddingNew, editingProject, formData, projects]);

  // 편집 모달용 폴더 선택 기능
  const handleFolderSelectInModal = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '프로젝트 폴더 선택'
      });
      
      if (selected && typeof selected === 'string') {
        setFormData(prev => ({ ...prev, path: selected }));
      }
    } catch (error) {
      console.error('폴더 선택 중 오류 발생:', error);
    }
  }, []);

  // 노드 생성용 파일 선택 기능 (프로젝트 하위 경로만)
  const handleFileSelectForNode = useCallback(async () => {
    if (!selectedProjectId) {
      alert('먼저 프로젝트를 선택해주세요.');
      return;
    }

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject) {
      alert('선택된 프로젝트를 찾을 수 없습니다.');
      return;
    }

    try {
      const selected = await open({
        directory: false,
        multiple: false,
        title: `${selectedProject.name} 프로젝트에서 파일 선택`,
        defaultPath: selectedProject.path
      });
      
      if (selected && typeof selected === 'string') {
        // 선택된 파일이 프로젝트 경로 하위에 있는지 확인
        const normalizedSelected = selected.replace(/\\/g, '/');
        const normalizedProjectPath = selectedProject.path.replace(/\\/g, '/');
        
        if (normalizedSelected.startsWith(normalizedProjectPath)) {
          setSelectedFilePath(selected);
        } else {
          alert('선택된 프로젝트의 하위 경로에서만 파일을 선택할 수 있습니다.');
        }
      }
    } catch (error) {
      console.error('파일 선택 중 오류 발생:', error);
    }
  }, [selectedProjectId, projects]);

  // 노드 생성용 폴더 선택 기능 (프로젝트 하위 경로만)
  const handleFolderSelectForNode = useCallback(async () => {
    if (!selectedProjectId) {
      alert('먼저 프로젝트를 선택해주세요.');
      return;
    }

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject) {
      alert('선택된 프로젝트를 찾을 수 없습니다.');
      return;
    }

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: `${selectedProject.name} 프로젝트에서 폴더 선택`,
        defaultPath: selectedProject.path
      });
      
      if (selected && typeof selected === 'string') {
        // 선택된 폴더가 프로젝트 경로 하위에 있는지 확인
        const normalizedSelected = selected.replace(/\\/g, '/');
        const normalizedProjectPath = selectedProject.path.replace(/\\/g, '/');
        
        if (normalizedSelected.startsWith(normalizedProjectPath)) {
          setSelectedFolderPath(selected);
        } else {
          alert('선택된 프로젝트의 하위 경로에서만 폴더를 선택할 수 있습니다.');
        }
      }
    } catch (error) {
      console.error('폴더 선택 중 오류 발생:', error);
    }
  }, [selectedProjectId, projects]);

  // 노드 생성 관련 상태 초기화 함수
  const resetNodeCreationStates = useCallback(() => {
    setSelectedFilePath("");
    setSelectedFolderPath("");
    setNewFileName("");
  }, []);

  // 프로젝트 선택 변경 핸들러
  const handleProjectChange = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    resetNodeCreationStates();
  }, [resetNodeCreationStates]);

  const handleCancelEdit = useCallback(() => {
    setIsAddingNew(false);
    setEditingProject(null);
    setFormData({ name: "", type: "typescript", path: "", description: "" });
  }, []);

  // 노드 생성 함수들
  const handleCreateFileNode = useCallback(() => {
    if (fileCreationMode === 'select-existing' && selectedProjectId && selectedFilePath) {
      console.log('기존 파일 노드 생성:', { projectId: selectedProjectId, filePath: selectedFilePath });
      // 여기에 실제 노드 생성 로직 구현
      alert('FILE 노드가 생성되었습니다!');
    } else if (fileCreationMode === 'create-new' && selectedProjectId && selectedFolderPath && newFileName) {
      console.log('새 파일 노드 생성:', { projectId: selectedProjectId, folderPath: selectedFolderPath, fileName: newFileName });
      // 여기에 실제 파일 생성 및 노드 생성 로직 구현
      alert('새 파일이 생성되고 FILE 노드가 생성되었습니다!');
    }
  }, [fileCreationMode, selectedProjectId, selectedFilePath, selectedFolderPath, newFileName]);

  const handleCreateApiNode = useCallback(() => {
    if (apiData.url && apiData.description) {
      console.log('API 노드 생성:', apiData);
      // 여기에 실제 API 노드 생성 로직 구현
      alert('API 노드가 생성되었습니다!');
    }
  }, [apiData]);

  const handleCreateDbNode = useCallback(() => {
    if (dbData.connectionString && dbData.schema) {
      console.log('DB 노드 생성:', dbData);
      // 여기에 실제 DB 노드 생성 로직 구현
      alert('DB 노드가 생성되었습니다!');
    }
  }, [dbData]);

  const menuItems = [
    { id: 'projects' as MenuSection, icon: Settings, label: '프로젝트' },
    { id: 'node-creation' as MenuSection, icon: PlusSquare, label: '노드 생성' },
    { id: 'general' as MenuSection, icon: Settings, label: '일반' },
    { id: 'appearance' as MenuSection, icon: Palette, label: '외관' },
    { id: 'editor' as MenuSection, icon: Settings, label: '에디터' },
    { id: 'shortcuts' as MenuSection, icon: Keyboard, label: '키보드 단축키' },
    { id: 'about' as MenuSection, icon: Info, label: '정보' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'projects':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-4">프로젝트 관리</h3>
              
              {/* 새 프로젝트 추가 영역 */}
              <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="flex space-x-2">
                  <Input
                    placeholder="프로젝트 경로 입력 또는 탐색..."
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFolderSelect}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleQuickAdd}
                    disabled={!formData.path.trim()}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    추가
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">{project.name}</h4>
                      <Badge variant="secondary">{project.type}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProject(project)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setProjects(projects.filter(p => p.id !== project.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{project.description}</p>
                  <p className="text-xs font-mono text-gray-500">{project.path}</p>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'node-creation':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-4">노드 생성</h3>
              
              {/* 노드 타입 탭 */}
              <div className="flex border-b mb-6">
                <button
                  onClick={() => setActiveNodeTab('file')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeNodeTab === 'file'
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  FILE
                </button>
                <button
                  onClick={() => setActiveNodeTab('api')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeNodeTab === 'api'
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Globe className="h-4 w-4 inline mr-2" />
                  API
                </button>
                <button
                  onClick={() => setActiveNodeTab('db')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeNodeTab === 'db'
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Database className="h-4 w-4 inline mr-2" />
                  DB
                </button>
              </div>

              {/* FILE 탭 콘텐츠 */}
              {activeNodeTab === 'file' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">FILE 노드 생성 방법</h4>
                    <div className="space-y-4">
                      {/* 생성 방법 선택 */}
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setFileCreationMode('select-existing')}
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
                          onClick={() => setFileCreationMode('create-new')}
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

                      {/* 기존 파일 선택 UI */}
                      {fileCreationMode === 'select-existing' && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <h5 className="font-medium mb-3">기존 파일 선택</h5>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-2 block">프로젝트 선택</label>
                              <select 
                                className="w-full p-2 border rounded-md"
                                value={selectedProjectId}
                                onChange={(e) => handleProjectChange(e.target.value)}
                              >
                                <option value="">프로젝트를 선택하세요</option>
                                {projects.map((project) => (
                                  <option key={project.id} value={project.id}>
                                    {project.name} ({project.type})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">파일 선택</label>
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="파일 경로..."
                                  className="flex-1"
                                  value={selectedFilePath}
                                  onChange={(e) => setSelectedFilePath(e.target.value)}
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleFileSelectForNode}
                                  disabled={!selectedProjectId}
                                  title={!selectedProjectId ? "먼저 프로젝트를 선택해주세요" : "파일 선택"}
                                >
                                  <FolderOpen className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <Button 
                              className="w-full"
                              onClick={handleCreateFileNode}
                              disabled={!selectedProjectId || !selectedFilePath}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              FILE 노드 생성
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* 새 파일 생성 UI */}
                      {fileCreationMode === 'create-new' && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <h5 className="font-medium mb-3">새 파일 생성</h5>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-2 block">프로젝트 선택</label>
                              <select 
                                className="w-full p-2 border rounded-md"
                                value={selectedProjectId}
                                onChange={(e) => handleProjectChange(e.target.value)}
                              >
                                <option value="">프로젝트를 선택하세요</option>
                                {projects.map((project) => (
                                  <option key={project.id} value={project.id}>
                                    {project.name} ({project.type})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">저장 폴더</label>
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="폴더 경로..."
                                  className="flex-1"
                                  value={selectedFolderPath}
                                  onChange={(e) => setSelectedFolderPath(e.target.value)}
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleFolderSelectForNode}
                                  disabled={!selectedProjectId}
                                  title={!selectedProjectId ? "먼저 프로젝트를 선택해주세요" : "폴더 선택"}
                                >
                                  <FolderOpen className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">파일명</label>
                              <Input
                                placeholder="새 파일명을 입력하세요 (예: example.ts)"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">파일 타입</label>
                              <select className="w-full p-2 border rounded-md">
                                <option value="typescript">TypeScript (.ts)</option>
                                <option value="javascript">JavaScript (.js)</option>
                                <option value="python">Python (.py)</option>
                                <option value="java">Java (.java)</option>
                                <option value="text">텍스트 (.txt)</option>
                                <option value="json">JSON (.json)</option>
                                <option value="yaml">YAML (.yaml)</option>
                                <option value="other">기타</option>
                              </select>
                            </div>
                            <Button 
                              className="w-full"
                              onClick={handleCreateFileNode}
                              disabled={!selectedProjectId || !selectedFolderPath || !newFileName}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              파일 생성 후 노드 생성
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* API 탭 콘텐츠 */}
              {activeNodeTab === 'api' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">API 노드 생성</h4>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">API 타입</label>
                          <select 
                            className="w-full p-2 border rounded-md"
                            value={apiData.type}
                            onChange={(e) => setApiData({...apiData, type: e.target.value})}
                          >
                            <option value="rest">REST API</option>
                            <option value="graphql">GraphQL</option>
                            <option value="websocket">WebSocket</option>
                            <option value="grpc">gRPC</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">엔드포인트 URL</label>
                          <Input
                            placeholder="https://api.example.com/v1/users"
                            value={apiData.url}
                            onChange={(e) => setApiData({...apiData, url: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">HTTP 메서드</label>
                          <select 
                            className="w-full p-2 border rounded-md"
                            value={apiData.method}
                            onChange={(e) => setApiData({...apiData, method: e.target.value})}
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">설명</label>
                          <Input
                            placeholder="API 설명..."
                            value={apiData.description}
                            onChange={(e) => setApiData({...apiData, description: e.target.value})}
                          />
                        </div>
                        <Button 
                          className="w-full"
                          onClick={handleCreateApiNode}
                          disabled={!apiData.url || !apiData.description}
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          API 노드 생성
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DB 탭 콘텐츠 */}
              {activeNodeTab === 'db' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">DB 노드 생성</h4>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">데이터베이스 타입</label>
                          <select 
                            className="w-full p-2 border rounded-md"
                            value={dbData.type}
                            onChange={(e) => setDbData({...dbData, type: e.target.value})}
                          >
                            <option value="mysql">MySQL</option>
                            <option value="postgresql">PostgreSQL</option>
                            <option value="sqlite">SQLite</option>
                            <option value="mongodb">MongoDB</option>
                            <option value="oracle">Oracle</option>
                            <option value="redis">Redis</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">연결 문자열</label>
                          <Input
                            placeholder="데이터베이스 연결 문자열..."
                            type="password"
                            value={dbData.connectionString}
                            onChange={(e) => setDbData({...dbData, connectionString: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">스키마/데이터베이스명</label>
                          <Input
                            placeholder="스키마 또는 데이터베이스명..."
                            value={dbData.schema}
                            onChange={(e) => setDbData({...dbData, schema: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">테이블명 (선택사항)</label>
                          <Input
                            placeholder="특정 테이블명..."
                            value={dbData.table}
                            onChange={(e) => setDbData({...dbData, table: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">설명</label>
                          <Input
                            placeholder="DB 연결 설명..."
                            value={dbData.description}
                            onChange={(e) => setDbData({...dbData, description: e.target.value})}
                          />
                        </div>
                        <Button 
                          className="w-full"
                          onClick={handleCreateDbNode}
                          disabled={!dbData.connectionString || !dbData.schema}
                        >
                          <Database className="h-4 w-4 mr-2" />
                          DB 노드 생성
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">일반 설정</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">자동 저장</label>
                  <Button variant="outline" size="sm">켜짐</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">백업 생성</label>
                  <Button variant="outline" size="sm">활성화</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">알림</label>
                  <Button variant="outline" size="sm">켜짐</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">테마</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">다크 모드</label>
                  <Button variant="outline" size="sm">비활성화</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">컬러 테마</label>
                  <Button variant="outline" size="sm">기본</Button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">폰트</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">폰트 크기</label>
                  <Button variant="outline" size="sm">14px</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">폰트 패밀리</label>
                  <Button variant="outline" size="sm">Pretendard</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'editor':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">편집기 옵션</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">미니맵 표시</label>
                  <Button variant="outline" size="sm">표시</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">그리드 스냅</label>
                  <Button variant="outline" size="sm">활성화</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">자동 정렬</label>
                  <Button variant="outline" size="sm">켜짐</Button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">노드 설정</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">자동 연결</label>
                  <Button variant="outline" size="sm">활성화</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">노드 미리보기</label>
                  <Button variant="outline" size="sm">표시</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">노드 조작</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">새 노드 추가</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + N</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">노드 삭제</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Delete</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">노드 복사</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + C</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">노드 붙여넣기</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + V</kbd>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">선택 및 네비게이션</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">전체 선택</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + A</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">화면 맞춤</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + 0</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">확대</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + +</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">축소</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + -</kbd>
                </div>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">애플리케이션 정보</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">버전</span>
                  <span className="text-sm">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">빌드 날짜</span>
                  <span className="text-sm">2025-08-06</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">개발자</span>
                  <span className="text-sm">ITOL Team</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">라이선스</h3>
              <div className="text-sm text-gray-600">
                <p>MIT License</p>
                <p className="mt-2">
                  이 소프트웨어는 MIT 라이선스 하에 배포됩니다.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] p-0 h-[600px]" showCloseButton={true}>
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-semibold">설정</DialogTitle>
          </DialogHeader>
          
          <div className="flex h-[calc(600px-120px)]">
            {/* 왼쪽 메뉴 */}
            <div className="w-48 border-r bg-gray-50 p-4">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                        activeSection === item.id
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {activeSection === item.id && (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 오른쪽 콘텐츠 */}
            <div className="flex-1 p-6 overflow-y-auto">
              {renderContent()}
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={onClose}>
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 프로젝트 추가/편집 모달 */}
      {(isAddingNew || editingProject) && (
        <Dialog open={true} onOpenChange={handleCancelEdit}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isAddingNew ? '새 프로젝트 추가' : '프로젝트 편집'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">프로젝트 이름</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="프로젝트 이름을 입력하세요"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">프로젝트 타입</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROJECT_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant={formData.type === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className="capitalize"
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">프로젝트 경로</label>
                <div className="flex space-x-2">
                  <Input
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    placeholder="프로젝트 경로를 입력하세요"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFolderSelectInModal}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">설명 (선택사항)</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="프로젝트 설명을 입력하세요"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleCancelEdit}>
                  취소
                </Button>
                <Button
                  onClick={handleSaveProject}
                  disabled={!formData.name || !formData.path}
                >
                  {isAddingNew ? '추가' : '저장'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default SettingsModal;
