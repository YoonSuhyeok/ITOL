import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { projectManager, Project, AllowedPath } from '../services/project-manager.service'
import { 
  Trash2, FolderPlus, Search, Shield, Eye, Edit, HardDrive, 
  Star, Clock, Folder, Grid, List 
} from 'lucide-react'

type ViewMode = 'projects' | 'paths'
type DisplayMode = 'grid' | 'list'

export const ProjectManagerComponent: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [allowedPaths, setAllowedPaths] = useState<AllowedPath[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('projects')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid')
  const [filterFavorites, setFilterFavorites] = useState(false)

  // 컴포넌트 마운트시 데이터 로드
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [projectsData, pathsData] = await Promise.all([
        projectManager.loadProjects(),
        projectManager.loadAllowedPaths()
      ])
      setProjects(projectsData)
      setAllowedPaths(pathsData)
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestProjectFolder = async () => {
    setIsLoading(true)
    try {
      const selectedPath = await projectManager.requestProjectFolder()
      if (selectedPath) {
        await loadData() // 데이터 새로고침
        console.log('프로젝트 폴더 추가됨:', selectedPath)
      }
    } catch (error) {
      console.error('프로젝트 폴더 요청 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveProject = async (projectId: string) => {
    setIsLoading(true)
    try {
      const success = await projectManager.removeProject(projectId)
      if (success) {
        await loadData() // 데이터 새로고침
        console.log('프로젝트 제거됨:', projectId)
      }
    } catch (error) {
      console.error('프로젝트 제거 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePath = async (path: string) => {
    setIsLoading(true)
    try {
      const success = await projectManager.removeAllowedPath(path)
      if (success) {
        await loadData() // 데이터 새로고침
        console.log('경로 제거됨:', path)
      }
    } catch (error) {
      console.error('경로 제거 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async (projectId: string) => {
    setIsLoading(true)
    try {
      await projectManager.toggleProjectFavorite(projectId)
      await loadData() // 데이터 새로고침
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAccessTypeColor = (accessType: string) => {
    return projectManager.getAccessTypeColor(accessType)
  }

  const getAccessTypeIcon = (accessType: string) => {
    switch (accessType) {
      case 'Read':
        return <Eye className="w-3 h-3" />
      case 'Write':
        return <Edit className="w-3 h-3" />
      case 'ReadWrite':
        return <Shield className="w-3 h-3" />
      default:
        return <HardDrive className="w-3 h-3" />
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFavorite = !filterFavorites || project.is_favorite
    
    return matchesSearch && matchesFavorite
  })

  const filteredPaths = allowedPaths.filter(path =>
    path.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    path.path.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Shield className="w-4 h-4" />
          프로젝트 관리 ({projects.length})
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            통합 프로젝트 & 경로 관리
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* 상단 컨트롤 */}
          <div className="flex gap-2 items-center flex-wrap">
            {/* 뷰 모드 선택 */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'projects' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('projects')}
                className="gap-1"
              >
                <Folder className="w-3 h-3" />
                프로젝트
              </Button>
              <Button
                variant={viewMode === 'paths' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('paths')}
                className="gap-1"
              >
                <HardDrive className="w-3 h-3" />
                경로
              </Button>
            </div>

            {/* 디스플레이 모드 */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={displayMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('grid')}
              >
                <Grid className="w-3 h-3" />
              </Button>
              <Button
                variant={displayMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('list')}
              >
                <List className="w-3 h-3" />
              </Button>
            </div>

            {/* 검색 */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={viewMode === 'projects' ? "프로젝트 검색..." : "경로 검색..."}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 필터 및 액션 */}
            {viewMode === 'projects' && (
              <Button
                variant={filterFavorites ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterFavorites(!filterFavorites)}
                className="gap-1"
              >
                <Star className="w-3 h-3" />
                즐겨찾기
              </Button>
            )}

            <Button 
              onClick={handleRequestProjectFolder}
              disabled={isLoading}
              className="gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              {viewMode === 'projects' ? '프로젝트 추가' : '폴더 추가'}
            </Button>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : viewMode === 'projects' ? (
              // 프로젝트 뷰
              filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <Folder className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">
                    {searchTerm || filterFavorites ? '검색 결과가 없습니다' : '프로젝트가 없습니다'}
                  </p>
                  <p className="text-sm text-center mb-4">
                    프로젝트 추가 버튼을 클릭하여 새로운 프로젝트를 추가하세요
                  </p>
                  <Button 
                    onClick={handleRequestProjectFolder}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    첫 번째 프로젝트 추가
                  </Button>
                </div>
              ) : displayMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{projectManager.getProjectTypeIcon(project.project_type)}</span>
                          <div>
                            <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                            <Badge 
                              variant="outline"
                              className={`text-xs ${getAccessTypeColor(project.access_type)}`}
                            >
                              {getAccessTypeIcon(project.access_type)}
                              {project.access_type}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(project.id)}
                            className={project.is_favorite ? 'text-yellow-500' : 'text-gray-400'}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProject(project.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 break-all mb-2">{project.path}</p>
                      
                      {project.description && (
                        <p className="text-xs text-gray-500 mb-2">{project.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>최근 접근: {new Date(project.last_accessed).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xl">{projectManager.getProjectTypeIcon(project.project_type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                              {project.is_favorite && <Star className="w-4 h-4 text-yellow-500" />}
                              <Badge 
                                variant="outline"
                                className={`text-xs ${getAccessTypeColor(project.access_type)}`}
                              >
                                {getAccessTypeIcon(project.access_type)}
                                {project.access_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 break-all mb-1">{project.path}</p>
                            {project.description && (
                              <p className="text-xs text-gray-500 mb-1">{project.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>최근 접근: {new Date(project.last_accessed).toLocaleDateString('ko-KR')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(project.id)}
                            className={project.is_favorite ? 'text-yellow-500' : 'text-gray-400'}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProject(project.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // 경로 뷰
              filteredPaths.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <HardDrive className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">
                    {searchTerm ? '검색 결과가 없습니다' : '허용된 경로가 없습니다'}
                  </p>
                  <p className="text-sm text-center mb-4">
                    폴더 추가 버튼을 클릭하여 새로운 경로를 추가하세요
                  </p>
                  <Button 
                    onClick={handleRequestProjectFolder}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    첫 번째 폴더 추가
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredPaths.map((allowedPath, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900 truncate">{allowedPath.name}</h3>
                            <Badge 
                              variant="outline"
                              className={`gap-1 ${getAccessTypeColor(allowedPath.access_type)}`}
                            >
                              {getAccessTypeIcon(allowedPath.access_type)}
                              {allowedPath.access_type}
                            </Badge>
                            {allowedPath.is_project_path && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                프로젝트 경로
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 break-all mb-2">{allowedPath.path}</p>
                          
                          <p className="text-xs text-gray-400">
                            추가 시간: {new Date(allowedPath.added_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemovePath(allowedPath.path)}
                          disabled={isLoading || allowedPath.is_project_path}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* 하단 정보 */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <strong>프로젝트: {projects.length}개</strong> | 
                <strong> 허용 경로: {allowedPaths.length}개</strong> | 
                <strong> 즐겨찾기: {projects.filter(p => p.is_favorite).length}개</strong>
              </div>
              <div className="text-right">
                통합 관리 시스템으로 프로젝트와 경로를 함께 관리합니다
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProjectManagerComponent
