const createError = require('http-errors')
import commonHelper from '../helper/common.js'
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

export default ArticleController