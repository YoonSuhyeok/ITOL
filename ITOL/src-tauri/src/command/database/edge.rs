use super::get_db_pool;
use sqlx::Row;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Edge {
    pub id: i32,
    pub fk_page_id: i32,
    pub source: String,
    pub target: String,
    pub source_handle: Option<String>,
    pub target_handle: Option<String>,
}

pub async fn get_edges_by_page_id(page_id: i32) -> Result<Vec<Edge>, sqlx::Error> {
    let pool = get_db_pool().await;

    let edges = sqlx::query("SELECT id, fk_page_id, source, target, sourceHandle, targetHandle FROM Edge WHERE fk_page_id = ?")
        .bind(page_id)
        .map(|row: sqlx::sqlite::SqliteRow| {
            Edge {
                id: row.get(0),
                fk_page_id: row.get(1),
                source: row.get(2),
                target: row.get(3),
                source_handle: row.get(4),
                target_handle: row.get(5),
            }
        })
        .fetch_all(&*pool)
        .await?;
    Ok(edges)
}

pub async fn create_edge(
    fk_page_id: i32,
    source: String,
    target: String,
    source_handle: Option<String>,
    target_handle: Option<String>,
) -> Result<i32, sqlx::Error> {
    let pool = get_db_pool().await;

    let result = sqlx::query("INSERT INTO Edge (fk_page_id, source, target, sourceHandle, targetHandle) VALUES (?, ?, ?, ?, ?)")
        .bind(fk_page_id)
        .bind(source)
        .bind(target)
        .bind(source_handle)
        .bind(target_handle)
        .execute(&*pool)
        .await?;
    
    Ok(result.last_insert_rowid() as i32)
}

pub async fn update_edge(
    id: i32,
    fk_page_id: i32,
    source: String,
    target: String,
    source_handle: Option<String>,
    target_handle: Option<String>,
) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    sqlx::query("UPDATE Edge SET source = ?, target = ?, sourceHandle = ?, targetHandle = ? WHERE id = ? AND fk_page_id = ?")
        .bind(source)
        .bind(target)
        .bind(source_handle)
        .bind(target_handle)
        .bind(id)
        .bind(fk_page_id)
        .execute(&*pool)
        .await?;
    
    Ok(())
}

pub async fn delete_edge(id: i32, fk_page_id: i32) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    sqlx::query("DELETE FROM Edge WHERE id = ? AND fk_page_id = ?")
        .bind(id)
        .bind(fk_page_id)
        .execute(&*pool)
        .await?;
    
    Ok(())
}

pub async fn delete_edges_by_page_id(page_id: i32) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    sqlx::query("DELETE FROM Edge WHERE fk_page_id = ?")
        .bind(page_id)
        .execute(&*pool)
        .await?;
    
    Ok(())
}
