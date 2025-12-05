const pool = require('../config/db.js')

const create = (data) => {
    const { id, email, passwordHash, fullname, phoneNumber, role } = data
    return pool.query(
        `INSERT INTO users(id, email, password, full_name, phone_number, role) VALUES($1, $2, $3, $4, $5, $6)`,
        [id, email, passwordHash, fullname, phoneNumber, role]
    )
}

const updateResetToken = (email, token, expires) => {
    const expiresISO = expires.toISOString()
    return pool.query(
        `UPDATE users SET reset_password_token = $1, reset_password_expires = $2::timestamp WHERE email = $3`,
        [token, expiresISO, email]
    )
}

const findByResetToken = (token) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT * FROM users WHERE reset_password_token='${token}'`, (error, result) => {
            if (!error) {
                resolve(result)
            } else {
                reject(error)
            }
        })
    )
}

const updatePassword = (email, passwordHash) => {
    return new Promise((resolve, reject) =>
        pool.query(`UPDATE users SET password='${passwordHash}', reset_password_token=NULL, reset_password_expires=NULL WHERE email='${email}'`, (error, result) => {
            if (!error) {
                resolve(result)
            } else {
                reject(error)
            }
        })
    )
}

const findAll = () => {
    return pool.query(`SELECT id, email, full_name, role, created_at FROM users`)
}

const findEmail = (email) => {
    return new Promise((resolve, reject) =>
        pool.query(`SELECT * FROM users WHERE email='${email}'`, (error, result) => {
            if (!error) {
                resolve(result)
            } else {
                reject(error)
            }
        })
    )
}

const updateUser = (id, data) => {
    const { fullname, email } = data
    return pool.query(
        `UPDATE users SET full_name = $1, email = $2, updated_at = NOW() WHERE id = $3`,
        [fullname, email, id]
    )
}

const deleteUser = (id) => {
    return pool.query(`DELETE FROM users WHERE id = $1`, [id])
}

const findById = (id) => {
    return pool.query(`SELECT id, email, full_name, role, created_at FROM users WHERE id = $1`, [id])
}

module.exports = { create, findEmail, findAll, updateUser, deleteUser, findById, updateResetToken, findByResetToken, updatePassword }