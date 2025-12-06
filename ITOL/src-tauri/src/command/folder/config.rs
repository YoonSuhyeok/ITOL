use dirs;
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Deserialize, Serialize)]
struct JsConfig {
    js_path: String,
    py_path: String,
}

pub fn get_path_config_file_name() -> String {
    String::from("pathConfig.json")
}

pub fn get_js_config_path() -> Result<String, Box<dyn std::error::Error>> {
    // 로컬 데이터 디렉토리(C:\Users\사용자\AppData\Local)를 얻고
    let local_data_dir = dirs::data_local_dir().ok_or("Local data directory not found")?;

    println!("로컬 데이터 디렉토리: {}", local_data_dir.display());

    // "TTOL" 폴더 경로 생성
    let ttol_dir = local_data_dir.join("TTOL");

    // TTOL 폴더가 없으면 생성
    if !ttol_dir.exists() {
        fs::create_dir_all(&ttol_dir)?;
    }

    // jsConfigFile.json 파일 경로 생성
    let config_file_path = ttol_dir.join(get_path_config_file_name());

    // 파일이 없으면 기본 값으로 생성
    if !config_file_path.exists() {
        let default_config = JsConfig {
            js_path: String::from(""),
            py_path: String::from(""),
        };
        let default_content = serde_json::to_string_pretty(&default_config)?;
        fs::write(&config_file_path, default_content)?;
    }

    // 파일을 읽어서 문자열로 변환
    let config_content = fs::read_to_string(&config_file_path)?;
    print!("config_content: {}", config_content);
    // JSON 파싱
    let config: JsConfig = serde_json::from_str(&config_content)?;

    Ok(config.js_path)
}

pub fn get_py_config_path() -> Result<String, Box<dyn std::error::Error>> {
    // 로컬 데이터 디렉토리(C:\Users\사용자\AppData\Local)를 얻고
    let local_data_dir = dirs::data_local_dir().ok_or("Local data directory not found")?;

    // "TTOL" 폴더 경로 생성
    let ttol_dir = local_data_dir.join("TTOL");

    // TTOL 폴더가 없으면 생성
    if !ttol_dir.exists() {
        fs::create_dir_all(&ttol_dir)?;
    }

    // jsConfigFile.json 파일 경로 생성
    let config_file_path = ttol_dir.join(get_path_config_file_name());

    // 파일이 없으면 기본 값으로 생성
    if !config_file_path.exists() {
        let default_config = JsConfig {
            js_path: String::from(""),
            py_path: String::from(""),
        };
        let default_content = serde_json::to_string_pretty(&default_config)?;
        fs::write(&config_file_path, default_content)?;
    }

    // 파일을 읽어서 문자열로 변환
    let config_content = fs::read_to_string(&config_file_path)?;

    // JSON 파싱
    let config: JsConfig = serde_json::from_str(&config_content)?;

    Ok(config.py_path)
}

pub async fn set_config_path(path: String) -> Result<String, String> {
    // Get the local data directory
    let local_data_dir = dirs::data_local_dir()
        .ok_or("Local data directory not found")?;
    
    // Create the TTOL directory path
    let ttol_dir = local_data_dir.join("TTOL");
    
    // Create the config file path
    let config_file_path = ttol_dir.join(get_path_config_file_name());
    
    // Create a new config object with the new path
    let new_config = JsConfig {
        js_path: path.clone(),
        py_path: path.clone(),
    };

    // Serialize the new config object to JSON
    let new_config_content = serde_json::to_string_pretty(&new_config)
        .map_err(|e| e.to_string())?;

    // Write the new config content to the config file
    match fs::write(config_file_path, new_config_content) {
        Ok(_) => Ok(path),
        Err(e) => Err(format!("Failed to write new config file: {}", e)),
    }
}