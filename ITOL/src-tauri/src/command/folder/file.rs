use std::fs;
use std::path::Path;
use std::path::PathBuf;
use crate::command::folder::config::get_js_config_path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileStats {
    pub is_file: bool,
    pub is_directory: bool,
    pub size: u64,
    pub modified: Option<u64>, // Unix timestamp
}

#[tauri::command]
pub fn get_file_stats(path: String) -> Result<FileStats, String> {
    let path_obj = Path::new(&path);
    
    if !path_obj.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    let metadata = fs::metadata(path_obj)
        .map_err(|e| format!("Failed to get metadata for {}: {}", path, e))?;
    
    let modified = metadata.modified()
        .ok()
        .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs());
    
    Ok(FileStats {
        is_file: metadata.is_file(),
        is_directory: metadata.is_dir(),
        size: metadata.len(),
        modified,
    })
}

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

pub fn list_files_in_path(path: &Path) -> Result<Vec<PathBuf>, String> {
    walk_dir(path)
}

pub fn list_dirs_in_path(path: &Path) -> Result<Vec<PathBuf>, String> {
    walk_dir2(path)
}

pub fn list_all_items_in_path(path: &Path) -> Result<Vec<PathBuf>, String> {
    let mut items = Vec::new();

    for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();
        
        if let Some(name) = entry_path.file_name() {
            if name == ".git" || name == "swagger" || name == "node_modules" {
                continue;
            }
        }
        
        items.push(entry_path.clone());
        
        // 디렉토리인 경우 재귀적으로 하위 항목들도 추가
        if entry_path.is_dir() {
            let sub_items = list_all_items_in_path(&entry_path)?;
            items.extend(sub_items);
        }
    }
    
    Ok(items)
}

pub fn list_items_single_level(path: &Path) -> Result<Vec<PathBuf>, String> {
    println!("🔍 list_items_single_level: Reading directory: {}", path.display());
    
    // 경로가 존재하는지 확인
    if !path.exists() {
        let error_msg = format!("Path does not exist: {}", path.display());
        println!("❌ {}", error_msg);
        return Err(error_msg);
    }
    
    // 경로가 디렉토리인지 확인
    if !path.is_dir() {
        let error_msg = format!("Path is not a directory: {}", path.display());
        println!("❌ {}", error_msg);
        return Err(error_msg);
    }
    
    println!("✅ Path exists and is a directory");
    let mut items = Vec::new();

    let entries = fs::read_dir(path).map_err(|e| {
        let error_msg = format!("Failed to read directory {}: {}", path.display(), e);
        println!("❌ {}", error_msg);
        error_msg
    })?;

    for entry in entries {
        let entry = entry.map_err(|e| {
            let error_msg = format!("Failed to read entry: {}", e);
            println!("❌ {}", error_msg);
            error_msg
        })?;
        let entry_path = entry.path();
        
        if let Some(name) = entry_path.file_name() {
            if name == ".git" || name == "swagger" || name == "node_modules" {
                println!("⏭️ Skipping filtered directory: {}", name.to_string_lossy());
                continue;
            }
        }
        
        println!("✅ Found item: {}", entry_path.display());
        items.push(entry_path);
    }
    
    println!("📊 Total items found: {}", items.len());
    Ok(items)
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

/// Generate a basic TypeScript template for ITOL nodes
fn generate_basic_typescript_template(file_name: &str) -> String {
    let name_without_ext = file_name.trim_end_matches(".ts").trim_end_matches(".js");
    
    format!(r#"import fs from 'fs';

/**
 * {} - Auto-generated by ITOL
 * 
 * This file is executed as part of an ITOL workflow node.
 * 
 * @input  JSON file path (process.argv[2]) - Contains requestProperties and previousNodeResults
 * @output JSON file path (process.argv[3]) - Write your results here
 */

interface RequestProperty {{
  name: string;
  value: any;
}}

interface InputData {{
  requestProperties: RequestProperty[];
  previousNodeResults?: Record<string, any>;
}}

interface OutputData {{
  status: 'success' | 'error';
  data?: any;
  error?: string;
  timestamp: string;
}}

async function main() {{
  const [inputPath, outputPath] = process.argv.slice(2);
  
  if (!inputPath || !outputPath) {{
    console.error('Usage: node {} <input.json> <output.json>');
    process.exit(1);
  }}
  
  try {{
    // 1. Read input data
    const inputData: InputData = JSON.parse(
      fs.readFileSync(inputPath, 'utf8')
    );
    
    console.log('📥 Input received:', inputData);
    
    // 2. Extract parameters from requestProperties
    const params = inputData.requestProperties.reduce((acc, prop) => {{
      acc[prop.name] = prop.value;
      return acc;
    }}, {{}} as Record<string, any>);
    
    // 3. Access results from previous nodes (if any)
    const previousResults = inputData.previousNodeResults || {{}};
    
    // ============================================
    // TODO: Implement your logic here
    // ============================================
    
    const result = {{
      message: 'Replace this with your actual implementation',
      receivedParams: params,
      previousNodeCount: Object.keys(previousResults).length
    }};
    
    // ============================================
    
    // 4. Write successful output
    const output: OutputData = {{
      status: 'success',
      data: result,
      timestamp: new Date().toISOString()
    }};
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log('✅ Output written successfully');
    
  }} catch (error) {{
    console.error('❌ Error:', error);
    
    // Write error output
    const output: OutputData = {{
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }};
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    process.exit(1);
  }}
}}

main();
"#, name_without_ext, name_without_ext)
}

/// Create a file with template content
pub async fn create_file_with_template(
    new_file_name: String, 
    path: String
) -> Result<CreateFileResult, String> {
    let dir_path = path;
    let dir = Path::new(&dir_path);
    let file_path = dir.join(&new_file_name);
    
    // Check if the file already exists
    if file_path.exists() {
        return Err(format!("File {} already exists", file_path.display()));
    }
    
    // Determine file extension
    let extension = file_path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");
    
    // Generate template based on file extension
    let content = match extension {
        "ts" => generate_basic_typescript_template(&new_file_name),
        "js" => generate_basic_typescript_template(&new_file_name), // Same template works for JS
        _ => String::new(), // Empty content for other file types
    };
    
    // Check if template was applied before writing
    let template_applied = !content.is_empty();
    
    // Write file with template content
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    // Extract file name without extension
    let file_name_only = file_path
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or(&new_file_name)
        .to_string();
    
    Ok(CreateFileResult {
        file_path: file_path.to_string_lossy().into_owned(),
        file_name: file_name_only,
        file_extension: extension.to_string(),
        template_applied,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFileResult {
    pub file_path: String,
    pub file_name: String,
    pub file_extension: String,
    pub template_applied: bool,
}
