const pool = require('../config/db');

const findActiveByUser = async (userId, limit, offset) => {
  const query = `
    SELECT 
    b.id as booking_id, b.booking_code as booking_code, b.booking_date as booking_date, b.departure_date as booking_departure_date, b.return_date as booking_return_date, b.total_participants as booking_total_participants, b.total_price as booking_total_price, b.status as booking_status, b.payment_status as booking_payment_status, b.total_price as booking_total_price, b.payment_deadline as booking_payment_deadline, b.fullname as booking_fullname, b.phone_number as booking_phone_number, b.email as booking_email, b.passport_number as booking_passport_number, b.passport_expiry as booking_passport_expiry, b.nationality as booking_nationality, 
        p.id as package_id, p.name as package_name, p.image as package_image,
        p.location as package_location, p.benua as package_benua, p.periode_start as package_periode_start, p.periode_end as package_periode_end, p.maskapai as package_maskapai, p.bandara as package_bandara
    FROM bookings b
    JOIN packages p ON b.package_id = p.id
    WHERE b.user_id = $1 
    AND b.status IN ('pending', 'confirmed', 'paid')
    ORDER BY b.departure_date ASC
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) FROM bookings 
    WHERE user_id = $1 AND status IN ('pending', 'confirmed', 'paid')
  `;

  const dataResult = await pool.query(query, [userId, limit, offset]);
  const countResult = await pool.query(countQuery, [userId]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].count),
  };
};

const findHistoryByUser = async (userId, limit, offset, statusFilter) => {
  let query = `
    SELECT 
        b.id, b.booking_code, b.booking_date, b.departure_date,
        b.total_participants, b.total_price, b.status, b.payment_status,
        p.name as package_name, p.image as package_image, p.location as package_location,
        p.maskapai as package_maskapai, p.bandara as package_bandara,
        CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_review
    FROM bookings b
    JOIN packages p ON b.package_id = p.id
    LEFT JOIN reviews r ON r.booking_id = b.id
    WHERE b.user_id = $1
  `;

  const params = [userId, limit, offset];

  if (statusFilter) {
    query += ` AND b.status = $4`;
    params.push(statusFilter);
  } else {
    query += ` AND b.status IN ('completed', 'cancelled')`;
  }

  query += ` ORDER BY b.booking_date DESC LIMIT $2 OFFSET $3`;

  const countQuery = `SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND status IN ('completed', 'cancelled')`;

  const dataResult = await pool.query(query, params);
  const countResult = await pool.query(countQuery, [userId]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].count),
  };
};

const findById = async (bookingId) => {
  const query = `
    SELECT 
        b.*,
        u.full_name, u.email as user_email, u.phone_number,
        p.name as package_name, p.image as package_image,
        p.location as destination_name, p.benua as destination_location
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN packages p ON b.package_id = p.id
    WHERE b.id = $1
  `;
  const result = await pool.query(query, [bookingId]);
  return result.rows[0];
};

const create = async (data) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pkgQuery = `SELECT harga as price, quota, quota_filled FROM packages WHERE id = $1 AND is_active = true FOR UPDATE`;
    const pkgRes = await client.query(pkgQuery, [data.package_id]);

    if (pkgRes.rows.length === 0) throw new Error('PACKAGE_NOT_FOUND');
    const pkg = pkgRes.rows[0];

    if (pkg.quota - pkg.quota_filled < data.total_participants) {
      throw new Error('QUOTA_FULL');
    }

    const totalPrice = pkg.price * data.total_participants;
    const bookingCode = `BK-${new Date().getFullYear()}-${Math.floor(
      10000 + Math.random() * 90000
    )}`;
    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + 24);

    const passengerDetails =
      Array.isArray(data.booking_passengers) && data.booking_passengers.length > 0
        ? data.booking_passengers
        : Array.isArray(data.passenger_details) && data.passenger_details.length > 0
          ? data.passenger_details
          : [];

    const contactName = passengerDetails[0]?.fullname || data.fullname || 'Guest';
    const contactPhone = passengerDetails[0]?.phone_number || data.phone_number || '';
    const contactEmail = passengerDetails[0]?.email || data.email || '';

    const departureDate =
      data.departure_date ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const insertQuery = `
        INSERT INTO bookings (
            user_id, package_id, booking_code, booking_date, 
            departure_date, total_participants, total_price, status, 
            payment_status, fullname, phone_number, email, 
            booking_passengers, special_requests, payment_deadline
        ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, 'pending', 'unpaid', $7, $8, $9, $10, $11, $12)
        RETURNING *
    `;

    const values = [
      data.user_id,
      data.package_id,
      bookingCode,
      departureDate,
      data.total_participants,
      totalPrice,
      contactName,
      contactPhone,
      contactEmail,
      JSON.stringify(passengerDetails),
      data.special_requests || null,
      paymentDeadline,
    ];

    const bookingRes = await client.query(insertQuery, values);

    await client.query(
      `INSERT INTO payments (booking_id, amount, status) VALUES ($1, $2, 'unpaid')`,
      [bookingRes.rows[0].id, totalPrice]
    );

    await client.query(`UPDATE packages SET quota_filled = quota_filled + $1 WHERE id = $2`, [
      data.total_participants,
      data.package_id,
    ]);

    await client.query('COMMIT');
    return bookingRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const cancel = async (bookingId, reason) => {
  const query = `
    UPDATE bookings 
    SET status = 'cancelled', 
        cancel_reason = $1, 
        cancelled_at = CURRENT_TIMESTAMP 
    WHERE id = $2
    RETURNING id, booking_code, status, cancel_reason, cancelled_at, departure_date
  `;
  const result = await pool.query(query, [reason, bookingId]);
  return result.rows[0];
};

const findAll = async (filters, limit, offset) => {
  let query = `
    SELECT b.id, b.booking_code, b.departure_date, b.status, b.total_price, 
           p.name as package_name, p.location as destination_name
    FROM bookings b
    JOIN packages p ON b.package_id = p.id
    WHERE b.user_id = $1 
  `;

  const params = [filters.user_id];
  let paramIndex = 2;

  if (filters.status) {
    query += ` AND b.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }
  if (filters.date_from) {
    query += ` AND b.departure_date >= $${paramIndex}`;
    params.push(filters.date_from);
    paramIndex++;
  }
  if (filters.date_to) {
    query += ` AND b.departure_date <= $${paramIndex}`;
    params.push(filters.date_to);
    paramIndex++;
  }
  if (filters.search) {
    query += ` AND (p.location ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  query += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  return { data: result.rows, total: 100 };
};

module.exports = {
  findActiveByUser,
  findHistoryByUser,
  findById,
  create,
  cancel,
  findAll,
};
