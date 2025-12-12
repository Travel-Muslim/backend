const { 
    findAll, 
    findById, 
    create, 
    update, 
    remove,
    checkBookingReview,
    addMedia
} = require('../models/ReviewModel');
const { findById: findBookingById } = require('../models/BookingModel');
const { uploadBufferToCloudinary } = require("../config/cloudinary");
const commonHelper = require('../helpers/common');

const ReviewController = {
    getAll: async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            const { rows } = await findAll(userId, limit, offset);

            commonHelper.success(res, rows, 'Get reviews successful');
        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    createReview: async (req, res) => {
        try {
            const { booking_id, rating, comment } = req.body;
            const userId = req.user.id;

            if (!booking_id || !rating || !comment) {
                return commonHelper.badRequest(res, 'booking_id, rating, and comment are required');
            }

            if (rating < 1 || rating > 5) {
                return commonHelper.badRequest(res, 'Rating must be between 1.0 and 5.0');
            }

            const booking = await findBookingById(booking_id);
            if (!booking) {
                return commonHelper.notFound(res, 'Booking not found');
            }
            if (booking.user_id !== userId) {
                return commonHelper.forbidden(res, 'You do not have access to this booking');
            }
            if (booking.completion_status !== 'done') {
                return commonHelper.badRequest(res, 'Can only review completed bookings');
            }

            const { rows: [existing] } = await checkBookingReview(booking_id);
            if (existing) {
                return commonHelper.badRequest(res, 'You have already reviewed this booking');
            }

            const { rows: [review] } = await create({
                userId,
                bookingId: booking_id,
                packageId: booking.package_id,
                rating,
                comment
            });

            commonHelper.created(res, {
                id: review.id,
                rating: review.rating,
                is_published: review.is_published
            }, 'Review submitted for moderation');

        } catch (error) {
            console.log(error);
            commonHelper.error(res, 'Server error', 500);
        }
    },

    uploadMedia: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            if (!req.files || req.files.length === 0) {
            return commonHelper.badRequest(res, "At least one media file is required");
            }

            const reviewExists = await findById(id);
            if (!reviewExists.rows.length)
            return commonHelper.notFound(res, "Review not found");
            if (reviewExists.rows[0].user_id !== userId)
            return commonHelper.forbidden(res, "Forbidden");

            const urls = [];

            for (const file of req.files) {
            const uploaded = await uploadBufferToCloudinary(
                file.buffer,
                "muslimah-travel/review-media"
            );

            await addMedia(id, uploaded.secure_url, "image");
            urls.push(uploaded.secure_url);
            }

            return commonHelper.success(
            res,
            { urls },
            "Media uploaded successfully"
            );

        } catch (error) {
            console.log(error);
            return commonHelper.error(res, "Server error", 500);
        }
    }
};

module.exports = ReviewController;