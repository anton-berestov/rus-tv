import { Request, Response } from 'express'
import config from '../config/env'
import { Payment, PaymentStatus } from '../models/Payment'
import { IPaymentMethod, PaymentMethod } from '../models/PaymentMethod'
import { SubscriptionPlan } from '../models/Subscription'
import { User } from '../models/User'
import { yookassaService } from '../services/yookassaService'
import { YooKassaPaymentStatus } from '../types/yookassa'

// Получение списка всех доступных планов подписок
export const getSubscriptionPlans = async (req: Request, res: Response) => {
	try {
		// Проверяем, есть ли планы в базе
		const count = await SubscriptionPlan.countDocuments()

		// Если планов нет - создаем стандартные
		if (count === 0) {
			await initSubscriptionPlans()
		}

		const plans = await SubscriptionPlan.find({}).sort({ sortOrder: 1 })
		res.json({ plans })
	} catch (error: any) {
		console.error('Error fetching subscription plans:', error)
		res.status(500).json({
			error: 'Не удалось получить планы подписки',
			details: error.message,
		})
	}
}

// Получение истории платежей пользователя
export const getUserPayments = async (req: Request, res: Response) => {
	try {
		if (!req.user) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		// Получаем платежи пользователя и связанные с ними планы подписки
		const payments = await Payment.find({ userId: req.user._id })
			.sort({ createdAt: -1 })
			.populate('subscriptionPlanId', 'name monthDuration')
			.exec()

		res.json({
			payments: payments.map(payment => ({
				id: payment._id,
				status: payment.status,
				amount: payment.amount,
				currency: payment.currency,
				description: payment.description,
				createdAt: payment.createdAt,
				paidAt: payment.paidAt,
				plan: payment.subscriptionPlanId,
			})),
		})
	} catch (error: any) {
		console.error('Error fetching user payments:', error)
		res.status(500).json({
			error: 'Ошибка при получении истории платежей',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

// Вспомогательная функция для создания дефолтных планов, если в базе их нет
function getDefaultSubscriptionPlans() {
	return [
		{
			id: 'base',
			name: 'Базовый',
			monthDuration: 1,
			priceEur: 299, // Цена в рублях
			discount: 0,
			deviceLimit: 1,
			isPopular: false,
			sortOrder: 1,
			description: 'Доступ к контенту на 1 месяц, 1 устройство',
		},
		{
			id: 'standard',
			name: 'Стандартный',
			monthDuration: 3,
			priceEur: 999, // Цена в рублях
			discount: 15,
			deviceLimit: 2,
			isPopular: true,
			sortOrder: 2,
			description: 'Доступ к контенту на 3 месяца, 2 устройства',
		},
		{
			id: 'premium',
			name: 'Премиум',
			monthDuration: 12,
			priceEur: 2999, // Цена в рублях
			discount: 25,
			deviceLimit: 5,
			isPopular: false,
			sortOrder: 3,
			description: 'Доступ к контенту на 12 месяцев, 5 устройств',
		},
	]
}

// Функция для инициализации дефолтных планов подписки
export const initSubscriptionPlans = async () => {
	try {
		// Проверяем, есть ли уже планы в базе данных
		const count = await SubscriptionPlan.countDocuments()
		if (count > 0) {
			// Если планы уже есть, обновляем их цены на рубли
			return // Уже инициализировано
		}

		// Создаем дефолтные планы подписки
		const defaultPlans = [
			{
				name: 'Базовый',
				description: 'Базовый план для просмотра на одном устройстве',
				monthDuration: 1,
				priceEur: 299,
				discount: 0,
				deviceLimit: 1,
				isPopular: false,
				sortOrder: 1,
			},
			{
				name: 'Стандартный',
				description: 'Стандартный план для просмотра на двух устройствах',
				monthDuration: 3,
				priceEur: 999,
				discount: 15,
				deviceLimit: 2,
				isPopular: true,
				sortOrder: 2,
			},
			{
				name: 'Премиум',
				description: 'Премиум план для просмотра на пяти устройствах',
				monthDuration: 12,
				priceEur: 2999,
				discount: 25,
				deviceLimit: 5,
				isPopular: false,
				sortOrder: 3,
			},
		]

		// Сохраняем планы в базу данных
		await SubscriptionPlan.insertMany(defaultPlans)
		console.log('Default subscription plans created')
	} catch (error) {
		console.error('Error initializing subscription plans:', error)
	}
}

// Включение/отключение автопродления подписки
export const toggleAutoRenewal = async (req: Request, res: Response) => {
	try {
		const { enable, paymentMethodId } = req.body

		if (!req.user) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		// В режиме разработки используем тестового пользователя
		let user: any = req.user
		if (config.server.nodeEnv !== 'development') {
			const dbUser = await User.findById(req.user._id)
			if (!dbUser) {
				return res.status(404).json({
					error: 'Пользователь не найден',
				})
			}
			user = dbUser
		}

		// Проверяем наличие активной подписки
		if (!user.subscription?.active) {
			return res.status(400).json({
				error: 'Для включения автопродления необходима активная подписка',
			})
		}

		console.log(
			`Запрос на ${
				enable ? 'включение' : 'отключение'
			} автопродления для пользователя ${user._id}`
		)

		// Включение автопродления
		if (enable) {
			// Проверяем наличие метода оплаты
			if (!paymentMethodId) {
				return res.status(400).json({
					error: 'Не указан метод оплаты для автопродления',
				})
			}

			// Проверяем, существует ли указанный метод оплаты
			const paymentMethod = (await PaymentMethod.findOne({
				_id: paymentMethodId,
				userId: user._id,
			})) as IPaymentMethod

			if (!paymentMethod) {
				return res.status(404).json({
					error: 'Метод оплаты не найден',
				})
			}

			// Явно определяем тип для _id как mongoose.Types.ObjectId
			const methodId = paymentMethod._id
				? paymentMethod._id.toString()
				: paymentMethodId
			const paymentMethodApiId = paymentMethod.paymentMethodId

			console.log(
				`Найден метод оплаты: ${methodId}, ID в ЮKassa: ${paymentMethodApiId}`
			)

			// Включаем автопродление и сохраняем ID метода оплаты
			user.subscription.autoRenewal = true
			user.subscription.defaultPaymentMethodId = paymentMethodApiId

			// Устанавливаем этот метод как метод по умолчанию
			await yookassaService.setDefaultPaymentMethod(
				user._id.toString(),
				methodId
			)

			console.log(`Автопродление включено, метод оплаты: ${paymentMethodApiId}`)
		} else {
			// Отключаем автопродление
			user.subscription.autoRenewal = false
			console.log(`Автопродление отключено для пользователя ${user._id}`)
		}

		await user.save()

		res.json({
			success: true,
			message: enable
				? 'Автопродление подписки включено'
				: 'Автопродление подписки отключено',
			user,
		})
	} catch (error: any) {
		console.error('Error toggling auto renewal:', error)
		res.status(500).json({
			error: 'Не удалось изменить настройки автопродления',
			details: error.message,
		})
	}
}

// Запуск автопродления подписок
export const processAutoRenewals = async () => {
	try {
		const currentDate = new Date()

		// Находим пользователей с активным автопродлением, у которых подписка истекает в течение 24 часов
		const tomorrow = new Date(currentDate)
		tomorrow.setDate(tomorrow.getDate() + 1)

		const users = await User.find({
			'subscription.active': true,
			'subscription.autoRenewal': true,
			'subscription.expireDate': {
				$gt: currentDate,
				$lt: tomorrow,
			},
		})

		console.log(`Найдено ${users.length} подписок для автопродления`)

		// Для каждого пользователя создаем автоплатеж
		for (const user of users) {
			try {
				if (
					!user.subscription.planId ||
					!user.subscription.defaultPaymentMethodId
				) {
					console.error(
						`Отсутствует planId или paymentMethodId для пользователя ${user._id}`
					)
					continue
				}

				// Получаем план подписки
				const plan = await SubscriptionPlan.findById(user.subscription.planId)
				if (!plan) {
					console.error(`План не найден для пользователя ${user._id}`)
					continue
				}

				// Создаем автоплатеж с использованием сохраненного метода оплаты
				const paymentResult = await yookassaService.createRecurringPayment(
					user,
					plan,
					user.subscription.defaultPaymentMethodId
				)

				// Проверяем результат создания платежа
				if (
					paymentResult.status === YooKassaPaymentStatus.SUCCEEDED ||
					paymentResult.status === YooKassaPaymentStatus.WAITING_FOR_CAPTURE
				) {
					// Платеж создан успешно, обновляем дату окончания подписки
					const newExpireDate = new Date(user.subscription.expireDate)
					newExpireDate.setMonth(newExpireDate.getMonth() + plan.monthDuration)

					user.subscription.expireDate = newExpireDate
					await user.save()

					// Сохраняем информацию о платеже
					const payment = new Payment({
						userId: user._id,
						subscriptionPlanId: plan._id,
						paymentId: paymentResult.paymentId,
						status: PaymentStatus.SUCCEEDED,
						amount: paymentResult.amount,
						currency: paymentResult.currency,
						description: paymentResult.description,
						confirmationUrl: paymentResult.confirmationUrl || '',
						isRecurring: true,
						gateway: 'yookassa',
						paymentMethodId: user.subscription.defaultPaymentMethodId, // Сохраняем ID метода оплаты
						paidAt: new Date(), // Устанавливаем дату оплаты
					})

					await payment.save()

					console.log(
						`Успешно обработано автопродление для пользователя ${
							user._id
						}, новая дата окончания: ${newExpireDate.toISOString()}`
					)
				} else {
					console.warn(
						`Платеж автопродления для пользователя ${user._id} имеет статус: ${paymentResult.status}`
					)
				}
			} catch (error) {
				console.error(
					`Ошибка при обработке автопродления для пользователя ${user._id}:`,
					error
				)
			}
		}

		return {
			processed: users.length,
			success: true,
		}
	} catch (error) {
		console.error('Ошибка при обработке автопродлений:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		}
	}
}
