use super::get_db_pool;
use sqlx::Row;

pub struct Book {
    pub id: i32,
    pub title: String,
    pub parent_id: Option<i32>,
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
            }
        })
        .fetch_one(&*pool)
        .await?;
    Ok(book)
}