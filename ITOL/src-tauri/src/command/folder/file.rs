use std::fs;
use std::path::Path;
use std::path::PathBuf;
use crate::command::folder::config::get_js_config_path;

use super::config::get_py_config_path;

fn walk_dir(dir: &Path) -> Result<Vec<PathBuf>, String> {
    let mut files = Vec::new();

    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "js" || ext == "ts" {
                    files.push(path);
                }
            }
        } else if path.is_dir() {
            if path.file_name().unwrap() == ".git" || path.file_name().unwrap() == "swagger" 
            || path.file_name().unwrap() == "node_modules" {
                continue;
            }
            let sub_files = walk_dir(&path)?;
            files.extend(sub_files);
        }
    }
    Ok(files)
}

pub fn list_js_files() -> Result<Vec<PathBuf>, String> {
    // 설정 파일에서 경로 문자열 얻기
    let js_dir_str = get_js_config_path().map_err(|e| e.to_string())?;
    let js_dir = PathBuf::from(js_dir_str);

    walk_dir(&js_dir)
}

fn walk_dir2(dir: &Path) -> Result<Vec<PathBuf>, String> {
    let mut directories = Vec::new();

    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_dir() {
            if let Some(name) = path.file_name() {
                if name == ".git" || name == "swagger" || name == "node_modules" {
                    continue;
                }
            }
            directories.push(path.clone());
            let sub_dirs = walk_dir2(&path)?;
            directories.extend(sub_dirs);
        }
    }
    Ok(directories)
}

pub fn list_dirs() -> Result<Vec<PathBuf>, String> {
    // 설정 파일에서 경로 문자열 얻기
    let js_dir_str = get_js_config_path().map_err(|e| e.to_string())?;
    let js_dir = PathBuf::from(js_dir_str);

    walk_dir2(&js_dir)
}

pub async fn rename_file(file_path: String, new_file_name: String) -> Result<String, String> {
    // Get the directory path and file extension from the original path
    let path = Path::new(&file_path);
    let parent_dir = match path.parent() {
        Some(dir) => dir,
        None => return Err("Could not determine parent directory".into()),
    };

    let extension = match path.extension() {
        Some(ext) => ext.to_str().unwrap_or(""),
        None => "",
    };

    // Create the new file path with the new name
    let new_file_path = parent_dir.join(format!("{}.{}", new_file_name, extension));

    // Perform the rename operation
    match fs::rename(path, new_file_path.clone()) {
        Ok(_) => Ok(new_file_path.to_string_lossy().into_owned()),
        Err(e) => Err(format!("Failed to rename file: {}", e)),
    }
}

pub async fn create_file(new_file_name: String, path: String) -> Result<String, String> {
    let dir_path = path;

    print!("dir_path: {}", dir_path);
    // Create a Path object from the directory path
    let dir = Path::new(&dir_path);

    // Create the full path for the new file
    let file_path = dir.join(&new_file_name);
    print!("file_path: {}", file_path.display());
    // Check if the file already exists
    if file_path.exists() {
        // TODO 에러 처리 따로 해야 하는지 고민해봐야 함
        return Err(format!("File {} already exists", file_path.display()));
    }

    // Try to create the file with empty content
    match fs::write(&file_path, "") {
        Ok(_) => {
            // Return the full path of the created file as a string
            Ok(file_path.to_string_lossy().into_owned())
        }
        Err(e) => Err(format!("Failed to create file: {}", e)),
    }
}
