const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const AdminModel = require('../models/AdminModel');
const commonHelper = require('../helpers/common');
const { ValidationHelper, ValidationError } = require('../helpers/validation');
const TransactionHelper = require('../helpers/transactionHelper');
const cloudinary = require('../config/cloudinary');
const {
    CONSTANTS,
    HTTP_STATUS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    PAGINATION,
    CLOUDINARY_FOLDERS
} = require('../config/constants');

const AdminController = {
    getDashboardStats: async (req, res) => {
        try {
            const stats = await AdminModel.getDashboardStats();
            
            return commonHelper.success(res, {
                totalBooking: stats.total_booking || 0,
                profit: parseFloat(stats.total_profit || 0),
                pembeliAktif: stats.active_buyers || 0
            }, 'Get dashboard data successful');
        } catch (error) {
            console.error('getDashboardStats error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getTopPackages: async (req, res) => {
        try {
            const result = await AdminModel.getTopPackages(PAGINATION.TOP_PACKAGES_LIMIT);
            
            const maxBookings = result.rows[0]?.booking_count || 1;
            
            const data = result.rows.map(pkg => ({
                name: pkg.package_name,
                percentage: Math.round((pkg.booking_count / maxBookings) * 100),
                imageUrl: pkg.image_url
            }));

            return commonHelper.success(res, data, 'Get top packages successful');
        } catch (error) {
            console.error('getTopPackages error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getBookingStatus: async (req, res) => {
        try {
            const result = await AdminModel.getBookingStatusByContinent();
            
            const data = {
                asia: 0,
                eropa: 0,
                australia: 0,
                afrika: 0
            };

            result.rows.forEach(row => {
                const continent = row.continent?.toLowerCase();
                const count = parseInt(row.booking_count) || 0;
                
                if (continent === 'asia') data.asia = count;
                else if (continent === 'eropa' || continent === 'europe') data.eropa = count;
                else if (continent === 'australia') data.australia = count;
                else if (continent === 'afrika' || continent === 'africa') data.afrika = count;
            });

            return commonHelper.success(res, data, 'Get booking status successful');
        } catch (error) {
            console.error('getBookingStatus error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getTopBuyers: async (req, res) => {
        try {
            const result = await AdminModel.getTopBuyers(PAGINATION.TOP_BUYERS_LIMIT);
            
            const data = result.rows.map(buyer => ({
                nama: buyer.full_name,
                totalBooking: parseInt(buyer.total_bookings) || 0,
                totalUlasan: parseInt(buyer.total_reviews) || 0,
                profileImage: buyer.avatar_url
            }));

            return commonHelper.success(res, data, 'Get top buyers successful');
        } catch (error) {
            console.error('getTopBuyers error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const search = req.query.search?.trim();
            const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit) || PAGINATION.USER_LIST_LIMIT;
            const offset = (page - 1) * limit;

            let users, countResult;

            if (search) {
                users = await AdminModel.searchUsers(search, limit, offset);
                countResult = await AdminModel.countSearchUsers(search);
            } else {
                users = await AdminModel.getAllUsers(limit, offset);
                countResult = await AdminModel.countAllUsers();
            }

            const total = parseInt(countResult.rows[0].count);

            const data = users.rows.map(user => ({
                id: user.id,
                namaLengkap: user.full_name,
                email: user.email,
                telepon: user.phone_number,
                password: '******', 
                tanggalDaftar: new Date(user.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).replace(',', '')
            }));

            return commonHelper.paginated(res, data, {
                page,
                limit,
                total_items: total,
                total_pages: Math.ceil(total / limit)
            }, 'Get users successful');
        } catch (error) {
            console.error('getAllUsers error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getUserDetail: async (req, res) => {
        try {
            const { id } = req.params;
            ValidationHelper.validateUUID(id, 'User ID');

            const result = await AdminModel.getUserById(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
            }

            const user = result.rows[0];

            return commonHelper.success(res, {
                id: user.id,
                namaLengkap: user.full_name,
                email: user.email,
                password: '******',
                nomorTelepon: user.phone_number
            }, 'Get user successful');
        } catch (error) {
            console.error('getUserDetail error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    createUser: async (req, res) => {
        try {
            const { namaLengkap, email, password, nomorTelepon } = req.body;

            const validatedEmail = ValidationHelper.validateEmail(email);
            const validatedName = ValidationHelper.validateString(namaLengkap, 'Nama lengkap', 2, 100);
            const validatedPassword = ValidationHelper.validatePassword(password);
            const validatedPhone = ValidationHelper.validatePhoneNumber(nomorTelepon, false);

            const existing = await pool.query('SELECT id FROM users WHERE email = $1', [validatedEmail]);
            if (existing.rows.length > 0) {
                return commonHelper.badRequest(res, ERROR_MESSAGES.USER_ALREADY_EXISTS);
            }

            const hashedPassword = await bcrypt.hash(validatedPassword, 10);

            const userData = {
                id: uuidv4(),
                full_name: validatedName,
                email: validatedEmail,
                password: hashedPassword,
                phone_number: validatedPhone,
                role: 'user'
            };

            await AdminModel.createUser(userData);

            return commonHelper.created(res, { userId: userData.id }, SUCCESS_MESSAGES.USER_CREATED);
        } catch (error) {
            console.error('createUser error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { namaLengkap, email, password, nomorTelepon } = req.body;

            ValidationHelper.validateUUID(id, 'User ID');

            const updateData = {};

            if (namaLengkap) {
                updateData.full_name = ValidationHelper.validateString(namaLengkap, 'Nama lengkap', 2, 100, false);
            }
            if (email) {
                updateData.email = ValidationHelper.validateEmail(email);
            }
            if (password) {
                const validatedPassword = ValidationHelper.validatePassword(password, 'Password', false);
                updateData.password = await bcrypt.hash(validatedPassword, 10);
            }
            if (nomorTelepon) {
                updateData.phone_number = ValidationHelper.validatePhoneNumber(nomorTelepon, false);
            }

            if (Object.keys(updateData).length === 0) {
                return commonHelper.badRequest(res, 'Tidak ada data yang diupdate');
            }

            const result = await AdminModel.updateUser(id, updateData);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
            }

            return commonHelper.success(res, null, SUCCESS_MESSAGES.USER_UPDATED);
        } catch (error) {
            console.error('updateUser error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            ValidationHelper.validateUUID(id, 'User ID');

            const result = await AdminModel.deleteUser(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
            }

            return commonHelper.success(res, null, SUCCESS_MESSAGES.USER_DELETED);
        } catch (error) {
            console.error('deleteUser error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getAllPackages: async (req, res) => {
        try {
            const search = req.query.search?.trim();
            const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit) || PAGINATION.PACKAGE_LIST_LIMIT;
            const offset = (page - 1) * limit;

            let packages, countResult;

            if (search) {
                packages = await AdminModel.searchPackages(search, limit, offset);
                countResult = await AdminModel.countSearchPackages(search);
            } else {
                packages = await AdminModel.getAllPackages(limit, offset);
                countResult = await AdminModel.countAllPackages();
            }

            const total = parseInt(countResult.rows[0].count);

            const data = packages.rows.map(pkg => ({
                id: pkg.id,
                namaPaket: pkg.name,
                lokasi: pkg.location,
                keberangkatan: pkg.periode ? new Date(pkg.periode).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
                maskapai: pkg.maskapai,
                harga: parseFloat(pkg.harga)
            }));

            return commonHelper.paginated(res, data, {
                page,
                limit,
                total_items: total,
                total_pages: Math.ceil(total / limit)
            }, 'Get packages successful');
        } catch (error) {
            console.error('getAllPackages error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getPackageDetail: async (req, res) => {
        try {
            const { id } = req.params;
            ValidationHelper.validateUUID(id, 'Package ID');

            const result = await AdminModel.getPackageById(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.PACKAGE_NOT_FOUND);
            }

            const pkg = result.rows[0];

            return commonHelper.success(res, {
                name: pkg.name,
                location: pkg.location,
                benua: pkg.benua || 'Asia',
                maskapai: pkg.maskapai,
                bandara: pkg.bandara,
                periode: pkg.periode ? new Date(pkg.periode).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) : null,
                harga: parseFloat(pkg.harga),
                imageUrl: pkg.image,
                itinerary: pkg.itinerary || {}
            }, 'Get package successful');
        } catch (error) {
            console.error('getPackageDetail error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    createPackage: async (req, res) => {
        try {
            const { name, location, benua, maskapai, bandara, periode, harga, itinerary } = req.body;

            if (!name || !harga) {
                return commonHelper.badRequest(res, ERROR_MESSAGES.PACKAGE_REQUIRED_FIELDS);
            }

            const image = req.file ? req.file.path : null;

            const packageData = {
                id: uuidv4(),
                name: name,
                location: location || null,
                benua: benua || 'Asia',
                image: image,
                periode: periode || null,
                harga: parseFloat(harga),
                duration: 5, 
                itinerary: itinerary || null,
                maskapai: maskapai || null,
                bandara: bandara || null
            };

            await AdminModel.createPackage(packageData);

            return commonHelper.created(res, { packageId: packageData.id }, SUCCESS_MESSAGES.PACKAGE_CREATED);
        } catch (error) {
            console.error('createPackage error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updatePackage: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, location, benua, maskapai, bandara, periode, harga, itinerary } = req.body;
            
            console.log('=== DEBUG UPDATE START ===');
            console.log('Package ID:', id);
            console.log('req.body:', req.body);
            console.log('req.file:', req.file);
            console.log('Destructured values:', { name, location, benua, maskapai, bandara, periode, harga });
            
            ValidationHelper.validateUUID(id, 'Package ID');
            
            if (Object.keys(req.body).length === 0 && !req.file) {
                return commonHelper.badRequest(res, 'Tidak ada data yang diupdate');
            }
            
            const checkResult = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
            
            if (checkResult.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.PACKAGE_NOT_FOUND);
            }
            
            const oldPackage = checkResult.rows[0];
            console.log('Old package data:', oldPackage);
            
            const updateData = {};
            
            if (name) updateData.name = name;
            if (location) updateData.location = location;
            if (benua) updateData.benua = benua;
            if (maskapai) updateData.maskapai = maskapai;
            if (bandara) updateData.bandara = bandara;
            if (periode) updateData.periode = periode;
            if (harga) updateData.harga = parseFloat(harga);
            if (itinerary) updateData.itinerary = itinerary;
            
            console.log('updateData object:', updateData);
            console.log('updateData keys:', Object.keys(updateData));
            
            if (req.file) {
                updateData.image = req.file.path;
                if (oldPackage.image) {
                    try {
                        const urlParts = oldPackage.image.split('/');
                        const filename = urlParts[urlParts.length - 1];
                        const publicId = `${CLOUDINARY_FOLDERS.PACKAGE_IMAGES}/${filename.split('.')[0]}`;
                        await cloudinary.uploader.destroy(publicId);
                    } catch (cloudinaryError) {
                        console.error('Cloudinary delete error:', cloudinaryError);
                    }
                }
            }
            
            console.log('Calling AdminModel.updatePackage with:', { id, updateData });
            const result = await AdminModel.updatePackage(id, updateData);
            console.log('Update result:', result.rows[0]);
            
            const pkg = result.rows[0];
            
            const responseData = {
                id: pkg.id,
                namaPaket: pkg.name,
                lokasi: pkg.location,
                keberangkatan: pkg.periode ? new Date(pkg.periode).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
                maskapai: pkg.maskapai,
                harga: parseFloat(pkg.harga)
            };
            
            console.log('Response data:', responseData);
            console.log('=== DEBUG UPDATE END ===');
            
            return commonHelper.success(res, responseData, SUCCESS_MESSAGES.PACKAGE_UPDATED);
        } catch (error) {
            console.error('updatePackage error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    deletePackage: async (req, res) => {
        try {
            const { id } = req.params;
            ValidationHelper.validateUUID(id, 'Package ID');

            const checkResult = await pool.query('SELECT image FROM packages WHERE id = $1', [id]);

            if (checkResult.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.PACKAGE_NOT_FOUND);
            }

            const deletedPackage = checkResult.rows[0];

            await AdminModel.deletePackage(id);

            if (deletedPackage.image) {
                try {
                    const urlParts = deletedPackage.image.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = `${CLOUDINARY_FOLDERS.PACKAGE_IMAGES}/${filename.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.error('Cloudinary delete error:', cloudinaryError);
                }
            }

            return commonHelper.success(res, null, SUCCESS_MESSAGES.PACKAGE_DELETED);
        } catch (error) {
            console.error('deletePackage error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getAllArticles: async (req, res) => {
        try {
            const search = req.query.search?.trim();
            const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit) || PAGINATION.ARTICLE_LIST_LIMIT;
            const offset = (page - 1) * limit;

            let articles, countResult;

            if (search) {
                articles = await AdminModel.searchArticles(search, limit, offset);
                countResult = await AdminModel.countSearchArticles(search);
            } else {
                articles = await AdminModel.getAllArticles(limit, offset);
                countResult = await AdminModel.countAllArticles();
            }

            const total = parseInt(countResult.rows[0].count);

            const data = articles.rows.map(article => ({
                id: article.id,
                judul: article.title,
                tanggalTerbit: new Date(article.published_at || article.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).replace(' pukul', ','),
                status: article.is_published ? 'Selesai' : 'Draft'
            }));

            return commonHelper.paginated(res, data, {
                page,
                limit,
                total_items: total,
                total_pages: Math.ceil(total / limit)
            }, 'Get articles successful');
        } catch (error) {
            console.error('getAllArticles error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getArticleDetail: async (req, res) => {
        try {
            const { id } = req.params;
            ValidationHelper.validateUUID(id, 'Article ID');

            const result = await AdminModel.getArticleById(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ARTICLE_NOT_FOUND);
            }

            const article = result.rows[0];

            return commonHelper.success(res, {
                judul: article.title,
                tanggal: new Date(article.published_at || article.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }),
                content: article.content,
                imageUrl: article.cover_image_url
            }, 'Get article successful');
        } catch (error) {
            console.error('getArticleDetail error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    createArticle: async (req, res) => {
        try {
            const { judul, tanggal, content } = req.body;
            const image = req.file ? req.file.path : null;

            const validatedTitle = ValidationHelper.validateString(judul, 'Judul', 3, 255);
            const validatedContent = ValidationHelper.validateString(content, 'Content', 10, 50000);

            const articleData = {
                id: uuidv4(),
                title: validatedTitle,
                content: validatedContent,
                cover_image_url: image,
                published_at: tanggal || null,
                is_published: false
            };

            const result = await AdminModel.createArticle(articleData);

            return commonHelper.created(res, { articleId: result.rows[0].id }, SUCCESS_MESSAGES.ARTICLE_CREATED);
        } catch (error) {
            console.error('createArticle error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updateArticle: async (req, res) => {
        try {
            const { id } = req.params;
            const { judul, tanggal, content } = req.body;

            ValidationHelper.validateUUID(id, 'Article ID');

            const updateData = {};

            if (judul) updateData.title = ValidationHelper.validateString(judul, 'Judul', 3, 255, false);
            if (content) updateData.content = ValidationHelper.validateString(content, 'Content', 10, 50000, false);
            if (tanggal) updateData.published_at = tanggal;
            if (req.file) updateData.cover_image_url = req.file.path;

            if (Object.keys(updateData).length === 0) {
                return commonHelper.badRequest(res, 'Tidak ada data yang diupdate');
            }

            const result = await AdminModel.updateArticle(id, updateData);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ARTICLE_NOT_FOUND);
            }

            return commonHelper.success(res, null, SUCCESS_MESSAGES.ARTICLE_UPDATED);
        } catch (error) {
            console.error('updateArticle error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    deleteArticle: async (req, res) => {
        try {
            const { id } = req.params;
            ValidationHelper.validateUUID(id, 'Article ID');

            const result = await AdminModel.deleteArticle(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ARTICLE_NOT_FOUND);
            }

            return commonHelper.success(res, null, SUCCESS_MESSAGES.ARTICLE_DELETED);
        } catch (error) {
            console.error('deleteArticle error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    togglePublish: async (req, res) => {
        try {
            const { id } = req.params;
            ValidationHelper.validateUUID(id, 'Article ID');

            const result = await AdminModel.toggleArticlePublish(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ARTICLE_NOT_FOUND);
            }

            const message = result.rows[0].is_published ? SUCCESS_MESSAGES.ARTICLE_PUBLISHED : SUCCESS_MESSAGES.ARTICLE_UNPUBLISHED;

            return commonHelper.success(res, null, message);
        } catch (error) {
            console.error('togglePublish error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getAllOrders: async (req, res) => {
        try {
            const search = req.query.search?.trim();
            const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit) || PAGINATION.ORDER_LIST_LIMIT;
            const offset = (page - 1) * limit;

            let orders, countResult;

            if (search) {
                orders = await AdminModel.searchOrders(search, limit, offset);
                countResult = await AdminModel.countSearchOrders(search);
            } else {
                orders = await AdminModel.getAllOrders(limit, offset);
                countResult = await AdminModel.countAllOrders();
            }

            const total = parseInt(countResult.rows[0].count);

            const data = orders.rows.map(order => ({
                tourId: order.booking_code,
                namaLengkap: order.full_name,
                namaPaket: order.package_name,
                tanggal: new Date(order.booking_date).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).replace(',', ''),
                status: CONSTANTS.READABLE_STATUS[order.payment_status?.toUpperCase()] || order.payment_status,
                pembayaran: parseFloat(order.total_price)
            }));

            return commonHelper.paginated(res, data, {
                page,
                limit,
                total_items: total,
                total_pages: Math.ceil(total / limit)
            }, 'Get orders successful');
        } catch (error) {
            console.error('getAllOrders error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updateOrderStatus: async (req, res) => {
        try {
            const { booking_id } = req.params;
            const { status } = req.body;

            ValidationHelper.validateUUID(booking_id, 'Booking ID');
            const validatedStatus = ValidationHelper.validateEnum(
                status,
                Object.values(CONSTANTS.BOOKING_STATUS),
                'Status'
            );

            const result = await AdminModel.updateOrderStatus(booking_id, validatedStatus);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ORDER_NOT_FOUND);
            }

            return commonHelper.success(res, null, SUCCESS_MESSAGES.ORDER_UPDATED);
        } catch (error) {
            console.error('updateOrderStatus error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updatePaymentStatus: async (req, res) => {
        try {
            const { booking_id } = req.params;
            const { payment_status } = req.body;

            ValidationHelper.validateUUID(booking_id, 'Booking ID');
            const validatedStatus = ValidationHelper.validateEnum(
                payment_status,
                Object.values(CONSTANTS.PAYMENT_STATUS),
                'Payment status'
            );

            const result = await AdminModel.updatePaymentStatus(booking_id, validatedStatus);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ORDER_NOT_FOUND);
            }

            return commonHelper.success(res, null, SUCCESS_MESSAGES.PAYMENT_UPDATED);
        } catch (error) {
            console.error('updatePaymentStatus error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getAdminProfile: async (req, res) => {
        try {
            const adminId = req.user.id;

            const result = await AdminModel.getAdminById(adminId);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ADMIN_NOT_FOUND);
            }

            const admin = result.rows[0];

            return commonHelper.success(res, {
                nama: admin.full_name,
                email: admin.email,
                noTelepon: admin.phone_number,
                profileImage: admin.avatar_url
            }, 'Get profile successful');
        } catch (error) {
            console.error('getAdminProfile error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updateAdminProfile: async (req, res) => {
        try {
            const adminId = req.user.id;
            const { nama, email, noTelepon, password } = req.body;

            const updateData = {};

            if (nama) updateData.full_name = ValidationHelper.validateString(nama, 'Nama', 2, 100, false);
            if (email) updateData.email = ValidationHelper.validateEmail(email);
            if (noTelepon) updateData.phone_number = ValidationHelper.validatePhoneNumber(noTelepon, false);
            if (password) {
                const validatedPassword = ValidationHelper.validatePassword(password, 'Password', false);
                updateData.password = await bcrypt.hash(validatedPassword, 10);
            }

            if (Object.keys(updateData).length === 0) {
                return commonHelper.badRequest(res, 'Tidak ada data yang diupdate');
            }

            const result = await AdminModel.updateAdmin(adminId, updateData);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ADMIN_NOT_FOUND);
            }

            const admin = result.rows[0];

            return commonHelper.success(res, {
                nama: admin.full_name,
                email: admin.email,
                noTelepon: admin.phone_number,
                profileImage: admin.avatar_url
            }, SUCCESS_MESSAGES.PROFILE_UPDATED);
        } catch (error) {
            console.error('updateAdminProfile error:', error);
            if (error instanceof ValidationError) {
                return commonHelper.badRequest(res, error.message);
            }
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    uploadAdminPhoto: async (req, res) => {
        try {
            const adminId = req.user.id;

            if (!req.file) {
                return commonHelper.badRequest(res, 'File foto wajib diupload');
            }

            const avatarUrl = req.file.path;

            const oldAdmin = await AdminModel.getAdminById(adminId);
            if (oldAdmin.rows[0]?.avatar_url) {
                try {
                    const urlParts = oldAdmin.rows[0].avatar_url.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = `${CLOUDINARY_FOLDERS.USER_AVATARS}/${filename.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.error('Cloudinary delete error:', cloudinaryError);
                }
            }

            const result = await AdminModel.updateAdmin(adminId, { avatar_url: avatarUrl });

            return commonHelper.success(res, {
                profileImage: result.rows[0].avatar_url
            }, SUCCESS_MESSAGES.PHOTO_UPLOADED);
        } catch (error) {
            console.error('uploadAdminPhoto error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    deleteAdminPhoto: async (req, res) => {
        try {
            const adminId = req.user.id;

            const admin = await AdminModel.getAdminById(adminId);

            if (admin.rows[0]?.avatar_url) {
                try {
                    const urlParts = admin.rows[0].avatar_url.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = `${CLOUDINARY_FOLDERS.USER_AVATARS}/${filename.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.error('Cloudinary delete error:', cloudinaryError);
                }
            }

            await AdminModel.updateAdmin(adminId, { avatar_url: null });

            return commonHelper.success(res, null, SUCCESS_MESSAGES.PHOTO_DELETED);
        } catch (error) {
            console.error('deleteAdminPhoto error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },


};


module.exports = AdminController;