mod command;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 로깅 초기화 (개발 중에만)
    #[cfg(debug_assertions)]
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();

    tauri::Builder::default()
        .setup(|_app| {
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
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            command::get_sqlite_path_command,
            command::list_dirs_command,
            command::list_js_files_command,
            command::rename_file_command, 
            command::create_file_command,
            command::create_file_with_template_command,
            command::list_files_in_path_command,
            command::list_dirs_in_path_command,
            command::list_all_items_in_path_command,
            command::list_items_single_level_command,
            command::select_folder_dialog,
            command::request_path_access,
            command::check_path_access,
            command::set_config_path_command,
            command::get_config_path_command,
            command::execute_js_command,
            command::execute_ts_command,
            command::execute_api_command,
            command::execute_db_command,
            command::test_db_connection_command,
            command::check_oracle_installed,
            command::install_oracle_client,
            command::add_project_command,
            command::remove_project_command,
            command::get_projects_command,
            command::toggle_project_favorite_command,
            command::add_allowed_path_command,
            command::remove_allowed_path_command,
            command::get_allowed_paths_command,
            command::request_project_folder_command,
            command::detect_project_type_command,
            command::folder::file::get_file_stats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}