mod command;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 앱 시작 후 비동기 초기화 실행
            tauri::async_runtime::spawn(async move {
                command::database::create_sqlite().await;
            });
            Ok(())
        })
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            command::get_sqlite_path_command,
            command::list_dirs_command,
            command::list_js_files_command,
            command::rename_file_command, 
            command::create_file_command,
            command::set_config_path_command,
            command::get_config_path_command,
            command::execute_js_command,
            command::execute_ts_command,
            command::execute_api_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}