const pool = require('../config/db');

const PackageModel = {
    getAll: (filters) => {
        let query = `
            SELECT 
                id,
                name,
                location,
                harga as price,
                duration,
                image,
                periode as departure_date
            FROM packages
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (filters.location) {
            query += ` AND location ILIKE $${paramCount}`;
            params.push(`%${filters.location}%`);
            paramCount++;
        }
        
        if (filters.search) {
            query += ` AND (name ILIKE $${paramCount} OR location ILIKE $${paramCount})`;
            params.push(`%${filters.search}%`);
            paramCount++;
        }
        
        if (filters.month) {
            const parts = filters.month.trim().split(' ');
            const monthName = parts[0];
            const year = parts[1];
            
            const monthMap = {
                'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4,
                'Mei': 5, 'Juni': 6, 'Juli': 7, 'Agustus': 8,
                'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
            };
            
            const monthNum = monthMap[monthName] || parseInt(monthName);
            
            if (year) {
                query += ` AND EXTRACT(MONTH FROM periode) = $${paramCount}`;
                params.push(monthNum);
                paramCount++;
                
                query += ` AND EXTRACT(YEAR FROM periode) = $${paramCount}`;
                params.push(parseInt(year));
                paramCount++;
            } else {
                query += ` AND EXTRACT(MONTH FROM periode) = $${paramCount}`;
                params.push(monthNum);
                paramCount++;
            }
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(filters.limit, filters.offset);
        
        return pool.query(query, params);
    },

    findById: (id) => {
        return pool.query(
            `SELECT 
                name,
                location,
                harga,
                duration,
                maskapai,
                bandara,
                periode,
                image,
                itinerary
            FROM packages
            WHERE id = $1`,
            [id]
        );
    },
};

module.exports = PackageModel;