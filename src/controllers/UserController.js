const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require('uuid');
const UserModel = require('../models/UserModel.js');
const cloudinary = require('../config/cloudinary');
const commonHelper = require('../helpers/common.js');
const authHelper = require('../helpers/auth.js');
const {
    findEmail,
    updateResetToken,
    findByResetToken,
    updatePassword,
    findById,
    updateProfile,
    deleteAvatar,
    updatePasswordById,
    create
} = UserModel;

const UserController = {
    register: async (req, res, next) => {
        try {
            const { email, password, password_confirm, full_name, phone_number } = req.body;

            if (!email || !password || !password_confirm || !full_name || !phone_number) {
                return commonHelper.badRequest(res, 'Semua field harus diisi');
            }

            if (password !== password_confirm) {
                return commonHelper.badRequest(res, 'Password dan konfirmasi password tidak cocok');
            }

            if (password.length < 8) {
                return commonHelper.badRequest(res, 'Password harus terdiri dari minimal 8 karakter');
            }

            const { rowCount } = await findEmail(email);
            if (rowCount) {
                return commonHelper.badRequest(res, "Email sudah digunakan");
            }

            const passwordHash = bcrypt.hashSync(password, 10);
            
            const data = {
                id: uuidv4(),
                email,
                password: passwordHash,
                full_name: full_name,
                phone_number: phone_number,
                role: "user",
            };

            const { rows: [user] } = await create(data);

            const payload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const responseData = {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                token: authHelper.generateToken(payload)
            };

            commonHelper.created(res, responseData, 'Registrasi berhasil');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return commonHelper.badRequest(res, 'Email dan password harus diisi');
            }

            const { rows: [user] } = await findEmail(email);
            if (!user) {
                return commonHelper.notFound(res, 'Email tidak ditemukan');
            }

            const isValidPassword = bcrypt.compareSync(password, user.password);
            if (!isValidPassword) {
                return commonHelper.unauthorized(res, 'Password tidak valid');
            }

            const payload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const responseData = {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token: authHelper.generateToken(payload)
            };

            commonHelper.success(res, responseData, 'Login berhasil');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    logout: async (req, res, next) => {
        try {
            commonHelper.success(res, null, 'Logout berhasil');
        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;

            if (!email) {
                return commonHelper.badRequest(res, 'Email harus diisi');
            }

            const { rows: [user] } = await findEmail(email);
            if (!user) {
                return commonHelper.notFound(res, 'Email tidak ditemukan');
            }

            const resetToken = crypto.randomUUID();
            const now = Date.now();
            const sixHours = 6 * 60 * 60 * 1000;
            const resetExpires = new Date(now + sixHours);

            await updateResetToken(email, resetToken, resetExpires);

            commonHelper.success(res, { resetToken }, 'Link reset password telah dikirim ke email Anda');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const { token, password } = req.body;

            if (!token || !password ) {
                return commonHelper.badRequest(res, 'Semua field harus diisi');
            }

            const { rows: [user] } = await findByResetToken(token);
            if (!user) {
                return commonHelper.badRequest(res, 'Token tidak valid atau sudah kedaluwarsa');
            }

            const expiresFixed = new Date(new Date(user.reset_password_expires).getTime() + 7 * 60 * 60 * 1000);
            if (new Date() > expiresFixed) {
                return commonHelper.badRequest(res, 'Token sudah kedaluwarsa');
            }

            const passwordHash = bcrypt.hashSync(password, 10);
            await updatePassword(user.email, passwordHash);

            commonHelper.success(res, null, 'Reset password berhasil');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    getProfile: async (req, res, next) => {
        try {
            const { rows: [user] } = await findById(req.user.id);
            
            if (!user) {
                return commonHelper.notFound(res, 'User tidak ditemukan');
            }
            
            commonHelper.success(res, user, 'Get profile berhasil');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    updateProfile: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { full_name, email, phone_number } = req.body;

            if (!full_name && !email && !phone_number) {
                return commonHelper.badRequest(res, 'Setidaknya satu field harus diisi untuk diperbarui');
            }

            if (email) {
                const { rows: [existingUser] } = await findEmail(email);
                if (existingUser && existingUser.id !== userId) {
                    return commonHelper.badRequest(res, 'Email sudah digunakan oleh pengguna lain');
                }
            }

            const data = {
                full_name,
                email,
                phoneNumber: phone_number
            };

            const { rows: [user] } = await updateProfile(userId, data);

            if (!user) {
                return commonHelper.notFound(res, 'User tidak ditemukan');
            }

            commonHelper.success(res, user, 'Profile berhasil diperbarui');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

   uploadAvatar: async (req, res) => {
        try {
            const userId = req.user.id;

            if (!req.file) {
            return commonHelper.badRequest(res, 'File avatar diperlukan');
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'muslimah-travel/avatars',
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' }
            ],
            public_id: `avatar_${userId}_${Date.now()}`
            });

            const { rows: [user] } = await UserModel.uploadAvatar(userId, result.secure_url);

            if (!user) {
            return commonHelper.notFound(res, 'User tidak ditemukan');
            }

            try { 
            fs.unlinkSync(req.file.path); 
            } catch (err) {}

            return commonHelper.success(res, {
            avatar_url: user.avatar_url
            }, 'Avatar berhasil diunggah');

        } catch (error) {
            console.log(error);
            return commonHelper.error(res, 'Server error', 500);
        }
    },


    deleteAvatar: async (req, res, next) => {
        try {
            const userId = req.user.id;

            const { rows: [currentUser] } = await findById(userId);
            
            if (!currentUser) {
                return commonHelper.notFound(res, 'User tidak ditemukan');
            }

            if (currentUser.avatar_url) {
                try {
                    const urlParts = currentUser.avatar_url.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = `muslimah-travel/avatars/${filename.split('.')[0]}`;
                    
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.log('Cloudinary hapus error:', cloudinaryError);
                }
            }

            await deleteAvatar(userId);

            commonHelper.success(res, null, 'Avatar berhasil dihapus');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    changePassword: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { current_password, new_password } = req.body;

            if (!current_password || !new_password ) {
                return commonHelper.badRequest(res, 'Semua field harus diisi');
            }

            if (new_password.length < 8) {
                return commonHelper.badRequest(res, 'Password baru harus terdiri dari minimal 8 karakter');
            }

            const { rows: [user] } = await findById(userId);

            if (!user) {
                return commonHelper.notFound(res, 'User not found');
            }

            const { rows: [userWithPassword] } = await findEmail(user.email);

            const isValidPassword = bcrypt.compareSync(current_password, userWithPassword.password);
            if (!isValidPassword) {
                return commonHelper.unauthorized(res, 'Password saat ini salah');
            }

            const passwordHash = bcrypt.hashSync(new_password, 10);

            await updatePasswordById(userId, passwordHash);

            commonHelper.success(res, null, 'Password berhasil diubah');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    }
};

module.exports = UserController;