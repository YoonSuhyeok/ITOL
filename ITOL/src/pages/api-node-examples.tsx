import ApiNode from '@/entities/language/ui/api-node';
import { createDefaultApiNodeData } from '@/entities/language/model/api-node-type';
import type { ApiNodeData } from '@/entities/language/model/api-node-type';

/**
 * API Node 사용 예제 모음
 */

// 예제 1: 기본 GET 요청
export const example1_BasicGet = (): JSX.Element => {
  const data = createDefaultApiNodeData();
  data.url = 'https://jsonplaceholder.typicode.com/posts';
  data.method = 'GET';
  data.name = 'Get All Posts';

  return <ApiNode id="example-1" data={data} />;
};

// 예제 2: Bearer Token 인증을 사용하는 GET 요청
export const example2_GetWithAuth = (): JSX.Element => {
  const data = createDefaultApiNodeData();
  data.url = 'https://api.github.com/user';
  data.method = 'GET';
  data.name = 'Get GitHub User';
  data.auth = {
    type: 'bearer',
    token: 'your_github_token_here'
  };

  return <ApiNode id="example-2" data={data} />;
};

// 예제 3: Query Parameters를 사용하는 GET 요청
export const example3_GetWithParams = (): JSX.Element => {
  const data = createDefaultApiNodeData();
  data.url = 'https://jsonplaceholder.typicode.com/posts';
  data.method = 'GET';
  data.name = 'Get Filtered Posts';
  data.queryParams = [
    { id: '1', key: 'userId', value: '1', enabled: true },
    { id: '2', key: '_limit', value: '5', enabled: true }
  ];

  return <ApiNode id="example-3" data={data} />;
};

// 예제 4: JSON Body를 사용하는 POST 요청
export const example4_PostWithJson = (): JSX.Element => {
  const data = createDefaultApiNodeData();
  data.url = 'https://jsonplaceholder.typicode.com/posts';
  data.method = 'POST';
  data.name = 'Create New Post';
  data.bodyType = 'json';
  data.jsonBody = JSON.stringify({
    title: 'My New Post',
    body: 'This is the content of my post',
    userId: 1
  }, null, 2);
  data.headers = [
    { id: '1', key: 'Content-Type', value: 'application/json', enabled: true }
  ];

  return <ApiNode id="example-4" data={data} />;
};

// 예제 5: Custom Headers를 사용하는 GET 요청
export const example5_GetWithHeaders = (): JSX.Element => {
  const data = createDefaultApiNodeData();
  data.url = 'https://api.example.com/data';
  data.method = 'GET';
  data.name = 'Get Data with Custom Headers';
  data.headers = [
    { id: '1', key: 'X-API-Key', value: 'your_api_key', enabled: true },
    { id: '2', key: 'Accept', value: 'application/json', enabled: true },
    { id: '3', key: 'X-Custom-Header', value: 'custom-value', enabled: true }
  ];

  return <ApiNode id="example-5" data={data} />;
};

// 예제 6: PUT 요청으로 리소스 업데이트
export const example6_PutUpdate = (): JSX.Element => {
  const data = createDefaultApiNodeData();
  data.url = 'https://jsonplaceholder.typicode.com/posts/1';
  data.method = 'PUT';
  data.name = 'Update Post';
  data.bodyType = 'json';
  data.jsonBody = JSON.stringify({
    id: 1,
    title: 'Updated Title',
    body: 'Updated content',
    userId: 1
  }, null, 2);
  data.headers = [
    { id: '1', key: 'Content-Type', value: 'application/json', enabled: true }
  ];

  return <ApiNode id="example-6" data={data} />;
};

// 예제 7: DELETE 요청
export const example7_Delete = (): JSX.Element => {
  const data = createDefaultApiNodeData();
  data.url = 'https://jsonplaceholder.typicode.com/posts/1';
  data.method = 'DELETE';
  data.name = 'Delete Post';

  return <ApiNode id="example-7" data={data} />;
};

// 예제 8: Basic Authentication
export const example8_BasicAuth = (): JSX.Element => {
  const data = createDefaultApiNodeData();
  data.url = 'https://httpbin.org/basic-auth/user/passwd';
  data.method = 'GET';
  data.name = 'Basic Auth Example';
  data.auth = {
    type: 'basic',
    username: 'user',
    password: 'passwd'
  };

  return <ApiNode id="example-8" data={data} />;
};

// 예제 9: Raw Body를 사용하는 POST 요청
export const example9_PostWithRaw = (): JSX.Element => {
  const data = createDefaultApiNodeData();
  data.url = 'https://api.example.com/webhook';
  data.method = 'POST';
  data.name = 'Send Raw Data';
  data.bodyType = 'raw';
  data.rawBody = 'This is raw text data\nWith multiple lines\nAnd no specific format';
  data.headers = [
    { id: '1', key: 'Content-Type', value: 'text/plain', enabled: true }
  ];

  return <ApiNode id="example-9" data={data} />;
};

// 예제 10: 복잡한 API 요청 (모든 기능 사용)
export const example10_ComplexRequest = (): JSX.Element => {
  const data: ApiNodeData = {
    url: 'https://api.example.com/v1/users',
    method: 'POST',
    name: 'Complex API Request',
    description: 'This example demonstrates all available features',
    
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: '2', key: 'Accept', value: 'application/json', enabled: true },
      { id: '3', key: 'X-Request-ID', value: '12345', enabled: true },
      { id: '4', key: 'X-Debug', value: 'false', enabled: false } // 비활성화된 헤더
    ],
    
    queryParams: [
      { id: '1', key: 'page', value: '1', enabled: true },
      { id: '2', key: 'limit', value: '10', enabled: true },
      { id: '3', key: 'sort', value: 'name', enabled: true },
      { id: '4', key: 'debug', value: 'true', enabled: false } // 비활성화된 파라미터
    ],
    
    bodyType: 'json',
    jsonBody: JSON.stringify({
      username: 'johndoe',
      email: 'john@example.com',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        age: 30
      },
      tags: ['developer', 'javascript', 'react']
    }, null, 2),
    
    auth: {
      type: 'bearer',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    
    isLoading: false
  };

  return <ApiNode id="example-10" data={data} />;
};

// 모든 예제를 렌더링하는 컴포넌트
export default function ApiNodeExamples() {
  return (
    <div className="p-8 space-y-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">API Node Examples</h1>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Basic GET Request</h2>
        {example1_BasicGet()}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. GET with Bearer Token</h2>
        {example2_GetWithAuth()}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. GET with Query Parameters</h2>
        {example3_GetWithParams()}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. POST with JSON Body</h2>
        {example4_PostWithJson()}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. GET with Custom Headers</h2>
        {example5_GetWithHeaders()}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">6. PUT Request</h2>
        {example6_PutUpdate()}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">7. DELETE Request</h2>
        {example7_Delete()}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">8. Basic Authentication</h2>
        {example8_BasicAuth()}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">9. POST with Raw Body</h2>
        {example9_PostWithRaw()}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">10. Complex Request (All Features)</h2>
        {example10_ComplexRequest()}
      </section>
    </div>
  );
}
