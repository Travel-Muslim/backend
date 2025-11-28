import jwt from 'jsonwebtoken'
import commonHelper from '../helper/common.js'

const protect = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]

        if (!token) {
            return commonHelper.response(res, null, 401, 'Token required')
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()

    } catch (error) {
        return commonHelper.response(res, null, 401, 'Invalid token')
    }
}

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return commonHelper.response(res, null, 403, 'Admin only')
    }
    next()
}

export { protect, isAdmin }