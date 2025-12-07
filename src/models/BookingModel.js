const pool = require("../config/db");

const findActiveByUser = async (userId, limit, offset) => {
  const query = `
    SELECT 
        b.id, b.booking_code, b.departure_date, b.return_date,
        b.total_participants, b.total_price, b.status, b.payment_status, b.facilities,
        p.id as package_id, p.name as package_name, p.image_url as package_image,
        d.name as destination_name
    FROM bookings b
    JOIN packages p ON b.package_id = p.id
    JOIN destinations d ON p.destination_id = d.id
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
        p.name as package_name, p.image_url as package_image
    FROM bookings b
    JOIN packages p ON b.package_id = p.id
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
        p.name as package_name, p.image_url as package_image,
        d.name as destination_name, d.location as destination_location
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN packages p ON b.package_id = p.id
    JOIN destinations d ON p.destination_id = d.id
    WHERE b.id = $1
  `;
  const result = await pool.query(query, [bookingId]);
  return result.rows[0];
};

const create = async (data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pkgQuery = `SELECT price, quota, quota_filled, destination_id FROM packages WHERE id = $1 FOR UPDATE`;
    const pkgRes = await client.query(pkgQuery, [data.package_id]);

    if (pkgRes.rows.length === 0) throw new Error("PACKAGE_NOT_FOUND");
    const pkg = pkgRes.rows[0];

    if (pkg.quota - pkg.quota_filled < data.total_participants) {
      throw new Error("QUOTA_FULL");
    }

    const totalPrice = pkg.price * data.total_participants;
    const bookingCode = `BK-${new Date().getFullYear()}-${Math.floor(
      10000 + Math.random() * 90000
    )}`;
    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + 24);

    const contactName = data.passenger_details[0]?.fullname || data.fullname;
    const contactPhone =
      data.passenger_details[0]?.phone_number || data.phone_number;
    const contactEmail = data.passenger_details[0]?.email || data.email;

    const insertQuery = `
        INSERT INTO bookings (
            user_id, package_id, destination_id, booking_code, booking_date, 
            departure_date, total_participants, total_price, status, 
            payment_status, fullname, phone_number, email, 
            booking_passengers, special_requests, payment_deadline
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, 'pending', 'unpaid', $8, $9, $10, $11, $12, $13)
        RETURNING *
    `;

    const values = [
      data.user_id,
      data.package_id,
      pkg.destination_id,
      bookingCode,
      data.departure_date,
      data.total_participants,
      totalPrice,
      contactName,
      contactPhone,
      contactEmail,
      JSON.stringify(data.passenger_details),
      data.special_requests,
      paymentDeadline,
    ];

    const bookingRes = await client.query(insertQuery, values);

    await client.query(
      `UPDATE packages SET quota_filled = quota_filled + $1 WHERE id = $2`,
      [data.total_participants, data.package_id]
    );

    await client.query("COMMIT");
    return bookingRes.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
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
           p.name as package_name
    FROM bookings b
    JOIN packages p ON b.package_id = p.id
    JOIN destinations d ON p.destination_id = d.id
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
    query += ` AND (d.name ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  query += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${
    paramIndex + 1
  }`;
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