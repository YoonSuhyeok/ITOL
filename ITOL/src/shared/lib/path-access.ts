import { invoke } from '@tauri-apps/api/core';

/**
 * 특정 경로에 대한 접근 권한을 요청하는 함수
 */
export async function requestPathAccess(path: string): Promise<boolean> {
  try {
    console.log(`🔓 Requesting access to path: ${path}`);
    const result = await invoke<boolean>('request_path_access', { path });
    console.log(`🔓 Access request result for ${path}: ${result}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to request access to ${path}:`, error);
    return false;
  }
}

/**
 * 특정 경로에 접근할 수 있는지 확인하는 함수
 */
export async function checkPathAccess(path: string): Promise<boolean> {
  try {
    const result = await invoke<boolean>('check_path_access', { path });
    console.log(`🔍 Path access check for ${path}: ${result}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to check access to ${path}:`, error);
    return false;
  }
}

/**
 * 프로젝트 경로를 설정하고 접근 권한을 요청하는 함수
 */
export async function setProjectPathWithAccess(path: string): Promise<boolean> {
  console.log(`📂 Setting project path with access: ${path}`);
  
  // 1. 먼저 경로 접근 권한 요청
  const accessGranted = await requestPathAccess(path);
  if (!accessGranted) {
    console.error(`❌ Access denied to path: ${path}`);
    return false;
  }
  
  // 2. 접근 권한이 부여되면 설정에 저장
  try {
    await invoke('set_config_path_command', { newPath: path });
    console.log(`✅ Project path set successfully: ${path}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to set project path: ${path}`, error);
    return false;
  }
}

/**
 * 현재 설정된 프로젝트 경로의 접근 권한을 확인하는 함수
 */
export async function validateCurrentProjectPath(language: string = 'js'): Promise<boolean> {
  try {
    // 현재 설정된 경로 가져오기
    const currentPath = await invoke<string>('get_config_path_command', { language });
    console.log(`🔍 Validating current project path: ${currentPath}`);
    
    // 접근 권한 확인
    return await checkPathAccess(currentPath);
  } catch (error) {
    console.error(`❌ Failed to validate current project path:`, error);
    return false;
  }
}

/**
 * 폴더 선택 다이얼로그를 열고 선택된 경로의 접근 권한을 요청하는 함수
 */
export async function selectFolderWithAccess(): Promise<string | null> {
  try {
    const selectedPath = await invoke<string>('select_folder_dialog');
    
    if (selectedPath) {
      const accessGranted = await requestPathAccess(selectedPath);
      if (accessGranted) {
        console.log(`✅ Folder selected and access granted: ${selectedPath}`);
        return selectedPath;
      } else {
        console.error(`❌ Access denied to selected folder: ${selectedPath}`);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Failed to select folder:`, error);
    return null;
  }
}
