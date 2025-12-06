const PackageModel = require('../models/PackageModel');
const commonHelper = require('../helper/common');
const createError = require('http-errors');

const PackageController = {
    getAll: async (req, res, next) => {
        try {
            const { 
                featured,         
                destination,      
                min_price,        
                max_price,        
                search,           
                page = 1,
                limit = 10
            } = req.query;

            const offset = (page - 1) * limit;

            const { rows } = await PackageModel.findAll({
                featured,
                destination,
                min_price,
                max_price,
                search,
                limit,
                offset
            });

            const { rows: [{ count }] } = await PackageModel.countAll({
                featured,
                destination,
                min_price,
                max_price,
                search
            });

            const response = {
                packages: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_items: parseInt(count),
                    total_pages: Math.ceil(count / limit)
                }
            };

            commonHelper.response(res, response, 200, 'Get packages success');

        } catch (error) {
            console.log(error);
            next(createError(500, "Server error"));
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.params;
            
            const { rows } = await PackageModel.findById(id);

            if (rows.length === 0) {
                return commonHelper.response(res, null, 404, 'Package not found');
            }

            commonHelper.response(res, rows[0], 200, 'Get package success');

        } catch (error) {
            console.log(error);
            next(createError(500, "Server error"));
        }
    }
};

module.exports = PackageController;