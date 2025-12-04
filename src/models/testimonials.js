import pool from '../config/db.js'

const getFeatured = (limit = 3) => {
    return pool.query(
        `SELECT 
            id, 
            name as user_name, 
            avatar_url as photo_url, 
            testimonial_text as message,
            'Indonesia' as user_location
        FROM testimonials
        WHERE is_featured = true
        ORDER BY created_at DESC
        LIMIT $1`,
        [limit]
    )
}

export { getFeatured }