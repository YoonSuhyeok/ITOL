import { test, expect } from '@playwright/test';

test.describe('API Node UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // API Node 테스트 페이지로 이동
    await page.goto('/test-api-node.html');
    
    // API Node가 렌더링될 때까지 대기
    await page.waitForSelector('[data-testid="api-node"]');
  });

  test('기본 렌더링 확인', async ({ page }) => {
    // API Node가 렌더링되었는지 확인
    const apiNode = page.getByTestId('api-node');
    await expect(apiNode).toBeVisible();
  });

  test('HTTP Method 선택 변경', async ({ page }) => {
    // Method select 열기
    await page.getByTestId('method-select').click();
    
    // POST 메서드 선택
    await page.getByTestId('method-POST').click();
    
    // 선택이 반영되었는지 확인
    const methodSelect = page.getByTestId('method-select');
    await expect(methodSelect).toContainText('POST');
  });

  test('URL 입력', async ({ page }) => {
    const urlInput = page.getByTestId('url-input');
    
    // URL 입력
    await urlInput.fill('https://api.example.com/users');
    
    // 입력값 확인
    await expect(urlInput).toHaveValue('https://api.example.com/users');
  });

  test('Query Parameter 추가 및 수정', async ({ page }) => {
    // Params 탭 클릭
    await page.getByTestId('tab-params').click();
    
    // Add 버튼 클릭
    await page.getByTestId('add-param').click();
    
    // 파라미터 입력 필드가 나타나는지 확인
    const paramKey = page.getByTestId(/param-key-/);
    const paramValue = page.getByTestId(/param-value-/);
    
    await expect(paramKey.first()).toBeVisible();
    await expect(paramValue.first()).toBeVisible();
    
    // Key와 Value 입력
    await paramKey.first().fill('userId');
    await paramValue.first().fill('123');
    
    // 입력값 확인
    await expect(paramKey.first()).toHaveValue('userId');
    await expect(paramValue.first()).toHaveValue('123');
  });

  test('Query Parameter 삭제', async ({ page }) => {
    // Params 탭 클릭
    await page.getByTestId('tab-params').click();
    
    // 파라미터 추가
    await page.getByTestId('add-param').click();
    await page.getByTestId(/param-key-/).first().fill('test');
    
    // 삭제 버튼 클릭
    await page.getByTestId(/param-delete-/).first().click();
    
    // 파라미터가 삭제되었는지 확인
    await expect(page.getByTestId(/param-key-/)).not.toBeVisible();
  });

  test('Header 추가 및 수정', async ({ page }) => {
    // Headers 탭 클릭
    await page.getByTestId('tab-headers').click();
    
    // Add 버튼 클릭
    await page.getByTestId('add-header').click();
    
    // 헤더 입력 필드가 나타나는지 확인
    const headerKey = page.getByTestId(/header-key-/);
    const headerValue = page.getByTestId(/header-value-/);
    
    await expect(headerKey.first()).toBeVisible();
    await expect(headerValue.first()).toBeVisible();
    
    // Key와 Value 입력
    await headerKey.first().fill('Content-Type');
    await headerValue.first().fill('application/json');
    
    // 입력값 확인
    await expect(headerKey.first()).toHaveValue('Content-Type');
    await expect(headerValue.first()).toHaveValue('application/json');
  });

  test('Header 활성화/비활성화', async ({ page }) => {
    // Headers 탭 클릭
    await page.getByTestId('tab-headers').click();
    
    // 헤더 추가
    await page.getByTestId('add-header').click();
    
    // Checkbox 찾기
    const checkbox = page.getByTestId(/header-enabled-/).first();
    
    // 기본값은 활성화 상태
    await expect(checkbox).toBeChecked();
    
    // 비활성화
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    
    // 다시 활성화
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test('Body Type 변경 - JSON', async ({ page }) => {
    // Body 탭 클릭
    await page.getByTestId('tab-body').click();
    
    // Body Type을 JSON으로 변경
    await page.getByTestId('body-type-select').click();
    await page.getByRole('option', { name: 'JSON' }).click();
    
    // JSON 입력 필드가 나타나는지 확인
    const jsonInput = page.getByTestId('json-body-input');
    await expect(jsonInput).toBeVisible();
    
    // JSON 입력
    await jsonInput.fill('{"name": "John", "age": 30}');
    
    // 입력값 확인
    await expect(jsonInput).toHaveValue('{"name": "John", "age": 30}');
  });

  test('Body Type 변경 - Raw', async ({ page }) => {
    // Body 탭 클릭
    await page.getByTestId('tab-body').click();
    
    // Body Type을 Raw로 변경
    await page.getByTestId('body-type-select').click();
    await page.getByRole('option', { name: 'Raw' }).click();
    
    // Raw 입력 필드가 나타나는지 확인
    const rawInput = page.getByTestId('raw-body-input');
    await expect(rawInput).toBeVisible();
    
    // Raw 텍스트 입력
    await rawInput.fill('This is raw body content');
    
    // 입력값 확인
    await expect(rawInput).toHaveValue('This is raw body content');
  });

  test('Authentication - Bearer Token', async ({ page }) => {
    // Auth 탭 클릭
    await page.getByTestId('tab-auth').click();
    
    // Auth Type을 Bearer Token으로 변경
    await page.getByTestId('auth-type-select').click();
    await page.getByRole('option', { name: 'Bearer Token' }).click();
    
    // Token 입력 필드가 나타나는지 확인
    const tokenInput = page.getByTestId('bearer-token-input');
    await expect(tokenInput).toBeVisible();
    
    // Token 입력
    await tokenInput.fill('abc123xyz');
    
    // 입력값 확인
    await expect(tokenInput).toHaveValue('abc123xyz');
  });

  test('Authentication - Basic Auth', async ({ page }) => {
    // Auth 탭 클릭
    await page.getByTestId('tab-auth').click();
    
    // Auth Type을 Basic Auth로 변경
    await page.getByTestId('auth-type-select').click();
    await page.getByRole('option', { name: 'Basic Auth' }).click();
    
    // Username과 Password 입력 필드 확인
    const usernameInput = page.getByTestId('basic-username-input');
    const passwordInput = page.getByTestId('basic-password-input');
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // 입력
    await usernameInput.fill('admin');
    await passwordInput.fill('password123');
    
    // 입력값 확인
    await expect(usernameInput).toHaveValue('admin');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('노드 접기/펼치기', async ({ page }) => {
    // 펼치기 버튼 클릭
    const toggleButton = page.getByTestId('toggle-expand');
    await toggleButton.click();
    
    // 컨텐츠가 숨겨졌는지 확인
    await expect(page.getByTestId('request-tabs')).not.toBeVisible();
    
    // 다시 펼치기
    await toggleButton.click();
    
    // 컨텐츠가 보이는지 확인
    await expect(page.getByTestId('request-tabs')).toBeVisible();
  });

  test('Send 버튼 클릭 및 Response 확인', async ({ page }) => {
    // URL 입력
    await page.getByTestId('url-input').fill('https://api.example.com/test');
    
    // Send 버튼 클릭
    await page.getByTestId('send-button').click();
    
    // 로딩 상태 확인
    await expect(page.getByText('Sending')).toBeVisible();
    
    // Response 섹션이 나타날 때까지 대기
    await expect(page.getByTestId('response-section')).toBeVisible({ timeout: 5000 });
    
    // Response Status 확인
    const responseStatus = page.getByTestId('response-status');
    await expect(responseStatus).toBeVisible();
    await expect(responseStatus).toContainText('200');
    
    // Response Duration 확인
    const responseDuration = page.getByTestId('response-duration');
    await expect(responseDuration).toBeVisible();
    
    // Response Data 확인
    const responseData = page.getByTestId('response-data');
    await expect(responseData).toBeVisible();
  });

  test('URL 없이 Send 버튼 비활성화', async ({ page }) => {
    // URL이 비어있을 때
    await page.getByTestId('url-input').clear();
    
    // Send 버튼이 비활성화되었는지 확인
    const sendButton = page.getByTestId('send-button');
    await expect(sendButton).toBeDisabled();
  });

  test('완전한 API 요청 플로우', async ({ page }) => {
    // 1. Method 선택
    await page.getByTestId('method-select').click();
    await page.getByTestId('method-POST').click();
    
    // 2. URL 입력
    await page.getByTestId('url-input').fill('https://jsonplaceholder.typicode.com/posts');
    
    // 3. Headers 추가
    await page.getByTestId('tab-headers').click();
    await page.getByTestId('add-header').click();
    await page.getByTestId(/header-key-/).first().fill('Content-Type');
    await page.getByTestId(/header-value-/).first().fill('application/json');
    
    // 4. Query Params 추가
    await page.getByTestId('tab-params').click();
    await page.getByTestId('add-param').click();
    await page.getByTestId(/param-key-/).first().fill('userId');
    await page.getByTestId(/param-value-/).first().fill('1');
    
    // 5. Body 설정
    await page.getByTestId('tab-body').click();
    await page.getByTestId('body-type-select').click();
    await page.getByRole('option', { name: 'JSON' }).click();
    await page.getByTestId('json-body-input').fill('{"title": "Test Post", "body": "Test content"}');
    
    // 6. Auth 설정
    await page.getByTestId('tab-auth').click();
    await page.getByTestId('auth-type-select').click();
    await page.getByRole('option', { name: 'Bearer Token' }).click();
    await page.getByTestId('bearer-token-input').fill('test-token-123');
    
    // 7. Send 버튼 활성화 확인
    const sendButton = page.getByTestId('send-button');
    await expect(sendButton).toBeEnabled();
    
    // 8. 요청 전송
    await sendButton.click();
    
    // 9. Response 확인
    await expect(page.getByTestId('response-section')).toBeVisible({ timeout: 5000 });
  });
});
