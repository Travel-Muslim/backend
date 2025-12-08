const PackageModel = require('../models/PackageModel');
const commonHelper = require('../helpers/common');

const PackageController = {
    getAll: async (req, res, next) => {
        try {
            const { 
                featured,         
                destination,      
                min_price,        
                max_price,        
                search,           
                page = 1,
                limit = 10
            } = req.query;

            const offset = (page - 1) * limit;

            const { rows } = await PackageModel.findAll({
                featured,
                destination,
                min_price,
                max_price,
                search,
                limit,
                offset
            });

            const { rows: [{ count }] } = await PackageModel.countAll({
                featured,
                destination,
                min_price,
                max_price,
                search
            });

            commonHelper.paginated(res, rows, {
                page: parseInt(page),
                total_pages: Math.ceil(count / limit),
                total_items: parseInt(count),
                per_page: parseInt(limit)
            }, 'Get packages successful');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.params;
            
            const { rows } = await PackageModel.findById(id);

            if (rows.length === 0) {
                return commonHelper.notFound(res, 'Package not found');
            }

            commonHelper.success(res, rows[0], 'Get package successful');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    }
};

module.exports = PackageController;