<!-- SubscriptionPage.vue -->
<template>
	<div class="subscription-page">
		<div v-if="loading" class="loading-container">
			<div class="spinner"></div>
			<p>Загрузка планов подписки...</p>
		</div>

		<div v-else-if="error" class="error-container">
			<p>{{ error }}</p>
			<button @click="fetchSubscriptionPlans" class="retry-button">
				Повторить
			</button>
		</div>

		<div v-else class="subscription-container">
			<h1>Управление подпиской</h1>

			<!-- Сообщение о статусе платежа после возврата с ЮKassa -->
			<div
				v-if="paymentStatus"
				class="payment-status mb-4"
				:class="paymentStatusClass"
			>
				<i class="fas" :class="paymentStatusIcon"></i>
				<div>
					<h3 class="text-lg font-semibold mb-1">{{ paymentStatusTitle }}</h3>
					<p>{{ paymentStatusMessage }}</p>

					<!-- Добавляем кнопку захвата платежа, если он в статусе waiting_for_capture -->
					<div
						v-if="paymentStatus.status === 'warning' && pendingPaymentId"
						class="mt-3"
					>
						<button
							@click="capturePayment(pendingPaymentId)"
							class="btn btn-success"
							:disabled="isProcessing"
						>
							<span v-if="isProcessing">
								<i class="fas fa-circle-notch fa-spin"></i> Подтверждение...
							</span>
							<span v-else>
								<i class="fas fa-check-circle"></i> Подтвердить оплату
							</span>
						</button>
					</div>

					<!-- Добавляем кнопку проверки для pending платежей -->
					<div
						v-if="paymentStatus.status === 'info' && pendingPaymentId"
						class="mt-3"
					>
						<button
							@click="checkYookassaStatus(pendingPaymentId)"
							class="btn btn-primary"
							:disabled="isProcessing"
						>
							<span v-if="isProcessing">
								<i class="fas fa-circle-notch fa-spin"></i> Проверка...
							</span>
							<span v-else>
								<i class="fas fa-sync-alt"></i> Проверить статус
							</span>
						</button>
					</div>
				</div>
			</div>

			<div v-if="authStore.hasActiveSubscription" class="current-subscription">
				<div class="section-header">
					<h2>Текущая подписка</h2>
				</div>
				<div class="subscription-details">
					<div class="detail-item">
						<span class="detail-label">Статус:</span>
						<span class="detail-value active">Активна</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Действует до:</span>
						<span class="detail-value">{{
							formatDate(authStore.user?.subscription?.expireDate)
						}}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Устройств:</span>
						<span class="detail-value">{{
							authStore.user?.subscription?.deviceLimit
						}}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Автопродление:</span>
						<span
							class="detail-value"
							:class="{
								active: authStore.hasAutoRenewal,
								inactive: !authStore.hasAutoRenewal,
							}"
						>
							{{ authStore.hasAutoRenewal ? 'Включено' : 'Отключено' }}
						</span>
					</div>
				</div>
			</div>

			<!-- Сохраненные способы оплаты -->
			<div
				v-if="authStore.paymentMethods.length > 0"
				class="saved-payment-methods"
			>
				<div class="section-header">
					<h2>Сохраненные способы оплаты</h2>
				</div>
				<div class="payment-methods-list">
					<div
						v-for="method in authStore.paymentMethods"
						:key="method.id"
						class="payment-method-item"
						:class="{
							'is-default': method.isDefault,
							selected: selectedPaymentMethod === method.id,
						}"
						@click="selectPaymentMethod(method.id)"
					>
						<div class="method-icon">
							<i class="fas" :class="getMethodIcon(method.type)"></i>
						</div>
						<div class="method-details">
							<div class="method-title">{{ method.title }}</div>
							<div v-if="method.card" class="method-card-info">
								**** {{ method.card.last4 }}
							</div>
							<div v-if="method.isDefault" class="method-default-badge">
								По умолчанию
							</div>
						</div>
						<div class="method-select">
							<div class="radio-button">
								<div
									class="radio-inner"
									v-if="selectedPaymentMethod === method.id"
								></div>
							</div>
						</div>
					</div>
				</div>
				<div class="methods-actions">
					<label class="save-method-checkbox">
						<input type="checkbox" v-model="useSavedMethod" />
						<span>Использовать сохраненный способ оплаты</span>
					</label>
					<button
						v-if="!useSavedMethod"
						class="btn-save-method"
						@click="useDefaultPaymentMethod"
					>
						Использовать сохраненные данные
					</button>
				</div>
			</div>

			<div class="section-header">
				<h2>
					{{
						authStore.hasActiveSubscription
							? 'Продлить подписку'
							: 'Оформление подписки'
					}}
				</h2>
			</div>

			<div class="subscription-info">
				<h3>Преимущества:</h3>
				<ul>
					<li>Доступ ко всем телеканалам</li>
					<li>Высокое качество вещания</li>
					<li>Просмотр на нескольких устройствах</li>
					<li>Техническая поддержка 24/7</li>
				</ul>

				<div class="payment-methods-info">
					<h3>Способы оплаты:</h3>
					<div class="payment-icons">
						<div class="payment-icon">
							<img
								src="/images/visa.svg"
								alt="Visa"
								onerror="this.src='/images/visa.png'; this.onerror=null;"
							/>
						</div>
						<div class="payment-icon">
							<img
								src="/images/mastercard.svg"
								alt="Mastercard"
								onerror="this.src='/images/mastercard.png'; this.onerror=null;"
							/>
						</div>
						<div class="payment-icon">
							<img
								src="/images/mir.svg"
								alt="МИР"
								onerror="this.src='/images/mir.png'; this.onerror=null;"
							/>
						</div>
					</div>
					<p class="payment-note">
						Оплата производится в рублях через защищенный шлюз платежной системы
						ЮKassa с соблюдением требований PCI DSS.
					</p>
				</div>
			</div>

			<div class="subscription-plans">
				<div
					v-for="plan in subscriptionPlans"
					:key="plan._id"
					class="plan"
					:class="{ selected: selectedPlan === plan._id }"
					@click="selectPlan(plan._id)"
				>
					<h3>{{ plan.name }}</h3>
					<p class="price">{{ formatPrice(plan.priceEur) }} ₽</p>
					<p class="description">{{ plan.description }}</p>
					<div v-if="plan.isPopular" class="popular-badge">Популярный</div>
				</div>
			</div>

			<!-- Кнопка сохранения метода оплаты -->
			<div v-if="!authStore.paymentMethods.length" class="save-payment-method">
				<label class="save-method-checkbox">
					<input type="checkbox" v-model="savePaymentMethod" />
					<span>Сохранить данные карты для автоплатежей</span>
				</label>
				<p class="save-method-info">
					Сохраненные данные позволят включить автопродление подписки и
					упростить будущие платежи
				</p>
			</div>

			<!-- <button
				class="subscribe-button"
				@click="subscribe"
				:disabled="!selectedPlan || isProcessing"
			>
				<span v-if="isProcessing">Обработка...</span>
				<span v-else>Оплатить подписку</span>
			</button> -->

			<div v-if="paymentHistory.length > 0" class="payment-history">
				<div class="section-header">
					<h2>История платежей</h2>
				</div>
				<div class="history-table">
					<table>
						<thead>
							<tr>
								<th>Дата</th>
								<th>План</th>
								<th>Сумма</th>
								<th>Статус</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="payment in paymentHistory" :key="payment.id">
								<td>{{ formatDate(payment.createdAt) }}</td>
								<td>{{ payment.plan?.name || 'Не указан' }}</td>
								<td>
									{{ formatPrice(payment.amount) }} {{ payment.currency }}
								</td>
								<td>
									<span :class="'status-' + payment.status">
										{{ getPaymentStatusText(payment.status) }}
									</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, defineOptions, onActivated, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

