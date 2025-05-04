import { Router } from 'express'
import {
	login,
	logout,
	me,
	register,
	subscribe,
} from '../controllers/authController'
import { updateProfile } from '../controllers/profileController'
import { auth } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', auth, logout)
router.get('/me', auth, me)
router.put('/profile', auth, updateProfile)
router.post('/subscribe', auth, subscribe)

export default router
