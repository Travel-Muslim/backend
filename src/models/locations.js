import pool from '../config/db.js'

const getAll = (isPopular) => {
    let query = `SELECT id, country as name, country, region FROM locations`
    
    if (isPopular === 'true') {
        query += ` WHERE country IN ('Indonesia', 'Korea Selatan', 'Jepang', 'Arab Saudi', 'Turki')`
    }
    
    query += ` ORDER BY country ASC`
    
    return pool.query(query)
}

export { getAll }