interface SubscriptionPlan {
	_id: string
	name: string
	monthDuration: number
	priceEur: number
	discount: number
	deviceLimit: number
	isPopular: boolean
	sortOrder: number
	description: string
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const selectedPlan = ref<string | null>(null)
const selectedPaymentMethod = ref<string | null>(null)
const useSavedMethod = ref(false)
const savePaymentMethod = ref(true)
const subscriptionPlans = ref<SubscriptionPlan[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const isProcessing = ref(false)
const paymentHistory = ref<any[]>([])
const pendingPaymentId = ref<string | null>(null)
const paymentStatus = ref<{
	status: string
	title: string
	message: string
} | null>(null)

// Получаем параметры маршрута
const paymentIdFromRoute = computed(() => route.params.paymentId as string)

// Компьютед свойства для статуса оплаты
const paymentStatusClass = computed(() => {
	if (!paymentStatus.value) return ''
	return `status-${paymentStatus.value.status}`
})

const paymentStatusIcon = computed(() => {
	switch (paymentStatus.value?.status) {
		case 'success':
			return 'fa-check-circle'
		case 'error':
			return 'fa-times-circle'
		case 'info':
			return 'fa-info-circle'
		case 'pending':
			return 'fa-clock'
		default:
			return 'fa-info-circle'
	}
})

const paymentStatusTitle = computed(() => paymentStatus.value?.title || '')
const paymentStatusMessage = computed(() => paymentStatus.value?.message || '')

// Имя компонента для работы с keep-alive
defineOptions({
	name: 'SubscriptionPage',
})

onMounted(async () => {
	try {
		// Загружаем данные о подписке и планах
		await Promise.all([
			fetchSubscriptionPlans(),
			fetchPaymentHistory(),
			authStore.fetchPaymentMethods(),
		])

		// Проверяем разные варианты присутствия ID платежа в URL
		// 1. В параметрах маршрута (если используется /subscription/:paymentId)
		// 2. В query параметре paymentId (если используется ?paymentId=...)
		// 3. В query параметре payment_id (который добавляет юKassa)
		// 4. В параметре orderId (который может добавлять ЮKassa в некоторых случаях)
		let paymentId =
			paymentIdFromRoute.value ||
			(route.query.paymentId as string) ||
			(route.query.payment_id as string) ||
			(route.query.orderId as string)

		// Проверяем, если payment_id содержит плейсхолдер PAYMENT_ID_PLACEHOLDER
		if (paymentId === 'PAYMENT_ID_PLACEHOLDER') {
			console.warn(
				'Обнаружен плейсхолдер PAYMENT_ID_PLACEHOLDER в URL вместо реального ID платежа'
			)

			// Проверяем, есть ли сохраненный ID платежа в localStorage
			const savedPaymentId = localStorage.getItem('lastYookassaPaymentId')
			if (savedPaymentId) {
				console.log(
					`Заменяем плейсхолдер на сохраненный ID платежа: ${savedPaymentId}`
				)
				paymentId = savedPaymentId
			} else {
				console.warn(
					'Нет сохраненного ID платежа в localStorage для замены плейсхолдера'
				)
				// Обнуляем ID, чтобы запустить проверку последних платежей
				paymentId = ''
			}
		}

		// Очищаем payment_id от возможных лишних данных
		if (paymentId) {
			// Удаляем все, что идет после специальных символов (?&=#) если они есть
			if (paymentId.includes('?')) {
				paymentId = paymentId.split('?')[0]
			}
			if (paymentId.includes('&')) {
				paymentId = paymentId.split('&')[0]
			}
			if (paymentId.includes('=')) {
				paymentId = paymentId.split('=')[0]
			}
			if (paymentId.includes('#')) {
				paymentId = paymentId.split('#')[0]
			}

			// Проверяем длину после очистки
			if (paymentId.length < 10) {
				console.warn(
					`Предупреждение: Очищенный ID платежа слишком короткий: ${paymentId}`
				)
			}
		}

		// Проверяем также наличие параметров ЮKassa
		const yookassaParams = {
			success: route.query.success as string,
			pending: route.query.pending as string,
			orderid: route.query.orderid as string,
			ym_merchant_receipt: route.query.ym_merchant_receipt as string,
		}

		console.log('Анализ URL и параметров:', {
			paymentIdFromRoute: paymentIdFromRoute.value,
			paymentIdFromQuery: route.query.paymentId,
			payment_idFromQuery: route.query.payment_id,
			orderId: route.query.orderId,
			yookassaParams,
			originalPaymentId:
				route.query.payment_id ||
				route.query.paymentId ||
				paymentIdFromRoute.value,
			finalPaymentId: paymentId,
			fullPath: route.fullPath,
			fullUrl: window.location.href,
		})

		// Определяем, возвращаемся ли мы из юKassa (просто проверяем referer или URL)
		const returningFromYookassa =
			document.referrer.includes('yookassa.ru') ||
			document.referrer.includes('yoomoney.ru') ||
			window.location.href.includes('subscription') ||
			route.query.payment_id !== undefined || // Добавляем проверку наличия payment_id
			route.query.success !== undefined // Добавляем проверку наличия success

		// Проверяем, есть ли сохраненный ID платежа в localStorage
		const savedPaymentId = localStorage.getItem('lastYookassaPaymentId')

		// Особая обработка, когда есть параметр success=true или success=false
		if (typeof route.query.success !== 'undefined') {
			if (route.query.success === 'true') {
				// Если есть успешный платеж, но нет ID
				setPaymentStatus(
					'success',
					'Спасибо за оплату!',
					'Проверяем данные о платеже и активируем вашу подписку...'
				)

				// Проверяем последние платежи
				console.log(
					'Получен параметр success=true, проверяем последние платежи'
				)
				await checkLatestPayments()

				// Обновляем данные с задержкой
				setTimeout(async () => {
					await refreshAllData()
				}, 2000)
			} else if (route.query.success === 'false') {
				// Платеж отменен или не завершен
				setPaymentStatus(
					'error',
					'Платеж не завершен',
					'Произошла ошибка при оплате или платеж был отменен. Пожалуйста, попробуйте снова.'
				)
			}

			// Удаляем параметры из URL
			router.replace({
				path: route.path,
				query: {
					...route.query,
					success: undefined,
				},
			})
		}
		// Если указан конкретный ID платежа, проверяем его
		else if (paymentId) {
			console.log(
				`Обнаружен ID платежа в URL: ${paymentId}, проверяем статус...`
			)
			await checkYookassaStatus(paymentId)

			// Удаляем параметры из URL, чтобы избежать повторной проверки при обновлении страницы
			if (route.query.paymentId || route.query.payment_id) {
				router.replace({
					path: route.path,
					query: {
						...route.query,
						paymentId: undefined,
						payment_id: undefined,
					},
				})
			}

			// Также очищаем сохраненный ID, так как уже проверили его
			if (savedPaymentId) {
				localStorage.removeItem('lastYookassaPaymentId')
			}

			// Принудительно обновляем все данные через небольшую задержку
			setTimeout(async () => {
				console.log(
					'Дополнительное обновление всех данных после проверки платежа'
				)
				await refreshAllData()
			}, 2000)
		}
		// Если есть сохраненный ID платежа, проверяем его
		else if (savedPaymentId) {
			console.log(
				`Найден сохраненный ID платежа: ${savedPaymentId}, проверяем статус...`
			)
			await checkYookassaStatus(savedPaymentId)
			localStorage.removeItem('lastYookassaPaymentId')

			// Принудительно обновляем все данные через небольшую задержку
			setTimeout(async () => {
				console.log(
					'Дополнительное обновление всех данных после проверки сохраненного платежа'
				)
				await refreshAllData()
			}, 2000)
		}
		// Если возвращаемся из юKassa, но без ID платежа, проверяем последние платежи
		else if (returningFromYookassa) {
			console.log(
				'Похоже, возврат из юKassa без ID платежа. Проверяем последние платежи...'
			)

			// Показываем уведомление о проверке платежа
			setPaymentStatus(
				'info',
				'Проверка платежа...',
				'Получаем информацию о вашем платеже. Пожалуйста, подождите несколько секунд.'
			)

			// Запускаем проверку последних платежей
			await checkLatestPayments()

			// Принудительно обновляем все данные через некоторое время
			setTimeout(async () => {
				console.log(
					'Дополнительное обновление всех данных после возврата из юKassa'
				)
				await refreshAllData()
			}, 2000)
		}
	} catch (error) {
		console.error('Ошибка при инициализации страницы подписки:', error)
		error.value = 'Ошибка загрузки данных. Пожалуйста, попробуйте позже.'
	} finally {
		loading.value = false
	}
})

const fetchSubscriptionPlans = async () => {
	loading.value = true
	error.value = ''

	try {
		const response = await axios.get('/api/subscriptions/plans')

		if (response.data && response.data.plans) {
			subscriptionPlans.value = response.data.plans
		}
	} catch (err: any) {
		console.error('Ошибка при загрузке планов подписки:', err)
		error.value =
			'Не удалось загрузить планы подписки. Пожалуйста, попробуйте позже.'
	} finally {
		loading.value = false
	}
}

const fetchPaymentHistory = async () => {
	try {
		const response = await axios.get('/api/subscriptions/payments')
		if (response.data && response.data.payments) {
			paymentHistory.value = response.data.payments
		}
	} catch (err) {
		console.error('Ошибка при загрузке истории платежей:', err)
	}
}

const checkYookassaStatus = async (paymentId: string) => {
	if (!paymentId) {
		console.warn('Пустой ID платежа при вызове checkYookassaStatus')
		return
	}

	// Валидация ID платежа
	if (typeof paymentId !== 'string' || paymentId.length < 10) {
		console.error(
			`Некорректный формат ID платежа: "${paymentId}", длина: ${paymentId?.length}`
		)
		setPaymentStatus(
			'error',
			'Ошибка проверки платежа',
			'Некорректный идентификатор платежа. Пожалуйста, обратитесь в поддержку.'
		)
		return
	}

	try {
		isProcessing.value = true
		pendingPaymentId.value = paymentId
		setPaymentStatus(
			'pending',
			'Проверка платежа...',
			'Получаем актуальную информацию о статусе платежа.'
		)

		console.log(`Отправка запроса проверки статуса платежа ID: ${paymentId}`)
		const result = await authStore.checkYookassaStatus(paymentId)
		console.log('Результат проверки платежа:', result)

		// Обновляем историю платежей
		await fetchPaymentHistory()

		if (result && result.payment) {
			if (result.payment.paid) {
				setPaymentStatus(
					'success',
					'Платеж успешно выполнен!',
					'Ваша подписка была активирована.'
				)
				pendingPaymentId.value = null

				// Принудительно обновляем профиль пользователя несколько раз
				// (иногда первый запрос может вернуть старые данные из-за кэширования)
				console.log('Принудительное обновление профиля пользователя...')
				for (let i = 0; i < 3; i++) {
					try {
						await authStore.fetchUserProfile()
						console.log(
							`Успешное обновление профиля (попытка ${i + 1})`,
							authStore.user?.subscription
						)
						// Добавляем небольшую задержку между запросами
						if (i < 2) await new Promise(r => setTimeout(r, 1000))
					} catch (e) {
						console.error(
							`Ошибка при обновлении профиля (попытка ${i + 1}):`,
							e
						)
					}
				}
			} else if (result.payment.status === 'waiting_for_capture') {
				setPaymentStatus(
					'warning',
					'Требуется подтверждение',
					'Ваш платеж ожидает подтверждения. Нажмите "Подтвердить оплату" ниже.'
				)
			} else if (result.payment.status === 'pending') {
				setPaymentStatus(
					'info',
					'Платеж в обработке',
					'Ваш платеж обрабатывается. Пожалуйста, подождите несколько минут.'
				)
			} else if (result.payment.status === 'canceled') {
				setPaymentStatus(
					'error',
					'Платеж отменен',
					'Ваш платеж был отменен. Пожалуйста, попробуйте снова.'
				)
				pendingPaymentId.value = null
			}
		} else {
			setPaymentStatus(
				'error',
				'Ошибка проверки платежа',
				'Не удалось получить информацию о платеже. Пожалуйста, обратитесь в поддержку.'
			)
			pendingPaymentId.value = null
		}

		// Обновляем данные о подписке пользователя
		await authStore.fetchUserProfile()
	} catch (error: any) {
		console.error('Ошибка при проверке статуса платежа:', error)

		// Проверяем тип ошибки - если это 404 (платеж не найден), проверяем последние платежи
		if (
			error.response?.status === 404 ||
			(error.message && error.message.includes('Платеж не найден')) ||
			(error.details && error.details.includes('404'))
		) {
			console.log(
				'Получена ошибка 404 (платеж не найден). Проверяем последние платежи...'
			)
			setPaymentStatus(
				'info',
				'Проверка последних платежей...',
				'Не удалось найти указанный платеж. Проверяем последние транзакции.'
			)

			// Проверяем последние платежи пользователя
			const found = await checkLatestPayments()

			if (!found) {
				setPaymentStatus(
					'error',
					'Платеж не найден',
					'Не удалось найти информацию о вашем платеже. Пожалуйста, обновите страницу или обратитесь в поддержку.'
				)
			}
		} else {
			// Другие типы ошибок
			setPaymentStatus(
				'error',
				'Ошибка проверки платежа',
				'Произошла ошибка при проверке статуса платежа. Пожалуйста, попробуйте позже.'
			)
		}

		pendingPaymentId.value = null
	} finally {
		isProcessing.value = false
	}
}

const capturePayment = async (paymentId: string) => {
	if (!paymentId) return

	try {
		isProcessing.value = true
		pendingPaymentId.value = paymentId
		setPaymentStatus(
			'pending',
			'Подтверждение платежа...',
			'Выполняем подтверждение вашего платежа.'
		)

		const result = await authStore.capturePayment(paymentId)
		console.log('Результат захвата платежа:', result)

		// Обновляем историю платежей
		await fetchPaymentHistory()

		if (result && result.payment && result.payment.paid) {
			setPaymentStatus(
				'success',
				'Платеж успешно подтвержден!',
				'Ваша подписка была активирована.'
			)
			pendingPaymentId.value = null

			// Обновляем данные о подписке пользователя
			await authStore.fetchUserProfile()
		} else {
			setPaymentStatus(
				'error',
				'Ошибка подтверждения платежа',
				'Не удалось подтвердить платеж. Пожалуйста, попробуйте позже.'
			)
		}
	} catch (error) {
		console.error('Ошибка при захвате платежа:', error)
		setPaymentStatus(
			'error',
			'Ошибка подтверждения платежа',
			'Произошла ошибка при подтверждении платежа. Пожалуйста, попробуйте позже.'
		)
	} finally {
		isProcessing.value = false
	}
}

const selectPlan = (planId: string) => {
	selectedPlan.value = planId
}

const selectPaymentMethod = (methodId: string) => {
	selectedPaymentMethod.value = methodId
	useSavedMethod.value = true
}

// Получение иконки для типа метода оплаты
const getMethodIcon = (type: string) => {
	switch (type) {
		case 'bank_card':
			return 'fa-credit-card'
		case 'yoo_money':
			return 'fa-wallet'
		default:
			return 'fa-money-bill'
	}
}

const subscribe = async () => {
	if (!selectedPlan.value || isProcessing.value) return

	isProcessing.value = true

	try {
		// Если используем сохраненный метод оплаты
		if (useSavedMethod.value && selectedPaymentMethod.value) {
			console.log(
				'Использование сохраненного метода оплаты:',
				selectedPaymentMethod.value
			)

			// Показываем индикатор ожидания
			setPaymentStatus(
				'pending',
				'Выполнение платежа...',
				'Обрабатываем ваш платеж с использованием сохраненного метода оплаты.'
			)

			try {
				const paymentData = await authStore.subscribeWithSavedMethod(
					selectedPlan.value,
					selectedPaymentMethod.value
				)

				// Обновляем данные пользователя и методы оплаты
				await authStore.fetchUserProfile()

				// Показываем сообщение об успешной оплате
				setPaymentStatus(
					'success',
					'Платеж выполнен',
					'Подписка успешно оформлена с использованием сохраненного метода оплаты.'
				)

				// Обновляем историю платежей
				await fetchPaymentHistory()

				// Запускаем таймер для обновления данных через некоторое время
				// (дополнительно для решения проблемы с обновлением данных)
				setTimeout(async () => {
					await refreshAllData()
				}, 3000)
			} catch (error) {
				console.error('Ошибка при оформлении автоплатежа:', error)
				setPaymentStatus(
					'error',
					'Ошибка платежа',
					'Не удалось выполнить платеж. Пожалуйста, попробуйте другой способ оплаты.'
				)
			}
		}
		// Если нет сохраненных методов или пользователь выбрал новый метод
		else {
			// Создаем платеж через ЮKassa
			const paymentData = await authStore.subscribeByPlanWithYookassa(
				selectedPlan.value,
				undefined,
				savePaymentMethod.value // сохраняем метод оплаты, если пользователь выбрал эту опцию
			)

			// Если есть сообщение о валюте, показываем его
			if (paymentData.currencyNote) {
				paymentStatus.value = {
					status: 'info',
					title: 'Информация о платеже',
					message: paymentData.currencyNote,
				}
			}

			// Если есть URL для подтверждения, перенаправляем пользователя
			if (paymentData && paymentData.confirmationUrl) {
				// Сохраняем ID платежа для последующей проверки
				if (paymentData.paymentId) {
					console.log(
						`Сохраняем ID платежа: ${paymentData.paymentId} перед редиректом`
					)
					pendingPaymentId.value = paymentData.paymentId

					// Также можно сохранить ID платежа в localStorage для восстановления после возврата
					localStorage.setItem('lastYookassaPaymentId', paymentData.paymentId)
				}

				// Задержка чтобы пользователь мог увидеть сообщение
				setTimeout(() => {
					window.location.href = paymentData.confirmationUrl
				}, 1500)
			} else {
				throw new Error('Не получен URL для перехода к оплате')
			}
		}
	} catch (error: any) {
		console.error('Ошибка при оформлении подписки:', error)

		// Проверяем наличие ответа от сервера и извлекаем сообщение об ошибке
		const errorMessage =
			error?.response?.data?.error ||
			error?.response?.data?.details ||
			error?.message ||
			'Не удалось создать платеж. Пожалуйста, попробуйте позже или обратитесь в поддержку.'

		paymentStatus.value = {
			status: 'error',
			title: 'Ошибка создания платежа',
			message: errorMessage,
		}
	} finally {
		isProcessing.value = false
	}
}

const formatDate = (dateString?: string | Date) => {
	if (!dateString) return 'Не указана'

	const date = new Date(dateString)
	return date.toLocaleDateString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	})
}

