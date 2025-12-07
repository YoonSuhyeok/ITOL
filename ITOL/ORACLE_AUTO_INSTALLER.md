# DBeaver 방식 Oracle Instant Client 자동 설치 구현

## ✨ 구현 완료!

DBeaver와 동일한 방식으로 **앱 내에서 Oracle Instant Client를 자동으로 다운로드 및 설치**하는 기능을 구현했습니다.

## 🎯 주요 기능

### 1. **자동 감지 및 설치 제안**
```
사용자가 Oracle 연결 시도
    ↓
연결 실패 감지 (DPI-1047 등)
    ↓
자동으로 설치 다이얼로그 표시
    ↓
"Install Oracle Instant Client" 버튼
    ↓
원클릭 자동 설치
```

### 2. **앱 내부 디렉토리에 설치**
- **Windows**: `%LOCALAPPDATA%\ITOL\oracle_instant_client\`
- **Linux**: `~/.local/share/ITOL/oracle_instant_client/`
- **macOS**: `~/Library/Application Support/ITOL/oracle_instant_client/`

**장점:**
- ✅ 시스템 전역 설치 불필요
- ✅ 관리자 권한 불필요
- ✅ 다른 앱에 영향 없음
- ✅ 앱 삭제 시 함께 제거 가능

### 3. **사용자 친화적 UI**

#### 설치 다이얼로그 기능:
- 📊 **실시간 진행률 표시** (다운로드 → 압축 해제 → 설정)
- ✅ **설치 상태 확인** (이미 설치된 경우 표시)
- 🔄 **두 가지 옵션 제공**:
  - Option 1: 자동 설치 (권장)
  - Option 2: 수동 설치 (Oracle 공식 페이지 링크)
- 📝 **라이선스 안내** 포함
- ⚠️ **상세한 에러 메시지** (실패 시)

## 📁 생성된 파일들

### Backend (Rust)

#### 1. `src-tauri/src/command/oracle_installer.rs` (신규)
```rust
주요 함수:
- check_oracle_installed() → 설치 상태 확인
- install_oracle_client() → 자동 다운로드 및 설치
- download_file() → HTTP 다운로드
- extract_zip() → ZIP 압축 해제
- setup_environment_variables() → PATH 설정
```

#### 2. `src-tauri/src/command.rs` (수정)
```rust
// 모듈 추가
pub mod oracle_installer;

// 명령어 추가
#[command]
pub async fn check_oracle_installed() -> Result<OracleInstallStatus, String>

#[command]
pub async fn install_oracle_client() -> Result<String, String>
```

#### 3. `src-tauri/src/lib.rs` (수정)
```rust
.invoke_handler(tauri::generate_handler![
    // ...
    command::check_oracle_installed,
    command::install_oracle_client,
    // ...
])
```

#### 4. `src-tauri/Cargo.toml` (수정)
```toml
[dependencies]
zip = "0.6"  # ZIP 압축 해제용
reqwest = "0.12.15"  # HTTP 다운로드용
```

### Frontend (React/TypeScript)

#### 1. `src/shared/components/oracle-installer-dialog.tsx` (신규)
완전한 설치 UI 컴포넌트:
- 설치 상태 표시
- 진행률 바
- 두 가지 설치 옵션
- 에러 처리
- 라이선스 안내

#### 2. `src/shared/components/db-node-editor.tsx` (수정)
```typescript
// Oracle 설치 다이얼로그 통합
import { OracleInstallerDialog } from './oracle-installer-dialog';

