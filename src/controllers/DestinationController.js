const createError = require('http-errors')
const commonHelper = require('../helper/common')
const { search } = require('../models/destinations.js')

const DestinationController = {
    search: async (req, res, next) => {
        try {
            const { from, to, date, keyword } = req.query
            
            const { rows } = await search({ from, to, date, keyword })

            if (rows.length === 0) {
                return commonHelper.response(res, null, 404, 'No destinations found')
            }

            commonHelper.response(res, rows, 200, 'Success')
        } catch (error) {
            console.log(error)
            next(createError(500, "Server error"))
        }
    }
}

module.exports = DestinationController;