use dirs;
use std::fs;
use std::path::PathBuf;

pub fn get_local_request_json_path(project_name: String, page_name: String) -> Result<PathBuf, String> {
    let local_data_dir = dirs::data_local_dir().ok_or("Local data directory not found")?;
    // u64 값을 문자열로 변환
    let request_save_path = local_data_dir
        .join("TTOL")
        .join("log")
        .join(project_name.to_string())
        .join(page_name.to_string());
    
    print!("Request save path: {}", request_save_path.display());

    if !request_save_path.exists() {
        fs::create_dir_all(&request_save_path).map_err(|e| e.to_string())?;
    }
    
    Ok(request_save_path)
}

pub fn save_request_json(path: std::path::PathBuf, node_name: String, json: String, run_id: String) -> Result<String, String> {
    use std::fs;
    
    let run_id_path = path.join(run_id);
    println!("Creating directory: {:?}", run_id_path);
    fs::create_dir_all(&run_id_path).map_err(|e| e.to_string())?;
    
    let file_name = run_id_path.join(format!("{}.json", node_name));
    println!("About to write JSON to file: {:?}", file_name);
    println!("JSON content:\n{}", json);
    
    fs::write(&file_name, &json)
        .map_err(|e| {
            println!("Error writing JSON: {}", e);
            e.to_string()
        })?;
    
    match fs::metadata(&file_name) {
        Ok(metadata) => {
            println!("File written successfully, size: {} bytes", metadata.len());
        },
        Err(e) => {
            println!("Failed to get file metadata: {}", e);
        }
    }
    
    // Return json file path
    Ok(file_name.display().to_string())
}