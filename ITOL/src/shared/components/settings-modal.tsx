import React, { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { invoke } from "@tauri-apps/api/core";

// 분리된 모듈들 import
import type { 
  SettingsModalProps, 
  Project, 
  MenuSection, 
  NodeType, 
  FileCreationMode, 
  ConfirmDialogState,
  ProjectFormData
} from './settings-modal/types';

import { 
  selectProjectFolder, 
  extractProjectNameFromPath, 
  validateProject, 
  checkProjectDuplicate, 
  createProjectWithPermissions,
  removeProjectWithPermissions,
  loadProjectsFromBackend
} from './settings-modal/project-management';

import { 
  createFileNode
} from './settings-modal/node-creation';

import { 
  ProjectManagementSection, 
  ConfirmDialog, 
  NodeCreationTabs, 
  MenuSidebar,
  NodeCreationForm
} from './settings-modal/dialog-components';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onCreateFileNode }) => {
  const [activeSection, setActiveSection] = useState<MenuSection>('projects');
  const [activeNodeTab, setActiveNodeTab] = useState<NodeType>('file');
  const [fileCreationMode, setFileCreationMode] = useState<FileCreationMode>('select-existing');
  
  // 프로젝트 관리 상태
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 컴포넌트 마운트 시 백엔드에서 프로젝트 목록 로드
  React.useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      try {
        const loadedProjects = await loadProjectsFromBackend();
        setProjects(loadedProjects);
      } catch (error) {
        console.error('프로젝트 목록 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
  }, []);
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    type: "typescript",
    path: "",
    description: ""
  });

  // 노드 생성 관련 상태
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedFileForNode, setSelectedFileForNode] = useState<string>("");
  
  // 확인 다이얼로그 상태
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // 프로젝트 관리 핸들러들
  const handleFolderSelect = useCallback(async () => {
    try {
      const selected = await selectProjectFolder();
      if (selected) {
        setFormData(prev => ({ ...prev, path: selected }));
      }
    } catch (error) {
      console.error('폴더 선택 중 오류 발생:', error);
    }
  }, []);

  const handleQuickAdd = useCallback(async () => {
    if (formData.path.trim()) {
      setIsLoading(true);
      try {
        const projectName = extractProjectNameFromPath(formData.path);
        
        const validationErrors = await validateProject({
          name: projectName,
          path: formData.path,
          type: formData.type
        });
        
        if (validationErrors.length > 0) {
          alert(validationErrors.join('\n'));
          return;
        }
        
        const duplicateError = checkProjectDuplicate(projects, {
          name: projectName,
          path: formData.path
        });
        
        if (duplicateError) {
          alert(duplicateError);
          return;
        }
        
        const newProject = await createProjectWithPermissions(
          projectName,
          formData.type,
          formData.path,
          formData.description
        );
        
        if (newProject) {
          setProjects(prev => [...prev, newProject]);
          setFormData({
            name: "",
            type: "typescript",
            path: "",
            description: ""
          });
          setIsAddingNew(false);
          alert('프로젝트가 성공적으로 추가되었습니다. 해당 경로에 대한 읽기 권한도 자동으로 추가되었습니다.');
        } else {
          alert('프로젝트 추가에 실패했습니다.');
        }
      } catch (error) {
        console.error('프로젝트 추가 중 오류:', error);
        alert('프로젝트 추가 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [formData, projects]);

  const handleEditProject = useCallback((project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      type: project.type,
      path: project.path,
      description: project.description || ""
    });
  }, []);

  const handleSaveProject = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAddingNew) {
        // 유효성 검사
        const validationErrors = await validateProject(formData);
        if (validationErrors.length > 0) {
          alert(validationErrors.join('\n'));
          return;
        }
        
        // 중복 검사
        const duplicateError = checkProjectDuplicate(projects, formData);
        if (duplicateError) {
          alert(duplicateError);
          return;
        }
        
        const newProject = await createProjectWithPermissions(
          formData.name,
          formData.type,
          formData.path,
          formData.description
        );
        
        if (newProject) {
          setProjects(prev => [...prev, newProject]);
          alert('프로젝트가 성공적으로 추가되었습니다. 해당 경로에 대한 읽기 권한도 자동으로 추가되었습니다.');
        } else {
          alert('프로젝트 추가에 실패했습니다.');
        }
      } else if (editingProject) {
        // 편집 모드의 경우 로컬에서만 업데이트 (백엔드 업데이트 API 추가 필요)
        // 유효성 검사
        const validationErrors = await validateProject(formData);
        if (validationErrors.length > 0) {
          alert(validationErrors.join('\n'));
          return;
        }
        
        // 중복 검사 (자신 제외)
        const duplicateError = checkProjectDuplicate(projects, formData, editingProject.id);
        if (duplicateError) {
          alert(duplicateError);
          return;
        }
        
        setProjects(prev => prev.map(p => 
          p.id === editingProject.id ? { ...editingProject, ...formData } : p
        ));
        alert('프로젝트 정보가 업데이트되었습니다.');
      }
      
      setIsAddingNew(false);
      setEditingProject(null);
      setFormData({ name: "", type: "typescript", path: "", description: "" });
    } catch (error) {
      console.error('프로젝트 저장 중 오류:', error);
      alert('프로젝트 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [isAddingNew, editingProject, formData, projects]);

  const handleCancelEdit = useCallback(() => {
    setIsAddingNew(false);
    setEditingProject(null);
    setFormData({ name: "", type: "typescript", path: "", description: "" });
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const confirmed = window.confirm('정말로 이 프로젝트를 삭제하시겠습니까? 프로젝트 관련 경로 권한도 함께 제거됩니다.');
      if (!confirmed) return;

      const deleted = await removeProjectWithPermissions(projectId);
      if (deleted) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
      } else {
        
      }
    } catch (error) {
      console.error('프로젝트 삭제 중 오류:', error);
      alert('프로젝트 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddNewProject = useCallback(() => {
    setIsAddingNew(true);
    setEditingProject(null);
    setFormData({ name: "", type: "typescript", path: "", description: "" });
  }, []);

  const handleFormDataChange = useCallback((field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 노드 생성 핸들러들
  const handleProjectChange = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedFileForNode("");
  }, []);

  const handleFileSelect = useCallback((filePath: string) => {
    setSelectedFileForNode(filePath);
  }, []);

  const handleCreateFileNode = useCallback(async () => {
    if (!selectedProjectId || !selectedFileForNode) {
      alert('프로젝트와 파일을 선택해주세요.');
      return;
    }
    
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject) {
      alert('선택된 프로젝트를 찾을 수 없습니다.');
      return;
    }
    
    try {
      let filePath = selectedFileForNode;
      let fileName = selectedFileForNode.split('/').pop() || selectedFileForNode.split('\\').pop() || '';
      let fileExtension = '';
      
      // 새 파일 생성 모드인 경우
      if (fileCreationMode === 'create-new') {
        // 파일명 검증
        if (!fileName.trim()) {
          alert('파일명을 입력해주세요.');
          return;
        }
        
        // 확장자 확인
        if (!fileName.endsWith('.ts') && !fileName.endsWith('.js')) {
          alert('파일명에 .ts 또는 .js 확장자를 포함해주세요.');
          return;
        }
        
        setConfirmDialog({
          isOpen: true,
          title: "새 파일 생성 및 노드 추가",
          message: `"${fileName}" 파일을 생성하고 노드를 추가하시겠습니까?\n\n파일 경로: ${selectedProject.path}/${fileName}\n\n기본 템플릿이 자동으로 적용됩니다.`,
          onConfirm: async () => {
            try {
              // Tauri 백엔드를 통해 템플릿과 함께 파일 생성
              const result = await invoke<{
                file_path: string;
                file_name: string;
                file_extension: string;
                template_applied: boolean;
              }>('create_file_with_template_command', {
                newFileName: fileName,
                path: selectedProject.path
              });
              
              console.log('✅ 파일 생성 완료:', result);
              
              // 생성된 파일로 노드 자동 생성
              const nodeId = createFileNode(
                result.file_path, 
                onCreateFileNode
              );
              
              console.log(`✅ 노드 자동 생성 완료! Node ID: ${nodeId}`);
              
              if (result.template_applied) {
                alert(`파일이 생성되고 노드가 추가되었습니다!\n\n파일: ${result.file_path}\n템플릿: 적용됨\n\n생성된 파일을 편집하여 로직을 구현하세요.`);
              } else {
                alert(`파일이 생성되고 노드가 추가되었습니다!\n\n파일: ${result.file_path}`);
              }
              
              closeConfirmDialog();
              onClose();
              
            } catch (error) {
              console.error('❌ 파일 생성 실패:', error);
              alert(`파일 생성에 실패했습니다.\n\n오류: ${error}`);
              closeConfirmDialog();
            }
          }
        });
        
      } else {
        // 기존 파일 선택 모드
        setConfirmDialog({
          isOpen: true,
          title: "FILE 노드 생성",
          message: `"${fileName}" 파일로 노드를 생성하시겠습니까?\n생성 후 설정 창을 닫습니다.`,
          onConfirm: () => {
            console.log('파일 노드 생성:', { 
              projectId: selectedProjectId, 
              projectName: selectedProject?.name,
              filePath: selectedFileForNode 
            });
            
            const nodeId = createFileNode(selectedFileForNode, onCreateFileNode);
            console.log(`FILE 노드가 생성되었습니다! Node ID: ${nodeId}`);
            
            closeConfirmDialog();
            onClose();
          }
        });
      }
      
    } catch (error) {
      console.error('노드 생성 중 오류:', error);
      alert(`노드 생성 중 오류가 발생했습니다.\n\n${error}`);
    }
  }, [selectedProjectId, selectedFileForNode, fileCreationMode, projects, onCreateFileNode, onClose]);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: () => {}
    });
  }, []);

  // 콘텐츠 렌더링
  const renderContent = () => {
    switch (activeSection) {
      case 'projects':
        return (
          <ProjectManagementSection
            projects={projects}
            editingProject={editingProject}
            isAddingNew={isAddingNew}
            formData={formData}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            onSave={handleSaveProject}
            onCancel={handleCancelEdit}
            onAddNew={handleAddNewProject}
            onQuickAdd={handleQuickAdd}
            onFolderSelect={handleFolderSelect}
            onFormDataChange={handleFormDataChange}
          />
        );
      
      case 'node-creation':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-4">노드 생성</h3>
              
              <NodeCreationTabs
                activeTab={activeNodeTab}
                onTabChange={setActiveNodeTab}
              />
              
              <div className="mt-6">
                <NodeCreationForm
                  activeTab={activeNodeTab}
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  selectedFile={selectedFileForNode}
                  fileCreationMode={fileCreationMode}
                  onProjectChange={handleProjectChange}
                  onFileSelect={handleFileSelect}
                  onFileCreationModeChange={setFileCreationMode}
                  onCreateFileNode={handleCreateFileNode}
                />
              </div>
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
          </div>
        );

      case 'editor':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">편집기 옵션</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">자동 완성</label>
                  <Button variant="outline" size="sm">켜짐</Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">구문 강조</label>
                  <Button variant="outline" size="sm">켜짐</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">키보드 단축키</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>새 노드</span>
                  <code className="px-2 py-1 bg-gray-100 rounded">Ctrl+N</code>
                </div>
                <div className="flex justify-between">
                  <span>설정 열기</span>
                  <code className="px-2 py-1 bg-gray-100 rounded">Ctrl+,</code>
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
                  <span className="text-sm text-gray-700">버전</span>
                  <span className="text-sm">1.0.0</span>
                </div>
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
        <DialogContent className="sm:max-w-[900px] p-0 h-[700px]" showCloseButton={true}>
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-semibold">설정</DialogTitle>
          </DialogHeader>
          
          <div className="flex h-[calc(700px-120px)]">
            <MenuSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />

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
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />
    </>
  );
};

// named export를 default export로도 제공
export default SettingsModal;
