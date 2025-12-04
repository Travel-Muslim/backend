import express from 'express'
import DestinationController from '../controllers/DestinastionController.js'

const router = express.Router()

router.get('/search', DestinationController.search)

export default router