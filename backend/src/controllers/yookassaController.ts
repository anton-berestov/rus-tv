import { Request, Response } from 'express'
import { Schema, Types } from 'mongoose'
import config from '../config/env'
import { Payment, PaymentStatus } from '../models/Payment'
import { PaymentMethod } from '../models/PaymentMethod'
import { SubscriptionPlan } from '../models/Subscription'
import { User } from '../models/User'
import { yookassaService } from '../services/yookassaService'
import { YooKassaPaymentStatus } from '../types/yookassa'

// Создание платежа для оформления подписки через ЮKassa
export const createYookassaPayment = async (req: Request, res: Response) => {
	try {
		const {
			planId,
			returnUrl,
			savePaymentMethod = true,
			useTwoStepPayment = false,
		} = req.body

		if (!req.user) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		// Получаем полные данные пользователя из БД
		let user = req.user

		// В режиме разработки можем не обращаться к БД для получения пользователя
		if (config.server.nodeEnv !== 'development') {
			const dbUser = await User.findById(req.user._id).exec()
			if (!dbUser) {
				console.error(
					`Пользователь с ID ${req.user._id} не найден в базе данных`
				)
				return res.status(404).json({
					error: 'Пользователь не найден',
				})
			}
			user = dbUser
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
			savePaymentMethod,
			useTwoStepPayment
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
			savePaymentMethod: savePaymentMethod,
		})

		// Логируем полный URL возврата для отладки
		console.log(
			`PaymentId: ${paymentResult.paymentId}, ЮKassa вернет пользователя на: ${
				returnUrl || config.payment.yookassa.returnUrl
			}`
		)
		console.log(
			`После возврата пользователя, фронтенд должен проверить статус платежа ${paymentResult.paymentId} через API`
		)

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

		// Если в ответе есть метод оплаты, сохраняем его ID
		if (paymentResult.paymentMethod && paymentResult.paymentMethod.id) {
			payment.paymentMethodId = paymentResult.paymentMethod.id
			console.log(
				`Метод оплаты ${paymentResult.paymentMethod.id} сохранен в платеже ${payment._id}`
			)
		}

		await payment.save()

		// НОВОЕ: Запускаем асинхронную проверку статуса платежа, не дожидаясь результата
		setTimeout(async () => {
			try {
				console.log(
					`Запускаем отложенную проверку статуса платежа ${paymentResult.paymentId}...`
				)

				// Ждем 2 секунды перед проверкой
				await new Promise(resolve => setTimeout(resolve, 2000))

				// Проверяем статус
				const paymentStatus = await yookassaService.checkPaymentStatus(
					paymentResult.paymentId
				)
				console.log(
					`Результаты отложенной проверки статуса ${paymentResult.paymentId}:`,
					JSON.stringify(
						{
							status: paymentStatus.status,
							paid: paymentStatus.paid,
						},
						null,
						2
					)
				)

				// Обновляем платеж в БД
				const updatedPayment = await Payment.findOne({
					paymentId: paymentResult.paymentId,
				})
				if (updatedPayment) {
					const oldStatus = updatedPayment.status

					// Обновляем статус
					if (
						paymentStatus.paid ||
						paymentStatus.status === YooKassaPaymentStatus.SUCCEEDED
					) {
						updatedPayment.status = PaymentStatus.SUCCEEDED
						if (!updatedPayment.paidAt) {
							updatedPayment.paidAt = new Date()
						}
					} else {
						updatedPayment.status =
							paymentStatus.status === YooKassaPaymentStatus.PENDING
								? PaymentStatus.PENDING
								: paymentStatus.status ===
								  YooKassaPaymentStatus.WAITING_FOR_CAPTURE
								? PaymentStatus.PENDING
								: PaymentStatus.CANCELED
					}

					// Логируем изменение статуса
					if (oldStatus !== updatedPayment.status) {
						console.log(
							`Статус платежа ${updatedPayment._id} изменен в отложенной проверке: ${oldStatus} -> ${updatedPayment.status}`
						)
					}

					// Сохраняем метод оплаты, если он есть
					if (paymentStatus.paymentMethod && paymentStatus.paymentMethod.id) {
						updatedPayment.paymentMethodId = paymentStatus.paymentMethod.id
					}

					// Сохраняем изменения
					await updatedPayment.save()
					console.log(
						`Платеж ${updatedPayment._id} обновлен в отложенной проверке`
					)

					// Если платеж успешен, активируем подписку
					if (updatedPayment.status === PaymentStatus.SUCCEEDED) {
						// Активируем подписку, используя существующую функцию
						try {
							await activateSubscription(
								updatedPayment,
								paymentStatus.paymentMethod
							)
							console.log(
								`Подписка для платежа ${updatedPayment._id} активирована в отложенной проверке`
							)
						} catch (activationError) {
							console.error(
								`Ошибка при активации подписки в отложенной проверке:`,
								activationError
							)
						}
					}
				}
			} catch (checkError) {
				console.error(
					`Ошибка при отложенной проверке статуса платежа ${paymentResult.paymentId}:`,
					checkError
				)
			}
		}, 0)

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

// Создание автоплатежа с использованием сохраненного метода оплаты
export const createRecurringPayment = async (req: Request, res: Response) => {
	try {
		const { planId, paymentMethodId } = req.body

		if (!req.user) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		// Находим пользователя
		const user = await User.findById(req.user._id).exec()

		if (!user) {
			return res.status(404).json({
				error: 'Пользователь не найден',
			})
		}

		// Находим план подписки
		if (!Types.ObjectId.isValid(planId)) {
			return res.status(400).json({
				error: 'Некорректный ID плана подписки',
			})
		}

		const plan = await SubscriptionPlan.findById(planId).exec()

		if (!plan) {
			return res.status(404).json({
				error: 'План подписки не найден',
			})
		}

		// Находим способ оплаты
		const paymentMethod = await PaymentMethod.findOne({
			_id: paymentMethodId,
			userId: user._id,
		})

		if (!paymentMethod) {
			return res.status(404).json({
				error: 'Метод оплаты не найден',
			})
		}

		// Создаем автоплатеж в ЮKassa
		const paymentResult = await yookassaService.createRecurringPayment(
			user,
			plan,
			paymentMethod.paymentMethodId
		)

		console.log('paymentResult', paymentResult)

		// Сохраняем информацию о платеже в базе данных
		const payment = new Payment({
			userId: user._id,
			subscriptionPlanId: plan._id,
			paymentId: paymentResult.paymentId,
			status: PaymentStatus.PENDING,
			amount: paymentResult.amount,
			currency: paymentResult.currency,
			description: paymentResult.description,
			confirmationUrl: paymentResult.confirmationUrl || '',
			gateway: 'yookassa',
			isRecurring: true,
			paymentMethodId: paymentMethod.paymentMethodId,
		})

		await payment.save()

		// НОВОЕ: Запускаем асинхронную проверку статуса платежа, не дожидаясь результата
		// Это особенно важно для автоплатежей, так как они могут быть обработаны мгновенно
		setTimeout(async () => {
			try {
				console.log(
					`Запускаем серию проверок статуса автоплатежа ${paymentResult.paymentId}...`
				)

				// Функция для выполнения одной проверки
				const performCheck = async (
					attempt = 1,
					maxAttempts = 3,
					delayMs = 1500
				) => {
					console.log(
						`Выполняется проверка #${attempt} для автоплатежа ${paymentResult.paymentId}`
					)

					// Проверяем статус
					const paymentStatus = await yookassaService.checkPaymentStatus(
						paymentResult.paymentId
					)
					console.log(
						`Результаты проверки статуса #${attempt} для автоплатежа ${paymentResult.paymentId}:`,
						JSON.stringify(
							{
								status: paymentStatus.status,
								paid: paymentStatus.paid,
							},
							null,
							2
						)
					)

					// Обновляем платеж в БД
					const updatedPayment = await Payment.findOne({
						paymentId: paymentResult.paymentId,
					})
					if (!updatedPayment) {
						console.error(
							`Платеж ${paymentResult.paymentId} не найден в БД при проверке #${attempt}`
						)
						return false
					}

					const oldStatus = updatedPayment.status

					// Обновляем статус
					if (
						paymentStatus.paid ||
						paymentStatus.status === YooKassaPaymentStatus.SUCCEEDED
					) {
						updatedPayment.status = PaymentStatus.SUCCEEDED
						if (!updatedPayment.paidAt) {
							updatedPayment.paidAt = new Date()
						}

						// Сохраняем метод оплаты, если он есть
						if (paymentStatus.paymentMethod && paymentStatus.paymentMethod.id) {
							updatedPayment.paymentMethodId = paymentStatus.paymentMethod.id
						}

						// Сохраняем изменения
						await updatedPayment.save()
						console.log(
							`Платеж ${updatedPayment._id} обновлен в проверке #${attempt}, статус: ${updatedPayment.status}`
						)

						// Если платеж успешен, активируем подписку
						try {
							await activateSubscription(
								updatedPayment,
								paymentStatus.paymentMethod
							)
							console.log(
								`Подписка для платежа ${updatedPayment._id} активирована в проверке #${attempt}`
							)
						} catch (activationError) {
							console.error(
								`Ошибка при активации подписки в проверке #${attempt}:`,
								activationError
							)
						}

						// Успешный платеж - прекращаем проверки
						return true
					} else if (
						paymentStatus.status === YooKassaPaymentStatus.WAITING_FOR_CAPTURE
					) {
						// Если платеж в ожидании захвата, выполняем захват
						console.log(
							`Автоплатеж ${paymentResult.paymentId} в статусе ожидания захвата, выполняем захват...`
						)
						try {
							const captureResult = await yookassaService.capturePayment(
								paymentResult.paymentId,
								{
									value: updatedPayment.amount.toString(),
									currency: updatedPayment.currency,
								}
							)

							if (
								captureResult.paid ||
								captureResult.status === YooKassaPaymentStatus.SUCCEEDED
							) {
								updatedPayment.status = PaymentStatus.SUCCEEDED
								if (!updatedPayment.paidAt) {
									updatedPayment.paidAt = new Date()
								}

								await updatedPayment.save()
								console.log(
									`Платеж ${updatedPayment._id} успешно захвачен в проверке #${attempt}`
								)

								// Активируем подписку
								try {
									await activateSubscription(
										updatedPayment,
										captureResult.paymentMethod
									)
									console.log(
										`Подписка для платежа ${updatedPayment._id} активирована после захвата`
									)
								} catch (activationError) {
									console.error(
										`Ошибка при активации подписки после захвата:`,
										activationError
									)
								}

								return true
							}
						} catch (captureError) {
							console.error(
								`Ошибка при захвате автоплатежа ${paymentResult.paymentId}:`,
								captureError
							)
						}
					} else {
						// Обновляем статус, если он изменился
						const newStatus =
							paymentStatus.status === YooKassaPaymentStatus.PENDING
								? PaymentStatus.PENDING
								: PaymentStatus.CANCELED

						if (newStatus !== oldStatus) {
							updatedPayment.status = newStatus
							await updatedPayment.save()
							console.log(
								`Статус платежа ${updatedPayment._id} изменен в проверке #${attempt}: ${oldStatus} -> ${newStatus}`
							)
						}
					}

					// Если достигли максимального числа попыток, прекращаем проверки
					if (attempt >= maxAttempts) {
						console.log(
							`Достигнуто максимальное количество попыток (${maxAttempts}) для автоплатежа ${paymentResult.paymentId}`
						)
						return false
					}

					// Делаем паузу перед следующей попыткой
					await new Promise(resolve => setTimeout(resolve, delayMs))

					// Рекурсивно выполняем следующую попытку
					return performCheck(attempt + 1, maxAttempts, delayMs)
				}

				// Запускаем серию проверок
				await performCheck()
			} catch (checkError) {
				console.error(
					`Ошибка при проверке статуса автоплатежа ${paymentResult.paymentId}:`,
					checkError
				)
			}
		}, 0)

		res.json({
			paymentId: payment.paymentId,
			status: payment.status,
			amount: payment.amount,
			currency: payment.currency,
			isRecurring: true,
			confirmationUrl: paymentResult.confirmationUrl,
			paymentMethod: {
				id: paymentMethod._id,
				title: paymentMethod.title,
				type: paymentMethod.type,
				card: paymentMethod.card,
			},
		})
	} catch (error: any) {
		console.error('Ошибка при создании автоплатежа в ЮKassa:', error)

		// Формируем понятное сообщение об ошибке
		let errorMessage = 'Не удалось создать автоплатеж'
		let errorDetails

		if (error.response?.data) {
			console.error('Детали ошибки ЮKassa:', error.response.data)
			errorMessage = 'Ошибка платежной системы'

			if (config.server.nodeEnv === 'development') {
				errorDetails = error.response.data.description || error.message
			}
		} else {
			if (config.server.nodeEnv === 'development') {
				errorDetails = error.message
			}
		}

		res.status(500).json({
			error: errorMessage,
			details: errorDetails,
		})
	}
}

// Проверка статуса платежа и активация подписки при успешной оплате
export const checkYookassaStatus = async (req: Request, res: Response) => {
	try {
		const { paymentId } = req.params

		if (!req.user) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		// Проверка валидности paymentId
		if (!paymentId || typeof paymentId !== 'string' || paymentId.length < 10) {
			console.error(
				`Неправильный формат ID платежа: "${paymentId}", длина: ${paymentId?.length}`
			)
			return res.status(400).json({
				error: 'Некорректный ID платежа',
				details: 'ID платежа должен быть строкой не менее 10 символов',
			})
		}

		// Проверяем статус платежа в ЮKassa ПЕРЕД поиском в нашей БД
		// Это обеспечит, что у нас всегда актуальные данные от ЮKassa
		console.log(`Получаем актуальный статус платежа ${paymentId} из ЮKassa...`)

		let paymentStatus
		try {
			paymentStatus = await yookassaService.checkPaymentStatus(paymentId)

			// Логируем полный ответ от ЮKassa для отладки
			console.log(
				`Детальный ответ от ЮKassa API для платежа ${paymentId}:`,
				JSON.stringify(
					{
						status: paymentStatus.status,
						paid: paymentStatus.paid,
						paymentMethod: paymentStatus.paymentMethod,
						saved: paymentStatus.paymentMethod?.saved,
					},
					null,
					2
				)
			)
		} catch (apiError: any) {
			console.error(`Ошибка при запросе к API ЮKassa:`, apiError)

			// Если ошибка 404, то платеж не найден в ЮKassa
			if (apiError.response && apiError.response.status === 404) {
				return res.status(404).json({
					error: 'Платеж не найден в системе ЮKassa',
					details: 'Проверьте правильность идентификатора платежа',
				})
			}

			throw apiError
		}

		// Находим платеж в нашей базе
		const payment = await Payment.findOne({
			paymentId: paymentId,
			userId: req.user._id,
		}).exec()

		if (!payment) {
			console.warn(
				`Платеж ${paymentId} не найден для пользователя ${req.user._id}`
			)

			// Возвращаем статус, но не обновляем запись в БД, так как её нет
			return res.json({
				payment: {
					id: paymentId,
					status: paymentStatus.status,
					paid: paymentStatus.status === YooKassaPaymentStatus.SUCCEEDED,
					paidAt: new Date(),
				},
				paymentMethod: paymentStatus.paymentMethod
					? {
							id: paymentStatus.paymentMethod.id,
							title: paymentStatus.paymentMethod.title || 'Метод оплаты',
							type: paymentStatus.paymentMethod.type,
							card: paymentStatus.paymentMethod.card,
							isDefault: false,
					  }
					: null,
			})
		}

		// КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: ВСЕГДА обновляем статус платежа из ЮKassa
		const oldStatus = payment.status

		// Если платеж показывается как оплаченный в ЮKassa, принудительно обновляем статус
		if (
			paymentStatus.paid ||
			paymentStatus.status === YooKassaPaymentStatus.SUCCEEDED
		) {
			console.log(
				`Платеж ${paymentId} оплачен в ЮKassa. Принудительно устанавливаем SUCCEEDED.`
			)
			payment.status = PaymentStatus.SUCCEEDED

			// Устанавливаем дату оплаты, если она еще не установлена
			if (!payment.paidAt) {
				payment.paidAt = new Date()
				console.log(
					`Установлена дата оплаты для платежа ${payment._id}: ${payment.paidAt}`
				)
			}
		}
		// Если платеж в статусе ожидания захвата, выполняем захват
		else if (
			paymentStatus.status === YooKassaPaymentStatus.WAITING_FOR_CAPTURE
		) {
			console.log(`Платеж ${paymentId} ожидает захвата, подтверждаем захват...`)

			try {
				// Выполняем захват платежа
				const captureResult = await yookassaService.capturePayment(paymentId, {
					value: payment.amount.toString(),
					currency: payment.currency,
				})

				// Обновляем статус из результата захвата
				payment.status =
					captureResult.status === YooKassaPaymentStatus.SUCCEEDED
						? PaymentStatus.SUCCEEDED
						: captureResult.status === YooKassaPaymentStatus.PENDING
						? PaymentStatus.PENDING
						: PaymentStatus.CANCELED

				console.log(
					`Платеж ${paymentId} успешно захвачен, новый статус: ${payment.status}`
				)

				// Используем данные о методе оплаты из ответа захвата
				if (captureResult.paymentMethod) {
					paymentStatus.paymentMethod = captureResult.paymentMethod
				}

				// Если после захвата платеж успешен, устанавливаем дату оплаты
				if (payment.status === PaymentStatus.SUCCEEDED && !payment.paidAt) {
					payment.paidAt = new Date()
				}
			} catch (captureError: any) {
				console.error(`Ошибка при захвате платежа ${paymentId}:`, captureError)
				// Если захват не удался, оставляем статус как есть
			}
		} else {
			// Обновляем статус платежа в нашей базе согласно ответу от ЮKassa
			payment.status =
				paymentStatus.status === YooKassaPaymentStatus.SUCCEEDED
					? PaymentStatus.SUCCEEDED
					: paymentStatus.status === YooKassaPaymentStatus.PENDING
					? PaymentStatus.PENDING
					: PaymentStatus.CANCELED
		}

		// Логируем изменение статуса
		if (oldStatus !== payment.status) {
			console.log(
				`Статус платежа ${payment._id} изменен: ${oldStatus} -> ${payment.status}`
			)
		}

		// Если в ответе есть метод оплаты, всегда сохраняем его ID
		if (paymentStatus.paymentMethod && paymentStatus.paymentMethod.id) {
			payment.paymentMethodId = paymentStatus.paymentMethod.id
			console.log(
				`Метод оплаты ${paymentStatus.paymentMethod.id} сохранен в платеже ${payment._id}`
			)
		}

		// ОБЯЗАТЕЛЬНО сохраняем обновления в платеже
		try {
			await payment.save()
			console.log(
				`Платеж ${payment._id} успешно сохранен в БД со статусом ${payment.status}`
			)
		} catch (saveError) {
			console.error(
				`КРИТИЧЕСКАЯ ОШИБКА: Не удалось сохранить платеж ${payment._id}:`,
				saveError
			)
			// Продолжаем выполнение, чтобы попробовать активировать подписку
		}

		// Если платеж был успешно оплачен, активируем подписку
		// ИЗМЕНЕНИЕ: проверяем только статус, а не paidAt
		if (payment.status === PaymentStatus.SUCCEEDED) {
			console.log(`Платеж ${payment._id} успешен, активируем подписку...`)

			// Активируем подписку пользователя
			const [user, plan] = await Promise.all([
				User.findById(payment.userId).exec(),
				SubscriptionPlan.findById(payment.subscriptionPlanId).exec(),
			])

			if (user && plan) {
				// Расчет даты истечения подписки
				const expireDate = new Date()
				expireDate.setMonth(expireDate.getMonth() + plan.monthDuration)

				console.log(
					`Активация подписки для пользователя ${user._id}, план: ${plan.name}`
				)

				// Сохраняем предыдущие настройки подписки, которые хотим сохранить
				const previousSubscription = user.subscription || {}

				// Обновляем подписку пользователя
				const newSubscription = {
					active: true,
					deviceLimit: plan.deviceLimit,
					expireDate,
					planId: plan._id as unknown as Schema.Types.ObjectId,
					// Сохраняем lastPaymentId, если он был
					lastPaymentId: payment._id as unknown as Schema.Types.ObjectId,
					// Если метод оплаты был сохранен, включаем автоматическое продление
					autoRenewal: Boolean(paymentStatus.paymentMethod?.saved),
					// Сохраняем defaultPaymentMethodId, если он был
					defaultPaymentMethodId: previousSubscription.defaultPaymentMethodId,
				}

				console.log('Новые данные подписки:', newSubscription)

				// Устанавливаем подписку
				user.subscription = newSubscription

				// Если метод оплаты был сохранен, сохраняем его в базе данных
				if (paymentStatus.paymentMethod && paymentStatus.paymentMethod.saved) {
					// Сохраняем метод оплаты
					try {
						const newSavedMethod = await yookassaService.savePaymentMethod(
							user._id.toString(),
							paymentStatus.paymentMethod
						)

						console.log(
							`Сохранен метод оплаты: ${newSavedMethod.title} (${newSavedMethod._id})`
						)

						// Устанавливаем этот метод оплаты для автопродления
						user.paymentMethodId = String(newSavedMethod._id)
						user.subscription.defaultPaymentMethodId =
							paymentStatus.paymentMethod.id
					} catch (saveMethodError) {
						console.error(
							'Ошибка при сохранении метода оплаты:',
							saveMethodError
						)
						// Не прерываем выполнение, чтобы завершить активацию подписки
					}
				}

				// Сохраняем пользователя
				try {
					await user.save()
					console.log(`Подписка пользователя ${user._id} успешно активирована`)

					// Дополнительная проверка обновления
					const updatedUser = await User.findById(user._id).exec()
					if (updatedUser && updatedUser.subscription?.active) {
						console.log(
							`Проверка успешна: подписка пользователя ${user._id} активна, лимит устройств: ${updatedUser.subscription.deviceLimit}`
						)
					} else {
						console.error(
							`Ошибка: данные подписки пользователя ${user._id} не обновились корректно`
						)
					}
				} catch (saveError) {
					console.error(
						`Ошибка при сохранении пользователя ${user._id}:`,
						saveError
					)

					// Повторная попытка сохранения
					try {
						const userToUpdate = await User.findById(user._id).exec()
						if (userToUpdate) {
							userToUpdate.subscription = newSubscription
							if (user.paymentMethodId) {
								userToUpdate.paymentMethodId = user.paymentMethodId
							}
							await userToUpdate.save()
							console.log('Пользователь успешно сохранен со второй попытки')
						}
					} catch (retryError) {
						console.error(
							'Ошибка при повторной попытке сохранения:',
							retryError
						)
					}
				}
			} else {
				console.error(
					`Ошибка активации подписки: пользователь или план не найдены (userId: ${payment.userId}, planId: ${payment.subscriptionPlanId})`
				)
			}
		}

		// Сохраняем обновленный платеж
		try {
			await payment.save()
			console.log(
				`Платеж ${payment._id} успешно сохранен со статусом ${payment.status}`
			)
		} catch (saveError) {
			console.error(`Ошибка при сохранении платежа ${payment._id}:`, saveError)
		}

		// Собираем информацию о платежном методе, если он был использован
		let paymentMethodInfo = null
		if (paymentStatus.paymentMethod) {
			// Ищем сохраненный метод оплаты
			const savedMethod = await PaymentMethod.findOne({
				paymentMethodId: paymentStatus.paymentMethod.id,
				userId: req.user._id,
			})

			if (savedMethod) {
				paymentMethodInfo = {
					id: savedMethod._id,
					title: savedMethod.title,
					type: savedMethod.type,
					card: savedMethod.card,
					isDefault: savedMethod.isDefault,
				}
			} else if (paymentStatus.paymentMethod.saved) {
				// Если метод оплаты был сохранен, но еще не добавлен в нашу базу
				const newSavedMethod = await yookassaService.savePaymentMethod(
					req.user._id.toString(),
					paymentStatus.paymentMethod
				)

				paymentMethodInfo = {
					id: newSavedMethod._id,
					title: newSavedMethod.title,
					type: newSavedMethod.type,
					card: newSavedMethod.card,
					isDefault: newSavedMethod.isDefault,
				}
			}
		}

		res.json({
			payment: {
				id: payment._id,
				status: payment.status,
				paid: payment.status === PaymentStatus.SUCCEEDED,
				paidAt: payment.paidAt,
			},
			paymentMethod: paymentMethodInfo,
		})
	} catch (error: any) {
		console.error('Ошибка при проверке статуса платежа в ЮKassa:', error)
		res.status(500).json({
			error: 'Не удалось проверить статус платежа',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

// Получение списка сохраненных методов оплаты
export const getPaymentMethods = async (req: Request, res: Response) => {
	try {
		if (!req.user) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		const methods = await yookassaService.getUserPaymentMethods(
			req.user._id.toString()
		)

		res.json({
			methods: methods.map(method => ({
				id: method._id,
				title: method.title,
				type: method.type,
				card: method.card,
				isDefault: method.isDefault,
			})),
		})
	} catch (error: any) {
		console.error('Ошибка при получении методов оплаты:', error)
		res.status(500).json({
			error: 'Не удалось получить методы оплаты',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

// Установка метода оплаты по умолчанию
export const setDefaultPaymentMethod = async (req: Request, res: Response) => {
	try {
		const { methodId } = req.params

		if (!req.user) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		const method = await yookassaService.setDefaultPaymentMethod(
			req.user._id.toString(),
			methodId
		)

		res.json({
			method: {
				id: method._id,
				title: method.title,
				type: method.type,
				card: method.card,
				isDefault: method.isDefault,
			},
		})
	} catch (error: any) {
		console.error('Ошибка при установке метода оплаты по умолчанию:', error)
		res.status(500).json({
			error: 'Не удалось установить метод оплаты по умолчанию',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

// Удаление метода оплаты
export const deletePaymentMethod = async (req: Request, res: Response) => {
	try {
		const { methodId } = req.params

		if (!req.user) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		await yookassaService.deletePaymentMethod(req.user._id.toString(), methodId)

		res.json({
			success: true,
			message: 'Метод оплаты успешно удален',
		})
	} catch (error: any) {
		console.error('Ошибка при удалении метода оплаты:', error)
		res.status(500).json({
			error: 'Не удалось удалить метод оплаты',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

// Обработка webhook уведомлений от ЮKassa
export const handleYookassaWebhook = async (req: Request, res: Response) => {
	try {
		// Проверяем подпись от ЮKassa для безопасности
		const signature = req.headers['yookassa-signature'] as string
		const isValidSignature = yookassaService.verifyWebhookSignature(
			JSON.stringify(req.body),
			signature
		)

		if (!isValidSignature) {
			return res.status(401).json({
				error: 'Неверная подпись',
			})
		}

		// Получаем данные события
		const event = req.body.event
		const payment = req.body.object

		if (!event || !payment || !payment.id) {
			return res.status(400).json({
				error: 'Некорректные данные уведомления',
			})
		}

		console.log(
			`Получено уведомление ЮKassa: ${event} для платежа ${payment.id}`
		)

		// Логируем URL возврата, если он есть, для отладки
		if (payment.confirmation && payment.confirmation.return_url) {
			console.log(`URL возврата из вебхука: ${payment.confirmation.return_url}`)

			// Проверяем, содержит ли URL плейсхолдер для ID платежа
			if (payment.confirmation.return_url.includes('PAYMENT_ID_PLACEHOLDER')) {
				console.log(
					'URL содержит плейсхолдер, который нужно заменить на реальный ID платежа'
				)
			}
		}

		// ВАЖНОЕ ИЗМЕНЕНИЕ: Дополнительно проверяем статус платежа напрямую в API
		// Это может дать более полную и актуальную информацию
		let apiPaymentStatus = null // Создаем переменную для хранения статуса из API
		try {
			console.log(
				`Дополнительно проверяем статус платежа ${payment.id} через API...`
			)
			apiPaymentStatus = await yookassaService.checkPaymentStatus(payment.id)
			console.log(
				`Результат проверки API для ${payment.id}:`,
				JSON.stringify(
					{
						status: apiPaymentStatus.status,
						paid: apiPaymentStatus.paid,
						paymentMethod: apiPaymentStatus.paymentMethod
							? {
									id: apiPaymentStatus.paymentMethod.id,
									type: apiPaymentStatus.paymentMethod.type,
									saved: apiPaymentStatus.paymentMethod.saved,
							  }
							: null,
					},
					null,
					2
				)
			)

			// Обновляем информацию о платеже из API, если она отличается
			if (
				apiPaymentStatus.status !== payment.status ||
				apiPaymentStatus.paid !== payment.paid
			) {
				console.log(
					`Обновляем информацию о платеже из API (статус: ${payment.status} -> ${apiPaymentStatus.status})`
				)
				payment.status = apiPaymentStatus.status
				payment.paid = apiPaymentStatus.paid
			}

			// Если в API есть информация о методе оплаты, используем её
			if (apiPaymentStatus.paymentMethod && !payment.payment_method) {
				console.log('Используем информацию о методе оплаты из API')
				payment.payment_method = apiPaymentStatus.paymentMethod
			}
		} catch (apiError) {
			console.error(
				`Ошибка при дополнительной проверке статуса ${payment.id}:`,
				apiError
			)
			// Не прерываем обработку вебхука при ошибке дополнительной проверки
		}

		// Находим платеж в нашей базе
		const paymentRecord = await Payment.findOne({
			paymentId: payment.id,
		}).exec()

		if (!paymentRecord) {
			console.log(
				`Платеж ${payment.id} не найден в базе, возможно внешний платеж`
			)
			return res.status(200).json({ received: true })
		}

		// ВАЖНОЕ ИЗМЕНЕНИЕ: Всегда принудительно обновляем статус, если платеж завершен
		let oldStatus = paymentRecord.status
		if (
			payment.paid === true ||
			payment.status === YooKassaPaymentStatus.SUCCEEDED
		) {
			paymentRecord.status = PaymentStatus.SUCCEEDED

			// Устанавливаем дату оплаты, если она не установлена
			if (!paymentRecord.paidAt) {
				paymentRecord.paidAt = new Date(
					payment.captured_at || payment.created_at || new Date()
				)
			}

			console.log(
				`Платеж ${payment.id} помечен как успешный по данным вебхука/API`
			)
		}
		// Обрабатываем событие в зависимости от его типа, только если платеж не завершен
		else if (event === 'payment.succeeded') {
			// Обновляем статус платежа на успешный
			paymentRecord.status = PaymentStatus.SUCCEEDED
			paymentRecord.paidAt = new Date()
		} else if (event === 'payment.canceled') {
			// Обновляем статус платежа на отмененный
			paymentRecord.status = PaymentStatus.CANCELED
		} else if (event === 'payment.waiting_for_capture') {
			// Для платежей, требующих подтверждения (если используется двухстадийная оплата)
			paymentRecord.status = PaymentStatus.PENDING

			// НОВОЕ: Автоматически пытаемся захватить платеж в ожидании
			try {
				console.log(
					`Автоматический захват платежа ${payment.id} в статусе waiting_for_capture`
				)
				const captureResult = await yookassaService.capturePayment(payment.id, {
					value: paymentRecord.amount.toString(),
					currency: paymentRecord.currency,
				})

				if (
					captureResult.paid ||
					captureResult.status === YooKassaPaymentStatus.SUCCEEDED
				) {
					console.log(`Платеж ${payment.id} успешно захвачен`)
					paymentRecord.status = PaymentStatus.SUCCEEDED
					paymentRecord.paidAt = new Date()

					// Обновляем метод оплаты из результата захвата
					if (captureResult.paymentMethod) {
						payment.payment_method = captureResult.paymentMethod
					}
				}
			} catch (captureError) {
				console.error(
					`Ошибка при автоматическом захвате платежа ${payment.id}:`,
					captureError
				)
				// Не прерываем обработку вебхука при ошибке захвата
			}
		}

		// Если есть информация о методе оплаты, сохраняем её в платеже
		if (payment.payment_method && payment.payment_method.id) {
			paymentRecord.paymentMethodId = payment.payment_method.id
			console.log(
				`Метод оплаты ${payment.payment_method.id} сохранен в платеже ${paymentRecord._id}`
			)
		}

		// Проверяем данные метода оплаты из вебхука
		console.log(
			'Данные метода оплаты из вебхука:',
			JSON.stringify(payment.payment_method, null, 2)
		)

		// Если платеж успешен, но нет флага saved, устанавливаем его, если есть данные карты
		if (
			payment.payment_method &&
			!payment.payment_method.saved &&
			payment.payment_method.card &&
			payment.payment_method.type === 'bank_card'
		) {
			console.log(
				'Метод оплаты имеет все необходимые данные, но не отмечен как сохраненный. Устанавливаем saved=true'
			)
			payment.payment_method.saved = true
		}

		// Если платеж был успешно оплачен, активируем подписку
		// ИЗМЕНЕНИЕ: проверяем только статус, а не paidAt
		if (payment.status === PaymentStatus.SUCCEEDED) {
			console.log(`Платеж ${payment._id} успешен, активируем подписку...`)

			// Активируем подписку пользователя
			const [user, plan] = await Promise.all([
				User.findById(payment.userId).exec(),
				SubscriptionPlan.findById(payment.subscriptionPlanId).exec(),
			])

			if (user && plan) {
				// Расчет даты истечения подписки
				const expireDate = new Date()
				expireDate.setMonth(expireDate.getMonth() + plan.monthDuration)

				console.log(
					`Активация подписки для пользователя ${user._id}, план: ${plan.name}`
				)

				// Сохраняем предыдущие настройки подписки, которые хотим сохранить
				const previousSubscription = user.subscription || {}

				// Обновляем подписку пользователя
				const newSubscription = {
					active: true,
					deviceLimit: plan.deviceLimit,
					expireDate,
					planId: plan._id as unknown as Schema.Types.ObjectId,
					// Сохраняем lastPaymentId, если он был
					lastPaymentId: payment._id as unknown as Schema.Types.ObjectId,
					// Если метод оплаты был сохранен, включаем автоматическое продление
					autoRenewal: Boolean(
						payment.payment_method?.saved ||
							(apiPaymentStatus && apiPaymentStatus.paymentMethod?.saved)
					),
					// Сохраняем defaultPaymentMethodId, если он был
					defaultPaymentMethodId: previousSubscription.defaultPaymentMethodId,
				}

				console.log('Новые данные подписки:', newSubscription)

				// Устанавливаем подписку
				user.subscription = newSubscription

				// Выбираем метод оплаты для сохранения (предпочитаем данные из API, если они есть)
				const paymentMethodToSave =
					apiPaymentStatus &&
					apiPaymentStatus.paymentMethod &&
					apiPaymentStatus.paymentMethod.saved
						? apiPaymentStatus.paymentMethod
						: payment.payment_method

				// Если метод оплаты был сохранен, сохраняем его в базе данных
				if (paymentMethodToSave && paymentMethodToSave.saved) {
					// Сохраняем метод оплаты
					try {
						const newSavedMethod = await yookassaService.savePaymentMethod(
							user._id.toString(),
							paymentMethodToSave
						)

						console.log(
							`Сохранен метод оплаты: ${newSavedMethod.title} (${newSavedMethod._id})`
						)

						// Устанавливаем этот метод оплаты для автопродления
						user.paymentMethodId = String(newSavedMethod._id)
						user.subscription.defaultPaymentMethodId = paymentMethodToSave.id
					} catch (saveMethodError) {
						console.error(
							'Ошибка при сохранении метода оплаты:',
							saveMethodError
						)
						// Не прерываем выполнение, чтобы завершить активацию подписки
					}
				}

				// Сохраняем пользователя
				try {
					await user.save()
					console.log(`Подписка пользователя ${user._id} успешно активирована`)

					// Дополнительная проверка обновления
					const updatedUser = await User.findById(user._id).exec()
					if (updatedUser && updatedUser.subscription?.active) {
						console.log(
							`Проверка успешна: подписка пользователя ${user._id} активна, лимит устройств: ${updatedUser.subscription.deviceLimit}`
						)
					} else {
						console.error(
							`Ошибка: данные подписки пользователя ${user._id} не обновились корректно`
						)
					}
				} catch (saveError) {
					console.error(
						`Ошибка при сохранении пользователя ${user._id}:`,
						saveError
					)

					// Повторная попытка сохранения
					try {
						const userToUpdate = await User.findById(user._id).exec()
						if (userToUpdate) {
							userToUpdate.subscription = newSubscription
							if (user.paymentMethodId) {
								userToUpdate.paymentMethodId = user.paymentMethodId
							}
							await userToUpdate.save()
							console.log('Пользователь успешно сохранен со второй попытки')
						}
					} catch (retryError) {
						console.error(
							'Ошибка при повторной попытке сохранения:',
							retryError
						)
					}
				}
			} else {
				console.error(
					`Ошибка активации подписки: пользователь или план не найдены (userId: ${payment.userId}, planId: ${payment.subscriptionPlanId})`
				)
			}
		}

		// Сохраняем обновленный платеж
		await paymentRecord.save()

		// Отвечаем 200 OK
		res.status(200).json({ received: true })
	} catch (error: any) {
		console.error('Ошибка при обработке вебхука ЮKassa:', error)
		// Отвечаем 200 OK, чтобы не получать повторные уведомления
		res.status(200).json({
			received: true,
			error: 'Ошибка обработки',
		})
	}
}

// Явное подтверждение платежа (для двухэтапной оплаты)
export const capturePayment = async (req: Request, res: Response) => {
	try {
		const { paymentId } = req.params
		const { amount } = req.body

		if (!req.user) {
			return res.status(401).json({
				error: 'Пользователь не авторизован',
			})
		}

		console.log(
			`Запрос на захват платежа ${paymentId} от пользователя ${req.user._id}`
		)

		// Проверяем текущий статус платежа в ЮKassa перед захватом
		console.log(
			`Проверяем текущий статус платежа ${paymentId} перед захватом...`
		)
		const currentStatus = await yookassaService.checkPaymentStatus(paymentId)

		console.log(
			`Текущий статус платежа ${paymentId}:`,
			JSON.stringify(
				{
					status: currentStatus.status,
					paid: currentStatus.paid,
				},
				null,
				2
			)
		)

		// Если платеж уже оплачен или не требует захвата, возвращаем его текущий статус
		if (
			currentStatus.paid ||
			currentStatus.status === YooKassaPaymentStatus.SUCCEEDED
		) {
			console.log(
				`Платеж ${paymentId} уже оплачен (статус: ${currentStatus.status})`
			)

			// Находим платеж в нашей базе
			const payment = await Payment.findOne({
				paymentId: paymentId,
				userId: req.user._id,
			}).exec()

			// Обновляем платеж в нашей БД, если он найден
			if (payment) {
				console.log(
					`Обновляем статус платежа ${paymentId} в нашей БД на SUCCEEDED`
				)
				payment.status = PaymentStatus.SUCCEEDED
				if (!payment.paidAt) {
					payment.paidAt = new Date()
				}
				await payment.save()

				// Активируем подписку, если платеж успешен
				await activateSubscription(payment, currentStatus.paymentMethod)

				return res.json({
					payment: {
						id: payment._id,
						paymentId: payment.paymentId,
						status: payment.status,
						paid: true,
						paidAt: payment.paidAt,
					},
					captureResult: {
						status: currentStatus.status,
						paid: currentStatus.paid,
					},
				})
			}

			return res.json({
				payment: {
					id: null,
					paymentId: paymentId,
					status: 'succeeded',
					paid: true,
					paidAt: new Date(),
				},
				captureResult: {
					status: currentStatus.status,
					paid: currentStatus.paid,
				},
			})
		}

		// Если платеж не в статусе ожидания захвата, возвращаем ошибку
		if (currentStatus.status !== YooKassaPaymentStatus.WAITING_FOR_CAPTURE) {
			return res.status(400).json({
				error: 'Платеж не находится в статусе ожидания захвата',
				status: currentStatus.status,
			})
		}

		// Находим платеж в нашей базе
		const payment = await Payment.findOne({
			paymentId: paymentId,
			userId: req.user._id,
		}).exec()

		if (!payment) {
			console.warn(
				`Платеж ${paymentId} не найден для пользователя ${req.user._id}`
			)
			return res.status(404).json({
				error: 'Платеж не найден',
			})
		}

		// Подготавливаем параметры захвата
		const captureAmount = amount || {
			value: payment.amount.toString(),
			currency: payment.currency,
		}

		// Выполняем захват платежа
		console.log(`Выполняем захват платежа ${paymentId}...`)
		const captureResult = await yookassaService.capturePayment(
			paymentId,
			captureAmount
		)

		console.log(
			`Результат захвата платежа ${paymentId}:`,
			JSON.stringify(
				{
					status: captureResult.status,
					paid: captureResult.paid,
				},
				null,
				2
			)
		)

		// Обновляем статус платежа в нашей базе
		const oldStatus = payment.status
		payment.status =
			captureResult.status === YooKassaPaymentStatus.SUCCEEDED
				? PaymentStatus.SUCCEEDED
				: captureResult.status === YooKassaPaymentStatus.PENDING
				? PaymentStatus.PENDING
				: PaymentStatus.CANCELED

		console.log(
			`Статус платежа ${paymentId} изменен: ${oldStatus} -> ${payment.status}`
		)

		// Если платеж был успешно оплачен, обновляем дату платежа
		if (
			payment.status === PaymentStatus.SUCCEEDED &&
			(!payment.paidAt || oldStatus !== PaymentStatus.SUCCEEDED)
		) {
			payment.paidAt = new Date()
			console.log(
				`Установлена дата оплаты для платежа ${payment._id}: ${payment.paidAt}`
			)

			// Активируем подписку
			await activateSubscription(payment, captureResult.paymentMethod)
		}

		// Сохраняем обновленный платеж
		await payment.save()
		console.log(
			`Платеж ${payment._id} успешно сохранен со статусом ${payment.status}`
		)

		// Возвращаем результат
		res.json({
			payment: {
				id: payment._id,
				paymentId: payment.paymentId,
				status: payment.status,
				paid: payment.status === PaymentStatus.SUCCEEDED,
				paidAt: payment.paidAt,
			},
			captureResult: {
				status: captureResult.status,
				paid: captureResult.paid,
			},
		})
	} catch (error: any) {
		console.error('Ошибка при захвате платежа:', error)
		res.status(500).json({
			error: 'Не удалось выполнить захват платежа',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

// Вспомогательная функция для активации подписки
async function activateSubscription(payment: any, paymentMethod: any) {
	try {
		// Активируем подписку пользователя
		const [user, plan] = await Promise.all([
			User.findById(payment.userId).exec(),
			SubscriptionPlan.findById(payment.subscriptionPlanId).exec(),
		])

		if (user && plan) {
			// Расчет даты истечения подписки
			const expireDate = new Date()
			expireDate.setMonth(expireDate.getMonth() + plan.monthDuration)

			console.log(
				`Активация подписки для пользователя ${user._id}, план: ${plan.name}`
			)

			// Сохраняем предыдущие настройки подписки, которые хотим сохранить
			const previousSubscription = user.subscription || {}

			// Обновляем подписку пользователя
			const newSubscription = {
				active: true,
				deviceLimit: plan.deviceLimit,
				expireDate,
				planId: plan._id as unknown as Schema.Types.ObjectId,
				// Сохраняем lastPaymentId, если он был
				lastPaymentId: payment._id as unknown as Schema.Types.ObjectId,
				// Если метод оплаты был сохранен, включаем автоматическое продление
				autoRenewal: Boolean(paymentMethod?.saved),
				// Сохраняем defaultPaymentMethodId, если он был
				defaultPaymentMethodId: previousSubscription.defaultPaymentMethodId,
			}

			console.log('Новые данные подписки:', newSubscription)

			// Устанавливаем подписку
			user.subscription = newSubscription

			// Если метод оплаты был сохранен, сохраняем его в базе данных
			if (paymentMethod && paymentMethod.saved) {
				// Сохраняем метод оплаты
				try {
					const newSavedMethod = await yookassaService.savePaymentMethod(
						user._id.toString(),
						paymentMethod
					)

					console.log(
						`Сохранен метод оплаты: ${newSavedMethod.title} (${newSavedMethod._id})`
					)

					// Устанавливаем этот метод оплаты для автопродления
					user.paymentMethodId = String(newSavedMethod._id)
					user.subscription.defaultPaymentMethodId = paymentMethod.id
				} catch (saveMethodError) {
					console.error('Ошибка при сохранении метода оплаты:', saveMethodError)
					// Не прерываем выполнение, чтобы завершить активацию подписки
				}
			}

			// Сохраняем пользователя
			try {
				await user.save()
				console.log(`Подписка пользователя ${user._id} успешно активирована`)

				// Дополнительная проверка обновления
				const updatedUser = await User.findById(user._id).exec()
				if (updatedUser && updatedUser.subscription?.active) {
					console.log(
						`Проверка успешна: подписка пользователя ${user._id} активна, лимит устройств: ${updatedUser.subscription.deviceLimit}`
					)
				} else {
					console.error(
						`Ошибка: данные подписки пользователя ${user._id} не обновились корректно`
					)
				}
			} catch (saveError) {
				console.error(
					`Ошибка при сохранении пользователя ${user._id}:`,
					saveError
				)

				// Повторная попытка сохранения
				try {
					const userToUpdate = await User.findById(user._id).exec()
					if (userToUpdate) {
						userToUpdate.subscription = newSubscription
						if (user.paymentMethodId) {
							userToUpdate.paymentMethodId = user.paymentMethodId
						}
						await userToUpdate.save()
						console.log('Пользователь успешно сохранен со второй попытки')
					}
				} catch (retryError) {
					console.error('Ошибка при повторной попытке сохранения:', retryError)
				}
			}
		} else {
			console.error(
				`Ошибка активации подписки: пользователь или план не найдены (userId: ${payment.userId}, planId: ${payment.subscriptionPlanId})`
			)
			return false
		}
	} catch (error) {
		console.error('Ошибка при активации подписки:', error)
		return false
	}
}
