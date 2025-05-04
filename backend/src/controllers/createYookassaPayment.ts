import { Request, Response } from 'express'
import { Types } from 'mongoose'
import config from '../config/env'
import { Payment, PaymentStatus } from '../models/Payment'
import { SubscriptionPlan } from '../models/Subscription'
import { User } from '../models/User'
import { yookassaService } from '../services/yookassaService'

// Создание платежа для оформления подписки через ЮKassa
export const createYookassaPayment = async (req: Request, res: Response) => {
	try {
		const { planId, returnUrl, savePaymentMethod = true } = req.body

		if (!req.user) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		// Получаем полные данные пользователя из БД
		const user = await User.findById(req.user._id).exec()
		if (!user) {
			return res.status(404).json({
				error: 'Пользователь не найден',
			})
		}

		// Проверяем валидность ID плана подписки
		if (!Types.ObjectId.isValid(planId)) {
			return res.status(400).json({
				error: 'Некорректный ID плана подписки',
			})
		}

		// Находим план подписки в БД
		const plan = await SubscriptionPlan.findById(planId).exec()
		if (!plan) {
			return res.status(404).json({
				error: 'План подписки не найден',
			})
		}

		// Создаем платежную сессию в ЮKassa с сохранением метода оплаты
		const paymentResult = await yookassaService.createPaymentSession(
			user,
			plan,
			returnUrl || config.payment.yookassa.returnUrl,
			savePaymentMethod
		)

		// Проверяем, есть ли confirmationUrl в результате
		if (!paymentResult.confirmationUrl) {
			console.error('Отсутствует confirmationUrl в результате:', paymentResult)
			return res.status(500).json({
				error: 'Не удалось создать платеж: отсутствует URL для перенаправления',
			})
		}

		console.log('Создание платежа с данными:', {
			userId: user._id,
			planId: plan._id,
			paymentId: paymentResult.paymentId,
			confirmationUrl: paymentResult.confirmationUrl,
		})

		// Сохраняем информацию о платеже в базе данных
		const payment = new Payment({
			userId: user._id,
			subscriptionPlanId: plan._id,
			paymentId: paymentResult.paymentId,
			status: PaymentStatus.PENDING,
			amount: paymentResult.amount,
			currency: paymentResult.currency,
			description: paymentResult.description,
			confirmationUrl: paymentResult.confirmationUrl,
			gateway: 'yookassa',
		})

		await payment.save()

		res.json({
			paymentId: payment.paymentId,
			status: payment.status,
			confirmationUrl: payment.confirmationUrl,
			amount: payment.amount,
			currency: 'RUB',
			savePaymentMethod,
			paymentMethodSaved: paymentResult.paymentMethodSaved,
			currencyNote: 'Оплата производится в рублях (RUB)',
		})
	} catch (error: any) {
		console.error('Ошибка при создании платежа в ЮKassa:', error)
		res.status(500).json({
			error: 'Не удалось создать платеж',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
} 