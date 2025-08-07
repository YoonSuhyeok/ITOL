pub mod database;
pub mod folder;
pub mod execution;

use tauri::command;

#[command]
pub fn get_sqlite_path_command() -> String {
    database::get_sqlite_path()
}

#[command]
pub fn list_js_files_command() -> Result<Vec<std::path::PathBuf>, String> {
    folder::file::list_js_files()
}

#[command]
pub fn list_dirs_command() -> Result<Vec<std::path::PathBuf>, String> {
    folder::file::list_dirs()
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
    execution::node_system::execute_ts(params).await
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
