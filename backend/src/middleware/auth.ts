import { NextFunction, Request, Response } from 'express'
import jwt, { Secret } from 'jsonwebtoken'
import config from '../config/env'
import { IUser, User } from '../models/User'

interface JwtPayload {
	userId: string
	deviceId: string
}

declare global {
	namespace Express {
		interface Request {
			user?: IUser & { _id: any }
			deviceId?: string
		}
	}
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '')

		if (!token) {
			throw new Error('Токен не предоставлен')
		}

		const decoded = jwt.verify(token, config.jwt.secret as Secret) as JwtPayload
		const user = await User.findById(decoded.userId).exec()

		if (!user) {
			throw new Error('Пользователь не найден')
		}

		// Проверка активной подписки
		if (
			!user.subscription.active ||
			new Date() > user.subscription.expireDate
		) {
			return res.status(403).json({ error: 'Подписка истекла' })
		}

		// Проверка лимита устройств
		const deviceIndex = user.activeDevices.findIndex(
			device => device.deviceId === decoded.deviceId
		)

		if (deviceIndex === -1) {
			if (user.activeDevices.length >= user.subscription.deviceLimit) {
				return res.status(403).json({
					error: 'Достигнут лимит устройств',
					maxDevices: user.subscription.deviceLimit,
				})
			}
			// Добавляем новое устройство
			user.activeDevices.push({
				deviceId: decoded.deviceId,
				lastActive: new Date(),
			})
		} else {
			// Обновляем время последней активности
			user.activeDevices[deviceIndex].lastActive = new Date()
		}

		await user.save()

		req.user = user
		req.deviceId = decoded.deviceId
		next()
	} catch (error: any) {
		console.error('Auth middleware error:', error)
		res.status(401).json({
			error: 'Пожалуйста, авторизуйтесь',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}
