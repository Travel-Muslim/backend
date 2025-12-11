const KomunitasModel = require('../models/KomunitasModel');
const commonHelper = require('../helpers/common');

const KomunitasController = {
  getAllAdmin: async (req, res, next) => {
    try {
      const { bulan, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { rows } = await KomunitasModel.findAllAdmin({
        bulan,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const { rows: [{ count }] } = await KomunitasModel.countAllAdmin({ bulan });

      const komunitas = rows.map(k => ({
        id: k.id,
        judul: k.judul,
        deskripsi: k.deskripsi,
        rating: k.rating,
        total_comments: parseInt(k.total_comments),
        last_commenter_nama: k.last_commenter_nama,
        last_commenter_rating: k.last_commenter_rating,
        last_comment_date: k.last_comment_date,
        created_at: k.created_at
      }));

      commonHelper.paginated(res, komunitas, {
        page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: parseInt(count),
        per_page: parseInt(limit)
      }, 'Get komunitas successful');

    } catch (error) {
      console.log(error);
      commonHelper.error(res, 'Server error', 500);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const { judul, bulan, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { rows } = await KomunitasModel.findAllUser({
        judul,
        bulan,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const { rows: [{ count }] } = await KomunitasModel.countAllUser({ judul, bulan });

      const komunitas = rows.map(k => ({
        id: k.id,
        judul: k.judul,
        deskripsi: k.deskripsi,
        rating: k.rating,
        total_comments: parseInt(k.total_comments),
        created_at: k.created_at
      }));

      commonHelper.paginated(res, komunitas, {
        page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: parseInt(count),
        per_page: parseInt(limit)
      }, 'Get komunitas successful');

    } catch (error) {
      console.log(error);
      commonHelper.error(res, 'Server error', 500);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { rows } = await KomunitasModel.findById(id);

      if (rows.length === 0) {
        return commonHelper.notFound(res, 'Komunitas not found');
      }

      const komunitas = rows[0];

      const { rows: comments } = await KomunitasModel.getCommentsByKomunitas(id);

      const responseData = {
        id: komunitas.id,
        judul: komunitas.judul,
        deskripsi: komunitas.deskripsi,
        rating: komunitas.rating,
        author_name: komunitas.author_name,
        total_comments: parseInt(komunitas.total_comments),
        comments: comments.map(c => ({
          id: c.id,
          nama: c.nama,
          judul: c.judul,
          komentar: c.komentar,
          rating: c.rating,
          author_name: c.author_name,
          created_at: c.created_at
        })),
        created_at: komunitas.created_at
      };

      commonHelper.success(res, responseData, 'Get komunitas successful');

    } catch (error) {
      console.log(error);
      commonHelper.error(res, 'Server error', 500);
    }
  },

  getComments: async (req, res, next) => {
    try {
      const { komunitas_id } = req.params;

      const { rows: komunitas } = await KomunitasModel.findById(komunitas_id);
      if (komunitas.length === 0) {
        return commonHelper.notFound(res, 'Komunitas not found');
      }

      const { rows } = await KomunitasModel.getCommentsByKomunitas(komunitas_id);

      const comments = rows.map(c => ({
        id: c.id,
        nama: c.nama,
        judul: c.judul,
        komentar: c.komentar,
        rating: c.rating,
        author_name: c.author_name,
        created_at: c.created_at
      }));

      commonHelper.success(res, comments, 'Get comments successful');

    } catch (error) {
      console.log(error);
      commonHelper.error(res, 'Server error', 500);
    }
  },

  addComment: async (req, res, next) => {
    try {
      const { komunitas_id } = req.params;
      const { nama, judul, komentar, rating } = req.body;
      const author_id = req.user.id;

      if (!nama || !judul || !komentar || !rating) {
        return commonHelper.badRequest(res, 'All fields (nama, judul, komentar, rating) are required');
      }

      if (rating < 1 || rating > 5) {
        return commonHelper.badRequest(res, 'Rating must be between 1 and 5');
      }

      
      const { rows: komunitas } = await KomunitasModel.findById(komunitas_id);
      if (komunitas.length === 0) {
        return commonHelper.notFound(res, 'Komunitas not found');
      }

      const { rows } = await KomunitasModel.createComment({
        komunitas_id,
        author_id,
        nama,
        judul,
        komentar,
        rating
      });

      commonHelper.success(res, rows[0], 'Comment created successfully', 201);

    } catch (error) {
      console.log(error);
      commonHelper.error(res, 'Server error', 500);
    }
  },


};

module.exports = KomunitasController;