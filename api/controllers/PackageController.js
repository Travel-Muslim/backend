const PackageModel = require('../models/PackageModel');
const commonHelper = require('../helpers/common');
const { ValidationHelper, ValidationError } = require('../helpers/validation');
const { PAGINATION, ERROR_MESSAGES, HTTP_STATUS } = require('../config/constants');

const PackageController = {
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(req.query.limit) || PAGINATION.PACKAGE_LIST_LIMIT;
      const offset = (page - 1) * limit;

      const filters = {
        search: req.query.search?.trim(),
        location: req.query.location?.trim(),
        month: req.query.month?.trim(),
        limit,
        offset,
      };

      const result = await PackageModel.getAll(filters);

      const data = result.rows.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        location: pkg.location,
        benua: pkg.benua,
        maskapai: pkg.maskapai,
        bandara: pkg.bandara,
        price: parseFloat(pkg.price),
        duration: `${pkg.duration} Hari`,
        periode_start: pkg.periode_start,
        periode_end: pkg.periode_end,
        imageUrl: pkg.image,
      }));

      return commonHelper.success(res, data, 'Get packages successful');
    } catch (error) {
      console.error('getAll error:', error);
      return commonHelper.error(
        res,
        ERROR_MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  },

  getPackageDetail: async (req, res) => {
    try {
      const { id } = req.params;
      ValidationHelper.validateUUID(id, 'Package ID');

      const result = await PackageModel.findById(id);

      if (result.rows.length === 0) {
        return commonHelper.notFound(res, ERROR_MESSAGES.PACKAGE_NOT_FOUND);
      }

      const pkg = result.rows[0];
      const durasi = `${pkg.duration} Hari ${pkg.duration - 1} Malam`;

      let itineraryData = [];
      if (pkg.itinerary) {
        try {
          const parsedItinerary =
            typeof pkg.itinerary === 'string' ? JSON.parse(pkg.itinerary) : pkg.itinerary;

          if (parsedItinerary && !Array.isArray(parsedItinerary)) {
            const maxLength = Math.max(
              (parsedItinerary.destinasi || []).length,
              (parsedItinerary.makan || []).length,
              (parsedItinerary.masjid || []).length,
              (parsedItinerary.transportasi || []).length
            );

            itineraryData = Array.from({ length: maxLength }, (_, idx) => ({
              destinasi: parsedItinerary.destinasi?.[idx] ? [parsedItinerary.destinasi[idx]] : [],
              makan: parsedItinerary.makan?.[idx] ? [parsedItinerary.makan[idx]] : [],
              masjid: parsedItinerary.masjid?.[idx] ? [parsedItinerary.masjid[idx]] : [],
              transportasi: parsedItinerary.transportasi?.[idx]
                ? [parsedItinerary.transportasi[idx]]
                : [],
            }));
          } else if (Array.isArray(parsedItinerary)) {
            itineraryData = parsedItinerary;
          }
        } catch (error) {
          console.error(error.message, error);
          itineraryData = [];
        }
      }

      return commonHelper.success(
        res,
        {
          id: pkg.id,
          name: pkg.name,
          location: pkg.location,
          benua: pkg.benua,
          duration: durasi,
          periode_start: pkg.periode_start,
          periode_end: pkg.periode_end,
          maskapai: pkg.maskapai,
          bandara: pkg.bandara,
          harga: parseFloat(pkg.harga),
          imageUrl: pkg.image,
          tabs: ['Itenary', 'Booking', 'Testimoni'],
          itinerary: itineraryData,
          testimonials: [],
        },
        'Get package successful'
      );
    } catch (error) {
      console.error('getPackageDetail error:', error);
      if (error instanceof ValidationError) {
        return commonHelper.badRequest(res, error.message);
      }
      return commonHelper.error(
        res,
        ERROR_MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  },
};

module.exports = PackageController;