const getPaymentStatusText = (status: string) => {
	const statusMap: Record<string, string> = {
		pending: 'Ожидает оплаты',
		succeeded: 'Оплачен',
		canceled: 'Отменен',
		waiting_for_capture: 'Ожидает подтверждения',
		waiting: 'Ожидает оплаты',
		confirming: 'Подтверждается',
		confirmed: 'Подтвержден',
		sending: 'Отправляется',
		partially_paid: 'Частично оплачен',
		finished: 'Завершен',
		failed: 'Не удалось',
		expired: 'Истек срок',
		refunded: 'Возвращен',
	}

	return statusMap[status] || status
}

const formatPrice = (price: number): string => {
	return price.toFixed(2).replace('.', ',')
}

const setPaymentStatus = (
	status: 'success' | 'error' | 'info' | 'pending' | 'warning',
	title: string,
	message: string
) => {
	paymentStatus.value = {
		status,
		title,
		message,
	}
}

// Проверка последних платежей
const checkLatestPayments = async () => {
	console.log('Запускаем проверку последних платежей...')
	try {
		// Получаем историю платежей
		await fetchPaymentHistory()

		// Если история пуста, ничего не делаем
		if (!paymentHistory.value || paymentHistory.value.length === 0) {
			console.log('История платежей пуста')

			// Обновляем данные профиля в любом случае, может подписка уже активирована
			try {
				await authStore.fetchUserProfile()

				// Проверяем, возможно подписка уже активна несмотря на отсутствие платежей в истории
				if (authStore.hasActiveSubscription) {
					console.log('Подписка активна, хотя история платежей пуста')
					setPaymentStatus(
						'success',
						'Подписка активна!',
						'Ваша подписка активна и действует до ' +
							formatDate(authStore.user?.subscription?.expireDate)
					)
					return true
				}
			} catch (e) {
				console.error('Ошибка при обновлении профиля:', e)
			}

			return false
		}

		// Ищем самый последний платеж (первый в списке)
		const latestPayment = paymentHistory.value[0]
		console.log('Самый последний платеж:', latestPayment)

		// Проверяем, есть ли успешный платеж в последних 5 платежах
		const recentPayments = paymentHistory.value.slice(0, 5)
		console.log(
			`Проверяем ${recentPayments.length} последних платежей:`,
			recentPayments.map(p => ({ id: p.id, status: p.status }))
		)

		// Ищем успешный платеж среди последних
		const successfulPayment = recentPayments.find(p => p.status === 'succeeded')
		if (successfulPayment) {
			console.log(`Найден успешный платеж: ${successfulPayment.id}`)
			setPaymentStatus(
				'success',
				'Платеж успешно выполнен!',
				'Ваша подписка активна.'
			)

			// Обновляем профиль
			await authStore.fetchUserProfile()
			return true
		}

		// Если платеж найден, проверяем его статус
		if (latestPayment && latestPayment.status !== 'succeeded') {
			// Получаем ID платежа, пробуем несколько вариантов
			const paymentId = latestPayment.paymentId || latestPayment.id || ''

			console.log(`Проверяем статус последнего платежа ${paymentId}...`)

			if (!paymentId) {
				console.error('Ошибка: платеж не содержит ID или paymentId')
				return false
			}

			// Если платеж не обработан, проверяем его
			await checkYookassaStatus(paymentId)
			return true
		} else if (latestPayment && latestPayment.status === 'succeeded') {
			// Если платеж успешен, просто показываем сообщение
			setPaymentStatus(
				'success',
				'Платеж успешно выполнен!',
				'Ваша подписка активна.'
			)
			return true
		}

		return false
	} catch (error) {
		console.error('Ошибка при проверке последних платежей:', error)
		return false
	}
}

