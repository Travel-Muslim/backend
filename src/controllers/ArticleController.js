const ArticleModel = require('../models/ArticleModel');
const commonHelper = require('../helper/common');
const createError = require('http-errors');

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

            const response = {
                articles: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_items: parseInt(count),
                    total_pages: Math.ceil(count / limit)
                }
            };

            commonHelper.response(res, response, 200, 'Get articles success');

        } catch (error) {
            console.log(error);
            next(createError(500, "Server error"));
        }
    },

    getCategories: async (req, res, next) => {
        try {
            const { rows } = await ArticleModel.findCategories();
            commonHelper.response(res, rows, 200, 'Get categories success');

        } catch (error) {
            console.log(error);
            next(createError(500, "Server error"));
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id_or_slug } = req.params;
            
            const { rows } = await ArticleModel.findByIdOrSlug(id_or_slug);

            if (rows.length === 0) {
                return commonHelper.response(res, null, 404, 'Article not found');
            }

            commonHelper.response(res, rows[0], 200, 'Get article success');

        } catch (error) {
            console.log(error);
            next(createError(500, "Server error"));
        }
    },

    incrementView: async (req, res, next) => {
        try {
            const { id } = req.params;

            const { rows } = await ArticleModel.incrementView(id);

            if (rows.length === 0) {
                return commonHelper.response(res, null, 404, 'Article not found');
            }

            const response = {
                article_id: rows[0].id,
                total_views: rows[0].views
            };

            commonHelper.response(res, response, 200, 'View counted');

        } catch (error) {
            console.log(error);
            next(createError(500, "Server error"));
        }
    }
};

module.exports = ArticleController;