import { Router } from 'express'
import {
	getSubscriptionPlans,
	getUserPayments,
	toggleAutoRenewal,
} from '../controllers/subscriptionController'
import { auth } from '../middleware/auth'

const router = Router()

router.get('/plans', getSubscriptionPlans)

router.get('/payments', auth, getUserPayments)

// Управление автопродлением подписки (включение/отключение)
router.post('/auto-renewal', auth, toggleAutoRenewal)

export default router
