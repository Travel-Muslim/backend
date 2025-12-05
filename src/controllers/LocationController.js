const createError = require('http-errors')
const commonHelper = require('../helper/common')
const { getAll } = require('../models/locations.js')

const LocationController = {
    getAll: async (req, res, next) => {
        try {
            const { popular } = req.query
            const { rows } = await getAll(popular)

            const locations = rows.map(loc => ({
                id: loc.id,
                name: loc.name,
                country: loc.country,
                is_popular: popular === 'true'
            }))

            commonHelper.response(res, locations, 200, 'Success')
        } catch (error) {
            console.log(error)
            next(createError(500, "Server error"))
        }
    }
}

module.exports = LocationController;