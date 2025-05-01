import { Router } from 'express'
import {
	login,
	logout,
	me,
	register,
	subscribe,
} from '../controllers/authController'
import { auth } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/subscribe', auth, subscribe)
router.post('/logout', auth, logout)
router.get('/me', auth, me)

export default router
