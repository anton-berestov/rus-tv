import { Request, Response, Router } from 'express'
import config from '../config/env'
import { auth } from '../middleware/auth'
import { User } from '../models/User'

const router = Router()

// Регистрация нового пользователя
router.post('/register', (req: Request, res: Response) => {
	const { email, username, password } = req.body

	if (!email || !username || !password) {
		return res.status(400).json({
			error: 'Все поля обязательны для заполнения',
		})
	}

	// Имитация успешной регистрации
	res.status(200).json({
		message: 'Пользователь успешно зарегистрирован',
		token: 'fake_jwt_token_' + Math.random().toString(36).substring(2),
		user: {
			id: 'user_' + Math.random().toString(36).substring(2),
			email,
			username,
			subscription: {
				active: false,
				deviceLimit: 0,
				expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		},
	})
})

// Вход пользователя
router.post('/login', (req: Request, res: Response) => {
	const { email, password } = req.body

	if (!email || !password) {
		return res.status(400).json({
			error: 'Email и пароль обязательны',
		})
	}

	// Имитация успешного входа
	res.status(200).json({
		message: 'Вход успешно выполнен',
		token: 'fake_jwt_token_' + Math.random().toString(36).substring(2),
		user: {
			id: 'user_' + Math.random().toString(36).substring(2),
			email,
			username: email.split('@')[0],
			subscription: {
				active: false,
				deviceLimit: 0,
				expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		},
	})
})

// Получение профиля пользователя
router.get('/profile', auth, async (req: Request, res: Response) => {
	try {
		// Получаем ID пользователя из req.user
		const userId = req.user?._id

		if (!userId) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		// Находим пользователя в базе данных
		const user = await User.findById(userId).exec()

		if (!user) {
			return res.status(404).json({
				error: 'Пользователь не найден',
			})
		}

		// Возвращаем данные пользователя
		res.status(200).json({
			user: {
				id: user._id,
				email: user.email,
				username: user.username,
				subscription: user.subscription,
				activeDevices: user.activeDevices,
				phoneNumber: user.phoneNumber,
			},
		})
	} catch (error: any) {
		console.error('Ошибка при получении профиля пользователя:', error)
		res.status(500).json({
			error: 'Произошла ошибка при получении профиля пользователя',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
})

// Обновление профиля пользователя
router.put('/profile', auth, async (req: Request, res: Response) => {
	try {
		const { phoneNumber } = req.body

		if (!req.user) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		const user = await User.findById(req.user._id).exec()

		if (!user) {
			return res.status(404).json({
				error: 'Пользователь не найден',
			})
		}

		// Валидация телефона (простая)
		if (phoneNumber) {
			const phoneRegex = /^[0-9+]{10,15}$/
			if (!phoneRegex.test(phoneNumber)) {
				return res.status(400).json({
					error: 'Некорректный формат номера телефона',
				})
			}

			user.phoneNumber = phoneNumber
		}

		await user.save()

		res.json({
			message: 'Профиль успешно обновлен',
			user: {
				id: user._id,
				email: user.email,
				username: user.username,
				phoneNumber: user.phoneNumber,
				subscription: user.subscription,
				activeDevices: user.activeDevices,
			},
		})
	} catch (error: any) {
		console.error('Ошибка при обновлении профиля:', error)
		res.status(500).json({
			error: 'Произошла ошибка при обновлении профиля',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
})

export default router
