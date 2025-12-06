use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::Manager;
// use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_accessed: chrono::DateTime<chrono::Utc>,
    pub access_type: ProjectAccessType,
    pub project_type: ProjectType,
    pub is_favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectAccessType {
    Read,
    Write,
    ReadWrite,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectType {
    NodeJs,
    Python,
    Rust,
    TypeScript,
    JavaScript,
    React,
    Vue,
    Angular,
    Other(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectManagerConfig {
    pub projects: HashMap<String, Project>,
    pub allowed_paths: HashMap<String, AllowedPath>,
    pub last_updated: chrono::DateTime<chrono::Utc>,
    pub default_project_location: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllowedPath {
    pub path: String,
    pub name: String,
    pub added_at: chrono::DateTime<chrono::Utc>,
    pub access_type: ProjectAccessType,
    pub is_project_path: bool,
}

impl Default for ProjectManagerConfig {
    fn default() -> Self {
        Self {
            projects: HashMap::new(),
            allowed_paths: HashMap::new(),
            last_updated: chrono::Utc::now(),
            default_project_location: None,
        }
    }
}

pub struct ProjectManager {
    config_path: PathBuf,
}

impl ProjectManager {
    pub fn new(app_data_dir: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let config_path = app_data_dir.join("project_manager.json");
        
        if !app_data_dir.exists() {
            std::fs::create_dir_all(app_data_dir)?;
        }
        
        Ok(Self { config_path })
    }

    /// 경로에 접근할 수 있는지 확인
    fn can_access_path(path: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let path_obj = Path::new(path);
        
        // 경로가 존재하는지 확인
        if !path_obj.exists() {
            return Ok(false);
        }
        
        // 먼저 기본적인 메타데이터 접근을 시도
        match std::fs::metadata(path_obj) {
            Ok(metadata) => {
                if metadata.is_dir() {
                    // 디렉토리인 경우에만 읽기 시도
                    match std::fs::read_dir(path_obj) {
                        Ok(_) => Ok(true),
                        Err(e) => {
                            eprintln!("디렉토리 읽기 실패: {} - {}", path, e);
                            // 읽기 실패해도 경로가 유효하면 true 반환
                            Ok(true)
                        }
                    }
                } else {
                    // 파일인 경우 존재하면 접근 가능
                    Ok(true)
                }
            },
            Err(e) => {
                eprintln!("경로 메타데이터 접근 실패: {} - {}", path, e);
                Ok(false)
            }
        }
    }

    /// 사용자에게 경로 접근 권한을 요청 (현재는 단순 확인으로 구현)
    pub async fn request_path_permission(
        _app_handle: &tauri::AppHandle,
        path: &str,
    ) -> Result<bool, Box<dyn std::error::Error>> {
        // 현재는 경로 접근 가능 여부만 확인
        // 나중에 필요하면 사용자 다이얼로그 추가 가능
        Self::can_access_path(path)
    }

    pub async fn load_config(&self) -> Result<ProjectManagerConfig, Box<dyn std::error::Error>> {
        if !self.config_path.exists() {
            return Ok(ProjectManagerConfig::default());
        }

        let contents = tokio::fs::read_to_string(&self.config_path).await?;
        let config: ProjectManagerConfig = serde_json::from_str(&contents)?;
        Ok(config)
    }

    pub async fn save_config(&self, config: &ProjectManagerConfig) -> Result<(), Box<dyn std::error::Error>> {
        let contents = serde_json::to_string_pretty(config)?;
        tokio::fs::write(&self.config_path, contents).await?;
        Ok(())
    }

    // 프로젝트 관련 메서드들
    pub async fn add_project(
        &self,
        name: String,
        path: String,
        description: Option<String>,
        project_type: ProjectType,
        access_type: ProjectAccessType,
    ) -> Result<Project, Box<dyn std::error::Error>> {
        let path_obj = Path::new(&path);
        if !path_obj.exists() {
            return Err("프로젝트 경로가 존재하지 않습니다".into());
        }

        // 경로 접근 권한 확인
        if !Self::can_access_path(&path)? {
            return Err(format!("경로 '{}'에 접근할 수 없습니다. 권한을 확인해주세요.", path).into());
        }

        let mut config = self.load_config().await?;
        let project_id = format!("project_{}", chrono::Utc::now().timestamp_millis());
        
        let project = Project {
            id: project_id.clone(),
            name: name.clone(),
            path: path.clone(),
            description,
            created_at: chrono::Utc::now(),
            last_accessed: chrono::Utc::now(),
            access_type: access_type.clone(),
            project_type,
            is_favorite: false,
        };

        // 프로젝트 추가
        config.projects.insert(project_id.clone(), project.clone());

        // 자동으로 허용된 경로에도 추가
        let allowed_path = AllowedPath {
            path: path.clone(),
            name: name.clone(),
            added_at: chrono::Utc::now(),
            access_type,
            is_project_path: true,
        };
        config.allowed_paths.insert(path, allowed_path);

        config.last_updated = chrono::Utc::now();
        self.save_config(&config).await?;
        
        Ok(project)
    }

    pub async fn remove_project(&self, project_id: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let mut config = self.load_config().await?;
        
        if let Some(project) = config.projects.remove(project_id) {
            // 프로젝트 경로도 허용 목록에서 제거 (선택적)
            config.allowed_paths.remove(&project.path);
            config.last_updated = chrono::Utc::now();
            self.save_config(&config).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub async fn get_projects(&self) -> Result<Vec<Project>, Box<dyn std::error::Error>> {
        let config = self.load_config().await?;
        Ok(config.projects.values().cloned().collect())
    }

    pub async fn update_project_last_accessed(&self, project_id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let mut config = self.load_config().await?;
        
        if let Some(project) = config.projects.get_mut(project_id) {
            project.last_accessed = chrono::Utc::now();
            config.last_updated = chrono::Utc::now();
            self.save_config(&config).await?;
        }
        
        Ok(())
    }

    pub async fn toggle_favorite(&self, project_id: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let mut config = self.load_config().await?;
        
        if let Some(project) = config.projects.get_mut(project_id) {
            project.is_favorite = !project.is_favorite;
            let is_favorite = project.is_favorite; // 값을 먼저 저장
            config.last_updated = chrono::Utc::now();
            self.save_config(&config).await?;
            Ok(is_favorite)
        } else {
            Err("프로젝트를 찾을 수 없습니다".into())
        }
    }

    // 경로 관련 메서드들
    pub async fn add_allowed_path(
        &self,
        path: String,
        name: String,
        access_type: ProjectAccessType,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let path_obj = Path::new(&path);
        if !path_obj.exists() {
            return Err("경로가 존재하지 않습니다".into());
        }

        let mut config = self.load_config().await?;
        
        let allowed_path = AllowedPath {
            path: path.clone(),
            name,
            added_at: chrono::Utc::now(),
            access_type,
            is_project_path: false,
        };

        config.allowed_paths.insert(path, allowed_path);
        config.last_updated = chrono::Utc::now();
        self.save_config(&config).await?;
        
        Ok(())
    }

    pub async fn remove_allowed_path(&self, path: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let mut config = self.load_config().await?;
        let removed = config.allowed_paths.remove(path).is_some();
        
        if removed {
            config.last_updated = chrono::Utc::now();
            self.save_config(&config).await?;
        }
        
        Ok(removed)
    }

    pub async fn is_path_allowed(&self, path: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let config = self.load_config().await?;
        
        // 정확한 경로 일치 확인
        if config.allowed_paths.contains_key(path) {
            return Ok(true);
        }

        // 부모 경로가 허용되어 있는지 확인
        let path_obj = Path::new(path);
        for allowed_path in config.allowed_paths.keys() {
            let allowed_path_obj = Path::new(allowed_path);
            if path_obj.starts_with(allowed_path_obj) {
                return Ok(true);
            }
        }

        Ok(false)
    }

    pub async fn get_allowed_paths(&self) -> Result<Vec<AllowedPath>, Box<dyn std::error::Error>> {
        let config = self.load_config().await?;
        Ok(config.allowed_paths.values().cloned().collect())
    }

    // 프로젝트 타입 자동 감지
    pub fn detect_project_type(path: &str) -> ProjectType {
        let path_obj = Path::new(path);
        
        // package.json 확인
        if path_obj.join("package.json").exists() {
            // React 프로젝트 확인
            if let Ok(contents) = std::fs::read_to_string(path_obj.join("package.json")) {
                if contents.contains("\"react\"") {
                    return ProjectType::React;
                }
                if contents.contains("\"vue\"") {
                    return ProjectType::Vue;
                }
                if contents.contains("\"@angular\"") {
                    return ProjectType::Angular;
                }
                if contents.contains("\"typescript\"") {
                    return ProjectType::TypeScript;
                }
            }
            return ProjectType::NodeJs;
        }
        
        // Cargo.toml 확인 (Rust)
        if path_obj.join("Cargo.toml").exists() {
            return ProjectType::Rust;
        }
        
        // requirements.txt 또는 pyproject.toml 확인 (Python)
        if path_obj.join("requirements.txt").exists() || path_obj.join("pyproject.toml").exists() {
            return ProjectType::Python;
        }
        
        ProjectType::Other("Unknown".to_string())
    }
}

// Tauri 명령어들
pub async fn add_project_command(
    app_handle: tauri::AppHandle,
    name: String,
    path: String,
    description: Option<String>,
    project_type: String,
    access_type: String,
) -> Result<Project, String> {
    // 먼저 사용자에게 권한 요청
    let permission_granted = ProjectManager::request_path_permission(&app_handle, &path)
        .await
        .map_err(|e| format!("권한 요청 실패: {}", e))?;
    
    if !permission_granted {
        return Err("사용자가 경로 접근을 거부했습니다".to_string());
    }

    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("앱 데이터 디렉토리를 가져올 수 없습니다: {}", e))?;

    let project_manager = ProjectManager::new(&app_data_dir)
        .map_err(|e| format!("ProjectManager 초기화 실패: {}", e))?;

    let project_type = match project_type.as_str() {
        "nodejs" => ProjectType::NodeJs,
        "python" => ProjectType::Python,
        "rust" => ProjectType::Rust,
        "typescript" => ProjectType::TypeScript,
        "javascript" => ProjectType::JavaScript,
        "react" => ProjectType::React,
        "vue" => ProjectType::Vue,
        "angular" => ProjectType::Angular,
        other => ProjectType::Other(other.to_string()),
    };

    let access_type = match access_type.as_str() {
        "read" => ProjectAccessType::Read,
        "write" => ProjectAccessType::Write,
        "readwrite" => ProjectAccessType::ReadWrite,
        _ => return Err("잘못된 접근 타입입니다".to_string()),
    };

    project_manager
        .add_project(name, path, description, project_type, access_type)
        .await
        .map_err(|e| format!("프로젝트 추가 실패: {}", e))
}

pub async fn remove_project_command(
    app_handle: tauri::AppHandle,
    project_id: String,
) -> Result<bool, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("앱 데이터 디렉토리를 가져올 수 없습니다: {}", e))?;

    let project_manager = ProjectManager::new(&app_data_dir)
        .map_err(|e| format!("ProjectManager 초기화 실패: {}", e))?;

    project_manager
        .remove_project(&project_id)
        .await
        .map_err(|e| format!("프로젝트 제거 실패: {}", e))
}

pub async fn get_projects_command(
    app_handle: tauri::AppHandle,
) -> Result<Vec<Project>, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("앱 데이터 디렉토리를 가져올 수 없습니다: {}", e))?;

    let project_manager = ProjectManager::new(&app_data_dir)
        .map_err(|e| format!("ProjectManager 초기화 실패: {}", e))?;

    project_manager
        .get_projects()
        .await
        .map_err(|e| format!("프로젝트 목록 가져오기 실패: {}", e))
}

pub async fn toggle_project_favorite_command(
    app_handle: tauri::AppHandle,
    project_id: String,
) -> Result<bool, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("앱 데이터 디렉토리를 가져올 수 없습니다: {}", e))?;

    let project_manager = ProjectManager::new(&app_data_dir)
        .map_err(|e| format!("ProjectManager 초기화 실패: {}", e))?;

    project_manager
        .toggle_favorite(&project_id)
        .await
        .map_err(|e| format!("즐겨찾기 토글 실패: {}", e))
}

