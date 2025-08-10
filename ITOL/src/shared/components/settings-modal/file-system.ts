import { readDir, stat } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import type { FileSystemItem } from './types';

/**
 * 디렉토리의 파일과 폴더를 읽어서 FileSystemItem 배열로 반환
 */
export async function loadFolderFiles(folderPath: string, filterFiles: boolean = true): Promise<FileSystemItem[]> {
  console.log(`📁 Loading folder files for path: ${folderPath}`);
  
  if (!folderPath) {
    console.warn('⚠️ Empty folder path provided');
    return [];
  }

  try {
    const entries = await readDir(folderPath);
    console.log(`📋 Read ${entries.length} directory entries from: ${folderPath}`);
    
    const items: FileSystemItem[] = [];
    
    for (const entry of entries) {
      try {
        const fullPath = await join(folderPath, entry.name);
        const stats = await stat(fullPath);
        
        console.log(`  ${stats.isDirectory ? '📁' : '📄'} ${entry.name} (${stats.isDirectory ? 'directory' : 'file'})`);
        
        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: stats.isDirectory,
          children: stats.isDirectory ? undefined : undefined, // 초기에는 undefined로 설정
          isExpanded: false,
          isChildrenLoaded: false // 아직 하위 내용이 로드되지 않음
        });
      } catch (error) {
        console.warn(`⚠️ Failed to stat ${entry.name}:`, error);
        // 에러가 발생한 파일은 스킵하고 계속 진행
      }
    }
    
    // 필터링 적용
    let filteredItems = items;
    if (filterFiles) {
      filteredItems = filterDevelopmentFiles(items, false);
      console.log(`🔍 Filtered ${items.length} → ${filteredItems.length} items (development files only)`);
    }
    
    // 디렉토리를 먼저, 그 다음 파일을 이름순으로 정렬
    filteredItems.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    console.log(`✅ Processed ${filteredItems.length} items from: ${folderPath}${filterFiles ? ' (filtered)' : ''}`);
    return filteredItems;
  } catch (error) {
    console.error(`❌ Error loading folder files from ${folderPath}:`, error);
    throw new Error(`폴더를 읽을 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 프로젝트 경로의 파일들을 로드
 */
export async function loadProjectFiles(projectPath: string, filterFiles: boolean = true): Promise<FileSystemItem[]> {
  console.log(`🚀 Loading project files for path: ${projectPath}`);
  
  if (!projectPath) {
    console.warn('⚠️ Empty project path provided');
    return [];
  }

  try {
    // 먼저 경로가 디렉토리인지 확인
    const pathStats = await stat(projectPath);
    if (!pathStats.isDirectory) {
      console.error(`❌ Path is not a directory: ${projectPath}`);
      throw new Error('선택한 경로가 디렉토리가 아닙니다.');
    }

    console.log(`📂 Project path validated: ${projectPath}`);
    return await loadFolderFiles(projectPath, filterFiles);
  } catch (error) {
    console.error(`❌ Error loading project files from ${projectPath}:`, error);
    throw new Error(`프로젝트 파일을 읽을 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 파일 시스템 아이템의 자식 폴더를 토글 (확장/축소)
 */
export async function toggleFolder(
  items: FileSystemItem[], 
  targetPath: string,
  autoLoadSubdirectories: boolean = true,
  maxDepth: number = 2
): Promise<FileSystemItem[]> {
  const toggleItem = async (item: FileSystemItem): Promise<FileSystemItem> => {
    if (item.path === targetPath && item.isDirectory) {
      console.log(`🔄 Toggling folder: ${item.name} (${item.path})`);
      
      if (item.isExpanded) {
        // 축소 (하지만 children는 유지하여 개수 표시)
        console.log(`📁 Collapsing folder: ${item.name}`);
        return {
          ...item,
          isExpanded: false
          // children와 isChildrenLoaded는 유지
        };
      } else {
        // 확장
        console.log(`📁 Expanding folder: ${item.name}`);
        try {
          console.log(`   └─ Loading direct children...`);
          const children = await loadFolderFiles(item.path, true);
          
          // 자동으로 하위 디렉토리도 로드
          let processedChildren = children;
          if (autoLoadSubdirectories && maxDepth > 1) {
            console.log(`   └─ Auto-loading subdirectories (maxDepth: ${maxDepth})...`);
            processedChildren = await preloadSubdirectories(children, maxDepth - 1, 0, false, true);
          }
          
          console.log(`   └─ ✅ Expanded ${item.name} with ${processedChildren.length} children`);
          return {
            ...item,
            isExpanded: true,
            children: processedChildren,
            isChildrenLoaded: true
          };
        } catch (error) {
          console.error(`   └─ ❌ Error expanding folder ${item.name}:`, error);
          return {
            ...item,
            isExpanded: false,
            children: [],
            isChildrenLoaded: true
          };
        }
      }
    }

    // 자식 항목들을 재귀적으로 처리
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: await Promise.all(item.children.map(child => toggleItem(child)))
      };
    }

    return item;
  };

  return Promise.all(items.map(toggleItem));
}

