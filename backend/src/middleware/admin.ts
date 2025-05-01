import { NextFunction, Request, Response } from 'express'
import { User } from '../models/User'

export const isAdmin = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const user = await User.findById(req.user?.id)

		if (!user?.isAdmin) {
			return res.status(403).json({
				success: false,
				message: 'Доступ запрещен. Требуются права администратора.',
			})
		}

		next()
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Ошибка при проверке прав администратора',
		})
	}
}
