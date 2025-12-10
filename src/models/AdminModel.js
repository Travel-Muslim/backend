const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const AdminModel = {
    getDashboardStats: () => {
        return pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM bookings) as total_booking,
                (SELECT SUM(total_price) FROM bookings WHERE payment_status = 'paid') as total_profit,
                (SELECT COUNT(DISTINCT user_id) FROM bookings) as pembeli_aktif
        `);
    },

    getTopPackages: (limit = 3) => {
        return pool.query(
            `SELECT 
                p.id,
                p.name,
                p.image_url,
                COUNT(DISTINCT b.id) as booking_count,
                ROUND(
                    (COUNT(DISTINCT b.id)::numeric / NULLIF((SELECT COUNT(*) FROM bookings), 0)) * 100, 
                    2
                ) as percentage
            FROM packages p
            LEFT JOIN bookings b ON p.id = b.package_id
            GROUP BY p.id, p.name, p.image_url
            ORDER BY booking_count DESC
            LIMIT $1`,
            [limit]
        );
    },

    getTopBuyers: (limit = 6) => {
        return pool.query(`
            SELECT 
                u.id,
                u.full_name as name,
                u.avatar_url,
                COUNT(DISTINCT b.id) as total_booking,
                COUNT(DISTINCT r.id) as total_ulasan
            FROM users u
            INNER JOIN bookings b ON u.id = b.user_id AND b.status != 'cancelled'
            LEFT JOIN reviews r ON u.id = r.user_id
            WHERE u.role = 'user'
            GROUP BY u.id, u.full_name, u.avatar_url
            ORDER BY total_booking DESC, total_ulasan DESC
            LIMIT $1
        `, [limit]);
    },


    getBookingStatus: () => {
        return pool.query(`
            WITH regional_bookings AS (
                SELECT 
                    CASE 
                        WHEN d.category = 'Asia' OR d.location ILIKE '%Asia%' OR d.location ILIKE '%Korea%' OR d.location ILIKE '%Japan%' OR d.location ILIKE '%Jepang%' THEN 'Paket Halal Tour Asia'
                        WHEN d.category = 'Eropa' OR d.location ILIKE '%Eropa%' OR d.location ILIKE '%Europe%' THEN 'Paket Halal Tour Eropa'
                        WHEN d.category = 'Australia' OR d.location ILIKE '%Australia%' THEN 'Paket Halal Tour Australia'
                        WHEN d.category = 'Afrika' OR d.location ILIKE '%Afrika%' OR d.location ILIKE '%Africa%' THEN 'Paket Halal Tour Afrika'
                        ELSE 'Paket Halal Tour Lainnya'
                    END as region,
                    COUNT(*) as count
                FROM bookings b
                JOIN packages p ON b.package_id = p.id
                JOIN destinations d ON p.destination_id = d.id
                GROUP BY region
            )
            SELECT 
                (SELECT SUM(count) FROM regional_bookings) as total,
                json_agg(
                    json_build_object(
                        'region', region,
                        'count', count,
                        'color', CASE 
                            WHEN region = 'Paket Halal Tour Asia' THEN '#00BCD4'
                            WHEN region = 'Paket Halal Tour Eropa' THEN '#FFA726'
                            WHEN region = 'Paket Halal Tour Australia' THEN '#5C6BC0'
                            WHEN region = 'Paket Halal Tour Afrika' THEN '#66BB6A'
                            ELSE '#9E9E9E'
                        END
                    ) ORDER BY count DESC
                ) as breakdown
            FROM regional_bookings
        `);
    },

    getRecentBookings: (limit = 3) => {
        return pool.query(`
            SELECT 
                b.id,
                b.booking_code as tour_id,
                u.full_name as pembeli,
                u.avatar_url,
                p.name as paket_tour,
                b.total_price as harga,
                b.created_at
            FROM bookings b
            INNER JOIN users u ON b.user_id = u.id
            INNER JOIN packages p ON b.package_id = p.id
            WHERE b.status != 'cancelled'
            ORDER BY b.created_at DESC
            LIMIT $1
        `, [limit]);
    },

    getAllUsers: (limit, offset) => {
        return pool.query(
            `SELECT 
                ROW_NUMBER() OVER (ORDER BY created_at ASC) as display_id,
                id, 
                full_name, 
                email, 
                phone_number, 
                password,
                role, 
                created_at 
             FROM users 
             WHERE role = 'user'
             ORDER BY created_at DESC 
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
    },

    countAllUsers: () => {
        return pool.query('SELECT COUNT(*) FROM users WHERE role = \'user\'');
    },

    searchUsers: (query) => {
        return pool.query(
            `SELECT 
                ROW_NUMBER() OVER (ORDER BY created_at DESC) as display_id,
                id, 
                full_name, 
                email, 
                phone_number, 
                created_at 
            FROM users 
            WHERE role = 'user' 
            AND (
                full_name ILIKE $1   
                OR email ILIKE $1
            )
            ORDER BY created_at DESC`,
            [`%${query}%`]  
        );
    },

    getUserById: (id) => {
        return pool.query(
            'SELECT id, full_name, email, phone_number, role, created_at FROM users WHERE id = $1',
            [id]
        );
    },

    createUser: (userData) => {
        const { id, fullname, email, phone_number, password, role } = userData;
        return pool.query(
            `INSERT INTO users (id, full_name, email, phone_number, password, role) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, full_name, email, phone_number, role, created_at`,
            [id, fullname, email, phone_number, password, role || 'user']
        );
    },

    updateUser: (id, userData) => {
        const { fullname, email, phone_number, password } = userData;
        
        let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        let paramIndex = 1;

        if (fullname) {
            query += `, full_name = $${paramIndex}`;
            params.push(fullname);
            paramIndex++;
        }

        if (email) {
            query += `, email = $${paramIndex}`;
            params.push(email);
            paramIndex++;
        }

        if (phone_number) {
            query += `, phone_number = $${paramIndex}`;
            params.push(phone_number);
            paramIndex++;
        }

        if (password) {
            query += `, password = $${paramIndex}`;
            params.push(password);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING id, full_name, email, phone_number, role`;
        params.push(id);

        return pool.query(query, params);
    },

    deleteUser: (id) => {
        return pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );
    },

    getAllPackages: (limit, offset) => {
        return pool.query(
            `SELECT 
                id,
                name,
                location,
                periode,
                maskapai,
                harga,
                image,
                created_at
            FROM packages
            ORDER BY created_at DESC 
            LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
    },

    countAllPackages: () => {
        return pool.query('SELECT COUNT(*) FROM packages');
    },

    searchPackages: (query, limit, offset) => {
        return pool.query(
            `SELECT 
                id,
                name,
                location,
                periode,
                maskapai,
                harga,
                image,
                created_at
            FROM packages
            WHERE name ILIKE $1 OR location ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3`,
            [`%${query}%`, limit, offset]
        );
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

    countSearchPackages: (query) => {
        return pool.query(
            'SELECT COUNT(*) FROM packages WHERE name ILIKE $1 OR location ILIKE $1',
            [`%${query}%`]
        );
    },

    getPackageById: (id) => {
        return pool.query(
            `SELECT 
                id,
                name,
                location,
                duration,
                periode,
                maskapai,
                bandara,
                harga,
                image,
                itinerary,
                created_at,
                updated_at
            FROM packages
            WHERE id = $1`,
            [id]
        );
    },

    deletePackage: (id) => {
        return pool.query('DELETE FROM packages WHERE id = $1', [id]);
    },

    getAllArticles: (limit, offset) => {
        return pool.query(
            `SELECT 
                ROW_NUMBER() OVER (ORDER BY created_at ASC) as display_id,
                id,
                title,
                created_at,
                CASE 
                    WHEN is_published = true THEN 'Selesai'
                    ELSE 'Draft'
                END as status
             FROM articles 
             ORDER BY created_at DESC 
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
    },

    countAllArticles: () => {
        return pool.query('SELECT COUNT(*) FROM articles');
    },

    searchArticles: (query) => {
        return pool.query(
            `SELECT 
                ROW_NUMBER() OVER (ORDER BY created_at ASC) as display_id,
                id,
                title,
                created_at,
                CASE 
                    WHEN is_published = true THEN 'Selesai'
                    ELSE 'Draft'
                END as status
             FROM articles 
             WHERE title ILIKE $1
             ORDER BY created_at DESC`,
            [`%${query}%`]
        );
    },

    getArticleById: (id) => {
        return pool.query(
            'SELECT * FROM articles WHERE id = $1',
            [id]
        );
    },

    createArticle: (articleData) => {
        return pool.query(
            `INSERT INTO articles (id, author_id, title, slug, published_at, content, is_published) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [
                articleData.id,
                articleData.author_id,
                articleData.title,
                articleData.slug,
                articleData.published_at,
                articleData.content,
                articleData.is_published
            ]
        );
    },

    updateArticle: (id, articleData) => {
        const { title, slug, category, cover_image_url, content, excerpt, tags, is_published } = articleData;
        return pool.query(
            `UPDATE articles 
             SET title = $1, slug = $2, category = $3, cover_image_url = $4, content = $5, 
                 excerpt = $6, tags = $7, is_published = $8, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $9 
             RETURNING *`,
            [title, slug, category, cover_image_url, content, excerpt, tags, is_published, id]
        );
    },

    deleteArticle: (id) => {
        return pool.query(
            'DELETE FROM articles WHERE id = $1 RETURNING id',
            [id]
        );
    },

    togglePublishArticle: (id) => {
        return pool.query(
            `UPDATE articles 
             SET is_published = NOT is_published, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 
             RETURNING *`,
            [id]
        );
    },

    getAllOrders: ({ status, search, limit, offset }) => {
        let query = `
            SELECT 
                b.booking_code as tour_id,
                u.full_name as nama_lengkap,
                p.name as nama_paket,
                b.created_at as tanggal,
                CASE 
                    WHEN b.payment_status = 'paid' THEN 'Selesai'
                    WHEN b.status = 'pending' THEN 'Pending'
                    WHEN b.status = 'cancelled' THEN 'Cancelled'
                    ELSE 'Pending'
                END as status,
                b.total_price as pembayaran
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN packages p ON b.package_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            if (status.toLowerCase() === 'selesai') {
                query += ` AND b.payment_status = 'paid'`;
            } else if (status.toLowerCase() === 'pending') {
                query += ` AND b.status = 'pending'`;
            } else if (status.toLowerCase() === 'cancelled') {
                query += ` AND b.status = 'cancelled'`;
            }
        }

        if (search) {
            query += ` AND (u.full_name ILIKE $${paramIndex} OR b.booking_code ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        return pool.query(query, params);
    },

    countAllOrders: ({ status, search }) => {
        let query = `
            SELECT COUNT(*) 
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN packages p ON b.package_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            if (status.toLowerCase() === 'selesai') {
                query += ` AND b.payment_status = 'paid'`;
            } else if (status.toLowerCase() === 'pending') {
                query += ` AND b.status = 'pending'`;
            } else if (status.toLowerCase() === 'cancelled') {
                query += ` AND b.status = 'cancelled'`;
            }
        }

        if (search) {
            query += ` AND (u.full_name ILIKE $${paramIndex} OR b.booking_code ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        return pool.query(query, params);
    },

    getOrderByTourId: (tourId) => {
        return pool.query(
            `SELECT 
                b.booking_code as tour_id,
                u.full_name as nama_lengkap,
                u.email,
                u.phone_number,
                p.name as nama_paket,
                b.created_at as tanggal,
                b.departure_date,
                b.total_participants,
                CASE 
                    WHEN b.payment_status = 'paid' THEN 'Selesai'
                    WHEN b.status = 'pending' THEN 'Pending'
                    WHEN b.status = 'cancelled' THEN 'Cancelled'
                    ELSE 'Pending'
                END as status,
                b.payment_status,
                b.total_price as pembayaran
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN packages p ON b.package_id = p.id
             WHERE b.booking_code = $1`,
            [tourId]
        );
    },

    updateOrderStatus: (bookingId, status) => {
        return pool.query(
            `UPDATE bookings 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [status, bookingId]
        );
    },

    updatePaymentStatus: (bookingId, paymentStatus) => {
        return pool.query(
            `UPDATE bookings 
             SET payment_status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [paymentStatus, bookingId]
        );
    },

    getAdminProfile: (adminId) => {
        return pool.query(
            `SELECT id, full_name as nama, email, phone_number as no_telepon, avatar_url, role 
             FROM users 
             WHERE id = $1 AND role = 'admin'`,
            [adminId]
        );
    },

    updateAdminProfile: (adminId, profileData) => {
        const { nama, email, noTelepon, password } = profileData;
        
        let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        let paramIndex = 1;

        if (nama) {
            query += `, full_name = $${paramIndex}`;
            params.push(nama);
            paramIndex++;
        }

        if (email) {
            query += `, email = $${paramIndex}`;
            params.push(email);
            paramIndex++;
        }

        if (noTelepon) {
            query += `, phone_number = $${paramIndex}`;
            params.push(noTelepon);
            paramIndex++;
        }

        if (password) {
            query += `, password = $${paramIndex}`;
            params.push(password);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} AND role = 'admin' RETURNING id, full_name as nama, email, phone_number as no_telepon`;
        params.push(adminId);

        return pool.query(query, params);
    },

    updateAdminAvatar: (adminId, avatarUrl) => {
        return pool.query(
            `UPDATE users 
             SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND role = 'admin'
             RETURNING id, avatar_url`,
            [avatarUrl, adminId]
        );
    },

    deleteAdminAvatar: (adminId) => {
        return pool.query(
            `UPDATE users 
             SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND role = 'admin'
             RETURNING id, avatar_url`,
            [adminId]
        );
    },

    getSalesPerformance: () => {
        return pool.query(`
            SELECT 
                TO_CHAR(created_at, 'Month') as month,
                COUNT(*) as total_bookings,
                SUM(total_price) as total_revenue
            FROM bookings
            WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)
            GROUP BY TO_CHAR(created_at, 'Month'), EXTRACT(MONTH FROM created_at)
            ORDER BY EXTRACT(MONTH FROM created_at)
        `);
    },

    getAgentPerformance: () => {
        return pool.query(`
            SELECT 
                u.id,
                u.full_name,
                COUNT(b.id) as total_bookings,
                SUM(b.total_price) as total_profit
            FROM users u
            LEFT JOIN bookings b ON u.id = b.user_id
            WHERE u.role = 'user'
            GROUP BY u.id, u.full_name
            ORDER BY total_profit DESC
            LIMIT 5
        `);
    },

    getUpcomingTrips: () => {
        return pool.query(`
            SELECT 
                b.id,
                b.departure_date,
                u.full_name as customer,
                p.name as package,
                b.status
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN packages p ON b.package_id = p.id
            WHERE b.departure_date > CURRENT_DATE
            ORDER BY b.departure_date ASC
            LIMIT 5
        `);
    },

    getOrderStats: () => {
        return pool.query(`
            SELECT 
                COUNT(*) as total_booking,
                COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
            FROM bookings
        `);
    },

    getAllCommunityPosts: ({ month, limit, offset }) => {
        let query = 'SELECT * FROM community_posts WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (month) {
            query += ` AND TO_CHAR(created_at, 'Month') ILIKE $${paramIndex}`;
            params.push(`%${month}%`);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        return pool.query(query, params);
    },

    getCommunityPostById: (id) => {
        return pool.query(
            'SELECT * FROM community_posts WHERE id = $1',
            [id]
        );
    },

    deleteCommunityPost: (id) => {
        return pool.query(
            'DELETE FROM community_posts WHERE id = $1 RETURNING id',
            [id]
        );
    },

    countAllCommunityPosts: (month) => {
        let query = 'SELECT COUNT(*) FROM community_posts WHERE 1=1';
        const params = [];

        if (month) {
            query += ` AND TO_CHAR(created_at, 'Month') ILIKE $1`;
            params.push(`%${month}%`);
        }

        return pool.query(query, params);
    },

    moderateCommunityPost: (id, status) => {
        return pool.query(
            `UPDATE community_posts 
            SET status = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING *`,
            [status, id]
        );
    }
};

module.exports = AdminModel;