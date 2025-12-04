import pool from '../config/db.js'

const getFeatured = (limit = 3) => {
    return pool.query(
        `SELECT 
            p.id, 
            p.name, 
            p.image_url, 
            p.start_date, 
            p.duration_days, 
            p.price,
            d.name as destination_name,
            d.location as destination_location
        FROM packages p
        JOIN destinations d ON p.destination_id = d.id
        WHERE p.is_featured = true AND p.is_active = true
        ORDER BY p.created_at DESC
        LIMIT $1`,
        [limit]
    )
}

export { getFeatured }