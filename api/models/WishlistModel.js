const pool = require('../config/db');

const WishlistModel = {
    getByUserId: (userId) => {
        return pool.query(
            `SELECT 
                w.id,
                w.created_at,
                json_build_object(
                    'id', p.id,
                    'title', p.name,
                    'destination_country', p.location,
                    'price_per_pax', p.harga,
                    'thumbnail_url', p.image
                ) as tour_package
            FROM wishlists w
            JOIN packages p ON w.package_id = p.id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC`,
            [userId]
        );
    },

    checkExists: (userId, packageId) => {
        return pool.query(
            'SELECT id FROM wishlists WHERE user_id = $1 AND package_id = $2',
            [userId, packageId]
        );
    },

    add: (userId, packageId) => {
        return pool.query(
            `INSERT INTO wishlists (user_id, package_id) 
             VALUES ($1, $2) 
             RETURNING id, package_id, created_at`,
            [userId, packageId]
        );
    },

    remove: (id) => {
        return pool.query(
            'DELETE FROM wishlists WHERE id = $1 RETURNING id',
            [id]
        );
    }
};

module.exports = WishlistModel;