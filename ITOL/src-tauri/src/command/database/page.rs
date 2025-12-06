use super::get_db_pool;
use sqlx::Row;

pub struct Page {
    pub id: i32,
    pub fk_book_id: i32,
    pub title: String,
}

pub async fn get_page_by_id(id: i32) -> Result<Page, sqlx::Error> {
    let pool = get_db_pool().await;

    let page = sqlx::query("SELECT * FROM Page WHERE id = ?")
        .bind(id)
        .map(|row: sqlx::sqlite::SqliteRow| {
            Page {
                id: row.get(0),
                fk_book_id: row.get(1),
                title: row.get(2),
            }
        })
        .fetch_one(&*pool)
        .await?;
    Ok(page)
}