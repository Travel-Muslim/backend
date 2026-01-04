const { findAll, findById, create, checkBookingReview } = require('../models/ReviewModel');
const { findById: findBookingById } = require('../models/BookingModel');
const { uploadBufferToCloudinary } = require('../config/cloudinary');
const commonHelper = require('../helpers/common');
const pool = require('../config/db');

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

      console.log('=== CREATE REVIEW START ===');
      console.log('Request body:', { booking_id, rating, commentLength: comment?.length });
      console.log('User ID:', userId);
      console.log('Files count:', req.files?.length || 0);

      if (!booking_id || !rating || !comment) {
        console.log('Validation failed: missing required fields');
        return commonHelper.badRequest(res, 'booking_id, rating, and comment are required');
      }

      if (rating < 1 || rating > 5) {
        console.log('Validation failed: invalid rating');
        return commonHelper.badRequest(res, 'Rating must be between 1.0 and 5.0');
      }

      console.log('Finding booking with ID:', booking_id);
      const booking = await findBookingById(booking_id);
      console.log(
        'Booking found:',
        booking
          ? {
              id: booking.id,
              user_id: booking.user_id,
              package_id: booking.package_id,
              status: booking.status,
              payment_status: booking.payment_status,
            }
          : 'null'
      );

      if (!booking) {
        console.log('Error: Booking not found');
        return commonHelper.notFound(res, 'Booking not found');
      }
      if (booking.user_id !== userId) {
        console.log('Error: User not authorized');
        return commonHelper.forbidden(res, 'You do not have access to this booking');
      }

      // Check if booking is completed or paid
      if (
        booking.status !== 'done' &&
        booking.status !== 'completed' &&
        booking.payment_status !== 'paid'
      ) {
        return commonHelper.badRequest(res, 'Can only review completed bookings');
      }

      const {
        rows: [existing],
      } = await checkBookingReview(booking_id);
      if (existing) {
        console.log('Error: Review already exists for this booking');
        return commonHelper.badRequest(res, 'You have already reviewed this booking');
      }

      if (!booking.package_id) {
        console.log('Error: Booking has no package_id');
        return commonHelper.badRequest(res, 'Invalid booking: package information not found');
      }

      // Upload media files first if provided
      const uploadedImages = [];
      if (req.files && req.files.length > 0) {
        console.log(`Uploading ${req.files.length} media file(s)...`);
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          try {
            console.log(`Uploading file ${i + 1}:`, {
              name: file.originalname,
              type: file.mimetype,
              size: file.size,
              hasBuffer: !!file.buffer,
              bufferLength: file.buffer?.length || 0,
            });

            if (!file.buffer || file.buffer.length === 0) {
              console.error(`File ${i + 1} has empty buffer, skipping...`);
              continue;
            }

            const uploaded = await uploadBufferToCloudinary(
              file.buffer,
              'muslimah-travel/review-media'
            );

            uploadedImages.push({
              url: uploaded.secure_url,
              type: file.mimetype.startsWith('image/') ? 'image' : 'video',
            });
            console.log(`Media ${i + 1} uploaded successfully:`, uploaded.secure_url);
          } catch (uploadError) {
            console.error(`Error uploading media ${i + 1}:`, uploadError);
            // Continue with other files even if one fails
          }
        }
      }

      console.log('Creating review in database with images...');
      const reviewResult = await create({
        userId,
        bookingId: booking_id,
        packageId: booking.package_id,
        rating,
        comment,
        images: uploadedImages,
      });

      console.log('Review create result:', reviewResult);

      if (!reviewResult.rows || reviewResult.rows.length === 0) {
        console.log('Error: No review returned from database');
        throw new Error('Failed to create review in database');
      }

      const review = reviewResult.rows[0];
      console.log('Review created successfully:', {
        id: review.id,
        rating: review.rating,
        imagesCount: uploadedImages.length,
      });

      const responseData = {
        id: review.id,
        rating: review.rating,
        comment: review.review_text,
        images: review.images,
        is_published: false,
      };

      console.log('=== CREATE REVIEW SUCCESS ===');
      console.log('Response data:', responseData);

      commonHelper.created(res, responseData, 'Review submitted successfully');
    } catch (error) {
      console.error('=== CREATE REVIEW ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error details:', error);
      commonHelper.error(res, error.message || 'Server error', 500);
    }
  },

  uploadMedia: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!req.files || req.files.length === 0) {
        return commonHelper.badRequest(res, 'At least one media file is required');
      }

      const reviewExists = await findById(id);
      if (!reviewExists.rows.length) return commonHelper.notFound(res, 'Review not found');
      if (reviewExists.rows[0].user_id !== userId) return commonHelper.forbidden(res, 'Forbidden');

      // Get existing images
      const existingImages = reviewExists.rows[0].images || [];
      const newImages = [];

      for (const file of req.files) {
        const uploaded = await uploadBufferToCloudinary(
          file.buffer,
          'muslimah-travel/review-media'
        );

        newImages.push({
          url: uploaded.secure_url,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        });
      }

      // Merge existing and new images
      const allImages = [...existingImages, ...newImages];

      // Update review with new images
      const updateResult = await pool.query(
        'UPDATE reviews SET images = $1 WHERE id = $2 RETURNING images',
        [JSON.stringify(allImages), id]
      );

      return commonHelper.success(
        res,
        { images: updateResult.rows[0].images },
        'Media uploaded successfully'
      );
    } catch (error) {
      console.log(error);
      return commonHelper.error(res, 'Server error', 500);
    }
  },
};

module.exports = ReviewController;
