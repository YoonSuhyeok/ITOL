# API Node UI 구현

Postman과 같은 API 클라이언트 UI를 구현한 React 컴포넌트입니다.

## 📁 프로젝트 구조

```
src/
├── entities/language/
│   ├── model/
│   │   └── api-node-type.ts          # API Node 데이터 타입 정의
│   └── ui/
│       └── api-node.tsx               # API Node UI 컴포넌트
├── features/api/
│   └── services/
│       └── api-execution.service.ts   # API 실행 서비스
└── pages/
    └── api-node-test.tsx              # 테스트 페이지

e2e/
└── api-node.spec.ts                   # Playwright E2E 테스트
```

## 🎯 주요 기능

### 1. HTTP 요청 구성
- **HTTP Method 선택**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **URL 입력**: 완전한 URL 입력 및 Query Parameter 자동 구성
- **Headers 관리**: Key-Value 형태로 HTTP 헤더 추가/수정/삭제
- **Query Parameters**: URL에 추가될 쿼리 파라미터 관리
- **Request Body**: 
  - JSON
  - Form Data
  - x-www-form-urlencoded
  - Raw Text
- **Authentication**:
  - Bearer Token
  - Basic Auth
  - API Key

### 2. 응답 표시
- HTTP Status Code 및 Status Text
- 응답 시간 (ms)
- 응답 Headers
- 응답 Body (JSON 포맷팅)
- 에러 메시지

### 3. UI 기능
- 노드 접기/펼치기
- 탭 기반 요청 세부 정보 관리
- 실시간 입력 검증
- 로딩 상태 표시

## 🚀 사용 방법

### 기본 사용법

```tsx
import ApiNode from '@/entities/language/ui/api-node';
import { createDefaultApiNodeData } from '@/entities/language/model/api-node-type';

function MyComponent() {
  const nodeData = createDefaultApiNodeData();
  
  return (
    <ApiNode 
      id="my-api-node" 
      data={nodeData}
    />
  );
}
```

### 커스텀 데이터와 함께 사용

```tsx
import ApiNode from '@/entities/language/ui/api-node';
import type { ApiNodeData } from '@/entities/language/model/api-node-type';

const customData: ApiNodeData = {
  url: 'https://api.example.com/users',
  method: 'GET',
  headers: [
    { 
      id: '1', 
      key: 'Authorization', 
      value: 'Bearer token123', 
      enabled: true 
    }
  ],
  queryParams: [
    { 
      id: '2', 
      key: 'page', 
      value: '1', 
      enabled: true 
    }
  ],
  bodyType: 'none',
  auth: { type: 'bearer', token: 'token123' },
  name: 'Get Users API',
  description: 'Fetch all users from the API'
};

function MyComponent() {
  return (
    <ApiNode 
      id="users-api" 
      data={customData}
    />
  );
}
```

## 🧪 테스트

### Playwright 테스트 실행

```bash
# 테스트 실행
pnpm test:e2e

# UI 모드로 테스트 실행
pnpm test:e2e:ui

# 디버그 모드로 테스트 실행
pnpm test:e2e:debug
```

### 테스트 커버리지

현재 구현된 E2E 테스트:

1. ✅ 기본 렌더링 확인
2. ✅ HTTP Method 선택 변경
3. ✅ URL 입력
4. ✅ Query Parameter 추가/수정/삭제
5. ✅ Header 추가/수정/삭제/활성화
6. ✅ Body Type 변경 (JSON, Raw)
7. ✅ Authentication 설정 (Bearer, Basic)
8. ✅ 노드 접기/펼치기
9. ✅ Send 버튼 클릭 및 Response 확인
10. ✅ URL 없이 Send 버튼 비활성화
11. ✅ 완전한 API 요청 플로우

### 테스트 페이지

테스트를 위한 독립적인 페이지가 제공됩니다:

```bash
# 개발 서버 실행
pnpm dev

# 브라우저에서 접속
# http://localhost:5173 (메인 앱)
```

테스트 페이지 컴포넌트: `src/pages/api-node-test.tsx`

## 📝 데이터 타입

### ApiNodeData

```typescript
interface ApiNodeData {
  url: string;
  method: HttpMethod;
  headers: ApiHeader[];
  queryParams: QueryParam[];
  bodyType: BodyType;
  jsonBody?: string;
  formData?: FormDataItem[];
  rawBody?: string;
  auth: ApiAuth;
  response?: ApiResponse;
  name: string;
  description?: string;
  isLoading?: boolean;
  lastExecuted?: number;
}
```

### ApiResponse

```typescript
interface ApiResponse {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: any;
  error?: string;
  timestamp?: number;
  duration?: number; // ms
}
```

## 🔧 API 실행 서비스

`ApiExecutionService` 클래스는 실제 HTTP 요청을 실행합니다:

```typescript
import { ApiExecutionService } from '@/features/api/services/api-execution.service';

// API 요청 실행
const response = await ApiExecutionService.executeRequest(apiNodeData);

// cURL 명령어로 변환
const curlCommand = ApiExecutionService.toCurl(apiNodeData);
console.log(curlCommand);
```

### 지원 기능

- ✅ 모든 HTTP Method
- ✅ Query Parameters 자동 구성
- ✅ Headers 자동 설정
- ✅ Authentication (Bearer, Basic, API Key)
- ✅ 다양한 Body Type (JSON, Form Data, URL Encoded, Raw)
- ✅ 자동 Content-Type 설정
- ✅ 응답 시간 측정
- ✅ 에러 핸들링
- ✅ cURL 명령어 변환

## 🎨 UI 컴포넌트

### 사용된 UI 라이브러리

- **@xyflow/react**: 노드 기반 UI
- **@radix-ui**: 접근성을 고려한 UI 컴포넌트
  - Select
  - Tabs
  - Checkbox
- **lucide-react**: 아이콘
- **Tailwind CSS**: 스타일링

### 커스터마이징

컴포넌트의 스타일은 Tailwind CSS 클래스를 통해 커스터마이징할 수 있습니다.

HTTP Method별 색상:

```typescript
const HTTP_METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-green-500',
  POST: 'bg-blue-500',
  PUT: 'bg-orange-500',
  DELETE: 'bg-red-500',
  PATCH: 'bg-purple-500',
  HEAD: 'bg-gray-500',
  OPTIONS: 'bg-yellow-500'
};
```

## 🔍 테스트 ID

UI 테스트를 위한 `data-testid` 속성:

- `api-node`: API Node 전체
- `method-select`: HTTP Method 선택
- `url-input`: URL 입력
- `send-button`: Send 버튼
- `tab-params`, `tab-headers`, `tab-body`, `tab-auth`: 탭
- `add-param`, `add-header`: 추가 버튼
- `param-key-{id}`, `param-value-{id}`: 파라미터 입력
- `header-key-{id}`, `header-value-{id}`: 헤더 입력
- `response-section`: 응답 영역
- `response-status`: 응답 상태
- `response-data`: 응답 데이터

## 🚧 향후 개선 사항

- [ ] Form Data 파일 업로드 지원
- [ ] 요청 히스토리 관리
- [ ] 환경 변수 지원
- [ ] 요청 저장 및 불러오기
- [ ] Collection 관리
- [ ] Response Headers 탭 분리
- [ ] Response 다운로드 기능
- [ ] 코드 생성 (cURL, JavaScript, Python 등)
- [ ] WebSocket 지원
- [ ] GraphQL 지원

## 📄 라이선스

이 프로젝트는 ITOL 프로젝트의 일부입니다.

## 🤝 기여

버그 리포트, 기능 제안, Pull Request는 언제나 환영합니다!
