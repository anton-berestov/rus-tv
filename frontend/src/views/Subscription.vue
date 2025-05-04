<template>
	<div class="subscription-page">
		<SubscriptionForm />
		<!-- Если есть последний платеж и он в ожидании оплаты -->
		<div
			v-if="lastPayment && lastPayment.status === 'pending'"
			class="pending-payment"
		>
			<div class="alert alert-info">
				<h3>Ожидание оплаты</h3>
				<p>
					Мы ожидаем подтверждение вашего платежа от платежной системы. Это
					может занять несколько минут.
				</p>
				<p>
					Когда платеж будет подтвержден, ваша подписка активируется
					автоматически.
				</p>
				<div class="mt-3">
					<button
						@click="checkPaymentStatus(lastPayment.id)"
						class="btn btn-primary"
						:disabled="isCheckingPayment"
					>
						<span v-if="isCheckingPayment">
							<i class="fas fa-circle-notch fa-spin"></i> Проверка...
						</span>
						<span v-else>
							<i class="fas fa-sync-alt"></i> Проверить статус платежа
						</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Если платеж в ожидании захвата -->
		<div
			v-if="lastPayment && lastPayment.status === 'waiting_for_capture'"
			class="pending-payment"
		>
			<div class="alert alert-warning">
				<h3>Требуется подтверждение</h3>
				<p>
					Ваш платеж ожидает подтверждения. Нажмите кнопку ниже, чтобы завершить
					оплату и активировать подписку.
				</p>
				<div class="mt-3">
					<button
						@click="capturePayment(lastPayment.id)"
						class="btn btn-success"
						:disabled="isCapturing"
					>
						<span v-if="isCapturing">
							<i class="fas fa-circle-notch fa-spin"></i> Подтверждение...
						</span>
						<span v-else>
							<i class="fas fa-check-circle"></i> Подтвердить оплату
						</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Информация о последнем платеже и кнопка повторной проверки даже для оплаченных -->
		<div
			v-if="lastPayment && lastPayment.status !== 'pending'"
			class="last-payment-info mb-4"
		>
			<div
				class="alert"
				:class="
					lastPayment.status === 'succeeded' ? 'alert-success' : 'alert-warning'
				"
			>
				<h3>
					Последний платеж:
					{{
						lastPayment.status === 'succeeded'
							? 'Оплачен'
							: lastPayment.status === 'canceled'
							? 'Отменен'
							: 'В обработке'
					}}
				</h3>
				<p v-if="lastPayment.status === 'succeeded'">
					Платеж был успешно выполнен и подписка активирована.
				</p>
				<p v-if="lastPayment.status === 'canceled'">
					Платеж был отменен. Вы можете выбрать тариф и оформить подписку
					заново.
				</p>
				<div class="mt-2">
					<button
						@click="checkPaymentStatus(lastPayment.id)"
						class="btn btn-sm btn-outline-primary"
						:disabled="isCheckingPayment"
					>
						<span v-if="isCheckingPayment">
							<i class="fas fa-circle-notch fa-spin"></i> Проверка...
						</span>
						<span v-else>
							<i class="fas fa-sync-alt"></i> Обновить статус
						</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import SubscriptionForm from '../components/Subscription/SubscriptionForm.vue'
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const authStore = useAuthStore()

const isCheckingPayment = ref(false)
const isCapturing = ref(false)
const lastPayment = ref(null)

// Загрузка истории платежей
const loadPaymentHistory = async () => {
	try {
		const response = await axios.get('/api/subscriptions/payments')
		if (
			response.data &&
			response.data.payments &&
			response.data.payments.length > 0
		) {
			// Берем последний платеж из истории
			lastPayment.value = response.data.payments[0]
		}
	} catch (error) {
		console.error('Ошибка при загрузке истории платежей:', error)
	}
}

// Проверка статуса платежа
const checkPaymentStatus = async (paymentId: string) => {
	if (!paymentId) return

	isCheckingPayment.value = true
	try {
		await authStore.checkYookassaStatus(paymentId)
		// Перезагружаем историю платежей
		await loadPaymentHistory()
	} catch (error) {
		console.error('Ошибка при проверке статуса платежа:', error)
	} finally {
		isCheckingPayment.value = false
	}
}

// Захват платежа (для двухэтапной оплаты)
const capturePayment = async (paymentId: string) => {
	if (!paymentId) return

	isCapturing.value = true
	try {
		await authStore.capturePayment(paymentId)
		// Перезагружаем историю платежей
		await loadPaymentHistory()
	} catch (error) {
		console.error('Ошибка при захвате платежа:', error)
	} finally {
		isCapturing.value = false
	}
}

// Загружаем историю платежей при монтировании компонента
onMounted(async () => {
	await loadPaymentHistory()
})
</script>

<style scoped>
.subscription-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #f8f9fa;
}
</style>
