use serde::{Deserialize, Serialize};
use sqlx::{Column, Row};
use std::collections::HashMap;

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum DatabaseConnection {
    #[serde(rename = "sqlite")]
    Sqlite {
        #[serde(rename = "filePath")]
        file_path: Option<String>,
    },
    #[serde(rename = "postgresql")]
    PostgreSQL {
        host: Option<String>,
        port: Option<u16>,
        database: Option<String>,
        username: Option<String>,
        password: Option<String>,
        schema: Option<String>,
        #[serde(rename = "sslMode")]
        ssl_mode: Option<bool>,
    },
    #[serde(rename = "oracle")]
    Oracle {
        host: Option<String>,
        port: Option<u16>,
        #[serde(rename = "serviceName")]
        service_name: Option<String>,
        sid: Option<String>,
        username: Option<String>,
        password: Option<String>,
    },
}

#[derive(Debug, Deserialize)]
pub struct ExecuteDbParams {
    pub connection: DatabaseConnection,
    pub query: String,
    pub timeout: Option<u64>,
    pub max_rows: Option<i32>,
    pub project_id: Option<i32>,
    pub page_id: i32,
    pub run_id: String,
}

#[derive(Debug, Deserialize)]
pub struct TestConnectionParams {
    pub connection: DatabaseConnection,
}

/// SQLite 데이터베이스에 연결하고 쿼리 실행
pub async fn execute_sqlite_query(
    file_path: &str,
    query: &str,
    max_rows: Option<i32>,
) -> Result<String, String> {
    println!("Connecting to SQLite database: {}", file_path);

    // 연결 문자열 생성
    let connection_string = format!("sqlite:{}", file_path);
    
    // 데이터베이스 풀 생성
    let pool = sqlx::sqlite::SqlitePool::connect(&connection_string)
        .await
        .map_err(|e| format!("Failed to connect to SQLite: {}", e))?;

    println!("Connected to SQLite. Executing query: {}", query);

    // 쿼리 실행
    let rows = sqlx::query(query)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Query execution failed: {}", e))?;

    println!("Query executed successfully. Rows fetched: {}", rows.len());

    // 결과를 JSON으로 변환
    let mut results: Vec<HashMap<String, serde_json::Value>> = Vec::new();
    let max = max_rows.unwrap_or(1000) as usize;
    
    for (idx, row) in rows.iter().enumerate() {
        if idx >= max {
            break;
        }

        let mut row_map = HashMap::new();
        
        // SQLite Row에서 컬럼 추출
        for col_idx in 0..row.len() {
            let col = row.column(col_idx);
            let col_name = col.name();
            
            // 다양한 타입 처리
            let value: serde_json::Value = if let Ok(val) = row.try_get::<String, _>(col_idx) {
                serde_json::Value::String(val)
            } else if let Ok(val) = row.try_get::<i64, _>(col_idx) {
                serde_json::Value::Number(val.into())
            } else if let Ok(val) = row.try_get::<f64, _>(col_idx) {
                serde_json::json!(val)
            } else if let Ok(val) = row.try_get::<bool, _>(col_idx) {
                serde_json::Value::Bool(val)
            } else {
                serde_json::Value::Null
            };
            
            row_map.insert(col_name.to_string(), value);
        }
        
        results.push(row_map);
    }

    pool.close().await;

    // 결과를 JSON 문자열로 반환
    let response = serde_json::json!({
        "success": true,
        "rowCount": results.len(),
        "data": results,
        "truncated": rows.len() > max,
    });

    Ok(response.to_string())
}

