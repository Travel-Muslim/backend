const DestinationModel = require('../models/DestinationModel');
const commonHelper = require('../helper/common');
const createError = require('http-errors');

const DestinationController = {
    getAll: async (req, res, next) => {
        try {
            const { 
                search,           
                category,         
                halal = 'true',   
                page = 1,
                limit = 10
            } = req.query;

            const offset = (page - 1) * limit;

            const { rows } = await DestinationModel.findAll({
                search,
                category,
                halal,
                limit,
                offset
            });

            const { rows: [{ count }] } = await DestinationModel.countAll({
                search,
                category,
                halal
            });

            const response = {
                destinations: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_items: parseInt(count),
                    total_pages: Math.ceil(count / limit)
                }
            };

            commonHelper.response(res, response, 200, 'Get destinations success');

        } catch (error) {
            console.log(error);
            next(createError(500, "Server error"));
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.params;
            
            const { rows } = await DestinationModel.findById(id);

            if (rows.length === 0) {
                return commonHelper.response(res, null, 404, 'Destination not found');
            }

            commonHelper.response(res, rows[0], 200, 'Get destination success');

        } catch (error) {
            console.log(error);
            next(createError(500, "Server error"));
        }
    }
};

module.exports = DestinationController;