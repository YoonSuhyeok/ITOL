import { open } from '@tauri-apps/plugin-dialog';
import type { Project, ProjectType } from './types';
import { isValidDirectory } from './file-system';
import { projectManager } from '../../services/project-manager.service';

/**
 * 프로젝트 관리 관련 유틸리티 함수들
 */

/**
 * 폴더 선택 다이얼로그를 열고 선택된 경로를 반환
 */
export async function selectProjectFolder(): Promise<string | null> {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: '프로젝트 폴더 선택'
    });
    
    if (selected && typeof selected === 'string') {
      return selected;
    }
    
    return null;
  } catch (error) {
    console.error('폴더 선택 중 오류 발생:', error);
    throw new Error('폴더를 선택할 수 없습니다.');
  }
}

/**
 * 경로에서 프로젝트 이름을 추출
 */
export function extractProjectNameFromPath(path: string): string {
  if (!path.trim()) return 'New Project';
  
  const pathParts = path.replace(/\\/g, '/').split('/');
  return pathParts[pathParts.length - 1] || 'New Project';
}

/**
 * 프로젝트 유효성 검사
 */
export async function validateProject(project: Partial<Project>): Promise<string[]> {
  const errors: string[] = [];
  
  if (!project.name?.trim()) {
    errors.push('프로젝트 이름은 필수입니다.');
  }
  
  if (!project.path?.trim()) {
    errors.push('프로젝트 경로는 필수입니다.');
  } else {
    const isValid = await isValidDirectory(project.path);
    if (!isValid) {
      errors.push('유효하지 않은 프로젝트 경로입니다.');
    }
  }
  
  if (!project.type) {
    errors.push('프로젝트 타입을 선택해야 합니다.');
  }
  
  return errors;
}

/**
 * 프로젝트 중복 확인
 */
export function checkProjectDuplicate(
  projects: Project[], 
  newProject: Partial<Project>, 
  excludeId?: string
): string | null {
  const nameExists = projects.some(p => 
    p.id !== excludeId && 
    p.name.toLowerCase() === newProject.name?.toLowerCase()
  );
  
  if (nameExists) {
    return '동일한 이름의 프로젝트가 이미 존재합니다.';
  }
  
  const pathExists = projects.some(p => 
    p.id !== excludeId && 
    p.path === newProject.path
  );
  
  if (pathExists) {
    return '동일한 경로의 프로젝트가 이미 존재합니다.';
  }
  
  return null;
}

/**
 * 새 프로젝트 생성 (백엔드와 연동하여 실제로 프로젝트 및 경로 권한 추가)
 */
export async function createProjectWithPermissions(
  name: string,
  type: ProjectType,
  path: string,
  description?: string
): Promise<Project | null> {
  try {
    // 프로젝트 타입을 백엔드 형식으로 변환
    const backendProjectType = mapProjectTypeToBackend(type);
    
    // 백엔드에 프로젝트 추가 (자동으로 경로 권한도 추가됨)
    const addedProject = await projectManager.addProject(
      name.trim(),
      path.trim(),
      description?.trim(),
      backendProjectType,
      'readwrite'
    );
    
    if (addedProject) {
      // 백엔드 Project 타입을 프론트엔드 Project 타입으로 변환
      return {
        id: addedProject.id,
        name: addedProject.name,
        type: mapBackendProjectTypeToFrontend(addedProject.project_type),
        path: addedProject.path,
        description: addedProject.description
      };
    }
    
    return null;
  } catch (error) {
    console.error('프로젝트 생성 중 오류 발생:', error);
    throw new Error('프로젝트 생성에 실패했습니다.');
  }
}

/**
 * 프론트엔드 프로젝트 타입을 백엔드 형식으로 변환
 */
function mapProjectTypeToBackend(type: ProjectType): string {
  const typeMapping: Record<ProjectType, string> = {
    typescript: 'typescript',
    javascript: 'javascript',
    python: 'python',
    java: 'other',
    csharp: 'other',
    cpp: 'other',
    rust: 'rust',
    go: 'other',
    other: 'other'
  };
  
  return typeMapping[type];
}

/**
 * 백엔드 프로젝트 타입을 프론트엔드 형식으로 변환
 */
function mapBackendProjectTypeToFrontend(backendType: any): ProjectType {
  if (typeof backendType === 'string') {
    switch (backendType) {
      case 'TypeScript': return 'typescript';
      case 'JavaScript': return 'javascript';
      case 'Python': return 'python';
      case 'Rust': return 'rust';
      case 'NodeJs': return 'javascript';
      case 'React': return 'typescript';
      case 'Vue': return 'typescript';
      case 'Angular': return 'typescript';
      default: return 'other';
    }
  } else if (typeof backendType === 'object' && 'Other' in backendType) {
    return 'other';
  }
  
  return 'other';
}

/**
 * 기존 프로젝트 제거 (백엔드와 연동)
 */
export async function removeProjectWithPermissions(projectId: string): Promise<boolean> {
  try {
    return await projectManager.removeProject(projectId);
  } catch (error) {
    console.error('프로젝트 제거 중 오류 발생:', error);
    throw new Error('프로젝트 제거에 실패했습니다.');
  }
}

/**
 * 백엔드에서 프로젝트 목록 로드
 */
export async function loadProjectsFromBackend(): Promise<Project[]> {
  try {
    const backendProjects = await projectManager.loadProjects();
    
    return backendProjects.map(project => ({
      id: project.id,
      name: project.name,
      type: mapBackendProjectTypeToFrontend(project.project_type),
      path: project.path,
      description: project.description
    }));
  } catch (error) {
    console.error('프로젝트 목록 로드 중 오류 발생:', error);
    return [];
  }
}

/**
 * 프로젝트 업데이트
 */
export function updateProject(
  existingProject: Project,
  updates: Partial<Omit<Project, 'id'>>
): Project {
  return {
    ...existingProject,
    ...updates,
    name: updates.name?.trim() || existingProject.name,
    path: updates.path?.trim() || existingProject.path,
    description: updates.description?.trim() || existingProject.description
  };
}

/**
 * 프로젝트 목록에서 프로젝트 제거
 */
export function removeProject(projects: Project[], projectId: string): Project[] {
  return projects.filter(p => p.id !== projectId);
}

/**
 * 프로젝트를 목록에 추가
 */
export function addProject(projects: Project[], newProject: Project): Project[] {
  return [...projects, newProject];
}

/**
 * 프로젝트를 목록에서 업데이트
 */
export function updateProjectInList(
  projects: Project[], 
  projectId: string, 
  updatedProject: Project
): Project[] {
  return projects.map(p => p.id === projectId ? updatedProject : p);
}

/**
 * 프로젝트 ID로 프로젝트 찾기
 */
export function findProjectById(projects: Project[], projectId: string): Project | undefined {
  return projects.find(p => p.id === projectId);
}

/**
 * 프로젝트 타입에 따른 기본 설명 생성
 */
export function getDefaultProjectDescription(type: ProjectType): string {
  const descriptions: Record<ProjectType, string> = {
    typescript: 'TypeScript 기반 프로젝트',
    javascript: 'JavaScript 기반 프로젝트',
    python: 'Python 기반 프로젝트',
    java: 'Java 기반 프로젝트',
    csharp: 'C# 기반 프로젝트',
    cpp: 'C++ 기반 프로젝트',
    rust: 'Rust 기반 프로젝트',
    go: 'Go 기반 프로젝트',
    other: '기타 프로젝트'
  };
  
  return descriptions[type];
}
