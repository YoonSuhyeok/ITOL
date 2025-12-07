use super::get_db_pool;
use sqlx::Row;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub id: i32,
    pub title: String,
    pub parent_id: Option<i32>,
    pub flow_data: Option<String>,
}

pub async fn get_book_by_id(id: i32) -> Result<Book, sqlx::Error> {
    // 두 번 역참조하여 내부의 Pool<Sqlite>에 대한 참조를 얻음
    let pool = get_db_pool().await;

    let book = sqlx::query("SELECT * FROM Book WHERE id = ?")
        .bind(id)
        .map(|row: sqlx::sqlite::SqliteRow| {
            Book {
                id: row.get(0),
                title: row.get(1),
                parent_id: row.get(2),
                flow_data: row.get(3),
            }
        })
        .fetch_one(&*pool)
        .await?;
    Ok(book)
}

pub async fn get_all_books() -> Result<Vec<Book>, sqlx::Error> {
    let pool = get_db_pool().await;

    let books = sqlx::query("SELECT * FROM Book ORDER BY parent_id, id")
        .map(|row: sqlx::sqlite::SqliteRow| {
            Book {
                id: row.get(0),
                title: row.get(1),
                parent_id: row.get(2),
                flow_data: row.get(3),
            }
        })
        .fetch_all(&*pool)
        .await?;
    Ok(books)
}

pub async fn create_book(title: String, parent_id: Option<i32>, flow_data: Option<String>) -> Result<i32, sqlx::Error> {
    let pool = get_db_pool().await;

    let result = sqlx::query("INSERT INTO Book (title, parent_id, flow_data) VALUES (?, ?, ?)")
        .bind(title)
        .bind(parent_id)
        .bind(flow_data)
        .execute(&*pool)
        .await?;
    
    Ok(result.last_insert_rowid() as i32)
}

pub async fn update_book(id: i32, title: String, parent_id: Option<i32>, flow_data: Option<String>) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    sqlx::query("UPDATE Book SET title = ?, parent_id = ?, flow_data = ? WHERE id = ?")
        .bind(title)
        .bind(parent_id)
        .bind(flow_data)
        .bind(id)
        .execute(&*pool)
        .await?;
    
    Ok(())
}

pub async fn delete_book(id: i32) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    sqlx::query("DELETE FROM Book WHERE id = ?")
        .bind(id)
        .execute(&*pool)
        .await?;
    
    Ok(())
}