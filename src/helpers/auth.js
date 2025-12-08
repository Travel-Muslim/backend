const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
    const verifyOpts = {
        expiresIn: '1h',
        issuer: 'muslimah-travel'
    }
    const token = jwt.sign(payload, process.env.JWT_SECRET, verifyOpts)
    return token
}

const generateRefreshToken = (payload) => {
    const verifyOpts = { expiresIn: '1d' }
    const token = jwt.sign(payload, process.env.JWT_SECRET, verifyOpts)
    return token
}

module.exports = { generateToken, generateRefreshToken };