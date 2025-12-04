import express from 'express'
import AuthController from '../controllers/UserController.js'
import { protect, isAdmin } from '../middlewares/auth.js'

const router = express.Router()

router.get('/profile', protect, AuthController.getProfile)
router.get('/users', protect, isAdmin, AuthController.getAllUsers)

router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.post('/forgot-password', AuthController.forgotPassword)
router.post('/reset-password', AuthController.resetPassword)

router.put('/users/:id', protect, isAdmin, AuthController.updateUser)

router.delete('/users/:id', protect, isAdmin, AuthController.deleteUser)

export default router