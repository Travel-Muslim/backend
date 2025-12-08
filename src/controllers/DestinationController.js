const DestinationModel = require('../models/DestinationModel');
const commonHelper = require('../helpers/common');

const DestinationController = {
    getAll: async (req, res, next) => {
        try {
            const { 
                search,           
                category,         
                halal = 'true',   
                page = 1,
                limit = 10
            } = req.query;

            const offset = (page - 1) * limit;

            const { rows } = await DestinationModel.findAll({
                search,
                category,
                halal,
                limit,
                offset
            });

            const { rows: [{ count }] } = await DestinationModel.countAll({
                search,
                category,
                halal
            });

            commonHelper.paginated(res, rows, {
                page: parseInt(page),
                total_pages: Math.ceil(count / limit),
                total_items: parseInt(count),
                per_page: parseInt(limit)
            }, 'Get destinations successful');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.params;
            
            const { rows } = await DestinationModel.findById(id);

            if (rows.length === 0) {
                return commonHelper.notFound(res, 'Destination not found');
            }

            commonHelper.success(res, rows[0], 'Get destination successful');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    }
};

module.exports = DestinationController;