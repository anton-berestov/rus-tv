<template>
	<div class="subscription-form">
		<h2>Управление подпиской</h2>
		<div v-if="user.subscription.active" class="subscription-info">
			<h3>Текущая подписка</h3>
			<p>Количество устройств: {{ user.subscription.deviceLimit }}</p>
			<p>Действует до: {{ formatDate(user.subscription.expireDate) }}</p>
		</div>
		<form @submit.prevent="handleSubmit">
			<div class="form-group">
				<label for="deviceLimit">Количество устройств:</label>
				<input
					type="number"
					id="deviceLimit"
					v-model="deviceLimit"
					min="1"
					required
					class="form-control"
				/>
				<p class="price-info">Стоимость: ${{ calculatePrice }} в месяц</p>
			</div>
			<button type="submit" class="btn btn-primary">
				{{
					user.subscription.active ? 'Обновить подписку' : 'Оформить подписку'
				}}
			</button>
		</form>
		<p v-if="error" class="error">{{ error }}</p>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const deviceLimit = ref(1)
const error = ref('')

const calculatePrice = computed(() => {
	return deviceLimit.value * 3
})

const formatDate = (date: string) => {
	return new Date(date).toLocaleDateString('ru-RU')
}

const handleSubmit = async () => {
	try {
		await authStore.subscribe(deviceLimit.value)
	} catch (err: any) {
		error.value = err.message || 'Ошибка при обновлении подписки'
	}
}

const user = authStore.user
</script>

<style scoped>
.subscription-form {
	max-width: 400px;
	margin: 0 auto;
	padding: 20px;
}

.subscription-info {
	margin-bottom: 20px;
	padding: 15px;
	background-color: #f8f9fa;
	border-radius: 4px;
}

.form-group {
	margin-bottom: 15px;
}

.form-control {
	width: 100%;
	padding: 8px;
	border: 1px solid #ddd;
	border-radius: 4px;
}

.price-info {
	margin-top: 5px;
	color: #28a745;
}

.btn {
	width: 100%;
	padding: 10px;
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
}

.btn:hover {
	background-color: #0056b3;
}

.error {
	color: red;
	margin-top: 10px;
}
</style>
