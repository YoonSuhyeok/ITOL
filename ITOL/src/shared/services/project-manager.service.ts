import { invoke } from '@tauri-apps/api/core'

export interface Project {
  id: string
  name: string
  path: string
  description?: string
  created_at: string
  last_accessed: string
  access_type: 'Read' | 'Write' | 'ReadWrite'
  project_type: 'NodeJs' | 'Python' | 'Rust' | 'TypeScript' | 'JavaScript' | 'React' | 'Vue' | 'Angular' | { Other: string }
  is_favorite: boolean
}

export interface AllowedPath {
  path: string
  name: string
  added_at: string
  access_type: 'Read' | 'Write' | 'ReadWrite'
  is_project_path: boolean
}

export class ProjectManagerService {
  private static instance: ProjectManagerService
  private projects: Project[] = []
  private allowedPaths: AllowedPath[] = []

  private constructor() {
    this.loadProjects()
    this.loadAllowedPaths()
  }

  public static getInstance(): ProjectManagerService {
    if (!ProjectManagerService.instance) {
      ProjectManagerService.instance = new ProjectManagerService()
    }
    return ProjectManagerService.instance
  }

  /**
   * 프로젝트 목록을 로드합니다
   */
  public async loadProjects(): Promise<Project[]> {
    try {
      this.projects = await invoke<Project[]>('get_projects_command')
      return this.projects
    } catch (error) {
      console.error('프로젝트 목록 로드 실패:', error)
      return []
    }
  }

  /**
   * 새로운 프로젝트를 추가합니다
   */
  public async addProject(
    name: string,
    path: string,
    description?: string,
    projectType: string = 'other',
    accessType: 'read' | 'write' | 'readwrite' = 'readwrite'
  ): Promise<Project | null> {
    try {
      const project = await invoke<Project>('add_project_command', {
        name,
        path,
        description,
        projectType,
        accessType
      })
      
      // 로컬 캐시 업데이트
      await this.loadProjects()
      await this.loadAllowedPaths()
      
      return project
    } catch (error) {
      console.error('프로젝트 추가 실패:', error)
      return null
    }
  }

  /**
   * 프로젝트를 제거합니다
   */
  public async removeProject(projectId: string): Promise<boolean> {
    try {
      const removed = await invoke<boolean>('remove_project_command', { projectId })
      
      if (removed) {
        // 로컬 캐시 업데이트
        await this.loadProjects()
        await this.loadAllowedPaths()
      }
      
      return removed
    } catch (error) {
      console.error('프로젝트 제거 실패:', error)
      return false
    }
  }

