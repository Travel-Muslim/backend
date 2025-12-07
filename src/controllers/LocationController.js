const LocationModel = require('../models/LocationModel');
const commonHelper = require('../helper/common');

const LocationController = {
    getAll: async (req, res, next) => {
        try {
            const { region } = req.query; 

            const { rows } = await LocationModel.findAll(region);

            commonHelper.response(res, rows, 200, 'Get locations success');

        } catch (error) {
            console.log(error);
            next(createError(500, "Server error"));
        }
    }
};

module.exports = LocationController;