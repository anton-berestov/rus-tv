<template>
	<div id="app">
		<!-- Показываем загрузку, если инициализация еще не завершена -->
		<div v-if="!authStore.isInitialized" class="loading-overlay">
			<div class="loading-spinner"></div>
		</div>

		<!-- Показываем навигационный бар только если пользователь авторизован и инициализация завершена -->
		<nav v-else-if="authStore.isAuthenticated" class="main-nav">
			<router-link to="/channels">Каналы</router-link>
			<router-link to="/subscription">Подписка</router-link>
			<button @click="logout" class="logout-button">Выйти</button>
		</nav>
		<router-view></router-view>
	</div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const logout = async () => {
	authStore.logout()
	router.push('/login')
}
</script>

<style>
body {
	margin: 0;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
		'Helvetica Neue', Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	background-color: #f5f5f5;
}

#app {
	min-height: 100vh;
}

.main-nav {
	background: #fff;
	padding: 1rem;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	display: flex;
	justify-content: center;
	gap: 2rem;
}

.main-nav a {
	color: #333;
	text-decoration: none;
	font-weight: 500;
	padding: 0.5rem 1rem;
	border-radius: 4px;
	transition: background-color 0.3s;
}

.main-nav a:hover {
	background-color: #f0f0f0;
}

.main-nav a.router-link-active {
	color: #4caf50;
	background-color: #e8f5e9;
}

.logout-button {
	background: none;
	border: 1px solid #dc3545;
	color: #dc3545;
	padding: 0.5rem 1rem;
	border-radius: 4px;
	cursor: pointer;
	font-weight: 500;
	transition: all 0.3s;
}

.logout-button:hover {
	background: #dc3545;
	color: white;
}

.loading-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(255, 255, 255, 0.8);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 9999;
}

.loading-spinner {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	border: 4px solid #f3f3f3;
	border-top: 4px solid #4caf50;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
