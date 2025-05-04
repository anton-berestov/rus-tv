import axios from 'axios'
import crypto from 'crypto'
import config from '../config/env'
import { IPaymentMethod, PaymentMethod } from '../models/PaymentMethod'
import { ISubscriptionPlan } from '../models/Subscription'
import { IUser, User } from '../models/User'
import {
	CreatePaymentRequest,
	CreateRecurringPaymentRequest,
	YooKassaPaymentResponse,
	YooKassaPaymentStatus,
} from '../types/yookassa'

// Интерфейс для результата создания платежа
interface CreatePaymentResult {
	paymentId: string
	status: string
	amount: number
	currency: string
	description: string
	confirmationUrl: string
	paymentMethodSaved: boolean
	paymentMethod?: any
}

// Интерфейс для тестового плана, содержащий только необходимые поля
interface TestPlan {
	_id: any
	name: string
	monthDuration: number
	priceEur: number
}

export const yookassaService = {
	/**
	 * Создает платежную сессию в ЮKassa с возможностью сохранения способа оплаты
	 */
	async createPaymentSession(
		user: IUser | any,
		plan: ISubscriptionPlan | TestPlan,
		returnUrl: string,
		savePaymentMethod: boolean = true,
		useTwoStepPayment: boolean = false
	): Promise<CreatePaymentResult> {
		try {
			// Формируем описание платежа
			const description = `Подписка "${plan.name}" на ${plan.monthDuration} мес.`

			// Цена в рублях
			// Используем цену из евро, но считаем, что это уже рубли
			// В реальном приложении здесь должен быть правильный расчет цены в рублях
			const priceAmount = plan.priceEur.toFixed(2)

			// Формируем URL для возврата после оплаты
			let successUrl = returnUrl || config.payment.yookassa.returnUrl

			// Убедимся, что returnUrl содержит /subscription
			if (!successUrl.endsWith('/subscription')) {
				if (successUrl.endsWith('/')) {
					successUrl += 'subscription'
				} else {
					successUrl += '/subscription'
				}
			}

			// ВАЖНО: Проверяем, содержит ли URL плейсхолдер для ID платежа
			// юКасса НЕ поддерживает автоматическую подстановку ID платежа
			// Поэтому мы просто используем базовый URL, а затем перенаправим пользователя с нашей страницы
			if (successUrl.includes('{payment_id}')) {
				// Удаляем плейсхолдер, он не работает в юКассе
				successUrl = successUrl.replace('?payment_id={payment_id}', '')
				successUrl = successUrl.replace('&payment_id={payment_id}', '')
			}

			console.log(`URL возврата для юКасса: ${successUrl}`)

			// Формируем параметры запроса для создания платежа
			const paymentRequest: CreatePaymentRequest = {
				amount: {
					value: priceAmount,
					currency: 'RUB', // Всегда используем рубли
				},
				confirmation: {
					type: 'redirect',
					return_url: successUrl,
				},
				capture: !useTwoStepPayment, // Если используем двухэтапную оплату, то не захватываем средства автоматически
				description,
				metadata: {
					userId: user._id?.toString() || '',
					planId: plan._id?.toString() || '',
					planName: plan.name,
					planDuration: plan.monthDuration.toString(),
					twoStepPayment: useTwoStepPayment ? 'true' : 'false', // Добавляем информацию о двухэтапной оплате
				},
				save_payment_method: savePaymentMethod, // Сохранять метод оплаты для автоплатежей
			}

			console.log('ЮKassa API запрос:', JSON.stringify(paymentRequest, null, 2))

			// Отправляем запрос к API ЮKassa
			const response = await axios.post<YooKassaPaymentResponse>(
				'https://api.yookassa.ru/v3/payments',
				paymentRequest,
				{
					headers: {
						'Content-Type': 'application/json',
						'Idempotence-Key': `payment_${
							user._id?.toString() || 'unknown'
						}_${Date.now()}`,
					},
					auth: {
						username: config.payment.yookassa.shopId,
						password: config.payment.yookassa.secretKey,
					},
				}
			)

			console.log(
				`ЮKassa API ответ для пользователя ${
					user._id?.toString() || 'unknown'
				}:`,
				response.data
			)

			// Проверяем наличие URL для подтверждения
			const confirmationUrl = response.data.confirmation?.confirmation_url
			if (!confirmationUrl) {
				throw new Error('ЮKassa не вернула URL для подтверждения платежа')
			}

			// Логируем URL и данные для отладки
			console.log(`ID платежа: ${response.data.id}`)
			console.log(`URL подтверждения: ${confirmationUrl}`)

			// Возвращаем результат
			return {
				paymentId: response.data.id,
				status: response.data.status,
				amount: parseFloat(response.data.amount.value),
				currency: response.data.amount.currency,
				description,
				confirmationUrl,
				paymentMethodSaved: Boolean(response.data.payment_method_saved),
				paymentMethod: response.data.payment_method,
			}
		} catch (error: any) {
			console.error('Ошибка при создании платежа в ЮKassa:', error)

			if (error.response?.data) {
				console.error('Детали ошибки ЮKassa:', error.response.data)
			}

			throw error
		}
	},

	/**
	 * Создает автоплатеж с использованием сохраненного метода оплаты
	 */
	async createRecurringPayment(
		user: IUser,
		plan: ISubscriptionPlan,
		paymentMethodId: string
	): Promise<CreatePaymentResult> {
		try {
			// Формируем описание платежа
			const description = `Автоплатеж: подписка "${plan.name}" на ${plan.monthDuration} мес.`

			// Цена в рублях
			const priceAmount = plan.priceEur.toFixed(2)

			// Базовый URL для возврата
			const baseReturnUrl =
				config.payment.yookassa.returnUrl || 'https://rustv.ru/subscription'

			// Вместо использования плейсхолдера, просто добавим к URL базовый параметр success=true
			// Это позволит фронтенду определить, что платеж был создан, и затем проверить последние платежи
			let returnUrl = baseReturnUrl
			if (returnUrl.includes('?')) {
				// Если URL уже содержит параметры, добавляем через &
				returnUrl = `${baseReturnUrl}&success=true`
			} else {
				// Иначе добавляем новый параметр через ?
				returnUrl = `${baseReturnUrl}?success=true`
			}

			// Добавляем timestamp для обхода кэширования
			returnUrl += `&_t=${Date.now()}`

			console.log(`Базовый URL возврата: ${baseReturnUrl}`)
			console.log(`Модифицированный URL возврата: ${returnUrl}`)

			// Формируем параметры запроса для создания автоплатежа
			const paymentRequest: CreateRecurringPaymentRequest = {
				amount: {
					value: priceAmount,
					currency: 'RUB',
				},
				capture: true,
				payment_method_id: paymentMethodId,
				description,
				confirmation: {
					type: 'redirect',
					return_url: returnUrl,
				},
				metadata: {
					userId: user._id?.toString() || '',
					planId: plan._id?.toString() || '',
					planName: plan.name,
					planDuration: plan.monthDuration.toString(),
					isRecurring: 'true',
				},
			}

			console.log(
				'ЮKassa API запрос на автоплатеж:',
				JSON.stringify(paymentRequest, null, 2)
			)

			// Отправляем запрос к API ЮKassa
			const response = await axios.post<YooKassaPaymentResponse>(
				'https://api.yookassa.ru/v3/payments',
				paymentRequest,
				{
					headers: {
						'Content-Type': 'application/json',
						'Idempotence-Key': `recurring_${
							user._id?.toString() || 'unknown'
						}_${Date.now()}`,
					},
					auth: {
						username: config.payment.yookassa.shopId,
						password: config.payment.yookassa.secretKey,
					},
				}
			)

			console.log(
				`ЮKassa API ответ на автоплатеж для пользователя ${
					user._id?.toString() || 'unknown'
				}:`,
				response.data
			)

			// Проверяем наличие URL для подтверждения
			let confirmationUrl = response.data.confirmation?.confirmation_url || ''

			// Если URL для подтверждения получен, заменяем плейсхолдер на реальный ID платежа
			if (confirmationUrl && response.data.id) {
				console.log(`Получен URL подтверждения: ${confirmationUrl}`)

				// Заменяем плейсхолдер в URL подтверждения, если он есть
				if (confirmationUrl.includes('PAYMENT_ID_PLACEHOLDER')) {
					confirmationUrl = confirmationUrl.replace(
						'PAYMENT_ID_PLACEHOLDER',
						response.data.id
					)
					console.log(`Модифицированный URL подтверждения: ${confirmationUrl}`)
				}
			}

			// Результат автоплатежа
			return {
				paymentId: response.data.id,
				status: response.data.status,
				amount: parseFloat(response.data.amount.value),
				currency: response.data.amount.currency,
				description,
				confirmationUrl,
				paymentMethodSaved: true,
				paymentMethod: response.data.payment_method,
			}
		} catch (error: any) {
			console.error('Ошибка при создании автоплатежа в ЮKassa:', error)

			if (error.response?.data) {
				console.error('Детали ошибки ЮKassa:', error.response.data)
			}

			throw error
		}
	},

	/**
	 * Проверяет статус платежа в ЮKassa
	 */
	async checkPaymentStatus(paymentId: string): Promise<{
		status: string
		paid: boolean
		paymentMethod?: any
	}> {
		try {
			// Проверяем формат ID платежа для предотвращения бессмысленных запросов к API
			if (
				!paymentId ||
				typeof paymentId !== 'string' ||
				paymentId.length < 10
			) {
				throw new Error(`Некорректный формат ID платежа: "${paymentId}"`)
			}

			console.log(
				`Отправка запроса на проверку статуса платежа ${paymentId} в ЮKassa API`
			)

			const response = await axios.get<YooKassaPaymentResponse>(
				`https://api.yookassa.ru/v3/payments/${paymentId}`,
				{
					auth: {
						username: config.payment.yookassa.shopId,
						password: config.payment.yookassa.secretKey,
					},
				}
			)

			const paymentStatus = response.data

			// Логируем полный ответ для отладки
			console.log(
				`Детальный ответ от ЮKassa по платежу ${paymentId}:`,
				JSON.stringify(
					{
						id: paymentStatus.id,
						status: paymentStatus.status,
						paid: paymentStatus.paid,
						amount: paymentStatus.amount,
						payment_method: paymentStatus.payment_method,
						payment_method_saved: paymentStatus.payment_method_saved,
					},
					null,
					2
				)
			)

			// Определяем, оплачен ли платеж
			const isPaid = paymentStatus.status === YooKassaPaymentStatus.SUCCEEDED

			// УЛУЧШЕННАЯ ОБРАБОТКА МЕТОДА ОПЛАТЫ
			// Если платеж успешен или в ожидании захвата, гарантируем сохранение данных метода оплаты
			if (
				(isPaid ||
					paymentStatus.status === YooKassaPaymentStatus.WAITING_FOR_CAPTURE) &&
				paymentStatus.payment_method
			) {
				// Если метод оплаты не отмечен как сохраненный, но есть все необходимые данные
				if (!paymentStatus.payment_method.saved) {
					console.log('Обнаружен платеж с методом оплаты, но без флага saved.')

					// Проверяем полноту данных метода оплаты
					if (
						(paymentStatus.payment_method.card &&
							paymentStatus.payment_method.id &&
							paymentStatus.payment_method.type) ||
						(paymentStatus.payment_method.type === 'yoo_money' &&
							paymentStatus.payment_method.id)
					) {
						console.log(
							'Устанавливаем payment_method.saved=true, так как метод оплаты содержит необходимые данные.'
						)
						paymentStatus.payment_method.saved = true

						// Также устанавливаем payment_method_saved поле на всем платеже
						paymentStatus.payment_method_saved = true
					}
				}
			}

			return {
				status: paymentStatus.status,
				paid: isPaid,
				paymentMethod: paymentStatus.payment_method,
			}
		} catch (error) {
			console.error('Ошибка при проверке статуса платежа в ЮKassa:', error)
			throw error
		}
	},

	/**
	 * Подтверждает платеж (для двухэтапной оплаты)
	 */
	async capturePayment(
		paymentId: string,
		amount?: { value: string; currency: string }
	): Promise<{
		status: string
		paid: boolean
		paymentMethod?: any
	}> {
		try {
			// Формируем тело запроса
			const requestBody: any = {}

			// Если указана сумма, добавляем её в запрос
			if (amount) {
				requestBody.amount = amount
			}

			console.log(
				`Отправляем запрос на захват платежа ${paymentId}`,
				requestBody
			)

			const response = await axios.post<YooKassaPaymentResponse>(
				`https://api.yookassa.ru/v3/payments/${paymentId}/capture`,
				requestBody,
				{
					headers: {
						'Content-Type': 'application/json',
						'Idempotence-Key': `capture_${paymentId}_${Date.now()}`,
					},
					auth: {
						username: config.payment.yookassa.shopId,
						password: config.payment.yookassa.secretKey,
					},
				}
			)

			const paymentStatus = response.data

			// Логируем ответ для отладки
			console.log(
				`Ответ ЮKassa на захват платежа ${paymentId}:`,
				JSON.stringify(
					{
						id: paymentStatus.id,
						status: paymentStatus.status,
						paid: paymentStatus.paid,
						amount: paymentStatus.amount,
						payment_method: paymentStatus.payment_method,
					},
					null,
					2
				)
			)

			// Определяем, оплачен ли платеж
			const isPaid = paymentStatus.status === YooKassaPaymentStatus.SUCCEEDED

			return {
				status: paymentStatus.status,
				paid: isPaid,
				paymentMethod: paymentStatus.payment_method,
			}
		} catch (error: any) {
			console.error('Ошибка при захвате платежа в ЮKassa:', error)

			if (error.response?.data) {
				console.error('Детали ошибки ЮKassa:', error.response.data)
			}

			throw error
		}
	},

	/**
	 * Сохраняет платежный метод пользователя
	 */
	async savePaymentMethod(
		userId: string,
		paymentMethod: any
	): Promise<IPaymentMethod> {
		try {
			console.log(
				`Попытка сохранения метода оплаты для пользователя ${userId}`,
				JSON.stringify(
					{
						paymentMethodId: paymentMethod.id,
						type: paymentMethod.type,
						saved: paymentMethod.saved,
						title: paymentMethod.title,
						status: paymentMethod.status,
						card: paymentMethod.card
							? {
									last4: paymentMethod.card.last4,
									first6: paymentMethod.card.first6,
									cardType: paymentMethod.card.card_type,
							  }
							: null,
					},
					null,
					2
				)
			)

			// Проверяем, существует ли уже такой метод оплаты
			const existingMethod = await PaymentMethod.findOne({
				paymentMethodId: paymentMethod.id,
				userId,
			})

			if (existingMethod) {
				console.log(
					`Метод оплаты ${paymentMethod.id} уже существует в базе с ID ${existingMethod._id}`
				)

				// Даже если метод оплаты уже существует, обновляем пользователя
				try {
					const user = await User.findById(userId).exec()
					if (user) {
						// Устанавливаем метод оплаты для автопродления, если он еще не установлен
						if (!user.paymentMethodId) {
							user.paymentMethodId = String(existingMethod._id)
							console.log(
								`Установлен существующий метод оплаты ${existingMethod._id} для пользователя ${userId}`
							)

							// Обновляем информацию о подписке, если она есть
							if (user.subscription) {
								user.subscription.defaultPaymentMethodId = paymentMethod.id
								user.subscription.autoRenewal = Boolean(paymentMethod.saved)
							}

							await user.save()
							console.log(
								`Пользователь ${userId} обновлен с существующим методом оплаты`
							)
						}
					}
				} catch (userUpdateError) {
					console.error(
						`Ошибка при обновлении пользователя ${userId} с существующим методом оплаты:`,
						userUpdateError
					)
					// Не выбрасываем ошибку, чтобы продолжить выполнение
				}

				return existingMethod
			}

			// Определяем заголовок для метода оплаты
			let title = paymentMethod.title || 'Способ оплаты'
			let cardInfo = null

			if (paymentMethod.type === 'bank_card' && paymentMethod.card) {
				const cardType = paymentMethod.card.card_type || 'Карта'
				title =
					paymentMethod.title || `${cardType} *${paymentMethod.card.last4}`
				cardInfo = {
					first6: paymentMethod.card.first6,
					last4: paymentMethod.card.last4,
					expiryMonth: paymentMethod.card.expiry_month,
					expiryYear: paymentMethod.card.expiry_year,
					cardType: paymentMethod.card.card_type,
				}

				console.log(`Создается платежный метод для банковской карты: ${title}`)
			} else if (paymentMethod.type === 'yoo_money') {
				title = paymentMethod.title || 'ЮMoney'
				console.log(`Создается платежный метод для ЮMoney`)
			} else {
				title = paymentMethod.title || paymentMethod.type
				console.log(`Создается платежный метод типа ${paymentMethod.type}`)
			}

			// Проверяем, есть ли у пользователя уже способы оплаты
			const hasExistingMethods = await PaymentMethod.exists({ userId })

			// Проверяем, существует ли пользователь
			const user = await User.findById(userId)
			if (!user) {
				console.error(
					`Пользователь с ID ${userId} не найден при сохранении метода оплаты`
				)
				throw new Error(`Пользователь с ID ${userId} не найден`)
			}

			// Создаем новый метод оплаты
			const newPaymentMethod = new PaymentMethod({
				userId,
				paymentMethodId: paymentMethod.id,
				type: paymentMethod.type,
				title,
				card: cardInfo,
				isDefault: !hasExistingMethods, // Первый сохраненный метод становится методом по умолчанию
			})

			console.log(
				`Создан новый метод оплаты: ${title} для пользователя ${userId}`
			)

			// Сохраняем с дополнительной обработкой ошибок
			try {
				await newPaymentMethod.save()
				console.log(
					`Метод оплаты успешно сохранен с ID: ${newPaymentMethod._id}`
				)

				// Обновляем пользователя, чтобы включить метод оплаты
				user.paymentMethodId = String(newPaymentMethod._id)

				if (user.subscription) {
					// Проверяем, есть ли подписка
					if (!user.subscription) {
						user.subscription = {
							active: false,
							deviceLimit: 0,
							expireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней в будущее как placeholder
							autoRenewal: Boolean(paymentMethod.saved),
						}
					} else {
						user.subscription.autoRenewal = Boolean(paymentMethod.saved)
					}

					// Устанавливаем ID метода оплаты в ЮKassa
					user.subscription.defaultPaymentMethodId = paymentMethod.id
				}

				// Сохраняем обновленного пользователя с дополнительной обработкой ошибок
				try {
					await user.save()
					console.log(`Пользователь ${userId} обновлен с новым методом оплаты`)
				} catch (userSaveError) {
					console.error(
						`Ошибка при сохранении пользователя ${userId}:`,
						userSaveError
					)

					// Повторная попытка сохранения с более подробным логированием
					try {
						const userToUpdate = await User.findById(userId).exec()
						if (userToUpdate) {
							userToUpdate.paymentMethodId = String(newPaymentMethod._id)

							if (userToUpdate.subscription) {
								userToUpdate.subscription.defaultPaymentMethodId =
									paymentMethod.id
								userToUpdate.subscription.autoRenewal = Boolean(
									paymentMethod.saved
								)
							}

							await userToUpdate.save()
							console.log(
								`Пользователь ${userId} успешно сохранен со второй попытки`
							)
						}
					} catch (retryError) {
						console.error(
							'Ошибка при повторной попытке сохранения пользователя:',
							retryError
						)
						// Не выбрасываем ошибку, чтобы вернуть хотя бы метод оплаты
					}
				}

				return newPaymentMethod
			} catch (saveError) {
				console.error(`Ошибка при сохранении метода оплаты:`, saveError)
				throw saveError
			}
		} catch (error) {
			console.error('Ошибка при сохранении метода оплаты:', error)
			throw error
		}
	},

	/**
	 * Получает список сохраненных методов оплаты пользователя
	 */
	async getUserPaymentMethods(userId: string): Promise<IPaymentMethod[]> {
		return PaymentMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 })
	},

	/**
	 * Устанавливает указанный метод оплаты как метод по умолчанию
	 */
	async setDefaultPaymentMethod(
		userId: string,
		methodId: string
	): Promise<IPaymentMethod> {
		// Сначала сбрасываем флаг у всех методов пользователя
		await PaymentMethod.updateMany({ userId }, { $set: { isDefault: false } })

		// Устанавливаем флаг для выбранного метода
		const paymentMethod = await PaymentMethod.findOneAndUpdate(
			{ _id: methodId, userId },
			{ $set: { isDefault: true } },
			{ new: true }
		)

		if (!paymentMethod) {
			throw new Error('Метод оплаты не найден')
		}

		return paymentMethod
	},

	/**
	 * Удаляет платежный метод пользователя
	 */
	async deletePaymentMethod(userId: string, methodId: string): Promise<void> {
		const method = await PaymentMethod.findOne({ _id: methodId, userId })

		if (!method) {
			throw new Error('Метод оплаты не найден')
		}

		// Удаляем метод оплаты
		await PaymentMethod.deleteOne({ _id: methodId, userId })

		// Если удаленный метод был по умолчанию, установить другой метод по умолчанию
		if (method.isDefault) {
			const anotherMethod = await PaymentMethod.findOne({ userId })
			if (anotherMethod) {
				anotherMethod.isDefault = true
				await anotherMethod.save()
			}
		}
	},

	/**
	 * Проверяет подпись вебхука от ЮKassa
	 */
	verifyWebhookSignature(body: string, signature: string): boolean {
		if (!config.payment.yookassa.secretKey || !signature) {
			return false
		}

		try {
			// Создаем HMAC-SHA256 хеш из тела запроса
			const hmac = crypto.createHmac(
				'sha256',
				config.payment.yookassa.secretKey
			)
			hmac.update(body)
			const calculatedSignature = hmac.digest('base64')

			// Сравниваем подписи
			return calculatedSignature === signature
		} catch (error) {
			console.error('Ошибка при проверке подписи вебхука ЮKassa:', error)
			return false
		}
	},
}
