use serde::Deserialize;
use std::fs::{self};
use std::path::{Path, PathBuf};
use std::process::{Command};
use crate::command::database::book;
use crate::command::database::page;
use crate::command::execution::request::get_local_request_json_path;
use crate::command::execution::request::save_request_json;
use std::io::{self, Write};
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use log::{debug, info, warn, error};

#[derive(Debug, Deserialize)]
pub struct ExecuteFileParams {
    project_path: String,
    file_path: String,
    param: String,
    project_id: Option<i32>,
    page_id: i32,
    node_name: String,
    run_id: String
}

// 공통 로직을 별도 함수로 분리
async fn prepare_execution_context(params: &ExecuteFileParams) -> Result<(String, String, String), String> {
    let project_name = match params.project_id {
        Some(id) => book::get_book_by_id(id)
            .await
            .map_err(|e| e.to_string())?
            .title,
        None => "root".to_owned(),
    };

    println!("Project name: {}", project_name);
    
    let page_name = page::get_page_by_id(params.page_id)
        .await
        .map_err(|e| e.to_string())?
        .title;
    
    info!("Preparing execution context - Project: {}, Page: {}", project_name, page_name);

    let local_request_json_path = get_local_request_json_path(project_name.clone(), page_name.clone())
        .map_err(|e| format!("Failed to get local request JSON path: {}", e))?;

    let json_path = save_request_json(
        local_request_json_path, 
        params.node_name.clone(), 
        params.param.clone(), 
        params.run_id.clone()
    ).map_err(|e| e.to_string())?;

    Ok((project_name, page_name, json_path))
}

pub async fn execute_js(params: ExecuteFileParams) -> Result<String, String> {
    let (_, _, json_path) = prepare_execution_context(&params).await?;
    
    let output = Command::new("node")
        .arg(&params.file_path)
        .arg(&json_path)
        .output()
        .map_err(|e| format!("Failed to execute process: {}", e))?;

    if output.status.success() {
        let result = String::from_utf8(output.stdout)
            .map_err(|e| format!("Failed to parse output: {}", e))?;
        Ok(result)
    } else {
        let error = String::from_utf8(output.stderr)
            .map_err(|e| format!("Failed to parse error: {}", e))?;
        Err(error)
    }
}

fn validate_file_path(file_path: &str) -> Result<(), String> {
    let path = Path::new(file_path);
    
    // 파일이 존재하는지 확인
    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }
    
    // 파일 확장자 검증
    match path.extension().and_then(|ext| ext.to_str()) {
        Some("js") | Some("ts") => Ok(()),
        Some(ext) => Err(format!("Unsupported file extension: {}", ext)),
        None => Err("File has no extension".to_string()),
    }
}

