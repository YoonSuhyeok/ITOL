pub mod database;
pub mod folder;
pub mod execution;
pub mod project_manager;

use tauri::command;

#[command]
pub fn get_sqlite_path_command() -> String {
    database::get_sqlite_path()
}

#[command]
pub fn list_js_files_command() -> Result<Vec<std::path::PathBuf>, String> {
    // 설정 파일에서 경로를 가져와서 list_files_in_path_command 사용
    let js_dir_str = folder::get_js_config_path().map_err(|e| e.to_string())?;
    let path_buf = std::path::Path::new(&js_dir_str);
    folder::file::list_files_in_path(path_buf)
}

#[command]
pub fn list_dirs_command() -> Result<Vec<std::path::PathBuf>, String> {
    // 설정 파일에서 경로를 가져와서 walk_dir2 함수 직접 사용
    let js_dir_str = folder::get_js_config_path().map_err(|e| e.to_string())?;
    let path_buf = std::path::Path::new(&js_dir_str);
    folder::file::list_dirs_in_path(path_buf)
}

#[command]
pub fn list_files_in_path_command(path: String) -> Result<Vec<std::path::PathBuf>, String> {
    let path_buf = std::path::Path::new(&path);
    folder::file::list_files_in_path(path_buf)
}

#[command]
pub fn list_dirs_in_path_command(path: String) -> Result<Vec<std::path::PathBuf>, String> {
    let path_buf = std::path::Path::new(&path);
    folder::file::list_dirs_in_path(path_buf)
}

#[command]
pub fn list_all_items_in_path_command(path: String) -> Result<Vec<std::path::PathBuf>, String> {
    let path_buf = std::path::Path::new(&path);
    folder::file::list_all_items_in_path(path_buf)
}

#[command]
pub fn list_items_single_level_command(path: String) -> Result<Vec<std::path::PathBuf>, String> {
    let path_buf = std::path::Path::new(&path);
    folder::file::list_items_single_level(path_buf)
}

#[command]
pub async fn select_folder_dialog() -> Result<String, String> {
    use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
    
    // TODO: 실제 폴더 선택 다이얼로그 구현
    // 현재는 임시로 고정된 경로 반환
    let default_path = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| "C:\\Users".to_string());
    
    println!("🔍 Folder dialog would open, returning default path: {}", default_path);
    Ok(default_path)
}

#[command]
pub async fn request_path_access(path: String) -> Result<bool, String> {
    use std::path::Path;
    
    // 경로가 유효한지 확인
    let path_obj = Path::new(&path);
    if !path_obj.exists() {
        return Err("경로가 존재하지 않습니다".to_string());
    }
    
    if !path_obj.is_dir() {
        return Err("디렉토리가 아닙니다".to_string());
    }
    
    // 여기서 Tauri에게 해당 경로에 대한 접근 권한을 요청
    // 실제로는 사용자에게 권한 요청 다이얼로그를 표시하고
    // 승인하면 해당 경로를 허용된 경로 목록에 추가
    
    println!("🔓 Requesting access to path: {}", path);
    Ok(true)
}

#[command]
pub fn check_path_access(path: String) -> Result<bool, String> {
    use std::path::Path;
    
    let path_obj = Path::new(&path);
    
    // 경로에 접근할 수 있는지 확인
    match std::fs::read_dir(path_obj) {
        Ok(_) => {
            println!("✅ Access granted to path: {}", path);
            Ok(true)
        },
        Err(e) => {
            println!("❌ Access denied to path: {} - {}", path, e);
            Ok(false)
        }
    }
}

#[command]
pub async fn rename_file_command(file_path: String, new_file_name: String) -> Result<String, String> {
    Ok(folder::file::rename_file(file_path, new_file_name).await?)
}

#[command]
pub async fn create_file_command(new_file_name: String, path: String) -> Result<String, String> {
    print!("new_file_name: {}, path: {}", new_file_name, path);
    Ok(folder::file::create_file(new_file_name, path).await?)
}

#[command]
pub async fn set_config_path_command(new_path: String) -> Result<String, String> {
    folder::set_config_path(new_path).await
}
 