/**
 * 특정 폴더의 하위 내용을 미리 로드하는 함수
 */
export async function preloadSubdirectories(
  items: FileSystemItem[], 
  maxDepth: number = 2,
  currentDepth: number = 0,
  autoExpand: boolean = false,
  filterFiles: boolean = true
): Promise<FileSystemItem[]> {
  const indent = '  '.repeat(currentDepth);
  console.log(`${indent}🔄 preloadSubdirectories: depth ${currentDepth}/${maxDepth}, autoExpand=${autoExpand}, items=${items.length}`);
  
  if (currentDepth >= maxDepth) {
    console.log(`${indent}⏹️ Max depth ${maxDepth} reached, stopping recursion`);
    return items;
  }

  const processItem = async (item: FileSystemItem): Promise<FileSystemItem> => {
    if (item.isDirectory && !item.isChildrenLoaded) {
      try {
        console.log(`${indent}📁 Processing directory: ${item.name} (${item.path})`);
        console.log(`${indent}   └─ Loading children...`);
        
        const children = await loadFolderFiles(item.path, filterFiles);
        console.log(`${indent}   └─ Found ${children.length} children`);
        
        console.log(`${indent}   └─ Recursively processing children...`);
        const processedChildren = await preloadSubdirectories(children, maxDepth, currentDepth + 1, autoExpand, filterFiles);
        
        const shouldExpand = autoExpand && currentDepth < maxDepth;
        console.log(`${indent}   └─ Directory ${item.name}: expanded=${shouldExpand}, finalChildren=${processedChildren.length}`);
        
        return {
          ...item,
          children: processedChildren,
          isExpanded: shouldExpand, // 최대 깊이까지 모두 확장
          isChildrenLoaded: true // 하위 내용이 로드됨
        };
      } catch (error) {
        console.warn(`${indent}⚠️ Failed to preload subdirectory: ${item.path}`, error);
        return {
          ...item,
          isChildrenLoaded: true, // 실패했지만 시도는 했음
          children: []
        };
      }
    } else if (item.isDirectory && item.isChildrenLoaded) {
      console.log(`${indent}📁 ${item.name} already loaded (${item.children?.length || 0} children)`);
    } else {
      console.log(`${indent}📄 ${item.name} (file)`);
    }
    return item;
  };

  const result = await Promise.all(items.map(processItem));
  console.log(`${indent}✅ Completed processing ${items.length} items at depth ${currentDepth}`);
  return result;
}

/**
 * 파일 시스템 트리에서 특정 경로의 아이템을 찾는 함수
 */
export function findItemByPath(items: FileSystemItem[], targetPath: string): FileSystemItem | null {
  for (const item of items) {
    if (item.path === targetPath) {
      return item;
    }
    if (item.children) {
      const found = findItemByPath(item.children, targetPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 파일 시스템 트리를 평면화하여 모든 파일들의 경로를 가져오는 함수
 */
export function flattenFileTree(items: FileSystemItem[]): string[] {
  const filePaths: string[] = [];
  
  const processItem = (item: FileSystemItem) => {
    if (!item.isDirectory) {
      filePaths.push(item.path);
    }
    if (item.children) {
      item.children.forEach(processItem);
    }
  };
  
  items.forEach(processItem);
  return filePaths;
}

/**
 * 파일 확장자를 반환
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1) : '';
}

/**
 * 파일명에서 확장자를 제거한 이름을 반환
 */
export function getFileNameWithoutExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
}

/**
 * 경로가 유효한 디렉토리인지 확인
 */
export async function isValidDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory;
  } catch {
    return false;
  }
}

/**
 * 경로가 유효한 파일인지 확인
 */
export async function isValidFile(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isFile;
  } catch {
    return false;
  }
}

