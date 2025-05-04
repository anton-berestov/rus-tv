import cors from 'cors'
import express, { Express } from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import morgan from 'morgan'
import config from './config/env'
import {
	initSubscriptionPlans,
	processAutoRenewals,
} from './controllers/subscriptionController'
import adminRoutes from './routes/adminRoutes'
import playlist from './routes/playlist'
import subscriptionRoutes from './routes/subscriptionRoutes'
import userRoutes from './routes/userRoutes'
import yookassaRoutes from './routes/yookassaRoutes'
import validateYookassaConfig from './utils/validateYookassaConfig'

// Проверяем конфигурацию платежной системы
const isYookassaConfigValid = validateYookassaConfig?.() || true
if (!isYookassaConfigValid && config.server.nodeEnv === 'production') {
	console.error(
		'ВНИМАНИЕ: Конфигурация ЮKassa некорректна. Платежи могут не работать!'
	)
}

// Проверка наличия импортированных маршрутов
const existingRoutes = {
	users: typeof userRoutes !== 'undefined',
	subscriptions: typeof subscriptionRoutes !== 'undefined',
	yookassa: typeof yookassaRoutes !== 'undefined',
	admin: typeof adminRoutes !== 'undefined',
	playlist: typeof playlist !== 'undefined',
}

console.log('Доступные маршруты:', existingRoutes)

const app: Express = express()

// Подключение к MongoDB
mongoose
	.connect(config.db.uri)
	.then(() => {
		console.log('Connected to MongoDB')
		// Инициализируем тарифные планы после подключения к БД
		initSubscriptionPlans()
			.then(() => console.log('Тарифные планы проверены/инициализированы'))
			.catch(err => console.error('Ошибка инициализации тарифов:', err))

		// Настройка автоматического запуска автопродления подписок каждые 6 часов
		const AUTO_RENEWAL_INTERVAL = 6 * 60 * 60 * 1000 // 6 часов в миллисекундах

		// Первый запуск через 10 секунд после старта приложения
		setTimeout(() => {
			console.log('Запуск первичной проверки автопродлений...')
			processAutoRenewals()
				.then(result =>
					console.log('Результат проверки автопродлений:', result)
				)
				.catch(err => console.error('Ошибка при проверке автопродлений:', err))

			// Последующие регулярные запуски
			setInterval(() => {
				console.log('Запуск регулярной проверки автопродлений...')
				processAutoRenewals()
					.then(result =>
						console.log('Результат проверки автопродлений:', result)
					)
					.catch(err =>
						console.error('Ошибка при проверке автопродлений:', err)
					)
			}, AUTO_RENEWAL_INTERVAL)
		}, 10000)
	})
	.catch(error => {
		console.error('Error connecting to MongoDB', error)
	})

// Middleware
app.use(express.json())
app.use(
	cors({
		origin: '*', // Разрешить запросы с любого домена (только для разработки!)
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
)
// Настройка Helmet с менее строгой политикой реферера для разработки
app.use(
	helmet({
		referrerPolicy: {
			policy: 'no-referrer-when-downgrade', // Более гибкая политика
		},
	})
)

// Логирование только в режиме разработки
if (config.server.nodeEnv === 'development') {
	app.use(morgan('dev'))
}

// Маршруты (добавляем проверку на существование)
if (userRoutes) app.use('/api/users', userRoutes)
if (subscriptionRoutes) app.use('/api/subscriptions', subscriptionRoutes)
if (yookassaRoutes) app.use('/api/yookassa', yookassaRoutes)
if (adminRoutes) app.use('/api/admin', adminRoutes)
if (playlist) app.use('/api/playlist', playlist)

// Простой тестовый эндпоинт
app.get('/api/health', (req, res) => {
	res.json({
		status: 'ok',
		serverTime: new Date().toISOString(),
		environment: config.server.nodeEnv,
	})
})

export default app
