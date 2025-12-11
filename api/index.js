require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const userRoutes = require('../src/routes/UserRoutes');
const packageRoutes = require('../src/routes/PackageRoutes');
const articleRoutes = require('../src/routes/ArticleRoutes');
const destinationRoutes = require('../src/routes/DestinationRoutes');
const locationRoutes = require('../src/routes/LocationRoutes');
const testimonialRoutes = require('../src/routes/TestimonialRoutes');
const wishlistRoutes = require('../src/routes/WishlistRoutes');
const bookingRoutes = require('../src/routes/BookingRoutes');
const forumRoutes = require('../src/routes/ForumRoutes');
const reviewRoutes = require('../src/routes/ReviewRoutes');
const paymentRoutes = require('../src/routes/PaymentRoutes');
const itineraryRoutes = require('../src/routes/ItineraryRoutes');
const adminRoutes = require('../src/routes/AdminRoutes');
const { handleMulterError } = require('../src/middlewares/upload');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    message: 'Muslimah Travel API is running!',
    documentation: '/api-docs',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/user', (req, res) => {
  res.json({ status: 'OK' });
});

app.use('/user', userRoutes);
app.use('/packages', packageRoutes);
app.use('/articles', articleRoutes);
app.use('/destinations', destinationRoutes);
app.use('/locations', locationRoutes);
app.use('/testimonials', testimonialRoutes);
app.use('/wishlists', wishlistRoutes);
app.use('/bookings', bookingRoutes);
app.use('/forums', forumRoutes);
app.use('/reviews', reviewRoutes);
app.use('/payments', paymentRoutes);
app.use('/itineraries', itineraryRoutes);
app.use('/admin', adminRoutes);

app.use(handleMulterError);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;