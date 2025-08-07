use serde::{Deserialize, Serialize};
use reqwest::{self, header::{HeaderMap, HeaderName, HeaderValue, ACCEPT, CONTENT_TYPE}};
use std::collections::HashMap;
use serde_json::Value;

#[derive(Debug, Deserialize)]
pub struct ExecuteApiParams {
    pub method: String,
    pub base_url: String,
    pub query: Option<String>,
    pub headers: Option<String>,
    pub body: Option<String>,
    pub project_id: Option<i32>,
    pub page_id: i32,
    pub run_id: String
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