// Функция для принудительного обновления всех данных
const refreshAllData = async () => {
	console.log('Обновление всех данных...')
	isProcessing.value = true
	try {
		await Promise.all([
			authStore.fetchUserProfile(),
			fetchPaymentHistory(),
			authStore.fetchPaymentMethods(),
			fetchSubscriptionPlans(),
		])
		console.log('Все данные успешно обновлены')
	} catch (error) {
		console.error('Ошибка при обновлении данных:', error)
	} finally {
		isProcessing.value = false
	}
}

// Обновление данных при активации компонента (например, когда пользователь возвращается на страницу)
onActivated(async () => {
	console.log('Компонент SubscriptionPage активирован, обновляем данные...')
	try {
		// Обновляем данные с минимальным визуальным воздействием
		await Promise.all([
			authStore.fetchUserProfile(),
			fetchPaymentHistory(),
			authStore.fetchPaymentMethods(),
		])
		console.log('Данные обновлены при активации компонента')
	} catch (error) {
		console.error('Ошибка при обновлении данных при активации:', error)
	}
})

// Метод для выбора платежного метода по умолчанию
const useDefaultPaymentMethod = () => {
	// Получаем метод оплаты по умолчанию
	const defaultMethod = authStore.defaultPaymentMethod

	if (defaultMethod && defaultMethod.id) {
		// Устанавливаем выбранный метод и включаем флаг использования сохраненного метода
		selectedPaymentMethod.value = defaultMethod.id
		useSavedMethod.value = true
		console.log('Выбран метод оплаты по умолчанию:', defaultMethod.id)
	} else if (authStore.paymentMethods.length > 0) {
		// Если нет метода по умолчанию, но есть другие методы, выбираем первый
		selectedPaymentMethod.value = authStore.paymentMethods[0].id
		useSavedMethod.value = true
		console.log(
			'Выбран первый доступный метод оплаты:',
			authStore.paymentMethods[0].id
		)
	} else {
		// Если нет методов оплаты, просто включаем флаг
		useSavedMethod.value = true
		console.log('Нет доступных методов оплаты')
	}
}
</script>

