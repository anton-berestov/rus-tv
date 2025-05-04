import { NextFunction, Request, Response, Router } from 'express'
import { auth } from '../middleware/auth'

const router = Router()

// Middleware для проверки прав администратора
const checkAdmin = (req: Request, res: Response, next: NextFunction) => {
	if (!req.user || !req.user.isAdmin) {
		return res
			.status(403)
			.json({ error: 'Доступ запрещен. Требуются права администратора' })
	}
	next()
}

// Получение всех пользователей (только для администраторов)
router.get('/users', auth, checkAdmin, (req: Request, res: Response) => {
	// Реализация будет добавлена позже
	res.status(200).json({ message: 'Список пользователей' })
})

// Статистика использования сервиса
router.get('/stats', auth, checkAdmin, (req: Request, res: Response) => {
	// Реализация будет добавлена позже
	res.status(200).json({ message: 'Статистика использования' })
})

export default router
