import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/routes.js'

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

app.listen(PORT, () => {
    console.log(`Server running at: http://localhost:${PORT}`)
})