<style scoped>
.subscription-page {
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
}

.subscription-container {
	background: #fff;
	border-radius: 12px;
	padding: 2rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h1 {
	text-align: center;
	color: #333;
	margin-bottom: 2rem;
}

.section-header {
	border-bottom: 1px solid #eee;
	margin-bottom: 1.5rem;
	padding-bottom: 0.5rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.refresh-button {
	background-color: #f0f0f0;
	border: 1px solid #ddd;
	border-radius: 4px;
	padding: 0.5rem 1rem;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.refresh-button:hover {
	background-color: #e0e0e0;
}

.refresh-button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.current-subscription {
	background-color: #f8f9fa;
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 2rem;
}

.subscription-details {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 1rem;
}

.detail-item {
	display: flex;
	flex-direction: column;
}

.detail-label {
	font-size: 0.875rem;
	color: #64748b;
	margin-bottom: 0.25rem;
}

.detail-value {
	font-weight: 600;
}

.detail-value.active {
	color: #10b981;
}

.detail-value.inactive {
	color: #64748b;
}

.subscription-info {
	margin-bottom: 2rem;
}

.subscription-info ul {
	list-style: none;
	padding: 0;
}

.subscription-info li {
	margin: 1rem 0;
	padding-left: 2rem;
	position: relative;
}

.subscription-info li::before {
	content: '✓';
	color: #4caf50;
	position: absolute;
	left: 0;
}

.subscription-plans {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 2rem;
	margin-bottom: 2rem;
}

.plan {
	border: 2px solid #e0e0e0;
	border-radius: 8px;
	padding: 1.5rem;
	text-align: center;
	cursor: pointer;
	transition: all 0.3s ease;
	position: relative;
}

.plan:hover {
	transform: translateY(-5px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plan.selected {
	border-color: #4caf50;
	background-color: #f8fff8;
}

.price {
	font-size: 2rem;
	font-weight: bold;
	color: #333;
	margin: 1rem 0;
}

.description {
	color: #666;
}

.popular-badge {
	position: absolute;
	top: -12px;
	right: -12px;
	background: #ff4081;
	color: white;
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 0.8rem;
}

.phone-form {
	background-color: #f8f9fa;
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 2rem;
}

.form-group {
	margin-bottom: 1.5rem;
}

.form-group label {
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
}

.form-group input {
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 1rem;
}

.form-group input.invalid {
	border-color: #f44336;
}

.error-message {
	color: #f44336;
	font-size: 0.875rem;
	margin-top: 0.5rem;
}

.help-text {
	color: #666;
	font-size: 0.875rem;
	margin-top: 0.5rem;
}

.subscribe-button {
	display: block;
	width: 100%;
	max-width: 300px;
	margin: 0 auto;
	padding: 1rem;
	background: #4caf50;
	color: white;
	border: none;
	border-radius: 8px;
	font-size: 1.1rem;
	cursor: pointer;
	transition: background 0.3s ease;
}

.subscribe-button:hover {
	background: #45a049;
}

.subscribe-button:disabled {
	background: #cccccc;
	cursor: not-allowed;
}

.payment-history {
	margin-top: 3rem;
}

.history-table {
	overflow-x: auto;
}

table {
	width: 100%;
	border-collapse: collapse;
	margin-top: 1rem;
}

th,
td {
	padding: 1rem;
	text-align: left;
	border-bottom: 1px solid #eee;
}

th {
	font-weight: 600;
	background-color: #f5f5f5;
}

.status-pending {
	color: #ff9800;
}

.status-succeeded {
	color: #4caf50;
}

.status-canceled {
	color: #f44336;
}

.status-waiting_for_capture {
	color: #2196f3;
}

.status-waiting {
	color: #ff9800;
}

.status-confirming {
	color: #2196f3;
}

.status-confirmed {
	color: #4caf50;
}

.status-sending {
	color: #ff9800;
}

.status-partially_paid {
	color: #ff9800;
}

.status-finished {
	color: #4caf50;
}

.status-failed {
	color: #f44336;
}

.status-expired {
	color: #9e9e9e;
}

.status-refunded {
	color: #9e9e9e;
}

.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 300px;
	background: #fff;
	border-radius: 12px;
	padding: 2rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.spinner {
	width: 50px;
	height: 50px;
	border-radius: 50%;
	border: 3px solid rgba(0, 0, 0, 0.1);
	border-top: 3px solid #4caf50;
	animation: spin 1s linear infinite;
	margin-bottom: 1rem;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.error-container {
	text-align: center;
	background: #fff;
	border-radius: 12px;
	padding: 2rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.retry-button {
	background: #4caf50;
	color: white;
	border: none;
	border-radius: 4px;
	padding: 0.5rem 1rem;
	cursor: pointer;
	margin-top: 1rem;
}

.retry-button:hover {
	background: #45a049;
}

.payment-methods {
	display: flex;
	gap: 1rem;
	margin: 1.5rem 0;
}

.payment-method {
	display: flex;
	flex-direction: column;
	align-items: center;
	border: 2px solid #e0e0e0;
	border-radius: 8px;
	padding: 1.5rem;
	cursor: pointer;
	transition: all 0.3s ease;
	width: 100%;
	max-width: 200px;
}

.payment-method:hover {
	transform: translateY(-5px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.payment-method img {
	height: 40px;
	width: auto;
	margin-bottom: 1rem;
	object-fit: contain;
}

.payment-method span {
	font-weight: 500;
}

.payment-method.selected {
	border-color: #4caf50;
	background-color: #f8fff8;
}

.payment-status-message {
	position: fixed;
	top: 20px;
	right: 20px;
	background-color: #fff;
	border-radius: 8px;
	padding: 1rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	display: flex;
	align-items: center;
	gap: 1rem;
	z-index: 1000;
	min-width: 300px;
	max-width: 400px;
}

.payment-status-message.success .icon {
	color: #4caf50;
}

.payment-status-message.pending .icon {
	color: #ff9800;
}

.payment-status-message.error .icon {
	color: #f44336;
}

.icon {
	font-size: 2rem;
}

.message {
	flex: 1;
}

.close-button {
	background: none;
	border: none;
	font-size: 1rem;
	color: #666;
	cursor: pointer;
}

.payment-methods-info {
	margin-top: 1rem;
}

.payment-icons {
	display: flex;
	gap: 1rem;
	margin-bottom: 1rem;
}

.payment-icon {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.payment-icon img {
	height: 40px;
	width: auto;
	margin-bottom: 0.5rem;
	object-fit: contain;
}

.payment-icon span {
	font-weight: 500;
}

.payment-note {
	color: #666;
	font-size: 0.875rem;
	margin-top: 0.5rem;
}

.saved-payment-methods {
	margin-bottom: 2rem;
}

.payment-methods-list {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	margin-bottom: 1rem;
}

.payment-method-item {
	display: flex;
	align-items: center;
	padding: 1rem;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	width: 100%;
	max-width: 350px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.payment-method-item:hover {
	border-color: #4caf50;
	background-color: #f8fff8;
}

.payment-method-item.selected {
	border-color: #4caf50;
	background-color: #f8fff8;
	box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.payment-method-item.is-default {
	border-color: #4caf50;
}

.method-icon {
	font-size: 1.5rem;
	color: #4f46e5;
	width: 40px;
	text-align: center;
}

.method-details {
	flex: 1;
	margin-left: 1rem;
}

.method-title {
	font-weight: 600;
	margin-bottom: 0.25rem;
}

.method-card-info {
	color: #64748b;
	font-size: 0.875rem;
}

.method-default-badge {
	display: inline-block;
	background-color: #4caf50;
	color: white;
	font-size: 0.75rem;
	padding: 0.125rem 0.5rem;
	border-radius: 1rem;
	margin-top: 0.25rem;
}

.method-select {
	margin-left: 1rem;
}

.radio-button {
	width: 18px;
	height: 18px;
	border: 2px solid #4f46e5;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.radio-inner {
	width: 10px;
	height: 10px;
	background-color: #4f46e5;
	border-radius: 50%;
}

.methods-actions {
	margin-top: 1rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.save-method-checkbox {
	display: flex;
	align-items: center;
	cursor: pointer;
}

.save-method-checkbox input {
	margin-right: 0.5rem;
}

.btn-save-method {
	background-color: transparent;
	border: 1px solid #4f46e5;
	color: #4f46e5;
	padding: 0.5rem 1rem;
	border-radius: 0.25rem;
	cursor: pointer;
	transition: all 0.2s ease;
}

.btn-save-method:hover {
	background-color: #4f46e5;
	color: white;
}

.save-payment-method {
	margin-bottom: 1.5rem;
	padding: 1rem;
	background-color: #f8f9fa;
	border-radius: 0.5rem;
}

.save-method-info {
	margin-top: 0.5rem;
	font-size: 0.875rem;
	color: #64748b;
}

.payment-status {
	display: flex;
	align-items: center;
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
}

.payment-status.status-success {
	background-color: #f0fff4;
	border: 1px solid #c6f6d5;
}

.payment-status.status-error {
	background-color: #fff5f5;
	border: 1px solid #fed7d7;
}

.payment-status.status-info {
	background-color: #ebf8ff;
	border: 1px solid #bee3f8;
}

.payment-status.status-pending {
	background-color: #fffaf0;
	border: 1px solid #feebc8;
}

.payment-status i {
	font-size: 1.5rem;
	margin-right: 1rem;
}

.payment-status.status-success i {
	color: #48bb78;
}

.payment-status.status-error i {
	color: #f56565;
}

.payment-status.status-info i {
	color: #4299e1;
}

.payment-status.status-pending i {
	color: #ed8936;
}
</style>
