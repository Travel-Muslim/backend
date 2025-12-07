const commonHelper = require('../helper/common')
const { getByUserId } = require('../models/WishlistModel')

const WishlistController = {
    getByUser: async (req, res, next) => {
        try {
            const { rows } = await getByUserId(req.user.id)

            if (rows.length === 0) {
                return commonHelper.success(res, [], 'Wishlist is empty')
            }

            commonHelper.success(res, rows, 'Get wishlist successful')
        } catch (error) {
            console.log(error)
            commonHelper.error(res, 'Server error', 500)
        }
    }
}

module.exports = WishlistController;