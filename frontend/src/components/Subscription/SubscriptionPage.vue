<!-- SubscriptionPage.vue -->
<template>
	<div class="subscription-page">
		<div class="subscription-container">
			<h1>Оформление подписки</h1>
			<div class="subscription-info">
				<h2>Преимущества подписки:</h2>
				<ul>
					<li>Доступ ко всем телеканалам</li>
					<li>Высокое качество вещания</li>
					<li>Просмотр на нескольких устройствах</li>
					<li>Техническая поддержка 24/7</li>
				</ul>
			</div>
			<div class="subscription-plans">
				<div
					class="plan"
					:class="{ selected: selectedPlan === 1 }"
					@click="selectPlan(1)"
				>
					<h3>1 месяц</h3>
					<p class="price">299 ₽</p>
					<p class="description">Базовый план</p>
				</div>
				<div
					class="plan"
					:class="{ selected: selectedPlan === 3 }"
					@click="selectPlan(3)"
				>
					<h3>3 месяца</h3>
					<p class="price">799 ₽</p>
					<p class="description">Выгода 10%</p>
					<div class="popular-badge">Популярный</div>
				</div>
				<div
					class="plan"
					:class="{ selected: selectedPlan === 12 }"
					@click="selectPlan(12)"
				>
					<h3>12 месяцев</h3>
					<p class="price">2799 ₽</p>
					<p class="description">Выгода 22%</p>
				</div>
			</div>
			<button
				class="subscribe-button"
				@click="subscribe"
				:disabled="!selectedPlan"
			>
				Оформить подписку
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const selectedPlan = ref<number | null>(null)

const selectPlan = (months: number) => {
	selectedPlan.value = months
}

const subscribe = async () => {
	if (!selectedPlan.value) return

	try {
		await authStore.subscribe(selectedPlan.value)
		router.push('/channels')
	} catch (error) {
		console.error('Ошибка при оформлении подписки:', error)
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
</style>
