require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const corsOptions = require('../src/config/cors');
const validateEnv = require('../src/config/validateEnv');
const swaggerSpec = require('../src/config/swagger');

try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  process.exit(1);
}

const userRoutes = require('../src/routes/UserRoutes');
const packageRoutes = require('../src/routes/PackageRoutes');
const articleRoutes = require('../src/routes/ArticleRoutes');
const wishlistRoutes = require('../src/routes/WishlistRoutes');
const bookingRoutes = require('../src/routes/BookingRoutes');
const forumRoutes = require('../src/routes/ForumRoutes');
const reviewRoutes = require('../src/routes/ReviewRoutes');
const paymentRoutes = require('../src/routes/PaymentRoutes');
const communityRoutes = require('../src/routes/CommunityRoutes');
const dashboardRoutes = require('../src/routes/DashboardRoutes');
const { handleMulterError } = require('../src/middlewares/upload');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));
const corsOptions = require('../src/config/cors');
   app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    message: 'Muslimah Travel API is running!',
    documentation: '/api-docs',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'disconnected'
  };

  try {
    await pool.query('SELECT 1');
    healthCheck.database = 'connected';
    healthCheck.status = 'OK';
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.database = 'error';
    healthCheck.status = 'DEGRADED';
    healthCheck.error = process.env.NODE_ENV === 'development' ? error.message : 'Database connection failed';
    res.status(503).json(healthCheck);
  }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Muslimah Travel API Docs',
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/user', userRoutes);
app.use('/packages', packageRoutes);
app.use('/articles', articleRoutes);
app.use('/wishlists', wishlistRoutes);
app.use('/bookings', bookingRoutes);
app.use('/forums', forumRoutes);
app.use('/reviews', reviewRoutes);
app.use('/payments', paymentRoutes);
app.use('/community', communityRoutes);
app.use('/dashboard', dashboardRoutes);

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