use super::get_db_pool;
use sqlx::Row;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Page {
    pub id: i32,
    pub fk_book_id: i32,
    pub title: String,
    pub flow_data: Option<String>,
    pub display_order: i32,
}

pub async fn get_page_by_id(id: i32) -> Result<Page, sqlx::Error> {
    let pool = get_db_pool().await;

    let page = sqlx::query("SELECT id, fk_book_id, title, flow_data, display_order FROM Page WHERE id = ?")
        .bind(id)
        .map(|row: sqlx::sqlite::SqliteRow| {
            Page {
                id: row.get(0),
                fk_book_id: row.get(1),
                title: row.get(2),
                flow_data: row.get(3),
                display_order: row.get(4),
            }
        })
        .fetch_one(&*pool)
        .await?;
    Ok(page)
}

pub async fn get_pages_by_book_id(book_id: i32) -> Result<Vec<Page>, sqlx::Error> {
    let pool = get_db_pool().await;

    let pages = sqlx::query("SELECT id, fk_book_id, title, flow_data, display_order FROM Page WHERE fk_book_id = ? ORDER BY display_order, id")
        .bind(book_id)
        .map(|row: sqlx::sqlite::SqliteRow| {
            Page {
                id: row.get(0),
                fk_book_id: row.get(1),
                title: row.get(2),
                flow_data: row.get(3),
                display_order: row.get(4),
            }
        })
        .fetch_all(&*pool)
        .await?;
    Ok(pages)
}

pub async fn create_page(fk_book_id: i32, title: String, flow_data: Option<String>) -> Result<i32, sqlx::Error> {
    let pool = get_db_pool().await;

    // Get max display_order for this book
    let max_order: Option<i32> = sqlx::query_scalar("SELECT MAX(display_order) FROM Page WHERE fk_book_id = ?")
        .bind(fk_book_id)
        .fetch_one(&*pool)
        .await?;
    
    let next_order = max_order.unwrap_or(-1) + 1;

    let result = sqlx::query("INSERT INTO Page (fk_book_id, title, flow_data, display_order) VALUES (?, ?, ?, ?)")
        .bind(fk_book_id)
        .bind(title)
        .bind(flow_data)
        .bind(next_order)
        .execute(&*pool)
        .await?;
    
    Ok(result.last_insert_rowid() as i32)
}

pub async fn update_page(id: i32, fk_book_id: i32, title: String, flow_data: Option<String>) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    sqlx::query("UPDATE Page SET fk_book_id = ?, title = ?, flow_data = ? WHERE id = ?")
        .bind(fk_book_id)
        .bind(title)
        .bind(flow_data)
        .bind(id)
        .execute(&*pool)
        .await?;
    
    Ok(())
}

pub async fn update_page_order(id: i32, new_order: i32) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    sqlx::query("UPDATE Page SET display_order = ? WHERE id = ?")
        .bind(new_order)
        .bind(id)
        .execute(&*pool)
        .await?;
    
    Ok(())
}

pub async fn reorder_pages(book_id: i32, page_ids_in_order: Vec<i32>) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;
    
    for (index, page_id) in page_ids_in_order.iter().enumerate() {
        sqlx::query("UPDATE Page SET display_order = ? WHERE id = ? AND fk_book_id = ?")
            .bind(index as i32)
            .bind(page_id)
            .bind(book_id)
            .execute(&*pool)
            .await?;
    }
    
    Ok(())
}

pub async fn delete_page(id: i32) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    sqlx::query("DELETE FROM Page WHERE id = ?")
        .bind(id)
        .execute(&*pool)
        .await?;
    
    Ok(())
}