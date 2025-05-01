import { Router } from 'express'
import {
	getLogo,
	getPlaylist,
	getStream,
	refreshPlaylist,
} from '../controllers/playlistController'
import { isAdmin } from '../middleware/admin'
import { auth } from '../middleware/auth'

const router = Router()

router.get('/', auth, getPlaylist)
router.get('/stream', getStream)
router.get('/logo', getLogo)

router.post('/refresh', auth, isAdmin, refreshPlaylist)

export default router
