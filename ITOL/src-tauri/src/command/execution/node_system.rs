use serde::Deserialize;
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use crate::command::database::book;
use crate::command::database::page;
use crate::command::execution::request::get_local_request_json_path;
use crate::command::execution::request::save_request_json;
use std::io::{self, Write};

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

pub async fn execute_js(params: ExecuteFileParams) -> Result<String, String> {
    
    let project_name = match params.project_id {
        Some(id) => book::getBookById(id)
            .await
            .map_err(|e| e.to_string())?
            .title,
        None => "root".to_owned(),
    };

    print!("Project name: {}", project_name);
    let page_name = page::getPageById(params.page_id)
    .await
    .map_err(|e|e.to_string())?
    .title;
    print!("Page name: {}", page_name);

    let local_request_json_path = get_local_request_json_path(project_name, page_name);

    let json = params.param;
    
    let json_path = save_request_json(local_request_json_path.unwrap(), params.node_name, json, params.run_id)
        .map_err(|e| e.to_string())?;
    
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

pub async fn execute_ts(params: ExecuteFileParams) -> Result<String, String> {
    println!("Executing TS file: {}", params.file_path);

    let project_name = match params.project_id {
        Some(id) => book::getBookById(id)
            .await
            .map_err(|e| e.to_string())?
            .title,
        None => "root".to_owned(),
    };

    println!("Project name: {}", project_name);
    let page_name = page::getPageById(params.page_id)
    .await
    .map_err(|e|e.to_string())?
    .title;
    println!("Page name: {}", page_name);

    let local_request_json_path = get_local_request_json_path(project_name, page_name);

    let json = params.param;
    
    let json_path = save_request_json(local_request_json_path.unwrap(), params.node_name.clone(), json, params.run_id)
        .map_err(|e| e.to_string())?;
    let parent_dir = Path::new(&json_path)
    .parent()
    .ok_or("Failed to get parent directory for JSON path")?;
    
    // 새로운 파일명 생성 (예: "ddv_save.json")
    let new_file_name = format!("{}_save.json", params.node_name);
    let response_path = parent_dir.join(new_file_name);
    let response_path_str = response_path.to_string_lossy().to_string();

    compile_and_run(&params.file_path, &params.project_path, &json_path, &response_path_str)
}

fn compile_and_run(ts_file: &str, ts_build_path: &str, json_path: &str, save_path: &str) -> Result<String, String> {
    println!("Compiling TypeScript file: {}", ts_file);
    io::stdout().flush().unwrap();

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

    // 실행하기 전에 명령어 출력
    println!("Executing: node {} {}", js_file_path, json_path);
    io::stdout().flush().unwrap();

    let json_output_parent = Path::new(json_path)
    .parent()
    .ok_or("Failed to get parent directory for JSON path")?;
    let output_file_path = json_output_parent.join("output.txt");

    let output_file = File::create(&output_file_path)
        .map_err(|e| format!("Failed to create output file at {:?}: {}", output_file_path, e))?;
    
        let output = Command::new("node")
        .arg(&js_file_path)
        .arg(json_path)
        .arg(save_path)
        .output() // stdout과 stderr를 모두 캡처
        .map_err(|e| format!("Failed to execute compiled file: {}", e))?;
    
    
        println!("Execution status: {:?}", output.status);
        println!("=== STDOUT ===\n{}", String::from_utf8_lossy(&output.stdout));
        println!("=== STDERR ===\n{}", String::from_utf8_lossy(&output.stderr));

        // 로그 파일에 stdout과 stderr 내용 저장
        fs::write(output_file_path, format!(
            "=== STDOUT ===\n{}\n\n=== STDERR ===\n{}", 
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        )).map_err(|e| format!("Failed to write output log: {}", e))?;

    println!("Execution status: {:?}", output.status);
    
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

fn build_project(project_path: &str) -> Result<(), String> {
    use std::process::Command;
    use std::io::{self, Write};

    println!("Building project in directory: {}", project_path);
    io::stdout().flush().unwrap();

    #[cfg(target_os = "windows")]
    let npm_cmd = "npm.cmd";
    #[cfg(not(target_os = "windows"))]
    let npm_cmd = "npm";

    let output = Command::new(npm_cmd)
        .current_dir(project_path) // package.json이 있는 프로젝트 경로 지정
        .arg("run")
        .arg("build")
        .output()
        .map_err(|e| format!("Failed to execute build command: {}", e))?;

    println!("Build stdout:\n{}", String::from_utf8_lossy(&output.stdout));
    println!("Build stderr:\n{}", String::from_utf8_lossy(&output.stderr));
    println!("Exit code: {:?}", output.status.code());

    if output.status.success() {
        println!(
            "Build succeeded:\n{}",
            String::from_utf8_lossy(&output.stdout)
        );
        Ok(())
    } else {
        Err(format!(
            "Build failed:\n{}",
            String::from_utf8_lossy(&output.stderr)
        ))
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
    // 만약 첫 번째 컴포넌트가 "src"라면 건너뛰기
    if let Some(first) = components.next() {
        if first == Component::Normal("src".as_ref()) {
            // 나머지 경로를 String으로 변환
            let remaining = components.as_path();
            Ok(remaining.to_string_lossy().to_string())
        } else {
            // "src"가 없으면 그대로 반환
            Ok(relative.to_string_lossy().to_string())
        }
    } else {
        Err("Empty relative path".to_owned())
    }
}