pub async fn add_allowed_path_command(
    app_handle: tauri::AppHandle,
    path: String,
    name: String,
    access_type: String,
) -> Result<(), String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("앱 데이터 디렉토리를 가져올 수 없습니다: {}", e))?;

    let project_manager = ProjectManager::new(&app_data_dir)
        .map_err(|e| format!("ProjectManager 초기화 실패: {}", e))?;

    let access_type = match access_type.as_str() {
        "read" => ProjectAccessType::Read,
        "write" => ProjectAccessType::Write,
        "readwrite" => ProjectAccessType::ReadWrite,
        _ => return Err("잘못된 접근 타입입니다".to_string()),
    };

    project_manager
        .add_allowed_path(path, name, access_type)
        .await
        .map_err(|e| format!("경로 추가 실패: {}", e))
}

pub async fn remove_allowed_path_command(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<bool, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("앱 데이터 디렉토리를 가져올 수 없습니다: {}", e))?;

    let project_manager = ProjectManager::new(&app_data_dir)
        .map_err(|e| format!("ProjectManager 초기화 실패: {}", e))?;

    project_manager
        .remove_allowed_path(&path)
        .await
        .map_err(|e| format!("경로 제거 실패: {}", e))
}

pub async fn get_allowed_paths_command(
    app_handle: tauri::AppHandle,
) -> Result<Vec<AllowedPath>, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("앱 데이터 디렉토리를 가져올 수 없습니다: {}", e))?;

    let project_manager = ProjectManager::new(&app_data_dir)
        .map_err(|e| format!("ProjectManager 초기화 실패: {}", e))?;

    project_manager
        .get_allowed_paths()
        .await
        .map_err(|e| format!("허용된 경로 목록 가져오기 실패: {}", e))
}

