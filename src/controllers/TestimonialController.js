const TestimonialModel = require('../models/TestimonialModel');
const commonHelper = require('../helper/common');
const createError = require('http-errors');

const TestimonialController = {
    getAll: async (req, res, next) => {
        try {
            const { 
                featured = 'true',  
                limit = 10 
            } = req.query;

            const { rows } = await TestimonialModel.findAll(featured, limit);

            commonHelper.response(res, rows, 200, 'Get testimonials success');

        } catch (error) {
            console.log(error);
            next(createError(500, "Server error"));
        }
    }
};

module.exports = TestimonialController;