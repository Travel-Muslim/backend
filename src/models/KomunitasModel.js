const pool = require('../config/db');

const KomunitasModel = {
  findAllAdmin: ({ bulan, limit, offset }) => {
    let query = `
      SELECT DISTINCT k.id, k.judul, k.deskripsi, k.rating, k.author_id, k.created_at,
             COUNT(DISTINCT c.id) as total_comments,
             (SELECT nama FROM comments WHERE komunitas_id = k.id ORDER BY created_at DESC LIMIT 1) as last_commenter_nama,
             (SELECT rating FROM comments WHERE komunitas_id = k.id ORDER BY created_at DESC LIMIT 1) as last_commenter_rating,
             (SELECT created_at FROM comments WHERE komunitas_id = k.id ORDER BY created_at DESC LIMIT 1) as last_comment_date
      FROM komunitas k
      LEFT JOIN comments c ON k.id = c.komunitas_id
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
      LEFT JOIN comments c ON k.id = c.komunitas_id
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
      SELECT DISTINCT k.id, k.judul, k.deskripsi, k.rating, k.created_at,
             COUNT(DISTINCT c.id) as total_comments
      FROM komunitas k
      LEFT JOIN comments c ON k.id = c.komunitas_id
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
    params.push(limit, offset);

    return pool.query(query, params);
  },

  countAllUser: ({ judul, bulan }) => {
    let query = `
      SELECT COUNT(DISTINCT k.id) as count
      FROM komunitas k
      LEFT JOIN comments c ON k.id = c.komunitas_id
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
      `SELECT k.*, u.nama as author_name, COUNT(c.id) as total_comments 
       FROM komunitas k 
       LEFT JOIN users u ON k.author_id = u.id 
       LEFT JOIN comments c ON k.id = c.komunitas_id 
       WHERE k.id = $1 
       GROUP BY k.id, u.nama`,
      [id]
    );
  },

  getCommentsByKomunitas: (komunitasId) => {
    return pool.query(
      `SELECT c.*, u.nama as author_name 
       FROM comments c 
       LEFT JOIN users u ON c.author_id = u.id 
       WHERE c.komunitas_id = $1 
       ORDER BY c.created_at DESC`,
      [komunitasId]
    );
  },

  getCommentById: (id) => {
    return pool.query(
      `SELECT c.*, u.nama as author_name 
       FROM comments c 
       LEFT JOIN users u ON c.author_id = u.id 
       WHERE c.id = $1`,
      [id]
    );
  },

  createComment: ({ komunitas_id, author_id, nama, judul, komentar, rating }) => {
    return pool.query(
      `INSERT INTO comments (komunitas_id, author_id, nama, judul, komentar, rating, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING *`,
      [komunitas_id, author_id, nama, judul, komentar, rating]
    );
  },


};

module.exports = KomunitasModel;