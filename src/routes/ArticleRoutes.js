import express from 'express'
import ArticleController from '../controllers/ArticleController.js'

const router = express.Router()

router.get('/latest', ArticleController.getLatest)

export default router