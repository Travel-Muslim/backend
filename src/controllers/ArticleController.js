const ArticleModel = require('../models/ArticleModel');
const commonHelper = require('../helper/common');

const ArticleController = {
    getAll: async (req, res, next) => {
        try {
            const { 
                search,           
                category,         
                sort = 'latest',  
                page = 1,
                limit = 10
            } = req.query;

            const offset = (page - 1) * limit;

            const { rows } = await ArticleModel.findAll({
                search,
                category,
                sort,
                limit,
                offset
            });

            const { rows: [{ count }] } = await ArticleModel.countAll({
                search,
                category
            });

            commonHelper.paginated(res, rows, {
                page: parseInt(page),
                total_pages: Math.ceil(count / limit),
                total_items: parseInt(count),
                per_page: parseInt(limit)
            }, 'Get articles successful');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    getCategories: async (req, res, next) => {
        try {
            const { rows } = await ArticleModel.findCategories();
            commonHelper.success(res, rows, 'Get categories successful');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id_or_slug } = req.params;
            
            const { rows } = await ArticleModel.findByIdOrSlug(id_or_slug);

            if (rows.length === 0) {
                return commonHelper.notFound(res, 'Article not found');
            }

            commonHelper.success(res, rows[0], 'Get article successful');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    incrementView: async (req, res, next) => {
        try {
            const { id } = req.params;

            const { rows } = await ArticleModel.incrementView(id);

            if (rows.length === 0) {
                return commonHelper.notFound(res, 'Article not found');
            }

            const response = {
                article_id: rows[0].id,
                total_views: rows[0].views
            };

            commonHelper.success(res, response, 'View counted');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    }
};

module.exports = ArticleController;