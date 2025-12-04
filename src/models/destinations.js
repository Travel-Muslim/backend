import pool from '../config/db.js'

const search = (filters) => {
    const { from, to, date, keyword } = filters
    let query = `
        SELECT 
            id, 
            name, 
            location, 
            image_url, 
            rating, 
            is_halal_friendly
        FROM destinations
        WHERE 1=1
    `
    const params = []
    let paramCount = 1

    if (keyword) {
        query += ` AND (name ILIKE $${paramCount} OR location ILIKE $${paramCount})`
        params.push(`%${keyword}%`)
        paramCount++
    }

    if (to) {
        query += ` AND (name ILIKE $${paramCount} OR location ILIKE $${paramCount})`
        params.push(`%${to}%`)
        paramCount++
    }

    query += ` ORDER BY rating DESC`

    return pool.query(query, params)
}

export { search }