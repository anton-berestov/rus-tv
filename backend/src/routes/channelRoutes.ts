import express from 'express'
import {
	createChannel,
	deleteChannel,
	getChannel,
	getChannels,
	updateChannel,
} from '../controllers/channelController'
import { isAdmin } from '../middleware/admin'
import { auth } from '../middleware/auth'

const router = express.Router()

// Публичные маршруты (требуют только аутентификации)
router.get('/', auth, getChannels)
router.get('/:id', auth, getChannel)

// Защищенные маршруты (требуют прав администратора)
router.post('/', auth, isAdmin, createChannel)
router.put('/:id', auth, isAdmin, updateChannel)
router.delete('/:id', auth, isAdmin, deleteChannel)

export default router
