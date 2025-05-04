<template>
	<div class="auto-renewal-container">
		<h3 class="text-xl font-bold mb-4">Автопродление подписки</h3>

		<div class="auto-renewal-card">
			<div class="card-content">
				<div class="renewal-status">
					<div class="status-icon" :class="{ active: autoRenewalEnabled }">
						<i
							class="fas"
							:class="autoRenewalEnabled ? 'fa-toggle-on' : 'fa-toggle-off'"
						></i>
					</div>

					<div class="status-info">
						<h4 class="status-title">
							{{
								autoRenewalEnabled
									? 'Автопродление включено'
									: 'Автопродление отключено'
							}}
						</h4>
						<p class="status-description">
							{{
								autoRenewalEnabled
									? 'Ваша подписка будет автоматически продлена при истечении срока действия.'
									: 'Ваша подписка не будет продлена автоматически. Вам нужно будет продлить её вручную.'
							}}
						</p>

						<div
							v-if="autoRenewalEnabled && defaultPaymentMethod"
							class="payment-method-info"
						>
							<p>Способ оплаты для автопродления:</p>
							<div class="default-method">
								<i
									class="fas"
									:class="getMethodIcon(defaultPaymentMethod.type)"
								></i>
								<span>{{ defaultPaymentMethod.title }}</span>
								<span v-if="defaultPaymentMethod.card" class="card-info">
									**** {{ defaultPaymentMethod.card.last4 }}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div class="renewal-actions">
					<button
						v-if="autoRenewalEnabled"
						@click="disableAutoRenewal"
						class="btn-disable"
						:disabled="loading"
					>
						<i class="fas fa-times-circle mr-2"></i> Отключить автопродление
					</button>

					<button
						v-else
						@click="showEnableModal = true"
						class="btn-enable"
						:disabled="loading || paymentMethods.length === 0"
					>
						<i class="fas fa-check-circle mr-2"></i> Включить автопродление
					</button>
				</div>
			</div>
		</div>

		<div class="info-section">
			<div class="info-card">
				<h4 class="info-title">
					<i class="fas fa-info-circle mr-2"></i>
					Как работает автопродление?
				</h4>
				<p class="info-text">
					При включении автопродления мы будем автоматически списывать средства
					с выбранного способа оплаты за день до окончания текущей подписки. Вы
					всегда можете отключить автопродление в личном кабинете.
				</p>
			</div>
		</div>

		<!-- Модальное окно для включения автопродления -->
		<div v-if="showEnableModal" class="modal-backdrop">
			<div class="modal-content">
				<div class="modal-header">
					<h3 class="modal-title">Включение автопродления</h3>
					<button @click="showEnableModal = false" class="modal-close">
						<i class="fas fa-times"></i>
					</button>
				</div>

				<div class="modal-body">
					<p class="mb-4">
						Выберите способ оплаты, который будет использоваться для
						автоматического продления подписки:
					</p>

					<div v-if="paymentMethods.length === 0" class="no-methods-message">
						<p>У вас нет сохраненных способов оплаты.</p>
						<p class="text-sm mt-2">
							Чтобы включить автопродление, сначала выполните оплату подписки с
							опцией "Сохранить способ оплаты".
						</p>
					</div>

					<div v-else class="payment-methods-selection">
						<div
							v-for="method in paymentMethods"
							:key="method.id"
							class="payment-method-option"
							:class="{ selected: selectedMethodId === method.id }"
							@click="selectedMethodId = method.id"
						>
							<div class="radio-button">
								<div
									class="radio-inner"
									v-if="selectedMethodId === method.id"
								></div>
							</div>

							<div class="method-details">
								<div class="method-title">{{ method.title }}</div>
								<div v-if="method.card" class="card-info">
									**** {{ method.card.last4 }}
								</div>
							</div>
						</div>
					</div>

					<div class="consent-section mt-4">
						<label class="consent-label">
							<input
								type="checkbox"
								v-model="userConsent"
								class="consent-checkbox"
							/>
							<span class="consent-text">
								Я согласен с автоматическим списанием средств для продления
								подписки. Я понимаю, что могу отключить автопродление в любое
								время.
							</span>
						</label>
					</div>

					<div v-if="error" class="error-message">
						{{ error }}
					</div>
				</div>

				<div class="modal-footer">
					<button @click="showEnableModal = false" class="btn-cancel">
						Отмена
					</button>
					<button
						@click="enableAutoRenewal"
						class="btn-confirm"
						:disabled="!selectedMethodId || !userConsent || loading"
					>
						<i v-if="loading" class="fas fa-spinner fa-spin mr-2"></i>
						Включить автопродление
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const showEnableModal = ref(false)
const selectedMethodId = ref('')
const userConsent = ref(false)

// Вычисляемые свойства
const autoRenewalEnabled = computed(() => authStore.hasAutoRenewal)
const paymentMethods = computed(() => authStore.paymentMethods || [])
const defaultPaymentMethod = computed(
	() => authStore.defaultPaymentMethod || null
)

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

