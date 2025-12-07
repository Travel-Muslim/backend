const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const {
    findEmail,
    updateResetToken,
    findByResetToken,
    updatePassword,
    findById,
    updateProfile,
    updateAvatar,
    deleteAvatar,
    updatePasswordById,
    createUser  
} = require('../models/UserModel.js')
const cloudinary = require('../config/cloudinary')
const commonHelper = require('../helper/common')
const authHelper = require('../helper/auth')
const pool = require('../config/db')

const UserController = {
    register: async (req, res, next) => {
        try {
            const { email, password, fullname, phone_number } = req.body;
            const { rowCount } = await findEmail(email);

            if (rowCount) {
                return commonHelper.badRequest(res, "Email is already used");
            }

            const passwordHash = bcrypt.hashSync(password, 10);
            const data = {
                id: crypto.randomUUID(),
                email,
                passwordHash,
                fullname,
                phoneNumber: phone_number,
                role: "user",
            };

            const query = `
                INSERT INTO users (id, email, password, full_name, phone_number, role)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, email, full_name, phone_number, role
            `;
            
            const { rows: [user] } = await pool.query(query, [
                data.id,
                data.email,
                data.passwordHash,
                data.fullname,
                data.phoneNumber,
                data.role
            ]);

            commonHelper.created(res, user, 'Registration successful');

        } catch (error) {
            console.log(error)
            commonHelper.error(res, 'Server error', 500)
        }
    },

    login: async (req, res, next) => {
        try {
            const { email, password } = req.body
            const { rows: [user] } = await findEmail(email)

            if (!user) {
                return commonHelper.notFound(res, 'Email not found')
            }

            const isValidPassword = bcrypt.compareSync(password, user.password)

            if (!isValidPassword) {
                return commonHelper.unauthorized(res, 'Invalid password')
            }

            delete user.password
            delete user.reset_password_token
            delete user.reset_password_expires

            const payload = {
                id: user.id,
                email: user.email,
                role: user.role
            }

            const responseData = { 
                id: user.id,
                fullname: user.full_name,
                email: user.email,
                phoneNumber: user.phone_number,
                role: user.role,
                avatar: user.avatar_url,
                token: authHelper.generateToken(payload),
                refreshToken: authHelper.generateRefreshToken(payload)
            }

            commonHelper.success(res, responseData, 'Login successful')
        } catch (error) {
            console.log(error)
            commonHelper.error(res, 'Server error', 500)
        }
    },

    logout: async (req, res, next) => {
        try {
            commonHelper.success(res, null, 'Logout successful')
        } catch (error) {
            console.log(error)
            commonHelper.error(res, 'Server error', 500)
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body
            const { rows: [user] } = await findEmail(email)

            if (!user) {
                return commonHelper.notFound(res, 'Email not found')
            }

            const resetToken = crypto.randomUUID() 
            const now = Date.now()
            const sixHours = 6 * 60 * 60 * 1000
            const resetExpires = new Date(now + sixHours)

            await updateResetToken(email, resetToken, resetExpires)

            commonHelper.success(res, { resetToken }, 'Password reset link sent to your email')

        } catch (error) {
            console.log(error)
            commonHelper.error(res, 'Server error', 500)
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const { token, newPassword } = req.body
            const { rows: [user] } = await findByResetToken(token)

            if (!user) {
                return commonHelper.badRequest(res, 'Invalid or expired token')
            }

            const expiresFixed = new Date(new Date(user.reset_password_expires).getTime() + 7 * 60 * 60 * 1000)
            
            if (new Date() > expiresFixed) {
                return commonHelper.badRequest(res, 'Token has expired')
            }

            const passwordHash = bcrypt.hashSync(newPassword, 10)
            await updatePassword(user.email, passwordHash)

            commonHelper.success(res, null, 'Password reset successful')

        } catch (error) {
            console.log(error)
            commonHelper.error(res, 'Server error', 500)
        }
    },

    getProfile: async (req, res, next) => {
        try {
            const { rows: [user] } = await findById(req.user.id)
            
            if (!user) {
                return commonHelper.notFound(res, 'User not found')
            }
            
            commonHelper.success(res, user, 'Get profile successful')
        } catch (error) {
            console.log(error)
            commonHelper.error(res, 'Server error', 500)
        }
    },

    updateProfileUser: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { fullname, phone_number } = req.body;

            const data = {
                fullname,
                phoneNumber: phone_number
            };

            const { rows: [user] } = await updateProfile(userId, data);

            if (!user) {
                return commonHelper.notFound(res, 'User not found');
            }

            commonHelper.success(res, user, 'Profile updated successfully');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    changePassword: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { current_password, new_password, confirm_password } = req.body;

            if (new_password !== confirm_password) {
                return commonHelper.badRequest(res, 'New password and confirm password do not match');
            }

            const { rows: [user] } = await findById(userId);

            if (!user) {
                return commonHelper.notFound(res, 'User not found');
            }

            const { rows: [userWithPassword] } = await findEmail(req.user.email);
            const isValidPassword = bcrypt.compareSync(current_password, userWithPassword.password);

            if (!isValidPassword) {
                return commonHelper.unauthorized(res, 'Current password is incorrect');
            }

            const passwordHash = bcrypt.hashSync(new_password, 10);
            await updatePasswordById(userId, passwordHash);

            commonHelper.success(res, null, 'Password changed successfully');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    uploadAvatar: async (req, res, next) => {
        try {
            const userId = req.user.id;

            if (!req.file) {
                return commonHelper.badRequest(res, 'No file uploaded');
            }

            const { rows: [oldUser] } = await findById(userId);

            if (oldUser && oldUser.avatar_url) {
                try {
                    const urlParts = oldUser.avatar_url.split('/');
                    const publicIdWithExt = urlParts[urlParts.length - 1];
                    const publicId = `saleema-tour/avatars/${publicIdWithExt.split('.')[0]}`;
                    
                    await cloudinary.uploader.destroy(publicId);
                } catch (error) {
                    console.log('Error deleting old avatar:', error);
                }
            }

            const avatarUrl = req.file.path; 

            const { rows: [user] } = await updateAvatar(userId, avatarUrl);

            if (!user) {
                return commonHelper.notFound(res, 'User not found');
            }

            commonHelper.success(res, { avatar_url: user.avatar_url }, 'Avatar uploaded successfully');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    deleteAvatarUser: async (req, res, next) => {
        try {
            const userId = req.user.id;

            const { rows: [oldUser] } = await findById(userId);

            if (oldUser && oldUser.avatar_url) {
                try {
                    const urlParts = oldUser.avatar_url.split('/');
                    const publicIdWithExt = urlParts[urlParts.length - 1];
                    const publicId = `saleema-tour/avatars/${publicIdWithExt.split('.')[0]}`;
                    
                    await cloudinary.uploader.destroy(publicId);
                } catch (error) {
                    console.log('Error deleting avatar from Cloudinary:', error);
                }
            }

            const { rows: [user] } = await deleteAvatar(userId);

            if (!user) {
                return commonHelper.notFound(res, 'User not found');
            }

            commonHelper.success(res, { avatar_url: null }, 'Avatar deleted successfully');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },
}

module.exports = UserController;