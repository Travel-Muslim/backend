import express from 'express'
import LocationController from '../controllers/LocationController.js'

const router = express.Router()

router.get('/', LocationController.getAll)

export default router