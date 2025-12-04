import express from 'express'
import WishlistController from '../controllers/WishlistController.js'
import { protect } from '../middlewares/auth.js'

const router = express.Router()

router.get('/', protect, WishlistController.getByUser)

export default router