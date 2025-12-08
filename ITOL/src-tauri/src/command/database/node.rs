use super::get_db_pool;
use sqlx::Row;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    pub fk_page_id: i32,
    pub data: String,
    pub node_type: String,
    pub position_x: i32,
    pub position_y: i32,
}

pub async fn get_nodes_by_page_id(page_id: i32) -> Result<Vec<Node>, sqlx::Error> {
    let pool = get_db_pool().await;

    let nodes = sqlx::query("SELECT id, fk_page_id, data, type, position_x, position_y FROM Node WHERE fk_page_id = ?")
        .bind(page_id)
        .map(|row: sqlx::sqlite::SqliteRow| {
            Node {
                id: row.get(0),
                fk_page_id: row.get(1),
                data: row.get(2),
                node_type: row.get(3),
                position_x: row.get(4),
                position_y: row.get(5),
            }
        })
        .fetch_all(&*pool)
        .await?;
    Ok(nodes)
}

pub async fn create_node(
    id: String,
    fk_page_id: i32,
    data: String,
    node_type: String,
    position_x: i32,
    position_y: i32,
) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    println!("[create_node] Creating node: id={}, fk_page_id={}, type={}", id, fk_page_id, node_type);

    sqlx::query("INSERT INTO Node (id, fk_page_id, data, type, position_x, position_y) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(&id)
        .bind(fk_page_id)
        .bind(&data)
        .bind(&node_type)
        .bind(position_x)
        .bind(position_y)
        .execute(&*pool)
        .await?;
    
    println!("[create_node] Successfully created node: {}", id);
    Ok(())
}

pub async fn update_node(
    id: String,
    fk_page_id: i32,
    data: String,
    node_type: String,
    position_x: i32,
    position_y: i32,
) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    sqlx::query("UPDATE Node SET data = ?, type = ?, position_x = ?, position_y = ? WHERE id = ? AND fk_page_id = ?")
        .bind(data)
        .bind(node_type)
        .bind(position_x)
        .bind(position_y)
        .bind(id)
        .bind(fk_page_id)
        .execute(&*pool)
        .await?;
    
    Ok(())
}

pub async fn delete_node(id: String, fk_page_id: i32) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    sqlx::query("DELETE FROM Node WHERE id = ? AND fk_page_id = ?")
        .bind(id)
        .bind(fk_page_id)
        .execute(&*pool)
        .await?;
    
    Ok(())
}

pub async fn delete_nodes_by_page_id(page_id: i32) -> Result<(), sqlx::Error> {
    let pool = get_db_pool().await;

    sqlx::query("DELETE FROM Node WHERE fk_page_id = ?")
        .bind(page_id)
        .execute(&*pool)
        .await?;
    
    Ok(())
}
