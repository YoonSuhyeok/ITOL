import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { cn } from '@/shared/lib/utils';
import { File, Plus, FileText } from 'lucide-react';
import type { 
  Project, 
  FileCreationMode 
} from './settings-modal/types';
import { loadProjectsFromBackend } from './settings-modal/project-management';
import { FileExplorer } from './settings-modal/dialog-components';

interface NodeCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFileNode: (filePath: string, fileName: string, fileExtension: string) => void;
}

export const NodeCreationDialog: React.FC<NodeCreationDialogProps> = ({
  isOpen,
  onClose,
  onCreateFileNode
}) => {
  const [fileCreationMode, setFileCreationMode] = useState<FileCreationMode>('select-existing');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 프로젝트 목록 로드
  useEffect(() => {
    const loadProjects = async () => {
      if (!isOpen) return;
      
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
  }, [isOpen]);

  // 다이얼로그 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setSelectedFile('');
    }
  }, [isOpen]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleCreateFileNode = () => {
    if (selectedProjectId && selectedFile) {
      // 파일 경로에서 파일명과 확장자 추출
      const pathParts = selectedFile.replace(/\\/g, '/').split('/');
      const fullFileName = pathParts[pathParts.length - 1] || selectedFile;
      const lastDotIndex = fullFileName.lastIndexOf('.');
      const fileName = lastDotIndex > 0 ? fullFileName.substring(0, lastDotIndex) : fullFileName;
      const fileExtension = lastDotIndex > 0 ? fullFileName.substring(lastDotIndex + 1) : '';
      
      onCreateFileNode(selectedFile, fileName, fileExtension);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>FILE 노드 생성</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <h4 className="text-sm font-medium mb-3">FILE 노드 생성 방법</h4>
            
            {/* 생성 방법 선택 */}
            <div className="space-y-4">
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

              {/* 프로젝트 선택 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">프로젝트 선택</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        setSelectedFile('');
                      }}
                    >
                      <option value="">프로젝트를 선택하세요</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.type})
                        </option>
                      ))}
                    </select>
                    
                    {projects.length === 0 && !isLoading && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-center">
                        <p className="text-sm text-yellow-700 mb-2">등록된 프로젝트가 없습니다.</p>
                        <p className="text-xs text-yellow-600">설정에서 프로젝트를 먼저 추가해주세요.</p>
                      </div>
                    )}
                  </div>
                  
                  {/* 파일 탐색기 - 기존 파일 선택 */}
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
                          onFileSelect={setSelectedFile}
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
                  
                  {/* 새 파일 생성 폼 */}
                  {selectedProject && fileCreationMode === 'create-new' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">새 파일 생성</label>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">파일명</label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded-md text-sm"
                            placeholder="예: processData.ts"
                            value={selectedFile}
                            onChange={(e) => setSelectedFile(e.target.value)}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            💡 .ts 또는 .js 확장자를 포함하여 입력하세요
                          </p>
                        </div>
                        
                        {selectedFile && (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            <div className="font-medium text-blue-800">생성될 파일 경로:</div>
                            <div className="text-blue-600 font-mono text-xs mt-1 break-all">
                              {selectedProject.path}/{selectedFile}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full"
                    onClick={handleCreateFileNode}
                    disabled={!selectedProjectId || !selectedFile}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {fileCreationMode === 'create-new' ? '파일 생성 및 노드 추가' : 'FILE 노드 생성'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NodeCreationDialog;
