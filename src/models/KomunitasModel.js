const pool = require('../config/db');

const KomunitasModel = {
    list: async (keyword, month, limit, offset) => {
        let query = `
            SELECT 
                k.*,
                COUNT(DISTINCT c.id) as total_comments
            FROM komunitas k
            LEFT JOIN komunitas_comments c ON k.id = c.komunitas_id
            WHERE 1=1
        `;
        
        let values = [];
        let index = 1;

        if (keyword) {
            const keywords = keyword.trim().split(/\s+/);
            
            if (keywords.length > 1) {
                const conditions = keywords.map(word => {
                    const idx = index;
                    index++;
                    values.push(word);
                    return `(k.judul ILIKE '%' || $${idx} || '%' OR k.deskripsi ILIKE '%' || $${idx} || '%')`;
                });
                query += ` AND (${conditions.join(' OR ')})`;
            } else {
                query += `
                    AND (k.judul ILIKE '%' || $${index} || '%' 
                    OR k.deskripsi ILIKE '%' || $${index} || '%')
                `;
                values.push(keyword);
                index++;
            }
        }

        if (month) {
            query += `
                AND TO_CHAR(k.created_at, 'YYYY-MM') = $${index}
            `;
            values.push(month);
            index++;
        }

        query += `
            GROUP BY k.id
            ORDER BY k.created_at DESC
            LIMIT $${index} OFFSET $${index + 1}
        `;
        
        values.push(parseInt(limit), parseInt(offset));

        return pool.query(query, values);
    },

    count: async (keyword, month) => {
        let query = `
            SELECT COUNT(DISTINCT k.id) as count
            FROM komunitas k
            WHERE 1=1
        `;

        let values = [];
        let index = 1;

        if (keyword) {
            const keywords = keyword.trim().split(/\s+/);
            
            if (keywords.length > 1) {
                const conditions = keywords.map(word => {
                    const idx = index;
                    index++;
                    values.push(word);
                    return `(k.judul ILIKE '%' || $${idx} || '%' OR k.deskripsi ILIKE '%' || $${idx} || '%')`;
                });
                query += ` AND (${conditions.join(' OR ')})`;
            } else {
                query += `
                    AND (k.judul ILIKE '%' || $${index} || '%'
                    OR k.deskripsi ILIKE '%' || $${index} || '%')
                `;
                values.push(keyword);
                index++;
            }
        }

        if (month) {
            query += `
                AND TO_CHAR(k.created_at, 'YYYY-MM') = $${index}
            `;
            values.push(month);
        }

        return pool.query(query, values);
    },

    findAllAdmin: ({ bulan, limit, offset }) => {
        let query = `
            SELECT DISTINCT k.id, k.judul, k.deskripsi, k.created_at,
                   COUNT(DISTINCT c.id) as total_comments,
                   (SELECT nama FROM komunitas_comments WHERE komunitas_id = k.id ORDER BY created_at DESC LIMIT 1) as last_commenter_nama,
                   (SELECT rating FROM komunitas_comments WHERE komunitas_id = k.id ORDER BY created_at DESC LIMIT 1) as last_commenter_rating,
                   (SELECT created_at FROM komunitas_comments WHERE komunitas_id = k.id ORDER BY created_at DESC LIMIT 1) as last_comment_date
            FROM komunitas k
            LEFT JOIN komunitas_comments c ON k.id = c.komunitas_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (bulan) {
            const tahun = new Date().getFullYear();
            const bulanNum = parseInt(bulan);
            const tanggalAwal = new Date(tahun, bulanNum - 1, 1);
            const tanggalAkhir = new Date(tahun, bulanNum, 0, 23, 59, 59);

            query += ` AND c.created_at >= $${paramIndex} AND c.created_at <= $${paramIndex + 1}`;
            params.push(tanggalAwal, tanggalAkhir);
            paramIndex += 2;
        }

        query += ` GROUP BY k.id ORDER BY k.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        return pool.query(query, params);
    },

    countAllAdmin: ({ bulan }) => {
        let query = `
            SELECT COUNT(DISTINCT k.id) as count
            FROM komunitas k
            LEFT JOIN komunitas_comments c ON k.id = c.komunitas_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (bulan) {
            const tahun = new Date().getFullYear();
            const bulanNum = parseInt(bulan);
            const tanggalAwal = new Date(tahun, bulanNum - 1, 1);
            const tanggalAkhir = new Date(tahun, bulanNum, 0, 23, 59, 59);

            query += ` AND c.created_at >= $${paramIndex} AND c.created_at <= $${paramIndex + 1}`;
            params.push(tanggalAwal, tanggalAkhir);
        }

        return pool.query(query, params);
    },

    findAllUser: ({ judul, bulan, limit, offset }) => {
        let query = `
            SELECT DISTINCT k.id, k.judul, k.deskripsi, k.created_at,
                   COUNT(DISTINCT c.id) as total_comments
            FROM komunitas k
            LEFT JOIN komunitas_comments c ON k.id = c.komunitas_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (judul) {
            query += ` AND k.judul ILIKE $${paramIndex}`;
            params.push(`%${judul}%`);
            paramIndex++;
        }

        if (bulan) {
            const tahun = new Date().getFullYear();
            const bulanNum = parseInt(bulan);
            const tanggalAwal = new Date(tahun, bulanNum - 1, 1);
            const tanggalAkhir = new Date(tahun, bulanNum, 0, 23, 59, 59);

            query += ` AND c.created_at >= $${paramIndex} AND c.created_at <= $${paramIndex + 1}`;
            params.push(tanggalAwal, tanggalAkhir);
            paramIndex += 2;
        }

        query += ` GROUP BY k.id ORDER BY k.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset)); 

        return pool.query(query, params);
    },

    countAllUser: ({ judul, bulan }) => {
        let query = `
            SELECT COUNT(DISTINCT k.id) as count
            FROM komunitas k
            LEFT JOIN komunitas_comments c ON k.id = c.komunitas_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (judul) {
            query += ` AND k.judul ILIKE $${paramIndex}`;
            params.push(`%${judul}%`);
            paramIndex++;
        }

        if (bulan) {
            const tahun = new Date().getFullYear();
            const bulanNum = parseInt(bulan);
            const tanggalAwal = new Date(tahun, bulanNum - 1, 1);
            const tanggalAkhir = new Date(tahun, bulanNum, 0, 23, 59, 59);

            query += ` AND c.created_at >= $${paramIndex} AND c.created_at <= $${paramIndex + 1}`;
            params.push(tanggalAwal, tanggalAkhir);
        }

        return pool.query(query, params);
    },

    findById: (id) => {
        return pool.query(
            `SELECT k.*, COUNT(c.id) as total_comments 
             FROM komunitas k 
             LEFT JOIN komunitas_comments c ON k.id = c.komunitas_id 
             WHERE k.id = $1 
             GROUP BY k.id`,
            [id]
        );
    },

    getCommentsByKomunitas: (komunitasId) => {
        return pool.query(
            `SELECT * FROM komunitas_comments 
             WHERE komunitas_id = $1 
             ORDER BY created_at DESC`,
            [komunitasId]
        );
    },

    create: ({ id, judul, komentar, rating, user_id, tanggal }) => {
        return pool.query(
            `INSERT INTO komunitas (id, judul, deskripsi, rating, user_id, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [id, judul, komentar, rating, user_id, tanggal || new Date()]
        );
    }
};

module.exports = KomunitasModel;