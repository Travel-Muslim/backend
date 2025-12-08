const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const AdminModel = require('../models/AdminModel');
const commonHelper = require('../helpers/common');

const AdminController = {
    getDashboardStats: async (req, res) => {
        try {
            const result = await AdminModel.getDashboardStats();
            const stats = result.rows[0];

            return commonHelper.success(res, {
                totalBooking: parseInt(stats.total_booking) || 0,
                totalProfit: parseFloat(stats.total_profit) || 0,
                pembeliAktif: parseInt(stats.pembeli_aktif) || 0
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getTopPackages: async (req, res) => {
        try {
            const result = await AdminModel.getTopPackages();
            
            const data = result.rows.map(row => ({
                id: row.id,
                name: row.name,
                imageUrl: row.image_url,
                percentage: parseInt(row.percentage) || 0
            }));

            return commonHelper.success(res, data);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getTopBuyers: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 6;
            const result = await AdminModel.getTopBuyers(limit);
            
            const data = result.rows.map(row => ({
                id: row.id,
                name: row.name,
                avatarUrl: row.avatar_url,
                totalBooking: parseInt(row.total_booking) || 0,
                totalUlasan: parseInt(row.total_ulasan) || 0
            }));

            return commonHelper.success(res, data);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getBookingStatus: async (req, res) => {
        try {
            const result = await AdminModel.getBookingStatus();
            const row = result.rows[0];

            return commonHelper.success(res, {
                total: parseInt(row.total) || 0,
                breakdown: row.breakdown || []
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getRecentBookings: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 3;
            const result = await AdminModel.getRecentBookings(limit);
            
            const data = result.rows.map(row => ({
                id: row.id,
                pembeli: row.pembeli,
                paketTour: row.paket_tour,
                harga: parseFloat(row.harga),
                createdAt: row.created_at
            }));

            return commonHelper.success(res, data);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },
    
    getAllUsers: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const users = await AdminModel.getAllUsers(limit, offset);
            const countResult = await AdminModel.countAllUsers();
            const total = parseInt(countResult.rows[0].count);

            const data = users.rows.map(user => ({
                displayId: user.display_id,
                id: user.id,
                namaLengkap: user.full_name,
                email: user.email,
                telepon: user.phone_number,
                password: user.password,
                tanggalDaftar: user.created_at
            }));

            return commonHelper.success(res, data, {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    searchUsers: async (req, res) => {
        try {
            const { search } = req.query;

            if (!search) {
                return commonHelper.badRequest(res, 'Search query is required');
            }

            const result = await AdminModel.searchUsers(search);

            const data = result.rows.map(user => ({
                displayId: user.display_id,
                id: user.id,
                namaLengkap: user.full_name,
                email: user.email,
                telepon: user.phone_number,
                password: user.password,
                tanggalDaftar: user.created_at
            }));

            return commonHelper.success(res, data);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getUserDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AdminModel.getUserById(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'User not found');
            }

            const user = result.rows[0];
            return commonHelper.success(res, {
                id: user.id,
                namaLengkap: user.full_name,
                email: user.email,
                telepon: user.phone_number,
                role: user.role,
                tanggalDaftar: user.created_at
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    createUser: async (req, res) => {
        try {
            const { fullname, email, phone_number, password, role } = req.body;

            if (!fullname || !email || !password) {
                return commonHelper.badRequest(res, 'Missing required fields');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userData = {
                id: uuidv4(),
                fullname,
                email,
                phone_number,
                password: hashedPassword,
                role: role || 'user'
            };

            const result = await AdminModel.createUser(userData);
            const user = result.rows[0];

            return commonHelper.created(res, 'User berhasil ditambahkan', {
                id: user.id,
                namaLengkap: user.full_name,
                email: user.email,
                telepon: user.phone_number,
                role: user.role,
                tanggalDaftar: user.created_at
            });
        } catch (error) {
            console.log(error);
            if (error.code === '23505') {
                return commonHelper.badRequest(res, 'Email already exists');
            }
            return commonHelper.error(res, error.message, 500);
        }
    },

    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { fullname, email, phone_number, password } = req.body;

            const userData = { fullname, email, phone_number };

            if (password) {
                userData.password = await bcrypt.hash(password, 10);
            }

            const result = await AdminModel.updateUser(id, userData);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'User not found');
            }

            const user = result.rows[0];
            return commonHelper.success(res, 'User berhasil diupdate', {
                id: user.id,
                namaLengkap: user.full_name,
                email: user.email,
                telepon: user.phone_number,
                role: user.role
            });
        } catch (error) {
            console.log(error);
            if (error.code === '23505') {
                return commonHelper.badRequest(res, 'Email already exists');
            }
            return commonHelper.error(res, error.message, 500);
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AdminModel.deleteUser(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'User not found');
            }

            return commonHelper.success(res, 'User berhasil dihapus');
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getAllPackages: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const packages = await AdminModel.getAllPackages(limit, offset);
            const countResult = await AdminModel.countAllPackages();
            const total = parseInt(countResult.rows[0].count);

            const data = packages.rows.map(pkg => ({
                displayId: pkg.display_id,
                id: pkg.id,
                namaPaket: pkg.name,
                lokasi: pkg.location,
                keberangkatan: pkg.departure_date,
                maskapai: pkg.airline,
                harga: parseFloat(pkg.price)
            }));

            return commonHelper.success(res, data, {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    searchPackages: async (req, res) => {
        try {
            const { search } = req.query;

            if (!search) {
                return commonHelper.badRequest(res, 'Search query is required');
            }

            const result = await AdminModel.searchPackages(search);

            const data = result.rows.map(pkg => ({
                displayId: pkg.display_id,
                id: pkg.id,
                namaPaket: pkg.name,
                lokasi: pkg.location,
                keberangkatan: pkg.departure_date,
                maskapai: pkg.airline,
                harga: parseFloat(pkg.price)
            }));

            return commonHelper.success(res, data);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getPackageDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AdminModel.getPackageById(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Package not found');
            }

            const pkg = result.rows[0];
            return commonHelper.success(res, {
                id: pkg.id,
                namaPaket: pkg.name,
                lokasi: pkg.location,
                maskapai: pkg.airline,
                bandara: pkg.departure_airport,
                periodeKeberangkatan: pkg.start_date,
                harga: parseFloat(pkg.price),
                gambarArtikel: pkg.image_url,
                itinerary: pkg.itinerary
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    createPackage: async (req, res) => {
        try {
            const packageData = {
                id: uuidv4(),
                ...req.body
            };

            const result = await AdminModel.createPackage(packageData);
            return commonHelper.created(res, 'Paket berhasil ditambahkan', result.rows[0]);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    updatePackage: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AdminModel.updatePackage(id, req.body);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Package not found');
            }

            return commonHelper.success(res, 'Paket berhasil diupdate', result.rows[0]);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    deletePackage: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AdminModel.deletePackage(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Package not found');
            }

            return commonHelper.success(res, 'Paket berhasil dihapus');
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getAllArticles: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const articles = await AdminModel.getAllArticles(limit, offset);
            const countResult = await AdminModel.countAllArticles();
            const total = parseInt(countResult.rows[0].count);

            const data = articles.rows.map(article => ({
                displayId: article.display_id,
                id: article.id,
                judulArtikel: article.title,
                tanggalTerbit: article.created_at,
                status: article.status
            }));

            return commonHelper.success(res, data, {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    searchArticles: async (req, res) => {
        try {
            const { search } = req.query;

            if (!search) {
                return commonHelper.badRequest(res, 'Search query is required');
            }

            const result = await AdminModel.searchArticles(search);

            const data = result.rows.map(article => ({
                displayId: article.display_id,
                id: article.id,
                judulArtikel: article.title,
                tanggalTerbit: article.created_at,
                status: article.status
            }));

            return commonHelper.success(res, data);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getArticleDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AdminModel.getArticleById(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Article not found');
            }

            const article = result.rows[0];
            return commonHelper.success(res, {
                id: article.id,
                judulArtikel: article.title,
                tanggal: article.created_at,
                isiArtikel: article.content
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    createArticle: async (req, res) => {
        try {
            const articleData = {
                id: uuidv4(),
                author_id: req.user.id,
                slug: req.body.title ? req.body.title.toLowerCase().replace(/\s+/g, '-') : uuidv4(),
                ...req.body
            };

            const result = await AdminModel.createArticle(articleData);
            return commonHelper.created(res, 'Artikel berhasil ditambahkan', result.rows[0]);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    updateArticle: async (req, res) => {
        try {
            const { id } = req.params;
            const articleData = {
                ...req.body,
                slug: req.body.title ? req.body.title.toLowerCase().replace(/\s+/g, '-') : undefined
            };

            const result = await AdminModel.updateArticle(id, articleData);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Article not found');
            }

            return commonHelper.success(res, 'Artikel berhasil diupdate', result.rows[0]);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    deleteArticle: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AdminModel.deleteArticle(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Article not found');
            }

            return commonHelper.success(res, 'Artikel berhasil dihapus');
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    togglePublish: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AdminModel.togglePublishArticle(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Article not found');
            }

            const message = result.rows[0].is_published 
                ? 'Artikel berhasil dipublish' 
                : 'Artikel berhasil di-unpublish';

            return commonHelper.success(res, message, {
                id: result.rows[0].id,
                isPublished: result.rows[0].is_published
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getAllOrders: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const { status, search } = req.query;

            const orders = await AdminModel.getAllOrders({ status, search, limit, offset });
            const countResult = await AdminModel.countAllOrders({ status, search });
            const total = parseInt(countResult.rows[0].count);

            const data = orders.rows.map(order => ({
                tourId: order.tour_id,
                namaLengkap: order.nama_lengkap,
                namaPaket: order.nama_paket,
                tanggal: order.tanggal,
                status: order.status,
                pembayaran: parseFloat(order.pembayaran)
            }));

            return commonHelper.success(res, data, {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getOrderDetail: async (req, res) => {
        try {
            const { tour_id } = req.params;
            const result = await AdminModel.getOrderByTourId(tour_id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Order not found');
            }

            const order = result.rows[0];
            return commonHelper.success(res, {
                tourId: order.tour_id,
                namaLengkap: order.nama_lengkap,
                email: order.email,
                phoneNumber: order.phone_number,
                namaPaket: order.nama_paket,
                tanggal: order.tanggal,
                status: order.status,
                pembayaran: parseFloat(order.pembayaran)
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    updateOrderStatus: async (req, res) => {
        try {
            const { booking_id } = req.params;
            const { status } = req.body;

            const result = await AdminModel.updateOrderStatus(booking_id, status);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Order not found');
            }

            return commonHelper.success(res, 'Status order berhasil diupdate', {
                id: result.rows[0].id,
                status: result.rows[0].status
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    updatePaymentStatus: async (req, res) => {
        try {
            const { booking_id } = req.params;
            const { paymentStatus } = req.body;

            const result = await AdminModel.updatePaymentStatus(booking_id, paymentStatus);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Order not found');
            }

            return commonHelper.success(res, 'Status pembayaran berhasil diupdate', {
                id: result.rows[0].id,
                paymentStatus: result.rows[0].payment_status
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getAdminProfile: async (req, res) => {
        try {
            const adminId = req.user.id;
            const result = await AdminModel.getAdminProfile(adminId);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Admin not found');
            }

            const admin = result.rows[0];
            return commonHelper.success(res, {
                id: admin.id,
                nama: admin.nama,
                email: admin.email,
                noTelepon: admin.no_telepon,
                avatarUrl: admin.avatar_url,
                role: admin.role
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    updateAdminProfile: async (req, res) => {
        try {
            const adminId = req.user.id;
            const { nama, email, noTelepon, password } = req.body;

            const profileData = { nama, email, noTelepon };

            if (password) {
                profileData.password = await bcrypt.hash(password, 10);
            }

            const result = await AdminModel.updateAdminProfile(adminId, profileData);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Admin not found');
            }

            const admin = result.rows[0];
            return commonHelper.success(res, 'Profil berhasil diupdate', {
                id: admin.id,
                nama: admin.nama,
                email: admin.email,
                noTelepon: admin.no_telepon
            });
        } catch (error) {
            console.log(error);
            if (error.code === '23505') {
                return commonHelper.badRequest(res, 'Email already exists');
            }
            return commonHelper.error(res, error.message, 500);
        }
    },

    uploadAdminPhoto: async (req, res) => {
        try {
            const adminId = req.user.id;
            
            if (!req.file) {
                return commonHelper.badRequest(res, 'No file uploaded');
            }

            const avatarUrl = req.file.path; 

            const result = await AdminModel.updateAdminAvatar(adminId, avatarUrl);

            return commonHelper.success(res, 'Foto profil berhasil diupload', {
                avatarUrl: result.rows[0].avatar_url
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    deleteAdminPhoto: async (req, res) => {
        try {
            const adminId = req.user.id;
            const result = await AdminModel.deleteAdminAvatar(adminId);

            return commonHelper.success(res, 'Foto profil berhasil dihapus');
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getAllCommunityPosts: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const { month } = req.query;

            const posts = await AdminModel.getAllCommunityPosts({ month, limit, offset });
            const countResult = await AdminModel.countAllCommunityPosts(month);
            const total = parseInt(countResult.rows[0].count);

            return commonHelper.success(res, posts.rows, {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    getCommunityPostDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AdminModel.getCommunityPostById(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Post not found');
            }

            return commonHelper.success(res, result.rows[0]);
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    },

    deleteCommunityPost: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await AdminModel.deleteCommunityPost(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Post not found');
            }

            return commonHelper.success(res, 'Post deleted successfully');
        } catch (error) {
            console.log(error);
            return commonHelper.error(res, error.message, 500);
        }
    }
};

module.exports = AdminController;