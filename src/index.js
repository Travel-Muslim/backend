import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/UserRoutes.js'
import packageRoutes from './routes/PackageRoutes.js'
import articleRoutes from './routes/ArticleRoutes.js'
import destinationRoutes from './routes/DestinationRoutes.js'
import locationRoutes from './routes/LocationRoutes.js'
import testimonialRoutes from './routes/TestimonialRoutes.js'
import wishlistRoutes from './routes/WishlistRoutes.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/', (req, res) => {
    res.json({
        message: 'Muslimah Travel API is running!',
        documentation: '/api-docs'
    })
})

app.use('/user', authRoutes)
app.use('/packages', packageRoutes)
app.use('/articles', articleRoutes)
app.use('/destinations', destinationRoutes)
app.use('/locations', locationRoutes)
app.use('/testimonials', testimonialRoutes)
app.use('/wishlists', wishlistRoutes)

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at: http://localhost:${PORT}`);
  });
}

export default app