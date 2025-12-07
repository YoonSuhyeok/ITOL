use serde::Deserialize;
use reqwest::{self, header::{HeaderName, HeaderValue, ACCEPT, CONTENT_TYPE}, Method};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct ExecuteApiParams {
    pub method: String,
    pub base_url: String,
    pub query: Option<String>,
    pub headers: Option<String>,
    pub body: Option<String>,
    pub auth: Option<String>,
    pub timeout: Option<u64>,
    pub project_id: Option<i32>,
    pub page_id: i32,
    pub run_id: String
}

/// 모든 HTTP 메서드를 지원하는 통합 API 실행 함수
pub async fn execute_api_request(params: ExecuteApiParams) -> Result<String, String> {
    println!("Starting API call to URL: {}", params.base_url);
    println!("Method: {}", params.method);
    println!("Query params: {:?}", params.query);
    println!("Headers: {:?}", params.headers);
    println!("Body: {:?}", params.body);
    println!("Auth: {:?}", params.auth);
    
    // HTTP 메서드 파싱
    let method = match params.method.to_uppercase().as_str() {
        "GET" => Method::GET,
        "POST" => Method::POST,
        "PUT" => Method::PUT,
        "PATCH" => Method::PATCH,
        "DELETE" => Method::DELETE,
        "HEAD" => Method::HEAD,
        "OPTIONS" => Method::OPTIONS,
        _ => {
            let error_msg = format!("Unsupported HTTP method: {}", params.method);
            println!("{}", error_msg);
            return Err(error_msg);
        }
    };
    
    // 클라이언트 생성
    println!("Creating HTTP client...");
    let timeout_secs = params.timeout.unwrap_or(30);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(timeout_secs))
        .build()
        .map_err(|e| e.to_string())?;
    
    println!("Client created successfully with timeout: {}s", timeout_secs);
    
    // 요청 빌더 생성
    println!("Creating request builder for URL: {}", params.base_url);
    let mut request_builder = client.request(method, &params.base_url);
    println!("Request builder created");
    
    // 쿼리 파라미터 처리
    if let Some(query_str) = params.query.as_ref() {
        println!("Processing query params: {}", query_str);
        if !query_str.is_empty() {
            match serde_json::from_str::<HashMap<String, String>>(query_str) {
                Ok(query_params) => {
                    println!("Query params parsed successfully: {:?}", query_params);
                    request_builder = request_builder.query(&query_params);
                },
                Err(e) => {
                    println!("Error parsing query parameters: {}", e);
                }
            }
        }
    }
    
    // 인증 처리
    if let Some(auth_str) = params.auth.as_ref() {
        println!("Processing authentication: {}", auth_str);
        if !auth_str.is_empty() {
            match serde_json::from_str::<HashMap<String, String>>(auth_str) {
                Ok(auth_map) => {
                    if let Some(auth_type) = auth_map.get("type") {
                        match auth_type.as_str() {
                            "bearer" => {
                                if let Some(token) = auth_map.get("token") {
                                    println!("Adding Bearer token authentication");
                                    request_builder = request_builder.header(
                                        "Authorization",
                                        format!("Bearer {}", token)
                                    );
                                }
                            },
                            "basic" => {
                                if let (Some(username), Some(password)) = 
                                    (auth_map.get("username"), auth_map.get("password")) {
                                    println!("Adding Basic authentication");
                                    request_builder = request_builder.basic_auth(username, Some(password));
                                }
                            },
                            _ => println!("Unknown auth type: {}", auth_type)
                        }
                    }
                },
                Err(e) => {
                    println!("Error parsing auth: {}", e);
                }
            }
        }
    }
    
    // 헤더 처리
    if let Some(header_str) = params.headers.as_ref() {
        println!("Processing headers: {}", header_str);
        if !header_str.is_empty() {
            match serde_json::from_str::<HashMap<String, String>>(header_str) {
                Ok(header_map) => {
                    println!("Headers parsed successfully: {:?}", header_map);
                    for (key, value) in header_map {
                        println!("Adding header: {} = {}", key, value);
                        match (HeaderName::from_bytes(key.as_bytes()), HeaderValue::from_str(&value)) {
                            (Ok(name), Ok(val)) => {
                                request_builder = request_builder.header(name, val);
                                println!("Header added: {} = {}", key, value);
                            },
                            _ => {
                                println!("Invalid header: {} = {}", key, value);
                            }
                        }
                    }
                },
                Err(e) => {
                    println!("Error parsing headers: {}", e);
                }
            }
        }
    }
    
    // 바디 처리 (GET, HEAD, OPTIONS는 바디 없음)
    if !matches!(params.method.to_uppercase().as_str(), "GET" | "HEAD" | "OPTIONS") {
        if let Some(body_str) = params.body.as_ref() {
            if !body_str.is_empty() {
                println!("Adding request body, length: {}", body_str.len());
                request_builder = request_builder.body(body_str.clone());
            }
        }
    }
    
    // 기본 헤더 추가 (사용자 헤더가 없는 경우에만)
    println!("Adding default Accept header");
    request_builder = request_builder.header(ACCEPT, "application/json");
    
    // 요청 실행 및 응답 처리
    println!("Sending request...");
    let response = request_builder.send().await.map_err(|e| e.to_string())?;
    
    let status = response.status();
    let headers = response.headers().clone();
    
    println!("Response received with status: {}", status);
    println!("Response headers: {:?}", headers);
    
    println!("Reading response body...");
    let text = response.text().await.map_err(|e| e.to_string())?;
    println!("Response body received, length: {}", text.len());
    
    // 응답을 JSON 형태로 포맷
    let response_json = serde_json::json!({
        "status": status.as_u16(),
        "statusText": status.canonical_reason().unwrap_or("Unknown"),
        "headers": headers.iter()
            .map(|(k, v)| (k.as_str().to_string(), v.to_str().unwrap_or("").to_string()))
            .collect::<HashMap<String, String>>(),
        "data": serde_json::from_str::<serde_json::Value>(&text).unwrap_or(serde_json::json!(text))
    });
    
    println!("API call completed successfully");
    Ok(response_json.to_string())
}
pub async fn get_api_call(
    base_url: &str,
    query: Option<&str>,
    headers: Option<&str>,
    body: Option<&str>  // GET 요청에서는 이 매개변수를 무시합니다
) -> Result<String, reqwest::Error> {
    println!("Starting API call to URL: {}", base_url);
    println!("Query params: {:?}", query);
    println!("Headers: {:?}", headers);
    println!("Body: {:?}", body);
    
    // 클라이언트 생성
    println!("Creating HTTP client...");
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))  // 30초 타임아웃 설정
        .build() {
            Ok(c) => {
                println!("Client created successfully");
                c
            },
            Err(e) => {
                println!("Error creating client: {}", e);
                return Err(e);
            }
        };
    
    // 요청 빌더 생성
    println!("Creating request builder for URL: {}", base_url);
    let mut request_builder = client.get(base_url);
    println!("Request builder created");
    
    // 쿼리 파라미터 처리
    if let Some(query_str) = query {
        println!("Processing query params: {}", query_str);
        if !query_str.is_empty() {
            match serde_json::from_str::<HashMap<String, String>>(query_str) {
                Ok(query_params) => {
                    println!("Query params parsed successfully: {:?}", query_params);
                    request_builder = request_builder.query(&query_params);
                },
                Err(e) => {
                    println!("Error parsing query parameters: {}", e);
                    // 오류가 있어도 계속 진행
                }
            }
        }
    }
    
    // 헤더 처리
    if let Some(header_str) = headers {
        println!("Processing headers: {}", header_str);
        if !header_str.is_empty() {
            match serde_json::from_str::<HashMap<String, String>>(header_str) {
                Ok(header_map) => {
                    println!("Headers parsed successfully: {:?}", header_map);
                    for (key, value) in header_map {
                        println!("Adding header: {} = {}", key, value);
                        match (HeaderName::from_bytes(key.as_bytes()), HeaderValue::from_str(&value)) {
                            (Ok(name), Ok(val)) => {
                                request_builder = request_builder.header(name, val);
                                println!("Header added: {} = {}", key, value);
                            },
                            _ => {
                                println!("Invalid header: {} = {}", key, value);
                                // 헤더 하나가 잘못되어도 계속 진행
                            }
                        }
                    }
                },
                Err(e) => {
                    println!("Error parsing headers: {}", e);
                    // 오류가 있어도 계속 진행
                }
            }
        }
    }
    
    // 기본 헤더 추가
    println!("Adding default Accept header");
    request_builder = request_builder.header(ACCEPT, "application/json");
    
    // 요청 실행 및 응답 처리
    println!("Sending request...");
    let response = match request_builder.send().await {
        Ok(r) => {
            println!("Response received with status: {}", r.status());
            r
        },
        Err(e) => {
            println!("Error sending request: {}", e);
            return Err(e);
        }
    };
    
    println!("Reading response body...");
    let text = match response.text().await {
        Ok(t) => {
            println!("Response body received, length: {}", t.len());
            t
        },
        Err(e) => {
            println!("Error reading response body: {}", e);
            return Err(e);
        }
    };
    
    println!("API call completed successfully");
    Ok(text)
}

