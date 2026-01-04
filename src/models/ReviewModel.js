const pool = require('../config/db');

const ReviewModel = {
  findAll: (userId, limit, offset) => {
    return pool.query(
      `SELECT 
                r.id, r.rating, r.comment, r.is_published, r.created_at,
                json_build_object(
                    'id', p.id,
                    'name', p.name
                ) as tour_package,
                (SELECT json_agg(json_build_object('media_url', media_url, 'media_type', media_type))
                 FROM review_media WHERE review_id = r.id) as media
            FROM reviews r
            JOIN packages p ON r.tour_package_id = p.id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
  },

  findById: (id) => {
    return pool.query(`SELECT * FROM reviews WHERE id = $1`, [id]);
  },

  checkBookingReview: (bookingId) => {
    return pool.query('SELECT id FROM reviews WHERE booking_id = $1', [bookingId]);
  },

  create: (data) => {
    const { userId, bookingId, packageId, rating, comment, images } = data;
    console.log('ReviewModel.create called with:', {
      userId,
      bookingId,
      packageId,
      rating,
      commentLength: comment?.length,
      imagesCount: images?.length || 0,
    });
    
    // Convert images array to JSON
    const imagesJson = images && images.length > 0 ? JSON.stringify(images) : null;
    
    return pool.query(
      `INSERT INTO reviews (user_id, booking_id, package_id, rating, review_text, images)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, rating, review_text, images, created_at`,
      [userId, bookingId, packageId, rating, comment, imagesJson]
    );
  },

  update: (id, data) => {
    const { rating, comment } = data;
    let query = 'UPDATE reviews SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    let paramIndex = 1;

    if (rating) {
      query += `, rating = $${paramIndex}`;
      params.push(rating);
      paramIndex++;
    }

    if (comment) {
      query += `, comment = $${paramIndex}`;
      params.push(comment);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    return pool.query(query, params);
  },

  remove: (id) => {
    return pool.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [id]);
  },
};

module.exports = ReviewModel;
