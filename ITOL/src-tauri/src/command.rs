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