// 연결 테스트 실패 시 자동으로 설치 다이얼로그 표시
if (data.connection.type === 'oracle' && errorMsg.includes('DPI-1047')) {
  setShowOracleInstaller(true);
}
```

#### 3. UI 컴포넌트 추가
- `src/shared/components/ui/progress.tsx` - 진행률 바
- `src/shared/components/ui/alert.tsx` - 알림 컴포넌트

## 🔄 사용자 시나리오

### 시나리오 1: 자동 설치 (권장)
```
1. 사용자가 DB Node Editor에서 Oracle 선택
2. 연결 정보 입력 후 "Test Connection" 클릭
3. ❌ 연결 실패 → "Oracle Instant Client not found"
4. 💡 자동으로 설치 다이얼로그 표시
5. "Install Oracle Instant Client" 버튼 클릭
6. 📥 자동 다운로드 (약 100MB)
7. 📦 자동 압축 해제
8. ⚙️ 환경 변수 자동 설정
9. ✅ 설치 완료 → 앱 재시작 안내
10. 🔄 앱 재시작 후 Oracle 사용 가능
```

### 시나리오 2: 수동 설치
```
1. 설치 다이얼로그에서 "Open Oracle Download Page" 클릭
2. Oracle 공식 사이트에서 수동 다운로드
3. 직접 설치 및 PATH 설정
4. 앱 재시작
```

## 🛠️ 기술 세부사항

### 다운로드 URL (OS별)
```rust
Windows: 
https://download.oracle.com/otn_software/nt/instantclient/2113000/instantclient-basic-windows.x64-21.13.0.0.0dbru.zip

Linux:
https://download.oracle.com/otn_software/linux/instantclient/2113000/instantclient-basic-linux.x64-21.13.0.0.0dbru.zip

macOS:
https://download.oracle.com/otn_software/mac/instantclient/2113000/instantclient-basic-macos.x64-21.13.0.0.0dbru.zip
```

### 환경 변수 자동 설정
```rust
// 현재 프로세스에만 적용 (앱 재시작 필요)
Windows: PATH에 추가
Linux: LD_LIBRARY_PATH에 추가
macOS: DYLD_LIBRARY_PATH에 추가
```

### 버전 관리
```
oracle_instant_client/
  ├── instantclient_21_13/  (압축 해제된 파일들)
  └── version.txt            (설치된 버전 정보)
```

## ⚠️ 주의사항

### 1. **앱 재시작 필요**
- 환경 변수는 현재 프로세스에만 적용
- Oracle 사용하려면 **반드시 앱 재시작 필요**
- UI에 명확하게 안내됨

### 2. **다운로드 크기**
- Basic Package: 약 100-120MB
- 네트워크 속도에 따라 시간 소요

### 3. **라이선스**
- Oracle Technology Network License 동의 필요
- 상업적 사용 시 Oracle 라이선스 확인 권장

### 4. **Oracle 서버 직접 다운로드**
- Oracle 서버가 때때로 느릴 수 있음
- 다운로드 실패 시 수동 설치 옵션 제공

## 🎨 DBeaver와 비교

| 기능 | DBeaver | ITOL |
|-----|---------|------|
| 자동 다운로드 | ✅ JDBC Driver | ✅ Instant Client |
| 앱 내부 설치 | ✅ ~/.dbeaver/drivers | ✅ AppData/ITOL |
| 진행률 표시 | ✅ | ✅ |
| 에러 처리 | ✅ | ✅ |
| 수동 옵션 | ✅ | ✅ |
| 크기 | ~5MB (JDBC) | ~100MB (Native) |

**차이점:**
- DBeaver는 Java JDBC 드라이버 (작음)
- ITOL은 Native C 라이브러리 (크지만 더 빠름)

## 🚀 향후 개선 가능성

1. **캐시 서버 운영**
   - ITOL 자체 CDN에서 다운로드
   - Oracle 서버보다 빠른 속도

2. **버전 업데이트 알림**
   - 새 버전 출시 시 알림
   - 원클릭 업데이트

3. **선택적 패키지**
   - Basic (필수)
   - SQL*Plus (선택)
   - SDK (개발자용)

4. **오프라인 설치**
   - 로컬 ZIP 파일 선택
   - 네트워크 없이 설치

## ✅ 결론

**DBeaver 방식의 자동 설치가 완전히 구현되었습니다!**

사용자는 이제:
- ❌ 복잡한 수동 설치 과정 불필요
- ❌ 시스템 PATH 수동 설정 불필요
- ❌ 관리자 권한 불필요
- ✅ **원클릭으로 Oracle 사용 가능!**

**사용자 경험:**
```
"Oracle에 연결하고 싶어요"
    ↓
"Install 버튼을 클릭하세요"
    ↓
1분 대기
    ↓
"완료! 앱을 재시작하세요"
    ↓
Oracle 사용 가능! 🎉
```