/// PostgreSQL 데이터베이스에 연결하고 쿼리 실행
pub async fn execute_postgresql_query(
    host: &str,
    port: u16,
    database: &str,
    username: &str,
    password: &str,
    schema: Option<&str>,
    query: &str,
    max_rows: Option<i32>,
) -> Result<String, String> {
    println!("Connecting to PostgreSQL database: {}:{}/{}", host, port, database);

    // 연결 문자열 생성
    let connection_string = format!(
        "postgresql://{}:{}@{}:{}/{}",
        username, password, host, port, database
    );

    // 데이터베이스 풀 생성
    let pool = sqlx::postgres::PgPool::connect(&connection_string)
        .await
        .map_err(|e| format!("Failed to connect to PostgreSQL: {}", e))?;

    println!("Connected to PostgreSQL. Executing query: {}", query);

    // 스키마 설정 (옵션)
    if let Some(schema_name) = schema {
        let set_schema = format!("SET search_path TO {};", schema_name);
        sqlx::query(&set_schema)
            .execute(&pool)
            .await
            .map_err(|e| format!("Failed to set schema: {}", e))?;
    }

    // 쿼리 실행
    let rows = sqlx::query(query)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Query execution failed: {}", e))?;

    println!("Query executed successfully. Rows fetched: {}", rows.len());

    // 결과를 JSON으로 변환
    let mut results: Vec<HashMap<String, serde_json::Value>> = Vec::new();
    let max = max_rows.unwrap_or(1000) as usize;

    for (idx, row) in rows.iter().enumerate() {
        if idx >= max {
            break;
        }

        let mut row_map = HashMap::new();
        let columns = row.columns();

        for col in columns {
            let col_name = col.name();
            
            // PostgreSQL 타입 처리
            let value: serde_json::Value = if let Ok(val) = row.try_get::<String, _>(col_name) {
                serde_json::Value::String(val)
            } else if let Ok(val) = row.try_get::<i32, _>(col_name) {
                serde_json::Value::Number(val.into())
            } else if let Ok(val) = row.try_get::<i64, _>(col_name) {
                serde_json::Value::Number(val.into())
            } else if let Ok(val) = row.try_get::<f32, _>(col_name) {
                serde_json::json!(val)
            } else if let Ok(val) = row.try_get::<f64, _>(col_name) {
                serde_json::json!(val)
            } else if let Ok(val) = row.try_get::<bool, _>(col_name) {
                serde_json::Value::Bool(val)
            } else {
                serde_json::Value::Null
            };

            row_map.insert(col_name.to_string(), value);
        }

        results.push(row_map);
    }

    pool.close().await;

    // 결과를 JSON 문자열로 반환
    let response = serde_json::json!({
        "success": true,
        "rowCount": results.len(),
        "data": results,
        "truncated": rows.len() > max,
    });

    Ok(response.to_string())
}

/// 데이터베이스 연결 테스트
pub async fn test_connection(connection: DatabaseConnection) -> Result<String, String> {
    match connection {
        DatabaseConnection::Sqlite { file_path } => {
            let path = file_path.ok_or("SQLite file path is required")?;
            
            let connection_string = format!("sqlite:{}", path);
            let pool = sqlx::sqlite::SqlitePool::connect(&connection_string)
                .await
                .map_err(|e| format!("Connection failed: {}", e))?;
            
            // 간단한 쿼리로 연결 테스트
            sqlx::query("SELECT 1")
                .fetch_one(&pool)
                .await
                .map_err(|e| format!("Test query failed: {}", e))?;
            
            pool.close().await;
            Ok("SQLite connection successful".to_string())
        }
        DatabaseConnection::PostgreSQL { host, port, database, username, password, .. } => {
            let host = host.ok_or("PostgreSQL host is required")?;
            let port = port.unwrap_or(5432);
            let database = database.ok_or("Database name is required")?;
            let username = username.ok_or("Username is required")?;
            let password = password.ok_or("Password is required")?;

            let connection_string = format!(
                "postgresql://{}:{}@{}:{}/{}",
                username, password, host, port, database
            );

            let pool = sqlx::postgres::PgPool::connect(&connection_string)
                .await
                .map_err(|e| format!("Connection failed: {}", e))?;

            // 간단한 쿼리로 연결 테스트
            sqlx::query("SELECT 1")
                .fetch_one(&pool)
                .await
                .map_err(|e| format!("Test query failed: {}", e))?;

            pool.close().await;
            Ok("PostgreSQL connection successful".to_string())
        }
        DatabaseConnection::Oracle { .. } => {
            // Oracle은 별도의 크레이트가 필요하므로 현재는 미지원
            Err("Oracle database is not yet supported. Coming soon.".to_string())
        }
    }
}

/// 통합 DB 쿼리 실행 함수
pub async fn execute_db_query(params: ExecuteDbParams) -> Result<String, String> {
    println!("Executing database query...");
    println!("Query: {}", params.query);

    match params.connection {
        DatabaseConnection::Sqlite { file_path } => {
            let path = file_path.ok_or("SQLite file path is required")?;
            execute_sqlite_query(&path, &params.query, params.max_rows).await
        }
        DatabaseConnection::PostgreSQL { 
            host, port, database, username, password, schema, ..
        } => {
            let host = host.ok_or("PostgreSQL host is required")?;
            let port = port.unwrap_or(5432);
            let database = database.ok_or("Database name is required")?;
            let username = username.ok_or("Username is required")?;
            let password = password.ok_or("Password is required")?;

            execute_postgresql_query(
                &host,
                port,
                &database,
                &username,
                &password,
                schema.as_deref(),
                &params.query,
                params.max_rows,
            )
            .await
        }
        DatabaseConnection::Oracle { .. } => {
            Err("Oracle database is not yet supported. Coming soon.".to_string())
        }
    }
}
