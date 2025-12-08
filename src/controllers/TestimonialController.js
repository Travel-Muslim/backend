const TestimonialModel = require('../models/TestimonialModel');
const commonHelper = require('../helpers/common');

const TestimonialController = {
    getAll: async (req, res, next) => {
        try {
            const { 
                featured = 'true',  
                limit = 10 
            } = req.query;

            const { rows } = await TestimonialModel.findAll(featured, limit);

            commonHelper.success(res, rows, 'Get testimonials successful');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    }
};

module.exports = TestimonialController;