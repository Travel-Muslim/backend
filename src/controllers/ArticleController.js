const createError = require('http-errors')
const commonHelper = require('../helper/common')
const { getLatest } = require('../models/articles.js')

const ArticleController = {
    getLatest: async (req, res, next) => {
        try {
            const limit = req.query.limit || 2
            const { rows } = await getLatest(limit)

            commonHelper.response(res, rows, 200, 'Success')
        } catch (error) {
            console.log(error)
            next(createError(500, "Server error"))
        }
    }
}

module.exports = ArticleController;