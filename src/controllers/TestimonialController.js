const createError = require('http-errors')
const commonHelper = require('../helper/common')
const { getFeatured } = require('../models/testimonials.js')

const TestimonialController = {
    getFeatured: async (req, res, next) => {
        try {
            const limit = req.query.limit || 3
            const { rows } = await getFeatured(limit)

            commonHelper.response(res, rows, 200, 'Success')
        } catch (error) {
            console.log(error)
            next(createError(500, "Server error"))
        }
    }
}

module.exports = TestimonialController;