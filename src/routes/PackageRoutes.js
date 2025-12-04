import express from 'express'
import PackageController from '../controllers/PackageController.js'

const router = express.Router()

router.get('/featured', PackageController.getFeatured)

export default router