pub async fn request_project_folder_internal(
    app_handle: tauri::AppHandle,
) -> Result<Option<String>, String> {
    // 간단한 폴더 선택을 위해 기존 select_folder_dialog 사용
    match crate::command::select_folder_dialog().await {
        Ok(folder_path) => {
            // 빈 문자열이면 취소된 것으로 간주
            if folder_path.is_empty() {
                return Ok(None);
            }
            
            let path_str = folder_path;
            
            // 프로젝트 타입 자동 감지
            let project_type = ProjectManager::detect_project_type(&path_str);
            
            // 폴더 이름을 프로젝트 이름으로 사용
            let folder_name = std::path::Path::new(&path_str)
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("Unknown Project");

            // 자동으로 프로젝트로 추가
            if let Err(e) = add_project_command(
                app_handle.clone(),
                folder_name.to_string(),
                path_str.clone(),
                Some("자동으로 추가된 프로젝트".to_string()),
                match project_type {
                    ProjectType::NodeJs => "nodejs".to_string(),
                    ProjectType::Python => "python".to_string(),
                    ProjectType::Rust => "rust".to_string(),
                    ProjectType::TypeScript => "typescript".to_string(),
                    ProjectType::JavaScript => "javascript".to_string(),
                    ProjectType::React => "react".to_string(),
                    ProjectType::Vue => "vue".to_string(),
                    ProjectType::Angular => "angular".to_string(),
                    ProjectType::Other(ref name) => name.clone(),
                },
                "readwrite".to_string(),
            ).await {
                eprintln!("프로젝트 자동 추가 실패: {}", e);
            }

            Ok(Some(path_str))
        }
        Err(e) => Err(format!("폴더 선택 실패: {}", e)),
    }
}

pub async fn detect_project_type_internal(path: String) -> Result<String, String> {
    let project_type = ProjectManager::detect_project_type(&path);
    
    let type_string = match project_type {
        ProjectType::NodeJs => "nodejs",
        ProjectType::Python => "python",
        ProjectType::Rust => "rust",
        ProjectType::TypeScript => "typescript",
        ProjectType::JavaScript => "javascript",
        ProjectType::React => "react",
        ProjectType::Vue => "vue",
        ProjectType::Angular => "angular",
        ProjectType::Other(ref name) => name,
    };
    
    Ok(type_string.to_string())
}
