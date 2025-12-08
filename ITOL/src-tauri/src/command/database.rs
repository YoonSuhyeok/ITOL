use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::sync::Arc;
use tokio::sync::OnceCell;

pub mod book;
pub mod page;
pub mod node;
pub mod edge;

pub fn get_sqlite_path() -> String {
    // 앱 데이터 디렉터리 가져오기 (Windows에서는 %APPDATA%, Linux에서는 ~/.config, macOS에서는 ~/Library/Application Support)
    let app_data_dir = dirs::data_local_dir()
        .expect("Failed to find local data directory");
    
    // 앱 이름을 사용하여 서브디렉터리 생성
    let app_name = "TTOL";
    let db_dir = app_data_dir.join(app_name).join("database");
    
    // 디렉터리가 없으면 생성
    if !db_dir.exists() {
        std::fs::create_dir_all(&db_dir)
            .expect("Failed to create database directory");
    }
    
    let sqlite_path = db_dir.join("ttol.db").to_str()
        .expect("Failed to convert path to string")
        .to_string();
    
    sqlite_path
}

pub static DB_POOL: OnceCell<Arc<Pool<Sqlite>>> = OnceCell::const_new();

/// DB_POOL을 초기화하거나 이미 초기화된 풀을 반환
pub async fn get_db_pool() -> Arc<Pool<Sqlite>> {
    DB_POOL
        .get_or_init(|| async {
            let sqlite_path = get_sqlite_path();
            println!("SQLite Path: {}", sqlite_path);
            
            // Ensure the database file exists
            if !std::path::Path::new(&sqlite_path).exists() {
                std::fs::File::create(&sqlite_path)
                    .expect("Failed to create SQLite database file");
            }
            
            let pool = SqlitePoolOptions::new()
                .max_connections(5)
                .connect(&format!("sqlite:///{}", sqlite_path))
                .await
                .expect("Failed to create SQLite pool");
            Arc::new(pool)
        })
        .await
        .clone()
}

pub async fn create_sqlite() {
    let pool = get_db_pool().await;
    println!("SQLite Table Book created");
    create_table_book(&*pool).await.unwrap();
    println!("SQLite Table Page created");
    create_table_page(&*pool).await.unwrap();
    println!("SQLite Table Node created");
    create_table_node(&*pool).await.unwrap();
    println!("SQLite Table Edge created");
    create_table_edge(&*pool).await.unwrap();
}

async fn create_table_book(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // 테이블 생성 쿼리 실행
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS Book (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            parent_id INTEGER,
            FOREIGN KEY (parent_id) REFERENCES Book(id) ON DELETE CASCADE
        )"
    )
    .execute(pool)
    .await?;
    
    Ok(())
}

async fn create_table_page(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // 테이블 생성 쿼리 실행
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS Page (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fk_book_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            flow_data TEXT,
            display_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (fk_book_id) REFERENCES Book(id) ON DELETE CASCADE
        )"
    )
    .execute(pool)
    .await?;
    
    // Add display_order column if it doesn't exist (for existing databases)
    let _ = sqlx::query("ALTER TABLE Page ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0")
        .execute(pool)
        .await;
    
    Ok(())
}

async fn create_table_node(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // 테이블 생성 쿼리 실행
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS Node (
            id STRING,
            fk_page_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            type STRING NOT NULL,
            position_x INTEGER NOT NULL,
            position_y INTEGER NOT NULL,
            FOREIGN KEY (fk_page_id) REFERENCES Page(id) ON DELETE CASCADE
            UNIQUE (id, fk_page_id)
        )"
    )
    .execute(pool)
    .await?;
    Ok(())
}

async fn create_table_edge(pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
    // 테이블 생성 쿼리 실행
    sqlx::query("CREATE TABLE IF NOT EXISTS Edge (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fk_page_id INTEGER NOT NULL,
            source TEXT NOT NULL,
            target TEXT NOT NULL,
            sourceHandle TEXT,
            targetHandle TEXT,
            FOREIGN KEY (fk_page_id) REFERENCES Page(id) ON DELETE CASCADE
        )")
    .execute(pool) // removed the extra '&' here
    .await?;
    
    Ok(())
}
