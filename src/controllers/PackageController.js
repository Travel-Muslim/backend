const createError = require('http-errors')
import commonHelper from '../helper/common.js'
const { getFeatured } = require('../models/packages.js')

const PackageController = {
    getFeatured: async (req, res, next) => {
        try {
            const limit = req.query.limit || 3
            const { rows } = await getFeatured(limit)
            
            const packages = rows.map(pkg => ({
                id: pkg.id,
                name: pkg.name,
                image_url: pkg.image_url,
                start_date: pkg.start_date,
                duration_days: pkg.duration_days,
                price: pkg.price,
                destination: {
                    name: pkg.destination_name,
                    location: pkg.destination_location
                }
            }))

            commonHelper.response(res, packages, 200, 'Success')
        } catch (error) {
            console.log(error)
            next(createError(500, "Server error"))
        }
    }
}

export default PackageController