fn compile_and_run(ts_file: &str, ts_build_path: &str, json_path: &str, save_path: &str) -> Result<String, String> {
    info!("🔨 Processing TypeScript file: {}", ts_file);
    io::stdout().flush().unwrap();

    // 먼저 ts-node로 직접 실행 시도
    if let Ok(result) = run_typescript_directly(ts_file, json_path, save_path) {
        return Ok(result);
    }

    // ts-node가 실패하면 컴파일 방식 사용
    let build_result = build_project(ts_build_path);
    
    if let Err(e) = build_result {
        return Err(format!("TypeScript build failed: {}", e));
    }
    
    let relative_path = get_relative_file_path(ts_file, ts_build_path)?;
    let mut js_file_path_buf = PathBuf::from(ts_build_path);
    js_file_path_buf.push("dist");
    js_file_path_buf.push(relative_path);

    let mut js_file_path = js_file_path_buf.into_os_string().into_string().unwrap();
    if js_file_path.ends_with(".ts") {
        js_file_path = js_file_path.trim_end_matches(".ts").to_string() + ".js";
    }

    // 컴파일된 JS 파일이 존재하는지 확인
    if !Path::new(&js_file_path).exists() {
        return Err(format!("Compiled JS file not found: {}", js_file_path));
    }

    // 실행하기 전에 명령어 출력
    info!("⚡ Executing: node {} {}", js_file_path, json_path);
    io::stdout().flush().unwrap();

    let json_output_parent = Path::new(json_path)
    .parent()
    .ok_or("Failed to get parent directory for JSON path")?;
    let output_file_path = json_output_parent.join("output.txt");

    let output = Command::new("node")
        .arg(&js_file_path)
        .arg(json_path)
        .arg(save_path)
        .output() // stdout과 stderr를 모두 캡처
        .map_err(|e| format!("Failed to execute compiled file: {}", e))?;
    
    
    debug!("📊 Execution status: {:?}", output.status);
    debug!("=== STDOUT ===\n{}", String::from_utf8_lossy(&output.stdout));
    if !output.stderr.is_empty() {
        warn!("=== STDERR ===\n{}", String::from_utf8_lossy(&output.stderr));
    }

    // 로그 파일에 stdout과 stderr 내용 저장
    fs::write(output_file_path, format!(
        "=== STDOUT ===\n{}\n\n=== STDERR ===\n{}", 
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    )).map_err(|e| format!("Failed to write output log: {}", e))?;
    
    // stderr가 비어있지 않다면 오류 메시지로 출력
    if !output.stderr.is_empty() {
        let error_message = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Node script error: {}", error_message));
    }

    // stdout 내용을 확인해 JSON 파싱 에러 문자열이 포함되어 있는지 확인
    let stdout_content = String::from_utf8_lossy(&output.stdout);
    if stdout_content.contains("SyntaxError") || stdout_content.contains("Failed to") {
        return Err(format!("Node script stdout error: {}", stdout_content));
    }

    // save_path 파일이 존재하는지 확인 후 읽기
    if output.status.success() {
        // 파일 존재 여부 확인
        if !Path::new(save_path).exists() {
            return Err(format!("Result file not created: {}", save_path));
        }
        
        // 성공 시 save_path 파일을 읽음
        fs::read_to_string(save_path)
            .map_err(|e| format!("Failed to read result file: {}", e))
    } else {
        Err("Node script failed with non-zero exit code".into())
    }
}

// 빌드 캐시 - 동일한 프로젝트의 반복 빌드 방지
static BUILD_CACHE: Lazy<Mutex<HashMap<String, std::time::SystemTime>>> = 
    Lazy::new(|| Mutex::new(HashMap::new()));