/**
 * 개발 관련 파일 확장자 목록
 */
const DEVELOPMENT_FILE_EXTENSIONS = [
  // 프로그래밍 언어
  'ts', 'tsx', 'js', 'jsx', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt',
  // 웹 기술
  'html', 'htm', 'css', 'scss', 'sass', 'less', 'vue', 'svelte',
  // 구성 파일
  'json', 'yaml', 'yml', 'toml', 'xml', 'ini', 'cfg', 'conf',
  // 문서
  'md', 'mdx', 'txt', 'rst', 'adoc',
  // 데이터
  'sql', 'graphql', 'gql',
  // 설정/빌드
  'dockerfile', 'makefile', 'gradle', 'cmake',
  // 스크립트
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd'
];

/**
 * 숨김 폴더/파일 패턴 목록
 */
const HIDDEN_PATTERNS = [
  // 시스템 파일
  /^\./,
  // 빌드 결과물
  /^(node_modules|target|build|dist|out|bin|obj|\.next|\.nuxt)$/,
  // 버전 관리
  /^(\.git|\.svn|\.hg)$/,
  // IDE/에디터
  /^(\.vscode|\.idea|\.vs)$/,
  // 캐시
  /^(\.cache|\.temp|\.tmp)$/,
  // 로그
  /\.log$/,
  // 락 파일
  /\.(lock|lockb)$/
];

/**
 * 파일이 개발 관련 파일인지 확인
 */
export function isDevelopmentFile(fileName: string): boolean {
  const extension = getFileExtension(fileName).toLowerCase();
  return DEVELOPMENT_FILE_EXTENSIONS.includes(extension);
}

/**
 * 파일/폴더가 숨겨져야 하는지 확인
 */
export function shouldHideItem(name: string): boolean {
  return HIDDEN_PATTERNS.some(pattern => pattern.test(name));
}

/**
 * 개발 관련 파일만 필터링하는 함수
 */
export function filterDevelopmentFiles(items: FileSystemItem[], showHidden: boolean = false): FileSystemItem[] {
  return items
    .filter(item => {
      // 숨김 파일/폴더 필터링
      if (!showHidden && shouldHideItem(item.name)) {
        return false;
      }
      
      // 폴더는 항상 포함 (하위에 개발 파일이 있을 수 있음)
      if (item.isDirectory) {
        return true;
      }
      
      // 파일의 경우 개발 관련 파일만 포함
      return isDevelopmentFile(item.name);
    })
    .map(item => {
      // 하위 항목들도 재귀적으로 필터링
      if (item.isDirectory && item.children) {
        return {
          ...item,
          children: filterDevelopmentFiles(item.children, showHidden)
        };
      }
      return item;
    });
}

/**
 * 파일 시스템 트리에서 파일명으로 검색하는 함수
 */
export function searchFilesByName(items: FileSystemItem[], searchTerm: string): FileSystemItem[] {
  if (!searchTerm.trim()) {
    return items;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();
  
  const searchItem = (item: FileSystemItem): FileSystemItem | null => {
    const nameMatches = item.name.toLowerCase().includes(lowerSearchTerm);
    
    if (item.isDirectory) {
      // 폴더의 경우 하위 항목들을 검색
      const matchingChildren = item.children ? 
        item.children.map(searchItem).filter(Boolean) as FileSystemItem[] : [];
      
      // 폴더 이름이 매치되거나 하위에 매치되는 항목이 있으면 포함
      if (nameMatches || matchingChildren.length > 0) {
        return {
          ...item,
          children: matchingChildren.length > 0 ? matchingChildren : item.children,
          isExpanded: matchingChildren.length > 0 // 매치되는 하위 항목이 있으면 자동 확장
        };
      }
    } else if (nameMatches) {
      // 파일의 경우 이름이 매치되면 포함
      return item;
    }
    
    return null;
  };

  return items.map(searchItem).filter(Boolean) as FileSystemItem[];
}