#[command]
pub async fn get_config_path_command(language: String) -> Result<String, String> {
    match language.as_str() {
        "js" | "ts" => folder::get_js_config_path().map_err(|e| e.to_string()),
        "py" => folder::get_py_config_path().map_err(|e| e.to_string()),
        _ => Err("Invalid language".to_string()),
    }
}
 
#[command]
pub async fn execute_js_command(params: execution::node_system::ExecuteFileParams) -> Result<String, String> {
    execution::node_system::execute_js(params).await
}

#[command]
pub async fn execute_ts_command(params: execution::node_system::ExecuteFileParams) -> Result<String, String> {
    execution::node_system::execute_file_by_type(params).await
}

#[command]
pub async fn execute_api_command(params: execution::api_system::ExecuteApiParams) -> Result<String, String> {
    if params.method == "GET" {
        execution::api_system::get_api_call(&params.base_url, params.query.as_deref(), params.headers.as_deref(), params.body.as_deref()).await
            .map_err(|e| e.to_string())
    } else if params.method == "POST" {
        execution::api_system::post_api_call(&params.base_url, params.query.as_deref(), params.headers.as_deref(), params.body.as_deref()).await
            .map_err(|e| e.to_string())
    } else {
        Err("Invalid method".to_string())
    }
}

// Project Manager Commands
#[command]
pub async fn add_project_command(
    app_handle: tauri::AppHandle,
    name: String,
    path: String,
    description: Option<String>,
    project_type: String,
    access_type: String,
) -> Result<project_manager::Project, String> {
    project_manager::add_project_command(app_handle, name, path, description, project_type, access_type).await
}

#[command]
pub async fn remove_project_command(
    app_handle: tauri::AppHandle,
    project_id: String,
) -> Result<bool, String> {
    project_manager::remove_project_command(app_handle, project_id).await
}

#[command]
pub async fn get_projects_command(
    app_handle: tauri::AppHandle,
) -> Result<Vec<project_manager::Project>, String> {
    project_manager::get_projects_command(app_handle).await
}

#[command]
pub async fn toggle_project_favorite_command(
    app_handle: tauri::AppHandle,
    project_id: String,
) -> Result<bool, String> {
    project_manager::toggle_project_favorite_command(app_handle, project_id).await
}

#[command]
pub async fn add_allowed_path_command(
    app_handle: tauri::AppHandle,
    path: String,
    name: String,
    access_type: String,
) -> Result<(), String> {
    project_manager::add_allowed_path_command(app_handle, path, name, access_type).await
}