fn should_rebuild(project_path: &str) -> Result<bool, String> {
    let package_json_path = Path::new(project_path).join("package.json");
    let tsconfig_path = Path::new(project_path).join("tsconfig.json");
    
    // 파일 존재 여부 확인 (경고만 출력하고 계속 진행)
    if !package_json_path.exists() {
        warn!("⚠️ package.json not found at: {}", package_json_path.display());
    }
    
    if !tsconfig_path.exists() {
        warn!("⚠️ tsconfig.json not found at: {}", tsconfig_path.display());
    }
    
    // 둘 다 없으면 빌드가 필요하다고 가정
    if !package_json_path.exists() && !tsconfig_path.exists() {
        info!("📦 No config files found, assuming build is needed");
        return Ok(true);
    }
    
    let mut cache = BUILD_CACHE.lock().map_err(|e| format!("Cache lock error: {}", e))?;
    
    // 마지막 빌드 시간 확인
    if let Some(&last_build) = cache.get(project_path) {
        let mut needs_rebuild = false;
        
        // package.json이 있고 수정되었는지 확인
        if package_json_path.exists() {
            let package_modified = std::fs::metadata(&package_json_path)
                .and_then(|m| m.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
            
            if package_modified > last_build {
                needs_rebuild = true;
            }
        }
        
        // tsconfig.json이 있고 수정되었는지 확인
        if tsconfig_path.exists() {
            let tsconfig_modified = std::fs::metadata(&tsconfig_path)
                .and_then(|m| m.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH);
                
            if tsconfig_modified > last_build {
                needs_rebuild = true;
            }
        }
        
        if !needs_rebuild {
            return Ok(false); // 리빌드 불필요
        }
    }
    
    // 빌드 시간 기록
    cache.insert(project_path.to_string(), std::time::SystemTime::now());
    Ok(true) // 리빌드 필요
}

fn build_project(project_path: &str) -> Result<(), String> {
    use std::process::Command;
    use std::io::{self, Write};

    // 빌드 필요성 확인
    if !should_rebuild(project_path)? {
        info!("⏭️ Skipping build - no changes detected");
        return Ok(());
    }

    info!("🔧 Building project in directory: {}", project_path);
    io::stdout().flush().unwrap();

    // package.json 존재 여부 확인
    let package_json_path = Path::new(project_path).join("package.json");
    if !package_json_path.exists() {
        warn!("⚠️ No package.json found, trying direct tsc compilation");
        return build_with_tsc(project_path);
    }

    // npm 빌드 시도
    #[cfg(target_os = "windows")]
    let npm_cmd = "npm.cmd";
    #[cfg(not(target_os = "windows"))]
    let npm_cmd = "npm";

    let output = Command::new(npm_cmd)
        .current_dir(project_path)
        .arg("run")
        .arg("build")
        .output()
        .map_err(|e| format!("Failed to execute build command: {}", e))?;

    debug!("Build stdout:\n{}", String::from_utf8_lossy(&output.stdout));
    if !output.stderr.is_empty() {
        warn!("Build stderr:\n{}", String::from_utf8_lossy(&output.stderr));
    }
    debug!("Exit code: {:?}", output.status.code());

    if output.status.success() {
        info!("✅ Build succeeded");
        Ok(())
    } else {
        warn!("❌ npm build failed, trying tsc directly");
        build_with_tsc(project_path)
    }
}

fn build_with_tsc(project_path: &str) -> Result<(), String> {
    info!("🔧 Trying TypeScript compiler (tsc) directly");
    
    // dist 디렉토리 확인 및 생성
    let dist_path = Path::new(project_path).join("dist");
    if !dist_path.exists() {
        fs::create_dir_all(&dist_path)
            .map_err(|e| format!("Failed to create dist directory: {}", e))?;
        info!("📁 Created dist directory: {}", dist_path.display());
    }
    
    #[cfg(target_os = "windows")]
    let tsc_cmd = "tsc.cmd";
    #[cfg(not(target_os = "windows"))]
    let tsc_cmd = "tsc";

    let tsconfig_path = Path::new(project_path).join("tsconfig.json");
    let mut command = Command::new(tsc_cmd);
    command.current_dir(project_path);

    if tsconfig_path.exists() {
        // tsconfig.json이 있으면 그것을 사용
        info!("📋 Using existing tsconfig.json");
    } else {
        // tsconfig.json이 없으면 기본 설정으로 컴파일
        info!("📋 No tsconfig.json found, using default tsc settings");
        command
            .arg("--outDir")
            .arg("dist")
            .arg("--target")
            .arg("ES2020")
            .arg("--module")
            .arg("CommonJS")
            .arg("--moduleResolution")
            .arg("node")
            .arg("--esModuleInterop")
            .arg("--allowSyntheticDefaultImports")
            .arg("--strict")
            .arg("--skipLibCheck")
            .arg("**/*.ts");
    }

    let output = command
        .output()
        .map_err(|e| format!("Failed to execute tsc: {}", e))?;

    debug!("TSC stdout:\n{}", String::from_utf8_lossy(&output.stdout));
    if !output.stderr.is_empty() {
        warn!("TSC stderr:\n{}", String::from_utf8_lossy(&output.stderr));
    }

    if output.status.success() {
        info!("✅ TypeScript compilation succeeded");
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!("❌ TypeScript compilation failed:\n{}", stderr);
        Err(format!("TypeScript compilation failed:\n{}", stderr))
    }
}

fn run_typescript_directly(ts_file: &str, json_path: &str, save_path: &str) -> Result<String, String> {
    info!("🚀 Running TypeScript file directly with ts-node");
    
    #[cfg(target_os = "windows")]
    let ts_node_cmd = "ts-node.cmd";
    #[cfg(not(target_os = "windows"))]
    let ts_node_cmd = "ts-node";

    // ts-node로 직접 실행 시도
    let output = Command::new(ts_node_cmd)
        .arg(ts_file)
        .arg(json_path)
        .arg(save_path)
        .output();

    match output {
        Ok(output) if output.status.success() => {
            info!("✅ ts-node execution succeeded");
            if Path::new(save_path).exists() {
                fs::read_to_string(save_path)
                    .map_err(|e| format!("Failed to read result file: {}", e))
            } else {
                Ok(String::from_utf8_lossy(&output.stdout).to_string())
            }
        }
        Ok(output) => {
            let error_message = String::from_utf8_lossy(&output.stderr);
            Err(format!("ts-node execution failed: {}", error_message))
        }
        Err(_) => {
            warn!("⚠️ ts-node not available, falling back to compilation");
            Err("ts-node not available".to_string())
        }
    }
}

fn get_relative_file_path(file_path: &str, project_path: &str) -> Result<String, String> {
    use std::path::{Path, Component};

    // project_path를 제거한 상대 경로를 구함
    let relative = Path::new(file_path)
        .strip_prefix(project_path)
        .map_err(|e| format!("Failed to strip prefix: {}", e))?;

    // relative가 "src" 폴더를 포함하고 있다면 이를 제거
    let mut components = relative.components();
    
    let final_path = if let Some(first) = components.next() {
        if first == Component::Normal("src".as_ref()) {
            // 나머지 경로를 String으로 변환
            components.as_path()
        } else {
            // "src"가 없으면 그대로 사용
            relative
        }
    } else {
        return Err("Empty relative path".to_owned());
    };

    // Windows 역슬래시를 슬래시로 변환
    let normalized_path = final_path
        .to_string_lossy()
        .replace('\\', "/");

    Ok(normalized_path)
}

pub async fn execute_playwright(params: ExecuteFileParams) -> Result<String, String> {
    info!("🎭 Starting Playwright execution - File: {}", params.file_path);
    debug!("📋 Execution params: {:?}", params);

    let (project_name, page_name, json_path) = prepare_execution_context(&params).await?;
    debug!("📁 Context prepared - JSON path: {}", json_path);
    
    let parent_dir = Path::new(&json_path)
        .parent()
        .ok_or("Failed to get parent directory for JSON path")?;
    
    let new_file_name = format!("{}_save.json", params.node_name);
    let response_path = parent_dir.join(new_file_name);
    let response_path_str = response_path.to_string_lossy().to_string();
    
    debug!("💾 Response will be saved to: {}", response_path_str);

    run_playwright(&params.file_path, &params.project_path, &json_path, &response_path_str)
}

fn run_playwright(ts_file: &str, project_path: &str, json_path: &str, save_path: &str) -> Result<String, String> {
    info!("🎭 Running Playwright file: {}", ts_file);
    io::stdout().flush().unwrap();

    // 파일 경로 검증
    validate_file_path(ts_file)?;

    // Playwright 설치 확인
    check_playwright_installation(project_path)?;

    // 절대 경로를 상대 경로로 변환
    let relative_file_path = get_relative_file_path(ts_file, project_path)?;

    let json_output_parent = Path::new(json_path)
        .parent()
        .ok_or("Failed to get parent directory for JSON path")?;
    let output_file_path = json_output_parent.join("output.txt");

    #[cfg(target_os = "windows")]
    let npx_cmd = "npx.cmd";
    #[cfg(not(target_os = "windows"))]
    let npx_cmd = "npx";

    info!("⚡ Executing: npx playwright test {} --reporter=json (from {})", relative_file_path, project_path);
    
    let output = Command::new(npx_cmd)
        .current_dir(project_path)  // 프로젝트 경로에서 실행
        .arg("playwright")
        .arg("test")
        .arg(&relative_file_path)   // 상대 경로 사용
        .arg("--reporter=json")
        .env("JSON_PATH", json_path)
        .env("SAVE_PATH", save_path)
        .output()
        .map_err(|e| format!("Failed to execute Playwright: {}", e))?;

    debug!("📊 Execution status: {:?}", output.status);
    debug!("=== STDOUT ===\n{}", String::from_utf8_lossy(&output.stdout));
    if !output.stderr.is_empty() {
        warn!("=== STDERR ===\n{}", String::from_utf8_lossy(&output.stderr));
    }

    // 로그 파일에 stdout과 stderr 내용 저장
    fs::write(output_file_path, format!(
        "=== STDOUT ===\n{}\n\n=== STDERR ===\n{}", 
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    )).map_err(|e| format!("Failed to write output log: {}", e))?;

    if output.status.success() {
        // save_path 파일이 존재하는지 확인 후 읽기
        if Path::new(save_path).exists() {
            fs::read_to_string(save_path)
                .map_err(|e| format!("Failed to read result file: {}", e))
        } else {
            // save_path가 없으면 stdout 반환
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        }
    } else {
        let error_message = String::from_utf8_lossy(&output.stderr);
        Err(format!("Playwright execution failed: {}", error_message))
    }
}

fn check_playwright_installation(project_path: &str) -> Result<(), String> {
    let package_json_path = Path::new(project_path).join("package.json");
    
    if !package_json_path.exists() {
        return Err("package.json not found in project".to_string());
    }

    // package.json에서 playwright 의존성 확인
    let package_content = fs::read_to_string(&package_json_path)
        .map_err(|e| format!("Failed to read package.json: {}", e))?;
    
    if !package_content.contains("@playwright") && !package_content.contains("playwright") {
        return Err("Playwright not found in package.json dependencies".to_string());
    }

    Ok(())
}

// 파일 확장자에 따른 실행 함수 선택
pub async fn execute_file_by_type(params: ExecuteFileParams) -> Result<String, String> {
    let file_path = &params.file_path;
    
    if file_path.contains(".spec.") || file_path.contains(".test.") {
        execute_playwright(params).await
    } else if file_path.ends_with(".ts") {
        execute_ts(params).await
    } else if file_path.ends_with(".js") {
        execute_js(params).await
    } else {
        Err("Unsupported file type".to_string())
    }
}

pub async fn execute_ts(params: ExecuteFileParams) -> Result<String, String> {
    info!("🚀 Starting TypeScript execution - File: {}", params.file_path);
    debug!("📋 Execution params: {:?}", params);

    let (project_name, page_name, json_path) = prepare_execution_context(&params).await?;
    debug!("📁 Context prepared - JSON path: {}", json_path);
    let parent_dir = Path::new(&json_path)
    .parent()
    .ok_or("Failed to get parent directory for JSON path")?;
    
    // 새로운 파일명 생성 (예: "ddv_save.json")
    let new_file_name = format!("{}_save.json", params.node_name);
    let response_path = parent_dir.join(new_file_name);
    let response_path_str = response_path.to_string_lossy().to_string();
    
    debug!("💾 Response will be saved to: {}", response_path_str);

    // 프로젝트 경로 유효성 검사
    if !Path::new(&params.project_path).exists() {
        return Err(format!("Project path does not exist: {}", params.project_path));
    }

    compile_and_run(&params.file_path, &params.project_path, &json_path, &response_path_str)
}