// Включение автопродления
const enableAutoRenewal = async () => {
	if (!selectedMethodId.value || !userConsent.value) {
		return
	}

	loading.value = true
	error.value = ''

	try {
		await authStore.toggleAutoRenewal(true, selectedMethodId.value)
		showEnableModal.value = false
		selectedMethodId.value = ''
		userConsent.value = false
	} catch (err: any) {
		error.value = err.message || 'Не удалось включить автопродление подписки'
	} finally {
		loading.value = false
	}
}

// Отключение автопродления
const disableAutoRenewal = async () => {
	if (!confirm('Вы уверены, что хотите отключить автопродление подписки?')) {
		return
	}

	loading.value = true
	error.value = ''

	try {
		await authStore.toggleAutoRenewal(false)
	} catch (err: any) {
		error.value = err.message || 'Не удалось отключить автопродление подписки'
	} finally {
		loading.value = false
	}
}

// При открытии модального окна выбираем текущий метод по умолчанию
const openEnableModal = () => {
	if (defaultPaymentMethod.value) {
		selectedMethodId.value = defaultPaymentMethod.value.id
	} else if (paymentMethods.value.length > 0) {
		selectedMethodId.value = paymentMethods.value[0].id
	}
	showEnableModal.value = true
}

onMounted(async () => {
	if (!paymentMethods.value.length) {
		await authStore.fetchPaymentMethods()
	}
})
</script>

<style scoped>
.auto-renewal-container {
	margin-bottom: 2rem;
}

.auto-renewal-card {
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1.5rem;
	background: white;
}

.card-content {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.renewal-status {
	display: flex;
	align-items: flex-start;
	gap: 1rem;
}

.status-icon {
	font-size: 2rem;
	color: #94a3b8;
}

.status-icon.active {
	color: #4f46e5;
}

.status-info {
	flex: 1;
}

.status-title {
	font-size: 1.125rem;
	font-weight: 600;
	margin-bottom: 0.5rem;
}

.status-description {
	color: #64748b;
	margin-bottom: 1rem;
}

.payment-method-info {
	background: #f8fafc;
	border-radius: 6px;
	padding: 0.75rem;
	margin-top: 1rem;
}

.default-method {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-top: 0.5rem;
	font-weight: 500;
}

.renewal-actions {
	display: flex;
	justify-content: flex-end;
}

.btn-enable,
.btn-disable {
	padding: 0.5rem 1rem;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
}

.btn-enable {
	background: #4f46e5;
	color: white;
	border: none;
}

.btn-enable:hover {
	background: #4338ca;
}

.btn-disable {
	background: transparent;
	color: #ef4444;
	border: 1px solid #ef4444;
}

.btn-disable:hover {
	background: #fee2e2;
}

.btn-enable:disabled,
.btn-disable:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.info-section {
	margin-top: 1.5rem;
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

/* Модальное окно */
.modal-backdrop {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	background: white;
	border-radius: 8px;
	width: 90%;
	max-width: 500px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 1.5rem;
	border-bottom: 1px solid #e2e8f0;
}

.modal-title {
	font-weight: 600;
	font-size: 1.25rem;
}

.modal-close {
	background: transparent;
	border: none;
	font-size: 1.25rem;
	cursor: pointer;
	color: #64748b;
}

.modal-body {
	padding: 1.5rem;
}

.modal-footer {
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	padding: 1rem 1.5rem;
	border-top: 1px solid #e2e8f0;
}

.btn-cancel {
	background: transparent;
	border: 1px solid #cbd5e1;
	color: #64748b;
	padding: 0.5rem 1rem;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
}

.btn-confirm {
	background: #4f46e5;
	color: white;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 6px;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
}

.btn-confirm:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.payment-methods-selection {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin-bottom: 1rem;
}

.payment-method-option {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.75rem;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s;
}

.payment-method-option:hover {
	border-color: #cbd5e1;
	background: #f8fafc;
}

.payment-method-option.selected {
	border-color: #4f46e5;
	background: #f5f3ff;
}

.radio-button {
	width: 20px;
	height: 20px;
	border-radius: 50%;
	border: 2px solid #cbd5e1;
	display: flex;
	align-items: center;
	justify-content: center;
}

.payment-method-option.selected .radio-button {
	border-color: #4f46e5;
}

.radio-inner {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: #4f46e5;
}

.consent-label {
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	cursor: pointer;
}

.consent-checkbox {
	margin-top: 3px;
}

.consent-text {
	font-size: 0.875rem;
	color: #334155;
}

.error-message {
	color: #ef4444;
	margin-top: 1rem;
	font-size: 0.875rem;
}

@media (max-width: 640px) {
	.renewal-status {
		flex-direction: column;
	}

	.status-icon {
		margin-bottom: 1rem;
	}

	.renewal-actions {
		justify-content: center;
	}
}
</style>
