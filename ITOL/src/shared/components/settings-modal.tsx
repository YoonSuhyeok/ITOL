import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

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
  createProject 
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
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "ITOL Project",
      type: "typescript",
      path: "/Users/yoonsu/ITOL/ITOL",
      description: "Main ITOL application"
    },
    {
      id: "2", 
      name: "TTOL Project",
      type: "typescript",
      path: "/Users/yoonsu/TTOL",
      description: "TTOL project with bizcf files"
    }
  ]);
  
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
      
      const newProject = createProject(
        projectName,
        formData.type,
        formData.path,
        formData.description
      );
      
      setProjects(prev => [...prev, newProject]);
      setFormData({
        name: "",
        type: "typescript",
        path: "",
        description: ""
      });
      setIsAddingNew(false);
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
      
      const newProject = createProject(
        formData.name,
        formData.type,
        formData.path,
        formData.description
      );
      
      setProjects(prev => [...prev, newProject]);
    } else if (editingProject) {
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
    }
    
    setIsAddingNew(false);
    setEditingProject(null);
    setFormData({ name: "", type: "typescript", path: "", description: "" });
  }, [isAddingNew, editingProject, formData, projects]);

  const handleCancelEdit = useCallback(() => {
    setIsAddingNew(false);
    setEditingProject(null);
    setFormData({ name: "", type: "typescript", path: "", description: "" });
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
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

  const handleCreateFileNode = useCallback(() => {
    if (selectedProjectId && selectedFileForNode) {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      const fileName = selectedFileForNode.split('/').pop() || selectedFileForNode.split('\\').pop() || '';
      
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
  }, [selectedProjectId, selectedFileForNode, projects, onCreateFileNode, onClose]);

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