#[command]
pub async fn remove_allowed_path_command(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<bool, String> {
    project_manager::remove_allowed_path_command(app_handle, path).await
}

#[command]
pub async fn get_allowed_paths_command(
    app_handle: tauri::AppHandle,
) -> Result<Vec<project_manager::AllowedPath>, String> {
    project_manager::get_allowed_paths_command(app_handle).await
}

#[command]
pub async fn request_project_folder_command(
    app_handle: tauri::AppHandle,
) -> Result<Option<String>, String> {
    project_manager::request_project_folder_internal(app_handle).await
}

#[command]
pub async fn detect_project_type_command(path: String) -> Result<String, String> {
    project_manager::detect_project_type_internal(path).await
}

#[command]
pub async fn read_text_file(path: String) -> Result<String, String> {
    use std::fs;
    use std::path::Path;
    
    println!("📖 Reading text file: {}", path);
    
    let file_path = Path::new(&path);
    
    // 파일이 존재하는지 확인
    if !file_path.exists() {
        return Err(format!("파일이 존재하지 않습니다: {}", path));
    }
    
    // 파일인지 확인
    if !file_path.is_file() {
        return Err(format!("지정된 경로가 파일이 아닙니다: {}", path));
    }
    
    // 파일 읽기
    match fs::read_to_string(file_path) {
        Ok(content) => {
            println!("✅ Successfully read file: {} ({} bytes)", path, content.len());
            Ok(content)
        },
        Err(e) => {
            let error_msg = format!("파일 읽기 실패: {}", e);
            println!("❌ {}", error_msg);
            Err(error_msg)
        }
    }
}

#[command]
pub async fn save_swagger_spec(spec: serde_json::Value) -> Result<bool, String> {
    use std::fs;
    use std::path::Path;
    
    println!("💾 Saving Swagger spec: {:?}", spec.get("name"));
    
    // 설정 디렉토리에 swagger 폴더 생성
    let config_dir = database::get_config_dir().map_err(|e| e.to_string())?;
    let swagger_dir = Path::new(&config_dir).join("swagger");
    
    if !swagger_dir.exists() {
        fs::create_dir_all(&swagger_dir).map_err(|e| format!("Swagger 디렉토리 생성 실패: {}", e))?;
    }
    
    // 스펙 ID를 파일명으로 사용
    let spec_id = spec.get("id")
        .and_then(|v| v.as_str())
        .ok_or("Swagger 스펙에 ID가 없습니다")?;
    
    let file_path = swagger_dir.join(format!("{}.json", spec_id));
    
    // JSON 파일로 저장
    let json_content = serde_json::to_string_pretty(&spec)
        .map_err(|e| format!("JSON 직렬화 실패: {}", e))?;
    
    fs::write(&file_path, json_content)
        .map_err(|e| format!("파일 쓰기 실패: {}", e))?;
    
    println!("✅ Swagger spec saved: {:?}", file_path);
    Ok(true)
}

#[command]
pub async fn load_swagger_specs() -> Result<Vec<serde_json::Value>, String> {
    use std::fs;
    use std::path::Path;
    
    println!("📂 Loading Swagger specs");
    
    let config_dir = database::get_config_dir().map_err(|e| e.to_string())?;
    let swagger_dir = Path::new(&config_dir).join("swagger");
    
    if !swagger_dir.exists() {
        println!("📁 Swagger directory doesn't exist, returning empty list");
        return Ok(Vec::new());
    }
    
    let mut specs = Vec::new();
    
    match fs::read_dir(&swagger_dir) {
        Ok(entries) => {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("json") {
                        match fs::read_to_string(&path) {
                            Ok(content) => {
                                match serde_json::from_str::<serde_json::Value>(&content) {
                                    Ok(spec) => {
                                        specs.push(spec);
                                        println!("✅ Loaded spec: {:?}", path.file_name());
                                    }
                                    Err(e) => {
                                        println!("⚠️ Failed to parse spec {:?}: {}", path.file_name(), e);
                                    }
                                }
                            }
                            Err(e) => {
                                println!("⚠️ Failed to read spec {:?}: {}", path.file_name(), e);
                            }
                        }
                    }
                }
            }
        }
        Err(e) => {
            return Err(format!("Swagger 디렉토리 읽기 실패: {}", e));
        }
    }
    
    println!("📋 Loaded {} Swagger specs", specs.len());
    Ok(specs)
}

#[command]
pub async fn delete_swagger_spec(spec_id: String) -> Result<bool, String> {
    use std::fs;
    use std::path::Path;
    
    println!("🗑️ Deleting Swagger spec: {}", spec_id);
    
    let config_dir = database::get_config_dir().map_err(|e| e.to_string())?;
    let swagger_dir = Path::new(&config_dir).join("swagger");
    let file_path = swagger_dir.join(format!("{}.json", spec_id));
    
    if !file_path.exists() {
        return Err("Swagger 스펙 파일이 존재하지 않습니다".to_string());
    }
    
    fs::remove_file(&file_path)
        .map_err(|e| format!("파일 삭제 실패: {}", e))?;
    
    println!("✅ Swagger spec deleted: {}", spec_id);
    Ok(true)
}

#[command]
pub async fn update_swagger_spec(spec: serde_json::Value) -> Result<bool, String> {
    // 업데이트는 저장과 동일한 로직 사용
    save_swagger_spec(spec).await
}

#[command]
pub async fn create_api_node_from_endpoint(
    endpoint: serde_json::Value,
    base_url: String,
    spec_id: String
) -> Result<String, String> {
    println!("🔗 Creating API node from endpoint");
    println!("  Endpoint: {:?}", endpoint.get("path"));
    println!("  Method: {:?}", endpoint.get("method"));
    println!("  Base URL: {}", base_url);
    println!("  Spec ID: {}", spec_id);
    
    // 임시로 노드 ID 생성 (실제로는 DAG 시스템과 연동 필요)
    let node_id = format!("api_node_{}", uuid::Uuid::new_v4().to_string().replace("-", "")[..8].to_string());
    
    println!("✅ Created API node: {}", node_id);
    Ok(node_id)
}
