import axios from 'axios'
import { defineStore } from 'pinia'
import router from '../router'

interface User {
	id: string
	email: string
	username: string
	subscription: {
		active: boolean
		deviceLimit: number
		expireDate: Date
		planId?: string
		lastPaymentId?: string
		autoRenewal?: boolean
	}
	phoneNumber?: string
	isAdmin?: boolean
	activeDevices?: any[]
}

export const useAuthStore = defineStore('auth', {
	state: () => ({
		user: null as User | null,
		token: null as string | null,
		isAuthenticated: false,
		isLoading: false,
		isInitialized: false,
		error: null as string | null,
		subscriptionPlans: [] as any[],
		paymentMethods: [] as any[],
	}),

	actions: {
		async initialize() {
			try {
				console.log('Начинаем инициализацию авторизации...')
				this.token = localStorage.getItem('token')

				if (this.token) {
					console.log(
						'Токен найден в localStorage:',
						this.token.substring(0, 10) + '...'
					)
					this.isAuthenticated = true
					axios.defaults.headers.common[
						'Authorization'
					] = `Bearer ${this.token}`

					try {
						console.log('Запрашиваем профиль пользователя...')
						await this.fetchUserProfile()
						console.log('Профиль пользователя успешно загружен:', this.user)
					} catch (err) {
						console.error('Ошибка при загрузке профиля:', err)
						throw err
					}

					try {
						console.log('Запрашиваем планы подписки...')
						await this.fetchSubscriptionPlans()
						console.log(
							'Планы подписки успешно загружены:',
							this.subscriptionPlans.length
						)
					} catch (err) {
						console.error('Ошибка при загрузке планов подписки:', err)
						// Не выбрасываем ошибку, чтобы продолжить инициализацию
					}

					try {
						console.log('Запрашиваем методы оплаты...')
						await this.fetchPaymentMethods()
						console.log(
							'Методы оплаты успешно загружены:',
							this.paymentMethods.length
						)
					} catch (err) {
						console.error('Ошибка при загрузке методов оплаты:', err)
						// Не выбрасываем ошибку, чтобы продолжить инициализацию
					}
				} else {
					console.log('Токен не найден в localStorage')
				}
			} catch (error) {
				console.error('Критическая ошибка при инициализации:', error)
				this.clearAuth()
			} finally {
				console.log('Инициализация завершена')
				this.isInitialized = true // Установим флаг в любом случае после завершения
			}
		},

		// Алиас для initialize() для обратной совместимости
		async init() {
			return this.initialize()
		},

		setToken(token: string) {
			this.token = token
			this.isAuthenticated = true
			localStorage.setItem('token', token)
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
		},

		clearAuth() {
			this.user = null
			this.token = null
			this.isAuthenticated = false
			localStorage.removeItem('token')
			delete axios.defaults.headers.common['Authorization']
		},

		logout() {
			this.clearAuth()
			router.push('/login')
		},

		// Метод для обновления токена или перенаправления на страницу входа
		async refreshTokenOrReLogin() {
			try {
				console.log('Пытаемся обновить данные авторизации...')
				// Проверяем, есть ли токен в localStorage
				const savedToken = localStorage.getItem('token')

				if (savedToken && savedToken !== this.token) {
					// Если токен в localStorage отличается от текущего, используем его
					console.log('Обновляем токен из localStorage')
					this.setToken(savedToken)
					// Проверяем валидность токена
					await this.fetchUserProfile()
					return true
				}

				// В этом месте можно было бы добавить запрос на обновление токена через refresh token API
				// если такой механизм есть в бэкенде

				// Если токен не удалось обновить, очищаем авторизацию
				console.log('Не удалось обновить токен, выполняем выход')
				this.clearAuth()
				return false
			} catch (error) {
				console.error('Ошибка при обновлении токена:', error)
				this.clearAuth()
				return false
			}
		},

		async login(email: string, password: string) {
			this.isLoading = true
			this.error = null

			try {
				const response = await axios.post('/api/users/login', {
					email,
					password,
				})

				if (!response.data.token) {
					throw new Error('Токен не получен от сервера')
				}

				this.setToken(response.data.token)
				await this.fetchUserProfile()

				return true
			} catch (error: any) {
				console.error('Ошибка авторизации:', error)
				this.error = error.response?.data?.error || 'Ошибка при входе в систему'
				return false
			} finally {
				this.isLoading = false
			}
		},

		async register(username: string, email: string, password: string) {
			this.isLoading = true
			this.error = null

			try {
				const response = await axios.post('/api/users/register', {
					username,
					email,
					password,
				})

				this.setToken(response.data.token)
				await this.fetchUserProfile()

				return true
			} catch (error: any) {
				this.error = error.response?.data?.error || 'Ошибка при регистрации'
				return false
			} finally {
				this.isLoading = false
			}
		},

		async fetchUserProfile() {
			if (!this.token) {
				console.warn('fetchUserProfile вызван без токена')
				return
			}

			try {
				// Проверяем, установлен ли заголовок Authorization
				if (!axios.defaults.headers.common['Authorization']) {
					axios.defaults.headers.common[
						'Authorization'
					] = `Bearer ${this.token}`
				}

				// Добавляем случайный параметр для обхода кэша
				const response = await axios.get(`/api/users/profile?_=${Date.now()}`)

				if (response.data && response.data.user) {
					// Сохраняем предыдущие данные для сравнения
					const prevUser = this.user

					// Обновляем данные пользователя
					this.user = response.data.user

					// Логируем изменения для отладки
					if (prevUser && prevUser.subscription) {
						console.log('Предыдущие данные подписки:', {
							active: prevUser.subscription.active,
							deviceLimit: prevUser.subscription.deviceLimit,
							expireDate: prevUser.subscription.expireDate,
						})
					}

					console.log('Новые данные подписки:', {
						active: this.user?.subscription?.active,
						deviceLimit: this.user?.subscription?.deviceLimit,
						expireDate: this.user?.subscription?.expireDate,
					})

					return this.user
				} else {
					console.error('Некорректный формат ответа API:', response.data)
					throw new Error('Некорректный формат ответа API')
				}
			} catch (error: any) {
				console.error('Ошибка при получении профиля:', error)
				console.log('Статус ошибки:', error.response?.status)
				console.log('Данные ошибки:', error.response?.data)

				if (error.response?.status === 401) {
					console.warn('Токен неверный или истек. Выполняем выход.')
					this.clearAuth()
				}
				throw error
			}
		},

		async updateProfile(userData: any) {
			try {
				const response = await axios.put('/api/users/profile', userData)
				this.user = response.data.user
				return true
			} catch (error: any) {
				this.error =
					error.response?.data?.error || 'Ошибка при обновлении профиля'
				return false
			}
		},

		async fetchSubscriptionPlans() {
			try {
				const response = await axios.get('/api/subscriptions/plans')
				this.subscriptionPlans = response.data.plans
			} catch (error) {
				console.error('Ошибка при получении планов подписки:', error)
			}
		},

		// Методы для работы с ЮKassa

		// Создание платежа через ЮKassa
		async createYookassaPayment(
			planId: string,
			returnUrl?: string,
			savePaymentMethod: boolean = true,
			useTwoStepPayment: boolean = false
		) {
			try {
				console.log('Создание платежа через ЮKassa:', {
					planId,
					returnUrl: returnUrl || '(не указан)',
					savePaymentMethod,
					useTwoStepPayment,
				})

				// Проверяем установлен ли токен
				if (!this.token && !axios.defaults.headers.common['Authorization']) {
					console.warn('Создание платежа без токена авторизации')
				}

				const response = await axios.post('/api/yookassa/payment', {
					planId,
					returnUrl,
					savePaymentMethod,
					useTwoStepPayment,
				})

				console.log('Получен ответ от API:', response.data)
				return response.data
			} catch (error: any) {
				console.error('Ошибка при создании платежа через ЮKassa:', error)

				// Если это ошибка от сервера с данными
				if (error.response?.data) {
					console.error('Детали ошибки:', error.response.data)
				}

				throw error
			}
		},

		// Создание автоплатежа через ЮKassa
		async createRecurringPayment(planId: string, paymentMethodId: string) {
			try {
				// Добавляем логирование
				console.log('Создание автоплатежа с параметрами:', {
					planId,
					paymentMethodId,
					timestamp: new Date().toISOString(),
				})

				// Отправляем запрос на создание автоплатежа
				const response = await axios.post('/api/yookassa/recurring-payment', {
					planId,
					paymentMethodId,
				})

				console.log('Ответ сервера на запрос автоплатежа:', response.data)

				// После автоплатежа принудительно обновляем данные пользователя
				// Делаем это асинхронно, чтобы не блокировать общий поток
				setTimeout(async () => {
					console.log('Принудительное обновление данных после автоплатежа...')

					// Делаем несколько попыток с задержкой
					for (let i = 0; i < 3; i++) {
						try {
							// Добавляем случайный параметр для обхода кэша
							await this.fetchUserProfile()
							console.log(
								`Успешное обновление профиля после автоплатежа (попытка ${
									i + 1
								})`
							)
							// Если все успешно, прерываем цикл
							break
						} catch (e) {
							console.error(
								`Ошибка при обновлении профиля после автоплатежа (попытка ${
									i + 1
								}):`,
								e
							)
							// Добавляем задержку между попытками
							await new Promise(r => setTimeout(r, 1000 * (i + 1)))
						}
					}
				}, 1000)

				return response.data
			} catch (error) {
				console.error('Ошибка при создании автоплатежа через ЮKassa:', error)
				throw error
			}
		},

		// Проверка статуса платежа в ЮKassa
		async checkYookassaStatus(
			paymentId: string,
			maxChecks = 3,
			interval = 3000
		) {
			try {
				console.log('Проверка статуса платежа:', paymentId)

				const performCheck = async (attempt = 1) => {
					try {
						// Проверяем, установлен ли токен перед запросом
						if (!this.token) {
							console.warn(
								'Попытка проверки статуса платежа без токена авторизации'
							)
							throw new Error(
								'Требуется авторизация для проверки статуса платежа'
							)
						}

						// Проверяем, установлен ли заголовок Authorization
						if (!axios.defaults.headers.common['Authorization']) {
							console.log('Устанавливаем заголовок Authorization для запроса')
							axios.defaults.headers.common[
								'Authorization'
							] = `Bearer ${this.token}`
						}

						// Проверка валидности ID платежа (чтобы избежать 404 ошибки)
						if (
							!paymentId ||
							typeof paymentId !== 'string' ||
							paymentId.length < 10
						) {
							console.error(`Некорректный ID платежа: ${paymentId}`)
							throw new Error(`Некорректный ID платежа: ${paymentId}`)
						}

						// Логируем URL запроса для отладки
						const requestUrl = `/api/yookassa/payment/${paymentId}/status`
						console.log(`Отправка запроса на URL: ${requestUrl}`)

						try {
							const response = await axios.get(requestUrl)

							console.log(
								'Результат проверки статуса:',
								JSON.stringify(
									{
										status: response.data?.payment?.status,
										paid: response.data?.payment?.paid,
										paymentMethod: response.data?.paymentMethod,
									},
									null,
									2
								)
							)

							// Проверяем, нуждается ли платеж в явном захвате (для двухэтапной оплаты)
							if (response.data?.payment?.status === 'waiting_for_capture') {
								console.log('Платеж ожидает захвата, выполняем захват...')
								try {
									const captureResponse = await this.capturePayment(paymentId)
									console.log(
										'Результат захвата платежа:',
										JSON.stringify(
											{
												status: captureResponse?.payment?.status,
												paid: captureResponse?.payment?.paid,
												paymentMethod: captureResponse?.paymentMethod,
											},
											null,
											2
										)
									)
									return captureResponse
								} catch (captureError) {
									console.error('Ошибка при захвате платежа:', captureError)
									// Если захват неуспешен, продолжаем с оригинальным ответом
								}
							}

							// Если платеж успешен, обновляем данные пользователя
							if (response.data?.payment?.paid) {
								console.log(
									'Платеж успешно выполнен, обновляем данные пользователя'
								)

								// Принудительно обновляем данные пользователя
								try {
									await this.fetchUserProfile()
									console.log(
										'Профиль пользователя успешно обновлен после платежа'
									)
								} catch (profileError) {
									console.error(
										'Ошибка при обновлении профиля после платежа:',
										profileError
									)
									// Не прерываем выполнение, так как основной запрос выполнен успешно
								}

								// Обновляем методы оплаты, если платеж успешен
								try {
									await this.fetchPaymentMethods()
									console.log('Методы оплаты успешно обновлены')
								} catch (methodsError) {
									console.error(
										'Ошибка при обновлении методов оплаты:',
										methodsError
									)
									// Не прерываем выполнение
								}
							}

							// Если платеж все еще в статусе ожидания и у нас остались попытки, повторяем через интервал
							if (!response.data?.payment?.paid && attempt < maxChecks) {
								console.log(
									`Платеж ${paymentId} еще не подтвержден. Повторная проверка через ${
										interval / 1000
									} сек. (${attempt}/${maxChecks})`
								)
								return new Promise(resolve => {
									setTimeout(() => {
										resolve(performCheck(attempt + 1))
									}, interval)
								})
							}

							return response.data
						} catch (requestError: any) {
							// Перехватываем ошибки запросов и преобразуем их в более информативные
							if (requestError.response) {
								console.error(
									`Ошибка запроса (статус ${requestError.response.status}):`,
									requestError.response.data
								)

								// Если платеж не найден (404), создаем специальную ошибку
								if (requestError.response.status === 404) {
									const error = new Error('Платеж не найден в системе ЮKassa')
									// @ts-ignore
									error.response = {
										status: 404,
										data: requestError.response.data,
									}
									throw error
								}

								// Пробрасываем оригинальную ошибку для других случаев
								throw requestError
							}
							throw requestError
						}
					} catch (error) {
						console.error('Ошибка при проверке статуса платежа:', error)
						if (attempt < maxChecks) {
							console.log(
								`Ошибка попытки #${attempt}. Повторная проверка через ${
									interval / 1000
								} сек.`
							)
							return new Promise(resolve => {
								setTimeout(() => {
									resolve(performCheck(attempt + 1))
								}, interval)
							})
						}
						throw error
					}
				}

				return await performCheck()
			} catch (error: any) {
				console.error(
					'Все попытки проверки статуса платежа завершились ошибкой:',
					error
				)
				throw new Error(
					`Ошибка при проверке статуса платежа: ${
						error.response?.data?.error || error.message
					}`
				)
			}
		},

		// Явное подтверждение платежа (для двухэтапной оплаты)
		async capturePayment(
			paymentId: string,
			amount?: { value: string; currency: string }
		) {
			try {
				console.log('Запрос на захват платежа:', paymentId)

				// Проверяем, установлен ли токен перед запросом
				if (!this.token) {
					console.warn('Попытка захвата платежа без токена авторизации')
					throw new Error('Требуется авторизация для захвата платежа')
				}

				// Проверяем, установлен ли заголовок Authorization
				if (!axios.defaults.headers.common['Authorization']) {
					console.log('Устанавливаем заголовок Authorization для запроса')
					axios.defaults.headers.common[
						'Authorization'
					] = `Bearer ${this.token}`
				}

				const requestData = amount ? { amount } : {}
				const response = await axios.post(
					`/api/yookassa/payment/${paymentId}/capture`,
					requestData
				)

				console.log('Результат захвата платежа:', response.data)

				// Если платеж успешно захвачен, обновляем данные пользователя
				if (response.data?.payment?.paid) {
					console.log('Платеж успешно захвачен, обновляем данные пользователя')

					// Принудительно обновляем данные пользователя
					try {
						await this.fetchUserProfile()
						console.log(
							'Профиль пользователя успешно обновлен после захвата платежа'
						)
					} catch (profileError) {
						console.error(
							'Ошибка при обновлении профиля после захвата платежа:',
							profileError
						)
						// Не прерываем выполнение, так как основной запрос выполнен успешно
					}

					// Обновляем список способов оплаты, если платеж успешен
					try {
						await this.fetchPaymentMethods()
						console.log(
							'Способы оплаты успешно обновлены после захвата платежа'
						)
					} catch (methodsError) {
						console.error(
							'Ошибка при обновлении способов оплаты:',
							methodsError
						)
						// Не прерываем выполнение
					}
				}

				return response.data
			} catch (error: any) {
				console.error('Ошибка при захвате платежа:', error)

				// Добавляем детали ошибки от сервера
				if (error.response?.data) {
					console.error('Детали ошибки:', error.response.data)
				}

				throw new Error(
					`Ошибка при захвате платежа: ${
						error.response?.data?.error || error.message
					}`
				)
			}
		},

		// Получение списка сохраненных способов оплаты
		async fetchPaymentMethods() {
			try {
				const response = await axios.get('/api/yookassa/payment-methods')
				this.paymentMethods = response.data.methods
				return response.data.methods
			} catch (error) {
				console.error('Ошибка при получении способов оплаты:', error)
				return []
			}
		},

		// Установка метода оплаты по умолчанию
		async setDefaultPaymentMethod(methodId: string) {
			try {
				const response = await axios.post(
					`/api/yookassa/payment-methods/${methodId}/default`
				)
				await this.fetchPaymentMethods()
				return response.data.method
			} catch (error) {
				console.error('Ошибка при установке метода оплаты по умолчанию:', error)
				throw error
			}
		},

		// Удаление метода оплаты
		async deletePaymentMethod(methodId: string) {
			try {
				await axios.delete(`/api/yookassa/payment-methods/${methodId}`)
				await this.fetchPaymentMethods()
				return true
			} catch (error) {
				console.error('Ошибка при удалении метода оплаты:', error)
				throw error
			}
		},

		// Включение/выключение автопродления подписки
		async toggleAutoRenewal(enable: boolean, paymentMethodId?: string) {
			try {
				const response = await axios.post('/api/subscriptions/auto-renewal', {
					enable,
					paymentMethodId,
				})

				// Обновляем данные пользователя
				this.user = response.data.user

				return true
			} catch (error) {
				console.error('Ошибка при настройке автопродления:', error)
				throw error
			}
		},

		// Метод для оформления подписки через ЮKassa
		async subscribeByPlanWithYookassa(
			planId: string,
			returnUrl?: string,
			savePaymentMethod: boolean = true,
			useTwoStepPayment: boolean = false
		) {
			try {
				console.log('Оформление подписки по плану:', planId, {
					savePaymentMethod,
					useTwoStepPayment,
				})

				// Создаем платеж через ЮKassa
				const paymentData = await this.createYookassaPayment(
					planId,
					returnUrl,
					savePaymentMethod,
					useTwoStepPayment
				)

				// Проверяем наличие URL для подтверждения
				if (!paymentData.confirmationUrl) {
					throw new Error('API не вернул URL для подтверждения платежа')
				}

				// Возвращаем данные платежа без автоматического перенаправления
				// Перенаправление будет выполнено в компоненте
				return paymentData
			} catch (error) {
				console.error('Ошибка при создании платежа:', error)
				throw error
			}
		},

		// Оформление подписки с использованием сохраненного метода оплаты
		async subscribeWithSavedMethod(planId: string, paymentMethodId: string) {
			try {
				console.log('Оформление подписки с сохраненным методом оплаты:', {
					planId,
					paymentMethodId,
					timestamp: new Date().toISOString(),
				})

				// Создаем автоплатеж
				const response = await this.createRecurringPayment(
					planId,
					paymentMethodId
				)

				console.log('Результат создания автоплатежа:', response)

				// Проверяем наличие ID платежа и сохраняем его в localStorage
				if (response.paymentId) {
					console.log(
						`Сохраняем ID платежа в localStorage: ${response.paymentId}`
					)
					localStorage.setItem('lastYookassaPaymentId', response.paymentId)

					// Также сохраняем временную метку для отладки
					localStorage.setItem(
						'lastYookassaPaymentTimestamp',
						new Date().toISOString()
					)
				} else {
					console.warn('Ответ API не содержит paymentId!')
				}

				// Проверяем наличие URL для подтверждения
				if (response.confirmationUrl) {
					console.log(`Получен URL подтверждения: ${response.confirmationUrl}`)
					console.log(
						`URL содержит payment_id: ${response.confirmationUrl.includes(
							'payment_id'
						)}`
					)

					// Добавляем payment_id в URL, если его там нет
					let redirectUrl = response.confirmationUrl

					// Исправляем проблему с PAYMENT_ID_PLACEHOLDER в URL
					if (
						redirectUrl.includes('PAYMENT_ID_PLACEHOLDER') &&
						response.paymentId
					) {
						redirectUrl = redirectUrl.replace(
							'PAYMENT_ID_PLACEHOLDER',
							response.paymentId
						)
						console.log(`Заменен плейсхолдер в URL: ${redirectUrl}`)
					} else if (
						!redirectUrl.includes('payment_id') &&
						response.paymentId
					) {
						const separator = redirectUrl.includes('?') ? '&' : '?'
						redirectUrl = `${redirectUrl}${separator}payment_id=${response.paymentId}`
						console.log(`Добавлен payment_id в URL: ${redirectUrl}`)
					}

					// Если URL получен, перенаправляем пользователя
					setTimeout(() => {
						console.log(`Перенаправление на URL подтверждения: ${redirectUrl}`)

						// Перед редиректом обновляем свойства для отладки
						try {
							// Добавляем параметр timestamp для обхода кэширования
							const urlObj = new URL(redirectUrl)
							urlObj.searchParams.append('_t', Date.now().toString())

							// Обновляем URL
							window.location.href = urlObj.toString()
						} catch (e) {
							console.error('Ошибка при модификации URL:', e)
							// Запасной вариант - просто редирект
							window.location.href = redirectUrl
						}
					}, 500)

					// Возвращаем ответ, чтобы обработать его во фронтенде
					return response
				}

				// Начинаем проверять статус платежа
				if (response && response.paymentId) {
					console.log(
						`Начинаем проверять статус платежа: ${response.paymentId}`
					)

					// Задержка для обработки платежа на стороне ЮKassa
					await new Promise(resolve => setTimeout(resolve, 2000))

					try {
						const statusResponse = await this.checkYookassaStatus(
							response.paymentId
						)
						console.log('Результат проверки статуса платежа:', statusResponse)

						// Ждем еще немного и обновляем профиль
						setTimeout(async () => {
							await this.fetchUserProfile()
						}, 3000)

						return { ...response, statusChecked: true, ...statusResponse }
					} catch (statusError) {
						console.error('Ошибка при проверке статуса:', statusError)
						// Продолжаем с оригинальным ответом
					}
				}

				return response
			} catch (error) {
				console.error('Ошибка оформления подписки:', error)
				throw error
			}
		},
	},

	getters: {
		isAdmin: state => state.user?.isAdmin || false,
		hasActiveSubscription: state => state.user?.subscription?.active || false,
		subscriptionExpireDate: state =>
			state.user?.subscription?.expireDate || null,
		deviceLimit: state => state.user?.subscription?.deviceLimit || 0,
		activeDevices: state => state.user?.activeDevices || [],
		defaultPaymentMethod: state => {
			return state.paymentMethods.find(method => method.isDefault) || null
		},
		hasAutoRenewal: state => state.user?.subscription?.autoRenewal || false,
	},
})
