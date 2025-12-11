const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const {
  findEmail,
  create,
  updateResetToken,
  findByResetToken,
  updatePassword,
} = require("../models/UserModel");
const commonHelper = require("../helpers/common");
const authHelper = require("../helpers/auth.js");
const pool = require("../config/db.js");

const UserController = {
    register: async (req, res, next) => {
        try {
            const { nama, email, noTelepon, password, konfirmasiPassword, setujuKebijakan } = req.body;

            if (!setujuKebijakan) {
                return commonHelper.error(res, "Anda harus menyetujui kebijakan privasi", 400);
            }

            if (password !== konfirmasiPassword) {
                return commonHelper.error(res, "Password dan konfirmasi password tidak cocok", 400);
            }

            const { rowCount } = await findEmail(email);

            if (rowCount) {
                return commonHelper.error(res, "Email sudah terdaftar", 403);
            }

            const passwordHash = bcrypt.hashSync(password, 10);
            const userId = crypto.randomUUID();
            
            const data = {
                id: userId,
                email,
                password: passwordHash,
                full_name: nama,
                phone_number: noTelepon,
                role: "user",
            };

            await create(data);

            const payload = {
                id: userId,
                email,
                role: "user",
            };

            return commonHelper.success(res, {
                userId: userId,
                token: authHelper.generateToken(payload),
            }, "Register successful", 201);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, "Server error", 500);
        }
    },

    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const { rows: [user] } = await findEmail(email);

            if (!user) {
                return commonHelper.error(res, "Email tidak valid", 403);
            }

            const isValidPassword = bcrypt.compareSync(password, user.password);

            if (!isValidPassword) {
                return commonHelper.error(res, "Password tidak valid", 403);
            }

            const payload = {
                id: user.id,
                email: user.email,
                role: user.role,
            };

            return commonHelper.success(res, {
                userId: user.id,
                nama: user.full_name,
                email: user.email,
                role: user.role,
                token: authHelper.generateToken(payload),
                profileImage: user.avatar_url
            }, "Login successful");
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, "Server error", 500);
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;
            const { rows: [user] } = await findEmail(email);

            if (!user) {
                return commonHelper.error(res, "Email tidak ditemukan", 404);
            }

            const resetToken = crypto.randomUUID();
            const now = Date.now();
            const sixHours = 6 * 60 * 60 * 1000;
            const resetExpires = new Date(now + sixHours);

            await updateResetToken(email, resetToken, resetExpires);

            return commonHelper.success(res, { resetToken }, "Reset token generated");
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, "Server error", 500);
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const { token, newPassword } = req.body;
            const { rows: [user] } = await findByResetToken(token);

            if (!user) {
                return commonHelper.error(res, "Token tidak valid atau sudah kadaluarsa", 400);
            }

            const expiresFixed = new Date(
                new Date(user.reset_password_expires).getTime() + 7 * 60 * 60 * 1000
            );

            if (new Date() > expiresFixed) {
                return commonHelper.error(res, "Token sudah kadaluarsa", 400);
            }

            const passwordHash = bcrypt.hashSync(newPassword, 10);
            await updatePassword(user.email, passwordHash);

            return commonHelper.success(res, null, "Password berhasil direset");
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, "Server error", 500);
        }
    },

    logout: async (req, res, next) => {
        try {
            return commonHelper.success(res, null, "Logout successful");
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, "Server error", 500);
        }
    },

    getProfile: async (req, res, next) => {
        try {
            const { rows: [user] } = await findEmail(req.user.email);

            return commonHelper.success(res, {
                nama: user.full_name,
                email: user.email,
                noTelepon: user.phone_number,
                profileImage: user.avatar_url
            }, "Get profile successful");
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, "Server error", 500);
        }
    },

    updateProfile: async (req, res, next) => {
        try {
            const { nama, email, noTelepon, password } = req.body;
            const userId = req.user.id;

            const updateData = {};
            if (nama) updateData.full_name = nama;
            if (email) updateData.email = email;
            if (noTelepon) updateData.phone_number = noTelepon;
            if (password) {
                updateData.password = bcrypt.hashSync(password, 10);
            }

            if (req.file) {
                updateData.avatar_url = req.file.path;
            }

            const fields = [];
            const values = [];
            let paramIndex = 1;

            Object.keys(updateData).forEach(key => {
                fields.push(`${key} = $${paramIndex}`);
                values.push(updateData[key]);
                paramIndex++;
            });

            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(userId);

            const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
            const result = await pool.query(query, values);

            const updatedUser = result.rows[0];

            return commonHelper.success(res, {
                nama: updatedUser.full_name,
                email: updatedUser.email,
                noTelepon: updatedUser.phone_number,
                profileImage: updatedUser.avatar_url
            }, "Profile updated successfully");
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, "Server error", 500);
        }
    },

    uploadAvatar: async (req, res, next) => {
        try {
            const userId = req.user.id;

            if (!req.file) {
                return commonHelper.error(res, "No file uploaded", 400);
            }

            const { rows: [user] } = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
       
            if (user.avatar_url) {
                const publicId = user.avatar_url.split('/').pop().split('.')[0];
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (err) {
                    console.log('Error deleting old avatar:', err);
                }
            }

            const avatarUrl = req.file.path; 
            const query = 'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING avatar_url';
            const result = await pool.query(query, [avatarUrl, userId]);

            return commonHelper.success(res, {
                avatarUrl: result.rows[0].avatar_url
            }, "Avatar uploaded successfully");
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, "Server error", 500);
        }
    },

    deleteAvatar: async (req, res, next) => {
        try {
            const userId = req.user.id;

            const { rows: [user] } = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);

            if (!user.avatar_url) {
                return commonHelper.error(res, "No avatar to delete", 400);
            }

            const publicId = user.avatar_url.split('/').pop().split('.')[0];
            try {
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.log('Error deleting avatar from Cloudinary:', err);
            }

            const query = 'UPDATE users SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
            await pool.query(query, [userId]);

            return commonHelper.success(res, null, "Avatar deleted successfully");
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, "Server error", 500);
        }
    },

};

module.exports = UserController;