pub async fn post_api_call(
    base_url: &str,
    query: Option<&str>,
    headers: Option<&str>,
    body: Option<&str>
) -> Result<String, reqwest::Error> {
    let client = reqwest::Client::new();
    let mut request = client.post(base_url);
    
    // 쿼리 파라미터 처리
    if let Some(query_str) = query {
        if !query_str.is_empty() {
            // 쿼리 문자열을 파싱하여 적용
            let query_params: HashMap<String, String> = 
                serde_json::from_str(query_str).unwrap_or_default();
            request = request.query(&query_params);
        }
    }
    
    // 헤더 처리
    if let Some(header_str) = headers {
        if !header_str.is_empty() {
            let header_map: HashMap<String, String> = 
                serde_json::from_str(header_str).unwrap_or_default();
            
            for (key, value) in header_map {
                request = request.header(
                    HeaderName::from_bytes(key.as_bytes()).unwrap_or(CONTENT_TYPE),
                    HeaderValue::from_str(&value).unwrap_or(HeaderValue::from_static("application/json"))
                );
            }
        }
    }
    
    // 기본 헤더 추가
    request = request
        .header(CONTENT_TYPE, "application/json")
        .header(ACCEPT, "application/json");
    
    // 바디 처리
    if let Some(body_str) = body {
        if !body_str.is_empty() {
            request = request.body(body_str.to_string());
        }
    }
    
    // 요청 실행
    let response = request.send().await?;
    let text = response.text().await?;
    Ok(text)
}