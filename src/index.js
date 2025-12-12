const express = require('express')
require('dotenv/config')
const helmet = require('helmet')
const morgan = require('morgan')
const cors = require('cors')
const userRoutes = require('./routes/UserRoutes')
const packageRoutes = require('./routes/PackageRoutes')
const articleRoutes = require('./routes/ArticleRoutes')
const wishlistRoutes = require('./routes/WishlistRoutes')
const bookingRoutes = require('./routes/BookingRoutes')
const reviewRoutes = require('./routes/ReviewRoutes')
const paymentRoutes = require('./routes/PaymentRoutes')
const adminRoutes = require('./routes/AdminRoutes')
const komunitasRoutes = require('./routes/KomunitasRoutes')
const { handleMulterError } = require('./middlewares/upload') 
const { swaggerUi, specs } = require('./config/swegger');

const app = express()
const port = process.env.PORT || 3000

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.use('/user', userRoutes)
app.use('/packages', packageRoutes)
app.use('/articles', articleRoutes)
app.use('/wishlists', wishlistRoutes)
app.use('/bookings', bookingRoutes)
app.use('/reviews', reviewRoutes)
app.use('/payments', paymentRoutes)
app.use('/admin', adminRoutes)
app.use('/komunitas', komunitasRoutes)

app.use(handleMulterError)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Muslimah Travel API',
        documentation: '/api-docs',
        version: '1.0.0'
    })
})

app.get('/user', (req, res) => {
    res.json({ status: 'OK' })
})

app.listen(port, () => {
    console.log(`Server running at: http://localhost:${port}`)
})

module.exports = app