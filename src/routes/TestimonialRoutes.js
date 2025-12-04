import express from 'express'
import TestimonialController from '../controllers/TestimonialController.js'

const router = express.Router()

router.get('/', TestimonialController.getFeatured)

export default router