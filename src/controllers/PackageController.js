const PackageModel = require('../models/PackageModel');
const commonHelper = require('../helpers/common');

const PackageController = {
    getAll: async (req, res) => {
        try {
            const { location, search, month, featured, limit = 10, offset = 0 } = req.query;
            
            const filters = {
                location,
                search,
                month,
                featured: featured === 'true',
                limit: parseInt(limit),
                offset: parseInt(offset)
            };
            
            const result = await PackageModel.getAll(filters);
            
            return commonHelper.success(res, result.rows);
        } catch (error) {
            console.error('getAll error:', error);
            return commonHelper.error(res, 'Server error', 500);
        }
    },

        getPackageDetail: async (req, res) => {
        try {
            const { id } = req.params;
            
            const result = await PackageModel.findById(id);
            
            if (result.rows.length === 0) {
                return commonHelper.notFound(res, 'Package not found');
            }
            
            const pkg = result.rows[0];
            const durasi = `${pkg.duration} Hari ${pkg.duration - 1} Malam`;
            
            return commonHelper.success(res, {
                name: pkg.name,
                location: pkg.location,
                durasi: durasi,
                periodeKeberangkatan: pkg.periode ? new Date(pkg.periode).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) : null,
                maskapai: pkg.maskapai,
                bandara: pkg.bandara,
                harga: parseFloat(pkg.harga),
                image: pkg.image,
                itinerary: pkg.itinerary || []
            });
        } catch (error) {
            console.error('getPackageDetail error:', error);
            return commonHelper.error(res, 'Server error', 500);
        }
    },
}

module.exports = PackageController;