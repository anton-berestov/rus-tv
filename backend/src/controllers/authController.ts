import { Request, Response } from 'express'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { Types } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import config from '../config/env'
import { IUser, User } from '../models/User'
import { emailService } from '../services/emailService'
import { JwtResponse } from '../types/jwt'
import { generatePassword } from '../utils/passwordGenerator'

interface CustomJwtPayload {
	userId: string
	deviceId: string
}

async function generateUniqueUsername(baseUsername: string): Promise<string> {
	let username = baseUsername
	let counter = 1

	while (true) {
		const existingUser = await User.findOne({ username }).exec()
		if (!existingUser) {
			return username
		}
		username = `${baseUsername}${counter}`
		counter++
	}
}

export const register = async (req: Request, res: Response) => {
	try {
		const { email } = req.body

		// Проверка наличия обязательных полей
		if (!email) {
			return res.status(400).json({
				error: 'Email обязателен для заполнения',
			})
		}

		// Проверка формата email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				error: 'Неверный формат email',
			})
		}

		// Проверка существующего пользователя
		const existingUser = await User.findOne({ email }).exec()
		if (existingUser) {
			return res.status(400).json({
				error: 'Пользователь с таким email уже существует',
			})
		}

		const deviceId = uuidv4()

		// Генерация username из email
		const baseUsername = email.split('@')[0]
		const username = await generateUniqueUsername(baseUsername)

		// Генерация случайного пароля
		const password = generatePassword(10)

		// Устанавливаем дату истечения пробного периода
		const trialExpireDate = new Date()
		trialExpireDate.setDate(
			trialExpireDate.getDate() + config.subscription.trial.duration
		)

		const user = new User({
			email,
			password,
			username,
			subscription: {
				active: true,
				deviceLimit: config.subscription.trial.deviceLimit,
				expireDate: trialExpireDate,
			},
		})

		await user.save()

		// Отправка email с данными для входа
		await emailService.sendCredentials(email, username, password)

		res.status(201).json({
			user: {
				id: user._id,
				email: user.email,
				username: user.username,
				subscription: user.subscription,
			},
			message: `Регистрация успешна! Логин и пароль для входа отправлены на ваш email. Вам предоставлен ${config.subscription.trial.duration}-дневный пробный период с лимитом в ${config.subscription.trial.deviceLimit} устройства.`,
		})
	} catch (error: any) {
		console.error('Registration error:', error)

		// Обработка ошибок MongoDB
		if (error.code === 11000) {
			const field = Object.keys(error.keyPattern)[0]
			return res.status(400).json({
				error: `Пользователь с таким ${field} уже существует`,
			})
		}

		// Ошибки валидации Mongoose
		if (error.name === 'ValidationError') {
			const messages = Object.values(error.errors).map(
				(err: any) => err.message
			)
			return res.status(400).json({
				error: messages.join(', '),
			})
		}

		res.status(500).json({
			error: 'Произошла ошибка при создании пользователя',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

export const login = async (req: Request, res: Response) => {
	try {
		const { email, username, password } = req.body
		const deviceId = req.body.deviceId || uuidv4()

		// Проверка наличия обязательных полей
		if ((!email && !username) || !password) {
			return res.status(400).json({
				error: 'Email/имя пользователя и пароль обязательны для заполнения',
			})
		}

		// Поиск пользователя по email или username
		let user;
		if (email) {
			user = await User.findOne({ email }).exec()
		} else if (username) {
			user = await User.findOne({ username }).exec()
		}

		if (!user) {
			return res.status(401).json({
				error: 'Неверные учетные данные',
			})
		}

		const isMatch = await user.comparePassword(password)
		if (!isMatch) {
			return res.status(401).json({
				error: 'Неверные учетные данные',
			})
		}

		// Создаем JWT токен
		const token = generateToken(user._id.toString(), deviceId)

		res.json({
			token,
			deviceId,
			user: {
				id: user._id,
				email: user.email,
				username: user.username,
				subscription: user.subscription,
			},
		})
	} catch (error: any) {
		console.error('Login error:', error)
		res.status(500).json({
			error: 'Произошла ошибка при входе в систему',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
	}

	// Генерация JWT токена
	const generateToken = (userId: string, deviceId?: string): string => {
	return jwt.sign(
		{ userId, deviceId },
		config.security.jwt.secret as Secret,
		{
			expiresIn: config.security.jwt.expiresIn,
		},
	)
}

export const subscribe = async (req: Request, res: Response) => {
	try {
		const { deviceLimit } = req.body

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

		// Проверяем количество устройств
		if (!deviceLimit || deviceLimit < config.subscription.minDevices) {
			return res.status(400).json({
				error: `Количество устройств должно быть не менее ${config.subscription.minDevices}`,
			})
		}

		if (deviceLimit > config.subscription.maxDevices) {
			return res.status(400).json({
				error: `Максимальное количество устройств - ${config.subscription.maxDevices}`,
			})
		}

		// Расчет стоимости подписки
		const subscriptionCost = deviceLimit * config.subscription.pricePerDevice

		// В реальном приложении здесь должна быть интеграция с платежной системой
		// Пока просто обновляем статус подписки

		const expireDate = new Date()
		expireDate.setMonth(expireDate.getMonth() + 1) // Подписка на 1 месяц

		user.subscription = {
			active: true,
			deviceLimit,
			expireDate,
		}

		await user.save()

		res.json({
			message: 'Подписка успешно оформлена',
			subscription: user.subscription,
			cost: subscriptionCost,
			currency: 'USD',
		})
	} catch (error: any) {
		console.error('Subscription error:', error)
		res.status(400).json({
			error: 'Ошибка при обновлении подписки',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

export const logout = async (req: Request, res: Response) => {
	try {
		const user = req.user as IUser
		const deviceId = req.deviceId

		if (!user || !deviceId) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		// Удаляем устройство из списка активных
		user.activeDevices = user.activeDevices.filter(
			device => device.deviceId !== deviceId
		)
		await user.save()

		res.json({ message: 'Выход выполнен успешно' })
	} catch (error: any) {
		console.error('Logout error:', error)
		res.status(500).json({
			error: 'Произошла ошибка при выходе из системы',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

export const me = async (req: Request, res: Response) => {
	try {
		const userId = req.user?._id

		if (!userId) {
			return res.status(401).json({
				error: 'Не авторизован',
			})
		}

		const user = await User.findById(userId).exec()
		if (!user) {
			return res.status(404).json({
				error: 'Пользователь не найден',
			})
		}

		res.json({
			user: {
				id: user._id,
				email: user.email,
				username: user.username,
				subscription: user.subscription,
			},
		})
	} catch (error: any) {
		console.error('Get user info error:', error)
		res.status(500).json({
			error: 'Произошла ошибка при получении информации о пользователе',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}
