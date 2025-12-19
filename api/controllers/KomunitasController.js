const { v4: uuidv4 } = require("uuid");
const KomunitasModel = require("../models/KomunitasModel");
const commonHelper = require("../helpers/common");

const KomunitasController = {
  addComment: async (req, res) => {
    try {
      const { judul, tanggal, rating, komentar } = req.body;
      const user_id = req.user.id;

      if (!judul || !komentar || !rating) {
        return commonHelper.badRequest(res, "Judul, komentar, and rating are required");
      }

      if (rating < 1 || rating > 5) {
        return commonHelper.badRequest(res, "Rating must be between 1 and 5");
      }

      const { v4: uuidv4 } = require("uuid");
      const id = uuidv4();

      const result = await KomunitasModel.create({
        id,
        judul,
        komentar,
        rating,
        user_id,
        tanggal: tanggal || new Date(),
      });

      // Get user info to include in response
      const userInfo = await KomunitasModel.getUserInfo(user_id);
      const responseData = {
        ...result.rows[0],
        user: userInfo.rows[0] || null,
      };

      return commonHelper.created(res, responseData, "Comment added successfully");
    } catch (err) {
      console.log(err);
      return commonHelper.error(res, "Internal server error", 500);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const { judul, bulan } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const posts = await KomunitasModel.list(judul, bulan, limit, offset);
      const countResult = await KomunitasModel.count(judul, bulan);

      // Transform response to include user object
      const transformedPosts = posts.rows.map((post) => ({
        id: post.id,
        judul: post.judul,
        deskripsi: post.deskripsi,
        rating: post.rating,
        user_id: post.user_id,
        created_at: post.created_at,
        updated_at: post.updated_at,
        total_comments: post.total_comments,
        user: {
          fullname: post.user_fullname,
          avatar: post.user_avatar,
        },
      }));

      return commonHelper.paginated(
        res,
        transformedPosts,
        {
          page,
          limit,
          total_items: parseInt(countResult.rows[0].count),
          total_pages: Math.ceil(countResult.rows[0].count / limit),
        },
        "Get komunitas successful"
      );
    } catch (err) {
      console.log(err);
      return commonHelper.error(res, "Internal server error", 500);
    }
  },
};

module.exports = KomunitasController;
