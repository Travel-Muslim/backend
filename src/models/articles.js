import pool from '../config/db.js'

const getLatest = (limit = 2) => {
    return pool.query(
        `SELECT 
            id, 
            title, 
            category, 
            cover_image_url, 
            excerpt, 
            created_at
        FROM articles
        WHERE is_published = true
        ORDER BY created_at DESC
        LIMIT $1`,
        [limit]
    )
}

export { getLatest }