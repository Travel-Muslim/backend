const pool = require('../config/db');

const AdminModel = {
    getDashboardStats: () => {
        return pool.query(`
            SELECT 
                COUNT(DISTINCT b.id) as total_booking,
                COALESCE(SUM(b.total_price), 0) as total_profit,
                COUNT(DISTINCT b.user_id) as active_buyers
            FROM bookings b
            WHERE b.payment_status = 'paid'
        `).then(result => result.rows[0]);
    },

    getTopPackages: (limit) => {
        return pool.query(`
            SELECT 
                p.name as package_name,
                p.image as image_url,
                COUNT(b.id) as booking_count
            FROM packages p
            LEFT JOIN bookings b ON p.id = b.package_id
            WHERE b.payment_status = 'paid'
            GROUP BY p.id, p.name, p.image
            ORDER BY booking_count DESC
            LIMIT $1
        `, [limit]);
    },

    getBookingStatusByContinent: () => {
        return pool.query(`
            SELECT 
                p.benua as continent,
                COUNT(b.id) as booking_count
            FROM bookings b
            JOIN packages p ON b.package_id = p.id
            WHERE b.payment_status = 'paid'
            GROUP BY p.benua
        `);
    },

    getTopBuyers: (limit) => {
        return pool.query(`
            SELECT 
                u.full_name,
                u.avatar_url,
                COUNT(DISTINCT b.id) as total_bookings,
                COUNT(DISTINCT r.id) as total_reviews
            FROM users u
            LEFT JOIN bookings b ON u.id = b.user_id AND b.payment_status = 'paid'
            LEFT JOIN reviews r ON u.id = r.user_id
            GROUP BY u.id, u.full_name, u.avatar_url
            HAVING COUNT(DISTINCT b.id) > 0
            ORDER BY total_bookings DESC, total_reviews DESC
            LIMIT $1
        `, [limit]);
    },

    getRecentBookings: (limit) => {
        return pool.query(`
            SELECT 
                u.full_name as buyer_name,
                u.avatar_url,
                p.name as package_name,
                b.total_price
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN packages p ON b.package_id = p.id
            ORDER BY b.created_at DESC
            LIMIT $1
        `, [limit]);
    },

    getAllUsers: (limit, offset) => {
        return pool.query(`
            SELECT 
                id, full_name, email, phone_number, created_at
            FROM users
            WHERE role = 'user'
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
    },

    countAllUsers: () => {
        return pool.query(`SELECT COUNT(*) FROM users WHERE role = 'user'`);
    },

    searchUsers: (search, limit, offset) => {
        return pool.query(`
            SELECT 
                id, full_name, email, phone_number, created_at
            FROM users
            WHERE role = 'user' AND (
                full_name ILIKE $1 OR 
                email ILIKE $1 OR 
                phone_number ILIKE $1
            )
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [`%${search}%`, limit, offset]);
    },

    countSearchUsers: (search) => {
        return pool.query(`
            SELECT COUNT(*) FROM users 
            WHERE role = 'user' AND (
                full_name ILIKE $1 OR 
                email ILIKE $1 OR 
                phone_number ILIKE $1
            )
        `, [`%${search}%`]);
    },

    getUserById: (id) => {
        return pool.query(`
            SELECT id, full_name, email, phone_number, created_at
            FROM users
            WHERE id = $1
        `, [id]);
    },

    createUser: (userData) => {
        return pool.query(`
            INSERT INTO users (id, full_name, email, password, phone_number, role)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [userData.id, userData.full_name, userData.email, userData.password, userData.phone_number, userData.role]);
    },

    updateUser: (id, updateData) => {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(updateData[key]);
                paramIndex++;
            }
        });

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        return pool.query(query, values);
    },

    deleteUser: (id) => {
        return pool.query(`DELETE FROM users WHERE id = $1 RETURNING *`, [id]);
    },

    getAllPackages: (limit, offset) => {
        return pool.query(`
            SELECT id, name, location, periode, maskapai, harga, image, created_at
            FROM packages
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
    },

    countAllPackages: () => {
        return pool.query(`SELECT COUNT(*) FROM packages`);
    },

    searchPackages: (search, limit, offset) => {
        return pool.query(`
            SELECT id, name, location, periode, maskapai, harga, image, created_at
            FROM packages
            WHERE name ILIKE $1 OR location ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [`%${search}%`, limit, offset]);
    },

    countSearchPackages: (search) => {
        return pool.query(`
            SELECT COUNT(*) FROM packages 
            WHERE name ILIKE $1 OR location ILIKE $1
        `, [`%${search}%`]);
    },

    getPackageById: (id) => {
        return pool.query(`
            SELECT id, name, location, benua, maskapai, bandara, periode, harga, image, itinerary, duration, created_at, updated_at
            FROM packages
            WHERE id = $1
        `, [id]);
    },

    createPackage: (packageData) => {
        return pool.query(`
            INSERT INTO packages (id, name, location, benua, image, periode, harga, duration, itinerary, maskapai, bandara)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            packageData.id,
            packageData.name,
            packageData.location,
            packageData.benua,
            packageData.image,
            packageData.periode,
            packageData.harga,
            packageData.duration,
            packageData.itinerary,
            packageData.maskapai,
            packageData.bandara
        ]);
    },

    updatePackage: (id, updateData) => {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(updateData[key]);
                paramIndex++;
            }
        });

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE packages SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        return pool.query(query, values);
    },

    deletePackage: (id) => {
        return pool.query(`DELETE FROM packages WHERE id = $1 RETURNING *`, [id]);
    },

    getAllArticles: (limit, offset) => {
        return pool.query(`
            SELECT id, title, content, cover_image_url, is_published, published_at, created_at
            FROM articles
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
    },

    countAllArticles: () => {
        return pool.query(`SELECT COUNT(*) FROM articles`);
    },

    searchArticles: (search, limit, offset) => {
        return pool.query(`
            SELECT id, title, content, cover_image_url, is_published, published_at, created_at
            FROM articles
            WHERE title ILIKE $1 OR content ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [`%${search}%`, limit, offset]);
    },

    countSearchArticles: (search) => {
        return pool.query(`
            SELECT COUNT(*) FROM articles 
            WHERE title ILIKE $1 OR content ILIKE $1
        `, [`%${search}%`]);
    },

    getArticleById: (id) => {
        return pool.query(`
            SELECT id, title, content, cover_image_url, is_published, published_at, created_at
            FROM articles
            WHERE id = $1
        `, [id]);
    },

    createArticle: (articleData) => {
        return pool.query(`
            INSERT INTO articles (id, title, content, cover_image_url, published_at, is_published)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            articleData.id,
            articleData.title,
            articleData.content,
            articleData.cover_image_url,
            articleData.published_at,
            articleData.is_published
        ]);
    },

    updateArticle: (id, updateData) => {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(updateData[key]);
                paramIndex++;
            }
        });

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE articles SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        return pool.query(query, values);
    },

    deleteArticle: (id) => {
        return pool.query(`DELETE FROM articles WHERE id = $1 RETURNING *`, [id]);
    },

    toggleArticlePublish: (id) => {
        return pool.query(`
            UPDATE articles 
            SET is_published = NOT is_published,
                published_at = CASE 
                    WHEN NOT is_published THEN CURRENT_TIMESTAMP 
                    ELSE published_at 
                END
            WHERE id = $1
            RETURNING *
        `, [id]);
    },

    getAllOrders: (limit, offset) => {
        return pool.query(`
            SELECT 
                b.id,
                b.booking_code,
                b.booking_date,
                b.total_price,
                b.status,
                b.payment_status,
                u.full_name,
                p.name as package_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN packages p ON b.package_id = p.id
            ORDER BY b.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
    },

    countAllOrders: () => {
        return pool.query(`SELECT COUNT(*) FROM bookings`);
    },

    searchOrders: (search, limit, offset) => {
        return pool.query(`
            SELECT 
                b.id,
                b.booking_code,
                b.booking_date,
                b.total_price,
                b.status,
                b.payment_status,
                u.full_name,
                p.name as package_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN packages p ON b.package_id = p.id
            WHERE b.booking_code ILIKE $1 OR u.full_name ILIKE $1 OR p.name ILIKE $1
            ORDER BY b.created_at DESC
            LIMIT $2 OFFSET $3
        `, [`%${search}%`, limit, offset]);
    },

    countSearchOrders: (search) => {
        return pool.query(`
            SELECT COUNT(*) FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN packages p ON b.package_id = p.id
            WHERE b.booking_code ILIKE $1 OR u.full_name ILIKE $1 OR p.name ILIKE $1
        `, [`%${search}%`]);
    },

    getOrderByTourId: (tourId) => {
        return pool.query(`
            SELECT 
                b.*,
                u.full_name,
                u.email,
                u.phone_number,
                p.name as package_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN packages p ON b.package_id = p.id
            WHERE b.booking_code = $1
        `, [tourId]);
    },

    updateOrderStatus: (bookingId, status) => {
        return pool.query(`
            UPDATE bookings 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [status, bookingId]);
    },

    updatePaymentStatus: (bookingId, paymentStatus) => {
        return pool.query(`
            UPDATE bookings 
            SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [paymentStatus, bookingId]);
    },

    getAdminById: (id) => {
        return pool.query(`
            SELECT id, full_name, email, phone_number, avatar_url
            FROM users
            WHERE id = $1 AND role = 'admin'
        `, [id]);
    },

    updateAdmin: (id, updateData) => {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(updateData[key]);
                paramIndex++;
            }
        });

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        return pool.query(query, values);
    },

    getAllCommunityPosts: (limit, offset) => {
        return pool.query(`
            SELECT 
                cp.id,
                cp.title,
                cp.content,
                cp.created_at,
                u.full_name as author_name,
                COALESCE(AVG(r.rating), 0) as author_rating
            FROM community_posts cp
            JOIN users u ON cp.user_id = u.id
            LEFT JOIN reviews r ON u.id = r.user_id
            GROUP BY cp.id, cp.title, cp.content, cp.created_at, u.full_name
            ORDER BY cp.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
    },

    countAllCommunityPosts: () => {
        return pool.query(`SELECT COUNT(*) FROM community_posts`);
    },

    getCommunityPostsByMonth: (month, limit, offset) => {
        return pool.query(`
            SELECT 
                cp.id,
                cp.title,
                cp.content,
                cp.created_at,
                u.full_name as author_name,
                COALESCE(AVG(r.rating), 0) as author_rating
            FROM community_posts cp
            JOIN users u ON cp.user_id = u.id
            LEFT JOIN reviews r ON u.id = r.user_id
            WHERE EXTRACT(MONTH FROM cp.created_at) = $1
            GROUP BY cp.id, cp.title, cp.content, cp.created_at, u.full_name
            ORDER BY cp.created_at DESC
            LIMIT $2 OFFSET $3
        `, [month, limit, offset]);
    },

    countCommunityPostsByMonth: (month) => {
        return pool.query(`
            SELECT COUNT(*) FROM community_posts 
            WHERE EXTRACT(MONTH FROM created_at) = $1
        `, [month]);
    },

    getCommunityPostById: (id) => {
        return pool.query(`
            SELECT 
                cp.id,
                cp.title,
                cp.content,
                cp.created_at,
                u.full_name as author_name,
                COALESCE(AVG(r.rating), 0) as author_rating
            FROM community_posts cp
            JOIN users u ON cp.user_id = u.id
            LEFT JOIN reviews r ON u.id = r.user_id
            WHERE cp.id = $1
            GROUP BY cp.id, cp.title, cp.content, cp.created_at, u.full_name
        `, [id]);
    },

    deleteCommunityPost: (id) => {
        return pool.query(`DELETE FROM community_posts WHERE id = $1 RETURNING *`, [id]);
    }
};

module.exports = AdminModel;