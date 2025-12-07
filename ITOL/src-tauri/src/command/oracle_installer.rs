use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct OracleInstallStatus {
    pub installed: bool,
    pub version: Option<String>,
    path: Option<String>,
}

/// Oracle Instant Client 설치 확인
pub async fn check_oracle_installed() -> Result<OracleInstallStatus, String> {
    // 앱 데이터 디렉토리 확인
    let app_oracle_path = get_app_oracle_path()?;
    
    if app_oracle_path.exists() {
        // 버전 파일 확인
        let version = read_version_file(&app_oracle_path);
        return Ok(OracleInstallStatus {
            installed: true,
            version,
            path: Some(app_oracle_path.to_string_lossy().to_string()),
        });
    }
    
    // 시스템 PATH 확인
    if check_system_oracle() {
        return Ok(OracleInstallStatus {
            installed: true,
            version: None,
            path: None,
        });
    }
    
    Ok(OracleInstallStatus {
        installed: false,
        version: None,
        path: None,
    })
}

/// Oracle Instant Client 자동 다운로드 및 설치
pub async fn install_oracle_client() -> Result<String, String> {
    println!("Starting Oracle Instant Client installation...");
    
    let app_oracle_path = get_app_oracle_path()?;
    
    // 디렉토리 생성
    fs::create_dir_all(&app_oracle_path)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    
    // OS별 다운로드 URL
    let (download_url, file_name) = get_download_info()?;
    
    println!("Downloading from: {}", download_url);
    
    // 다운로드
    let zip_path = app_oracle_path.join(&file_name);
    download_file(&download_url, &zip_path).await?;
    
    println!("Download complete. Extracting...");
    
    // 압축 해제
    extract_zip(&zip_path, &app_oracle_path)?;
    
    // 버전 정보 저장
    save_version_file(&app_oracle_path, "21.13.0.0")?;
    
    // ZIP 파일 삭제
    let _ = fs::remove_file(&zip_path);
    
    // 환경 변수 설정 (현재 프로세스)
    setup_environment_variables(&app_oracle_path)?;
    
    println!("Oracle Instant Client installed successfully!");
    
    Ok(format!("Installed to: {}", app_oracle_path.display()))
}

/// 앱 데이터 디렉토리 경로 가져오기
fn get_app_oracle_path() -> Result<PathBuf, String> {
    let data_dir = dirs::data_local_dir()
        .ok_or("Failed to get local data directory")?;
    
    Ok(data_dir.join("ITOL").join("oracle_instant_client"))
}

/// OS별 다운로드 정보
fn get_download_info() -> Result<(String, String), String> {
    #[cfg(target_os = "windows")]
    {
        Ok((
            "https://download.oracle.com/otn_software/nt/instantclient/2113000/instantclient-basic-windows.x64-21.13.0.0.0dbru.zip".to_string(),
            "instantclient-basic-windows.zip".to_string(),
        ))
    }
    
    #[cfg(target_os = "linux")]
    {
        Ok((
            "https://download.oracle.com/otn_software/linux/instantclient/2113000/instantclient-basic-linux.x64-21.13.0.0.0dbru.zip".to_string(),
            "instantclient-basic-linux.zip".to_string(),
        ))
    }
    
    #[cfg(target_os = "macos")]
    {
        Ok((
            "https://download.oracle.com/otn_software/mac/instantclient/2113000/instantclient-basic-macos.x64-21.13.0.0.0dbru.zip".to_string(),
            "instantclient-basic-macos.zip".to_string(),
        ))
    }
    
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        Err("Unsupported operating system".to_string())
    }
}

/// 파일 다운로드
async fn download_file(url: &str, dest: &PathBuf) -> Result<(), String> {
    let response = reqwest::get(url)
        .await
        .map_err(|e| format!("Download failed: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Download failed with status: {}", response.status()));
    }
    
    let bytes = response.bytes()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    fs::write(dest, bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(())
}

/// ZIP 파일 압축 해제
fn extract_zip(zip_path: &PathBuf, target_dir: &PathBuf) -> Result<(), String> {
    let file = fs::File::open(zip_path)
        .map_err(|e| format!("Failed to open zip: {}", e))?;
    
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("Failed to read zip: {}", e))?;
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Failed to read file in zip: {}", e))?;
        
        let outpath = match file.enclosed_name() {
            Some(path) => target_dir.join(path),
            None => continue,
        };
        
        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)
                        .map_err(|e| format!("Failed to create parent directory: {}", e))?;
                }
            }
            let mut outfile = fs::File::create(&outpath)
                .map_err(|e| format!("Failed to create file: {}", e))?;
            std::io::copy(&mut file, &mut outfile)
                .map_err(|e| format!("Failed to extract file: {}", e))?;
        }
        
        // Unix 권한 설정
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Some(mode) = file.unix_mode() {
                fs::set_permissions(&outpath, fs::Permissions::from_mode(mode))
                    .map_err(|e| format!("Failed to set permissions: {}", e))?;
            }
        }
    }
    
    Ok(())
}

/// 환경 변수 설정
fn setup_environment_variables(oracle_path: &PathBuf) -> Result<(), String> {
    let instant_client_dir = oracle_path.join("instantclient_21_13");
    
    #[cfg(target_os = "windows")]
    {
        let path = std::env::var("PATH").unwrap_or_default();
        let new_path = format!("{};{}", instant_client_dir.display(), path);
        std::env::set_var("PATH", new_path);
    }
    
    #[cfg(target_os = "linux")]
    {
        let ld_path = std::env::var("LD_LIBRARY_PATH").unwrap_or_default();
        let new_ld_path = format!("{}:{}", instant_client_dir.display(), ld_path);
        std::env::set_var("LD_LIBRARY_PATH", new_ld_path);
    }
    
    #[cfg(target_os = "macos")]
    {
        let dyld_path = std::env::var("DYLD_LIBRARY_PATH").unwrap_or_default();
        let new_dyld_path = format!("{}:{}", instant_client_dir.display(), dyld_path);
        std::env::set_var("DYLD_LIBRARY_PATH", new_dyld_path);
    }
    
    Ok(())
}

/// 버전 파일 저장
fn save_version_file(oracle_path: &PathBuf, version: &str) -> Result<(), String> {
    let version_file = oracle_path.join("version.txt");
    fs::write(version_file, version)
        .map_err(|e| format!("Failed to write version file: {}", e))?;
    Ok(())
}

/// 버전 파일 읽기
fn read_version_file(oracle_path: &PathBuf) -> Option<String> {
    let version_file = oracle_path.join("version.txt");
    fs::read_to_string(version_file).ok()
}

/// 시스템 PATH에서 Oracle 확인
fn check_system_oracle() -> bool {
    #[cfg(target_os = "windows")]
    {
        if let Ok(path) = std::env::var("PATH") {
            return path.to_lowercase().contains("instantclient") || 
                   path.to_lowercase().contains("oracle");
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        if let Ok(ld_path) = std::env::var("LD_LIBRARY_PATH") {
            return ld_path.contains("instantclient") || ld_path.contains("oracle");
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        if let Ok(dyld_path) = std::env::var("DYLD_LIBRARY_PATH") {
            return dyld_path.contains("instantclient") || dyld_path.contains("oracle");
        }
    }
    
    false
}
