import { Request, Response } from 'express'
import config from '../config/env'
import { User } from '../models/User'

export const updateProfile = async (req: Request, res: Response) => {
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
			},
		})
	} catch (error: any) {
		console.error('Error updating profile:', error)
		res.status(500).json({
			error: 'Произошла ошибка при обновлении профиля',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}
