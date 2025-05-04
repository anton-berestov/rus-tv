<template>
	<div class="payment-methods-container">
		<h3 class="text-xl font-bold mb-4">Сохраненные способы оплаты</h3>

		<div v-if="loading" class="text-center py-4">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Загрузка...</span>
			</div>
		</div>

		<div v-else-if="paymentMethods.length === 0" class="no-methods-message">
			<p>У вас пока нет сохраненных способов оплаты.</p>
			<p class="text-sm text-gray-600 mt-2">
				Сохраненные способы оплаты появятся после успешной оплаты с
				установленной опцией "Сохранить способ оплаты".
			</p>
		</div>

		<div v-else class="payment-methods-list">
			<div
				v-for="method in paymentMethods"
				:key="method.id"
				class="payment-method-card"
				:class="{ 'default-method': method.isDefault }"
			>
				<div class="card-body">
					<div class="flex justify-between items-center">
						<div class="method-info">
							<!-- Иконка метода оплаты в зависимости от типа -->
							<div class="method-icon">
								<i
									v-if="method.type === 'bank_card'"
									class="fas fa-credit-card"
								></i>
								<i
									v-else-if="method.type === 'yoo_money'"
									class="fas fa-wallet"
								></i>
								<i v-else class="fas fa-money-bill"></i>
							</div>

							<div class="method-details">
								<div class="method-title">{{ method.title }}</div>

								<!-- Информация о карте -->
								<div v-if="method.card" class="card-info">
									<span v-if="method.card.first6" class="card-number">{{
										formatCardNumber(method.card)
									}}</span>
									<span
										v-if="method.card.expiryMonth && method.card.expiryYear"
										class="card-expiry"
									>
										Срок действия: {{ method.card.expiryMonth }}/{{
											method.card.expiryYear
										}}
									</span>
								</div>

								<div v-if="method.isDefault" class="default-badge">
									<span>Основной способ оплаты</span>
								</div>
							</div>
						</div>

						<div class="method-actions">
							<button
								v-if="!method.isDefault"
								@click="setAsDefault(method.id)"
								class="btn-set-default"
								:disabled="actionInProgress"
							>
								Сделать основным
							</button>

							<button
								@click="deleteMethod(method.id)"
								class="btn-delete"
								:disabled="actionInProgress"
							>
								<i class="fas fa-trash"></i>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="payment-methods-info mt-4">
			<div class="info-card">
				<h4 class="info-title">
					<i class="fas fa-info-circle mr-2"></i>
					О зарубежных картах
				</h4>
				<p class="info-text">
					При оплате картами Visa или Mastercard, выпущенными зарубежными
					банками, сумма будет автоматически сконвертирована в валюту вашей
					карты по курсу банка-эмитента.
				</p>
			</div>

			<div class="info-card">
				<h4 class="info-title">
					<i class="fas fa-shield-alt mr-2"></i>
					Безопасность данных
				</h4>
				<p class="info-text">
					Мы не храним полные данные ваших карт. Платежи обрабатываются и
					защищаются платежной системой ЮKassa с соблюдением требований PCI DSS.
				</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

const loading = ref(false)
const actionInProgress = ref(false)
const error = ref('')

const paymentMethods = computed(() => {
	return authStore.paymentMethods || []
})

// Загрузка методов оплаты
const loadPaymentMethods = async () => {
	loading.value = true
	error.value = ''

	try {
		await authStore.fetchPaymentMethods()
	} catch (err: any) {
		error.value = err.message || 'Не удалось загрузить способы оплаты'
	} finally {
		loading.value = false
	}
}

// Установка метода оплаты по умолчанию
const setAsDefault = async (methodId: string) => {
	actionInProgress.value = true
	error.value = ''

	try {
		await authStore.setDefaultPaymentMethod(methodId)
	} catch (err: any) {
		error.value =
			err.message || 'Не удалось установить метод оплаты по умолчанию'
	} finally {
		actionInProgress.value = false
	}
}

// Удаление метода оплаты
const deleteMethod = async (methodId: string) => {
	if (!confirm('Вы уверены, что хотите удалить этот способ оплаты?')) {
		return
	}

	actionInProgress.value = true
	error.value = ''

	try {
		await authStore.deletePaymentMethod(methodId)
	} catch (err: any) {
		error.value = err.message || 'Не удалось удалить метод оплаты'
	} finally {
		actionInProgress.value = false
	}
}

// Форматирование номера карты для отображения
const formatCardNumber = (card: any) => {
	if (!card) return ''

	let formatted = ''
	if (card.first6) {
		formatted +=
			card.first6.substring(0, 4) + ' ' + card.first6.substring(4, 6) + 'xx '
	}

	if (card.last4) {
		formatted += 'xxxx ' + card.last4
	}

	return formatted.trim()
}

onMounted(() => {
	loadPaymentMethods()
})
</script>

<style scoped>
.payment-methods-container {
	margin-bottom: 2rem;
}

.no-methods-message {
	padding: 1.5rem;
	background: #f8f9fa;
	border-radius: 8px;
	text-align: center;
}

.payment-methods-list {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.payment-method-card {
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1rem;
	background: white;
	transition: all 0.2s ease;
}

.default-method {
	border-color: #4f46e5;
	border-width: 2px;
	background-color: #f5f3ff;
}

.method-info {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.method-icon {
	font-size: 1.5rem;
	color: #4f46e5;
	min-width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f5f3ff;
	border-radius: 50%;
}

.method-details {
	flex: 1;
}

.method-title {
	font-weight: 600;
	margin-bottom: 0.25rem;
}

.card-info {
	color: #64748b;
	font-size: 0.875rem;
	display: flex;
	flex-direction: column;
}

.default-badge {
	display: inline-block;
	margin-top: 0.5rem;
	background: #4f46e5;
	color: white;
	border-radius: 4px;
	padding: 0.25rem 0.5rem;
	font-size: 0.75rem;
	font-weight: 600;
}

.method-actions {
	display: flex;
	gap: 0.5rem;
}

.btn-set-default {
	background: transparent;
	border: 1px solid #4f46e5;
	color: #4f46e5;
	padding: 0.25rem 0.75rem;
	border-radius: 4px;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s;
}

.btn-set-default:hover {
	background: #f5f3ff;
}

.btn-delete {
	background: transparent;
	border: 1px solid #ef4444;
	color: #ef4444;
	width: 32px;
	height: 32px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s;
}

.btn-delete:hover {
	background: #fee2e2;
}

.payment-methods-info {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.info-card {
	background: #f8f9fa;
	border-radius: 8px;
	padding: 1rem;
}

.info-title {
	display: flex;
	align-items: center;
	font-weight: 600;
	margin-bottom: 0.5rem;
	color: #334155;
}

.info-text {
	color: #64748b;
	font-size: 0.875rem;
}

@media (max-width: 640px) {
	.method-actions {
		flex-direction: column;
	}
}
</style>
