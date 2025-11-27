import pool from '../config/db.js'

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

const create = (data) => {
    const { id, email, passwordHash, fullname } = data
    return pool.query(
        `INSERT INTO users(id, email, password, full_name) VALUES($1, $2, $3, $4)`,
        [id, email, passwordHash, fullname]
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

export { findEmail, create, updateResetToken, findByResetToken, updatePassword }