const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const AdminModel = require('../models/AdminModel');
const commonHelper = require('../helpers/common');
const cloudinary = require('../config/cloudinary');
const TransactionHelper = require('../helpers/transactionHelper');
const { ValidationHelper, ValidationError } = require('../helpers/validation');
const { 
    CONSTANTS, 
    SUCCESS_MESSAGES, 
    ERROR_MESSAGES, 
    HTTP_STATUS, 
    PG_ERROR_CODES,
    PAGINATION,
    CLOUDINARY_FOLDERS
} = require('../config/constants');
const pool = require('../config/db');


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
            console.error('getDashboardStats error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getTopPackages: async (req, res) => {
        try {
            const limit = 3;
            const result = await AdminModel.getTopPackages(limit);
            
            const data = result.rows.map(row => ({
                id: row.id,
                name: row.name,
                imageUrl: row.image_url,
                percentage: parseInt(row.percentage) || 0
            }));
            
            return commonHelper.success(res, data);
        } catch (error) {
            console.error('getTopPackages error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getTopBuyers: async (req, res) => {
        try {
            
            const limit = 6;
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
            console.error('getTopBuyers error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
            console.error('getBookingStatus error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getRecentBookings: async (req, res) => {
        try {
            const limit = 3;
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
            console.error('getRecentBookings error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },
    
    getAllUsers: async (req, res) => {
        try {
            const { search } = req.query; 
            const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit) || PAGINATION.USER_LIST_LIMIT;
            const offset = (page - 1) * limit;

            let users, total;

            if (search && search.trim() !== '') {
                const searchQuery = search.trim();
                users = await AdminModel.searchUsers(searchQuery);
                total = users.rows.length;

                if (users.rows.length === 0) {
                    return commonHelper.success(res, [], `Tidak ada user dengan nama "${searchQuery}"`);
                }
            } else {
                users = await AdminModel.getAllUsers(limit, offset);
                const countResult = await AdminModel.countAllUsers();
                total = parseInt(countResult.rows[0].count);
            }

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
            console.error('getAllUsers error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getUserDetail: async (req, res) => {
        try {
            const { id } = req.params;

            try {
                ValidationHelper.validateUUID(id, 'User ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const result = await AdminModel.getUserById(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
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
            console.error('getUserDetail error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    createUser: async (req, res) => {
        try {
            const { fullname, email, phone_number, password, role } = req.body;

            let validatedData = {};

            try {
                validatedData.fullname = ValidationHelper.validateString(fullname, 'Nama lengkap', 2, 100);
                validatedData.email = ValidationHelper.validateEmail(email);
                validatedData.phone_number = ValidationHelper.validatePhoneNumber(phone_number, false);
                validatedData.password = ValidationHelper.validatePassword(password);
                
                if (role) {
                    validatedData.role = ValidationHelper.validateEnum(
                        role, 
                        [CONSTANTS.ROLES.USER, CONSTANTS.ROLES.ADMIN], 
                        'Role'
                    );
                }
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const hashedPassword = await bcrypt.hash(validatedData.password, 10);
            
            const userData = {
                id: uuidv4(),
                fullname: validatedData.fullname,
                email: validatedData.email,
                phone_number: validatedData.phone_number,
                password: hashedPassword,
                role: validatedData.role || CONSTANTS.ROLES.USER
            };

            const result = await AdminModel.createUser(userData);
            const user = result.rows[0];

            return commonHelper.created(res, {
                id: user.id,
                namaLengkap: user.full_name,
                email: user.email,
                telepon: user.phone_number,
                role: user.role,
                tanggalDaftar: user.created_at
            }, SUCCESS_MESSAGES.USER_CREATED);
        } catch (error) {
            console.error('createUser error:', error);
            
            if (error.code === PG_ERROR_CODES.UNIQUE_VIOLATION) {
                return commonHelper.badRequest(res, ERROR_MESSAGES.USER_ALREADY_EXISTS);
            }
            
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { fullname, email, phone_number, password } = req.body;

            try {
                ValidationHelper.validateUUID(id, 'User ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            let userData = {};

            try {
                if (fullname) {
                    userData.fullname = ValidationHelper.validateString(fullname, 'Nama lengkap', 2, 100, false);
                }
                if (email) {
                    userData.email = ValidationHelper.validateEmail(email);
                }
                if (phone_number) {
                    userData.phone_number = ValidationHelper.validatePhoneNumber(phone_number, false);
                }
                if (password) {
                    const validatedPassword = ValidationHelper.validatePassword(password, 'Password', false);
                    if (validatedPassword) {
                        userData.password = await bcrypt.hash(validatedPassword, 10);
                    }
                }
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            if (Object.keys(userData).length === 0) {
                return commonHelper.badRequest(res, 'Tidak ada data yang diupdate');
            }

            const result = await AdminModel.updateUser(id, userData);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
            }

            const user = result.rows[0];
            return commonHelper.success(res, {
                id: user.id,
                namaLengkap: user.full_name,
                email: user.email,
                telepon: user.phone_number,
                role: user.role
            }, SUCCESS_MESSAGES.USER_UPDATED);
        } catch (error) {
            console.error('updateUser error:', error);
            
            if (error.code === PG_ERROR_CODES.UNIQUE_VIOLATION) {
                return commonHelper.badRequest(res, ERROR_MESSAGES.USER_ALREADY_EXISTS);
            }
            
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            try {
                ValidationHelper.validateUUID(id, 'User ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const result = await TransactionHelper.safeDelete('users', id, [
                {
                    table: 'bookings',
                    foreignKey: 'user_id',
                    errorMessage: 'Tidak dapat menghapus user yang memiliki booking aktif. Hapus booking terlebih dahulu.'
                },
                {
                    table: 'reviews',
                    foreignKey: 'user_id',
                    errorMessage: 'Tidak dapat menghapus user yang memiliki review. Hapus review terlebih dahulu.'
                }
            ]);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
            }

            return commonHelper.success(res, null, SUCCESS_MESSAGES.USER_DELETED);
        } catch (error) {
            console.error('deleteUser error:', error);
            
            if (error.message.includes('Tidak dapat menghapus')) {
                return commonHelper.badRequest(res, error.message);
            }
            
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    
    getAllPackages: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit) || PAGINATION.PACKAGE_LIST_LIMIT;
            const offset = (page - 1) * limit;
            const search = req.query.search?.trim();

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
                name: pkg.name,
                location: pkg.location,
                periode: pkg.periode,
                maskapai: pkg.maskapai,
                harga: parseFloat(pkg.harga)
            }));

            return commonHelper.success(res, data, {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.error('getAllPackages error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    searchPackages: async (req, res) => {
        try {
            const { search } = req.query;

            if (!search || search.trim() === '') {
                return commonHelper.badRequest(res, ERROR_MESSAGES.SEARCH_QUERY_REQUIRED);
            }

            const result = await AdminModel.searchPackages(search.trim());

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
            console.error('searchPackages error:', error);
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
                duration: pkg.duration,
                periode: pkg.periode,
                maskapai: pkg.maskapai,
                bandara: pkg.bandara,
                harga: parseFloat(pkg.harga),
                image: pkg.image,
                itinerary: pkg.itinerary || []
            });
        } catch (error) {
            console.error('getPackageDetail error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    createPackage: async (req, res) => {
        try {
            const { 
                name, 
                location, 
                duration, 
                periode, 
                maskapai, 
                bandara, 
                harga,
                itinerary
            } = req.body;

            let validatedData = {};

            try {
                validatedData.name = ValidationHelper.validateString(name, 'Nama paket', 3, 255);
                validatedData.harga = ValidationHelper.validatePrice(harga);
                
                if (location) {
                    validatedData.location = ValidationHelper.validateString(location, 'Lokasi', 2, 255, false);
                }
                
                if (periode) {
                    validatedData.periode = ValidationHelper.validateDate(periode, 'Periode', false);
                }
                
                if (duration) {
                    validatedData.duration = ValidationHelper.validatePositiveInteger(
                        duration, 
                        'Durasi', 
                        1, 
                        365
                    );
                }
                
                if (itinerary) {
                    validatedData.itinerary = ValidationHelper.validateItinerary(itinerary);
                }

                if (maskapai) {
                    validatedData.maskapai = ValidationHelper.validateString(maskapai, 'Maskapai', 2, 100, false);
                }

                if (bandara) {
                    validatedData.bandara = ValidationHelper.validateString(bandara, 'Bandara', 3, 100, false);
                }
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const image = req.file ? req.file.path : null;

            const packageData = {
                id: uuidv4(),
                name: validatedData.name,
                location: validatedData.location || null,
                image: image,
                periode: validatedData.periode || null,
                harga: validatedData.harga,
                duration: validatedData.duration || 5,
                itinerary: validatedData.itinerary ? JSON.stringify(validatedData.itinerary) : null,
                maskapai: validatedData.maskapai || null,
                bandara: validatedData.bandara || null
            };

            const result = await AdminModel.createPackage(packageData);

            const response = {
                name: result.rows[0].name,
                location: result.rows[0].location,
                duration: result.rows[0].duration,
                periode: result.rows[0].periode,
                maskapai: result.rows[0].maskapai,
                bandara: result.rows[0].bandara,
                harga: parseFloat(result.rows[0].harga),
                image: result.rows[0].image,
                itinerary: result.rows[0].itinerary || null
            };

            return commonHelper.created(res, response, SUCCESS_MESSAGES.PACKAGE_CREATED);
        } catch (error) {
            console.error('createPackage error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updatePackage: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, location, duration, periode, maskapai, bandara, harga, itinerary } = req.body;

            if (Object.keys(req.body).length === 0 && !req.file) {
                return commonHelper.badRequest(res, 'Tidak ada data yang diupdate');
            }

            const checkResult = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
            
            if (checkResult.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.PACKAGE_NOT_FOUND);
            }

            const oldPackage = checkResult.rows[0];
            const updateData = {};

            if (name) updateData.name = name;
            if (location) updateData.location = location;
            if (duration) updateData.duration = parseInt(duration);
            if (periode) updateData.periode = periode;
            if (maskapai) updateData.maskapai = maskapai;
            if (bandara) updateData.bandara = bandara;
            if (harga) updateData.harga = parseFloat(harga);
            if (itinerary) updateData.itinerary = itinerary;

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

            const result = await AdminModel.updatePackage(id, updateData);

            const response = {
                name: result.rows[0].name,
                location: result.rows[0].location,
                duration: result.rows[0].duration,
                periode: result.rows[0].periode,
                maskapai: result.rows[0].maskapai,
                bandara: result.rows[0].bandara,
                harga: parseFloat(result.rows[0].harga),
                image: result.rows[0].image,
                itinerary: result.rows[0].itinerary || []
            };

            return commonHelper.success(res, response, SUCCESS_MESSAGES.PACKAGE_UPDATED);
        } catch (error) {
            console.error('updatePackage error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    deletePackage: async (req, res) => {
        try {
            const { id } = req.params;

            try {
                ValidationHelper.validateUUID(id, 'Package ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

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
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    
    getAllArticles: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit) || PAGINATION.ARTICLE_LIST_LIMIT;
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
            console.error('getAllArticles error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    searchArticles: async (req, res) => {
        try {
            const { search } = req.query;

            if (!search || search.trim() === '') {
                return commonHelper.badRequest(res, ERROR_MESSAGES.SEARCH_QUERY_REQUIRED);
            }

            const result = await AdminModel.searchArticles(search.trim());

            const data = result.rows.map(article => ({
                displayId: article.display_id,
                id: article.id,
                judulArtikel: article.title,
                tanggalTerbit: article.created_at,
                status: article.status
            }));

            return commonHelper.success(res, data);
        } catch (error) {
            console.error('searchArticles error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getArticleDetail: async (req, res) => {
        try {
            const { id } = req.params;

            try {
                ValidationHelper.validateUUID(id, 'Article ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const result = await AdminModel.getArticleById(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ARTICLE_NOT_FOUND);
            }

            const article = result.rows[0];
            return commonHelper.success(res, {
                id: article.id,
                judulArtikel: article.title,
                tanggal: article.created_at,
                isiArtikel: article.content
            });
        } catch (error) {
            console.error('getArticleDetail error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    createArticle: async (req, res) => {
        try {
            const { title, tanggal, content } = req.body;
            
            if (!title || title.trim().length < 3) {
                return commonHelper.badRequest(res, 'Judul artikel minimal 3 karakter');
            }
            
            if (!content || content.trim().length < 10) {
                return commonHelper.badRequest(res, 'Isi artikel minimal 10 karakter');
            }
            
            const slug = title.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            
            const articleData = {
                id: uuidv4(),
                author_id: req.user.id,
                title: title.trim(),
                slug,
                published_at: tanggal || null,
                content,
                is_published: false
            };
            
            const result = await AdminModel.createArticle(articleData);
            
            return commonHelper.created(res, {
                id: result.rows[0].id,
                title: result.rows[0].title,
                slug: result.rows[0].slug,
                tanggal: result.rows[0].published_at,
                isPublished: result.rows[0].is_published
            }, 'Artikel berhasil dibuat');
        } catch (error) {
            console.error('createArticle error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updateArticle: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, category, cover_image_url, content, excerpt, tags, is_published } = req.body;

            try {
                ValidationHelper.validateUUID(id, 'Article ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            let validatedData = {};

            try {
                if (title) {
                    validatedData.title = ValidationHelper.validateString(title, 'Judul artikel', 3, 255, false);
                    validatedData.slug = validatedData.title.toLowerCase().replace(/\s+/g, '-');
                }
                if (content) {
                    validatedData.content = ValidationHelper.validateString(
                        content, 
                        'Isi artikel', 
                        10, 
                        CONSTANTS.VALIDATION.CONTENT_MAX_LENGTH, 
                        false
                    );
                }
                if (category) {
                    validatedData.category = ValidationHelper.validateString(category, 'Kategori', 2, 100, false);
                }
                if (excerpt) {
                    validatedData.excerpt = ValidationHelper.validateString(
                        excerpt, 
                        'Excerpt', 
                        10, 
                        CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH, 
                        false
                    );
                }
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const articleData = {
                ...validatedData,
                cover_image_url,
                tags,
                is_published
            };

            const result = await AdminModel.updateArticle(id, articleData);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ARTICLE_NOT_FOUND);
            }

            return commonHelper.success(res, result.rows[0], SUCCESS_MESSAGES.ARTICLE_UPDATED);
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

            try {
                ValidationHelper.validateUUID(id, 'Article ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const result = await TransactionHelper.executeTransaction(async (client) => {
                const deleteResult = await client.query(
                    'DELETE FROM articles WHERE id = $1 RETURNING *',
                    [id]
                );
                return deleteResult;
            });

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ARTICLE_NOT_FOUND);
            }

            return commonHelper.success(res, null, SUCCESS_MESSAGES.ARTICLE_DELETED);
        } catch (error) {
            console.error('deleteArticle error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    togglePublish: async (req, res) => {
        try {
            const { id } = req.params;

            try {
                ValidationHelper.validateUUID(id, 'Article ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const result = await AdminModel.togglePublishArticle(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ARTICLE_NOT_FOUND);
            }

            const message = result.rows[0].is_published 
                ? SUCCESS_MESSAGES.ARTICLE_PUBLISHED
                : SUCCESS_MESSAGES.ARTICLE_UNPUBLISHED;

            return commonHelper.success(res, {
                id: result.rows[0].id,
                isPublished: result.rows[0].is_published
            }, message);
        } catch (error) {
            console.error('togglePublish error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    
    getAllOrders: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit) || PAGINATION.ORDER_LIST_LIMIT;
            const offset = (page - 1) * limit;
            const { status, search } = req.query;

            let validatedStatus = null;
            if (status) {
                try {
                    validatedStatus = ValidationHelper.validateEnum(
                        status, 
                        ['selesai', 'pending', 'cancelled'], 
                        'Status'
                    );
                } catch (validationError) {
                    return commonHelper.badRequest(res, validationError.message);
                }
            }

            const orders = await AdminModel.getAllOrders({ status: validatedStatus, search, limit, offset });
            const countResult = await AdminModel.countAllOrders({ status: validatedStatus, search });
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
            console.error('getAllOrders error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getOrderDetail: async (req, res) => {
        try {
            const { tour_id } = req.params;

            if (!tour_id || tour_id.trim() === '') {
                return commonHelper.badRequest(res, 'Tour ID wajib diisi');
            }

            const result = await AdminModel.getOrderByTourId(tour_id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ORDER_NOT_FOUND);
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
            console.error('getOrderDetail error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updateOrderStatus: async (req, res) => {
        try {
            const { booking_id } = req.params;
            const { status } = req.body;

            try {
                ValidationHelper.validateUUID(booking_id, 'Booking ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            let validatedStatus;
            try {
                validatedStatus = ValidationHelper.validateEnum(
                    status, 
                    [CONSTANTS.BOOKING_STATUS.PENDING, CONSTANTS.BOOKING_STATUS.CONFIRMED, CONSTANTS.BOOKING_STATUS.CANCELLED, CONSTANTS.BOOKING_STATUS.COMPLETED],
                    'Status'
                );
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const result = await TransactionHelper.executeTransaction(async (client) => {
                const updateResult = await client.query(
                    `UPDATE bookings 
                     SET status = $1, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $2 
                     RETURNING *`,
                    [validatedStatus, booking_id]
                );
                return updateResult;
            });

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ORDER_NOT_FOUND);
            }

            return commonHelper.success(res, {
                id: result.rows[0].id,
                status: result.rows[0].status
            }, SUCCESS_MESSAGES.ORDER_UPDATED);
        } catch (error) {
            console.error('updateOrderStatus error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updatePaymentStatus: async (req, res) => {
        try {
            const { booking_id } = req.params;
            const { paymentStatus } = req.body;

            try {
                ValidationHelper.validateUUID(booking_id, 'Booking ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            let validatedStatus;
            try {
                validatedStatus = ValidationHelper.validateEnum(
                    paymentStatus, 
                    [CONSTANTS.PAYMENT_STATUS.UNPAID, CONSTANTS.PAYMENT_STATUS.PAID, CONSTANTS.PAYMENT_STATUS.REFUNDED, CONSTANTS.PAYMENT_STATUS.FAILED],
                    'Payment Status'
                );
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const result = await TransactionHelper.executeTransaction(async (client) => {
                const updateResult = await client.query(
                    `UPDATE bookings 
                     SET payment_status = $1, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $2 
                     RETURNING *`,
                    [validatedStatus, booking_id]
                );
                return updateResult;
            });

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ORDER_NOT_FOUND);
            }

            return commonHelper.success(res, {
                id: result.rows[0].id,
                paymentStatus: result.rows[0].payment_status
            }, SUCCESS_MESSAGES.PAYMENT_UPDATED);
        } catch (error) {
            console.error('updatePaymentStatus error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    
    getAdminProfile: async (req, res) => {
        try {
            const adminId = req.user.id;
            const result = await AdminModel.getAdminProfile(adminId);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, ERROR_MESSAGES.ADMIN_NOT_FOUND);
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
            console.error('getAdminProfile error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    updateAdminProfile: async (req, res) => {
        try {
            const adminId = req.user.id;
            
            const fullname = req.body.fullname || req.body.full_name;
            const email = req.body.email;
            const phoneNumber = req.body.phone_number || req.body.phoneNumber;
            const password = req.body.password;
            
            if (!fullname && !email && !phoneNumber) {
                return commonHelper.error(res, 'Tidak ada data yang diupdate', HTTP_STATUS.BAD_REQUEST);
            }
            
            const updates = [];
            const values = [];
            let paramCount = 1;
            
            if (fullname) {
                updates.push(`full_name = $${paramCount}`);
                values.push(fullname);
                paramCount++;
            }
            
            if (email) {
                updates.push(`email = $${paramCount}`);
                values.push(email);
                paramCount++;
            }
            
            if (phoneNumber) {
                updates.push(`phone_number = $${paramCount}`);
                values.push(phoneNumber);
                paramCount++;
            }

            if (password) {
                updates.push(`password = $${paramCount}`);
                values.push(password);
                paramCount++;
            }
            
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(adminId); 
            
            const query = `
                UPDATE users 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount} AND role = 'admin'
                RETURNING id, full_name, email, phone_number, avatar_url, updated_at
            `;
            
            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                return commonHelper.error(res, 'Admin not found', HTTP_STATUS.NOT_FOUND);
            }
            
            const updated = result.rows[0];
            const data = {
                id: updated.id,
                fullName: updated.full_name,
                email: updated.email,
                phoneNumber: updated.phone_number,
                password: updated.password,
                avatarUrl: updated.avatar_url,
                updatedAt: updated.updated_at
            };
            
            return commonHelper.success(res, data, 'Profile updated successfully');
        } catch (error) {
            console.error('updateAdminProfile error:', error);
            
            if (error.code === '23505') {
                return commonHelper.error(res, 'Email already in use', HTTP_STATUS.BAD_REQUEST);
            }
            
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    uploadAdminPhoto: async (req, res) => {
        try {
            const adminId = req.user.id;
            
            if (!req.file) {
                return commonHelper.badRequest(res, ERROR_MESSAGES.FILE_NOT_FOUND);
            }

            const avatarUrl = req.file.path;

            const currentAdmin = await AdminModel.getAdminProfile(adminId);
            if (currentAdmin.rows.length > 0 && currentAdmin.rows[0].avatar_url) {
                try {
                    const urlParts = currentAdmin.rows[0].avatar_url.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = `${CLOUDINARY_FOLDERS.USER_AVATARS}/${filename.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.error('Cloudinary delete error:', cloudinaryError);
                }
            }

            const result = await AdminModel.updateAdminAvatar(adminId, avatarUrl);

            return commonHelper.success(res, {
                avatarUrl: result.rows[0].avatar_url
            }, SUCCESS_MESSAGES.PHOTO_UPLOADED);
        } catch (error) {
            console.error('uploadAdminPhoto error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    deleteAdminPhoto: async (req, res) => {
        try {
            const adminId = req.user.id;
            
            const result = await TransactionHelper.executeTransaction(async (client) => {
                const currentAdmin = await client.query(
                    'SELECT avatar_url FROM users WHERE id = $1 AND role = $2',
                    [adminId, CONSTANTS.ROLES.ADMIN]
                );
                
                if (currentAdmin.rows.length === 0) {
                    throw new Error('ADMIN_NOT_FOUND');
                }

                const admin = currentAdmin.rows[0];

                if (admin.avatar_url) {
                    try {
                        const urlParts = admin.avatar_url.split('/');
                        const filename = urlParts[urlParts.length - 1];
                        const publicId = `${CLOUDINARY_FOLDERS.USER_AVATARS}/${filename.split('.')[0]}`;
                        await cloudinary.uploader.destroy(publicId);
                    } catch (cloudinaryError) {
                        console.error('Cloudinary delete error:', cloudinaryError);
                    }
                }

                const deleteResult = await client.query(
                    `UPDATE users 
                     SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $1 AND role = $2
                     RETURNING id, avatar_url`,
                    [adminId, CONSTANTS.ROLES.ADMIN]
                );

                return deleteResult;
            });

            return commonHelper.success(res, null, SUCCESS_MESSAGES.PHOTO_DELETED);
        } catch (error) {
            console.error('deleteAdminPhoto error:', error);
            
            if (error.message === 'ADMIN_NOT_FOUND') {
                return commonHelper.notFound(res, ERROR_MESSAGES.ADMIN_NOT_FOUND);
            }
            
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },


    getSalesPerformance: async (req, res) => {
        try {
            const result = await AdminModel.getSalesPerformance();
            return commonHelper.success(res, result.rows);
        } catch (error) {
            console.error('getSalesPerformance error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getAgentPerformance: async (req, res) => {
        try {
            const result = await AdminModel.getAgentPerformance();
            return commonHelper.success(res, result.rows);
        } catch (error) {
            console.error('getAgentPerformance error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getUpcomingTrips: async (req, res) => {
        try {
            const result = await AdminModel.getUpcomingTrips();
            return commonHelper.success(res, result.rows);
        } catch (error) {
            console.error('getUpcomingTrips error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getOrderStats: async (req, res) => {
        try {
            const result = await AdminModel.getOrderStats();
            return commonHelper.success(res, result.rows[0]);
        } catch (error) {
            console.error('getOrderStats error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },


    getAllCommunityPosts: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
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
            console.error('getAllCommunityPosts error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    getCommunityPostDetail: async (req, res) => {
        try {
            const { id } = req.params;

            try {
                ValidationHelper.validateUUID(id, 'Post ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const result = await AdminModel.getCommunityPostById(id);

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Postingan tidak ditemukan');
            }

            return commonHelper.success(res, result.rows[0]);
        } catch (error) {
            console.error('getCommunityPostDetail error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    },

    deleteCommunityPost: async (req, res) => {
        try {
            const { id } = req.params;

            try {
                ValidationHelper.validateUUID(id, 'Post ID');
            } catch (validationError) {
                return commonHelper.badRequest(res, validationError.message);
            }

            const result = await TransactionHelper.executeTransaction(async (client) => {
                const deleteResult = await client.query(
                    'DELETE FROM community_posts WHERE id = $1 RETURNING *',
                    [id]
                );
                return deleteResult;
            });

            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Postingan tidak ditemukan');
            }

            return commonHelper.success(res, null, SUCCESS_MESSAGES.POST_DELETED);
        } catch (error) {
            console.error('deleteCommunityPost error:', error);
            return commonHelper.error(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
};

module.exports = AdminController;