  /**
   * 프로젝트 즐겨찾기를 토글합니다
   */
  public async toggleProjectFavorite(projectId: string): Promise<boolean> {
    try {
      const isFavorite = await invoke<boolean>('toggle_project_favorite_command', { projectId })
      
      // 로컬 캐시 업데이트
      await this.loadProjects()
      
      return isFavorite
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error)
      return false
    }
  }

  /**
   * 허용된 경로 목록을 로드합니다
   */
  public async loadAllowedPaths(): Promise<AllowedPath[]> {
    try {
      this.allowedPaths = await invoke<AllowedPath[]>('get_allowed_paths_command')
      return this.allowedPaths
    } catch (error) {
      console.error('허용된 경로 목록 로드 실패:', error)
      return []
    }
  }

  /**
   * 새로운 경로를 허용 목록에 추가합니다
   */
  public async addAllowedPath(
    path: string,
    name: string,
    accessType: 'read' | 'write' | 'readwrite' = 'readwrite'
  ): Promise<boolean> {
    try {
      await invoke('add_allowed_path_command', {
        path,
        name,
        accessType
      })
      
      // 로컬 캐시 업데이트
      await this.loadAllowedPaths()
      return true
    } catch (error) {
      console.error('경로 추가 실패:', error)
      return false
    }
  }

  /**
   * 허용된 경로를 제거합니다
   */
  public async removeAllowedPath(path: string): Promise<boolean> {
    try {
      const removed = await invoke<boolean>('remove_allowed_path_command', { path })
      
      if (removed) {
        // 로컬 캐시 업데이트
        await this.loadAllowedPaths()
      }
      
      return removed
    } catch (error) {
      console.error('경로 제거 실패:', error)
      return false
    }
  }

  /**
   * 프로젝트 폴더 선택 다이얼로그를 열고 자동으로 프로젝트로 추가합니다
   */
  public async requestProjectFolder(): Promise<string | null> {
    try {
      const selectedPath = await invoke<string | null>('request_project_folder_command')
      
      if (selectedPath) {
        // 로컬 캐시 업데이트
        await this.loadProjects()
        await this.loadAllowedPaths()
      }
      
      return selectedPath
    } catch (error) {
      console.error('프로젝트 폴더 요청 실패:', error)
      return null
    }
  }

  /**
   * 경로의 프로젝트 타입을 자동 감지합니다
   */
  public async detectProjectType(path: string): Promise<string> {
    try {
      return await invoke<string>('detect_project_type_command', { path })
    } catch (error) {
      console.error('프로젝트 타입 감지 실패:', error)
      return 'other'
    }
  }

  /**
   * 현재 캐시된 프로젝트 목록을 반환합니다
   */
  public getProjects(): Project[] {
    return [...this.projects]
  }

  /**
   * 현재 캐시된 허용 경로 목록을 반환합니다
   */
  public getAllowedPaths(): AllowedPath[] {
    return [...this.allowedPaths]
  }

  /**
   * 즐겨찾기 프로젝트만 반환합니다
   */
  public getFavoriteProjects(): Project[] {
    return this.projects.filter(project => project.is_favorite)
  }

  /**
   * 최근 접근한 프로젝트들을 반환합니다 (상위 10개)
   */
  public getRecentProjects(): Project[] {
    return [...this.projects]
      .sort((a, b) => new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime())
      .slice(0, 10)
  }

  /**
   * 프로젝트 타입별로 필터링합니다
   */
  public getProjectsByType(projectType: string): Project[] {
    return this.projects.filter(project => {
      if (typeof project.project_type === 'string') {
        return project.project_type.toLowerCase() === projectType.toLowerCase()
      } else if (typeof project.project_type === 'object' && 'Other' in project.project_type) {
        return project.project_type.Other.toLowerCase() === projectType.toLowerCase()
      }
      return false
    })
  }

  /**
   * 프로젝트 이름 또는 경로로 검색합니다
   */
  public searchProjects(searchTerm: string): Project[] {
    const term = searchTerm.toLowerCase()
    return this.projects.filter(project =>
      project.name.toLowerCase().includes(term) ||
      project.path.toLowerCase().includes(term) ||
      (project.description && project.description.toLowerCase().includes(term))
    )
  }

  /**
   * 경로 이름으로 검색합니다
   */
  public searchAllowedPaths(searchTerm: string): AllowedPath[] {
    const term = searchTerm.toLowerCase()
    return this.allowedPaths.filter(path =>
      path.name.toLowerCase().includes(term) ||
      path.path.toLowerCase().includes(term)
    )
  }

  /**
   * 프로젝트 타입별 아이콘을 반환합니다
   */
  public getProjectTypeIcon(projectType: Project['project_type']): string {
    if (typeof projectType === 'string') {
      switch (projectType) {
        case 'NodeJs': return '🟢'
        case 'Python': return '🐍'
        case 'Rust': return '🦀'
        case 'TypeScript': return '🔷'
        case 'JavaScript': return '🟨'
        case 'React': return '⚛️'
        case 'Vue': return '💚'
        case 'Angular': return '🔺'
        default: return '📁'
      }
    } else if (typeof projectType === 'object' && 'Other' in projectType) {
      return '📁'
    }
    return '📁'
  }

  /**
   * 접근 권한별 색상을 반환합니다
   */
  public getAccessTypeColor(accessType: string): string {
    switch (accessType) {
      case 'Read':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Write':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ReadWrite':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const projectManager = ProjectManagerService.getInstance()
