<template>
	<div id="app">
		<div v-if="!authStore.isInitialized" class="loading-overlay">
			<div class="loading-spinner"></div>
		</div>

		<nav v-else-if="authStore.isAuthenticated" class="main-nav">
			<router-link to="/channels">Каналы</router-link>
			<router-link to="/subscription">Подписка</router-link>
			<button @click="logout" class="logout-button">Выйти</button>
		</nav>
		<div class="router-view-container">
			<router-view v-slot="{ Component }">
				<keep-alive include="SubscriptionPage">
					<component :is="Component" />
				</keep-alive>
			</router-view>
		</div>
		<footer class="site-footer">
			<div class="footer-content">
				<strong>Информация для покупателей</strong>
				<div class="footer-offer">
					Берестов Антон Леонидович<br />
					ИНН: 182101629473<br />
					<a href="/offer" class="footer-link">Публичная оферта</a><br />
					<a href="mailto:info@rus-tv.live" class="footer-link"
						>info@rus-tv.live</a
					>
				</div>
			</div>
		</footer>
	</div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const logout = async () => {
	await authStore.logout()
	router.push('/login')
}
</script>

<style>
html,
body {
	margin: 0;
	padding: 0;
	width: 100%;
}

body {
	margin: 0;
	padding: 0;
	font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI',
		Roboto, 'Helvetica Neue', Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	background: linear-gradient(135deg, #f5f7fa 0%, #e4eafc 100%);
	color: #333;
	line-height: 1.6;
	overflow-x: hidden;
	width: 100%;
	box-sizing: border-box;
}

#app {
	min-height: 100vh;
	margin: 0 auto;
	box-sizing: border-box;
	overflow-x: hidden;
}

.main-nav {
	background: linear-gradient(to right, #2c3e50, #4c6ef5);
	padding: 1rem;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	display: flex;
	justify-content: center;
	gap: 2.5rem;
	border-radius: 0 0 10px 10px;
	position: relative;
	z-index: 10;
}

.main-nav a {
	color: rgba(255, 255, 255, 0.85);
	text-decoration: none;
	font-weight: 600;
	padding: 0.6rem 1.2rem;
	border-radius: 6px;
	transition: all 0.3s ease;
	letter-spacing: 0.5px;
	position: relative;
}

.main-nav a:hover {
	color: #ffffff;
	background-color: rgba(255, 255, 255, 0.1);
	transform: translateY(-2px);
}

.main-nav a.router-link-active {
	color: #ffffff;
	background-color: rgba(255, 255, 255, 0.15);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
	border-bottom: 2px solid #4cd964;
}

.logout-button {
	background: rgba(220, 53, 69, 0.1);
	border: 2px solid rgba(220, 53, 69, 0.6);
	color: #ffffff;
	padding: 0.6rem 1.2rem;
	border-radius: 6px;
	cursor: pointer;
	font-weight: 600;
	transition: all 0.3s ease;
	letter-spacing: 0.5px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logout-button:hover {
	background: rgba(220, 53, 69, 0.9);
	color: white;
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.register-button {
	color: #fff;
	background-color: #4caf50;
	border-radius: 4px;
}

.register-button:hover {
	background-color: #3d9140;
}

.loading-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(44, 62, 80, 0.95);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 9999;
	backdrop-filter: blur(5px);
}

.loading-spinner {
	width: 50px;
	height: 50px;
	border-radius: 50%;
	border: 3px solid rgba(255, 255, 255, 0.1);
	border-top: 3px solid #4c6ef5;
	border-right: 3px solid transparent;
	box-shadow: 0 0 25px rgba(76, 110, 245, 0.5);
	animation: spin 0.8s ease-in-out infinite;
	position: relative;
}

.loading-spinner::before {
	content: '';
	position: absolute;
	top: -10px;
	left: -10px;
	right: -10px;
	bottom: -10px;
	border-radius: 50%;
	border: 3px solid rgba(76, 110, 245, 0.1);
	animation: pulse 1.5s linear infinite;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

@keyframes pulse {
	0% {
		transform: scale(0.85);
		opacity: 0.7;
	}
	50% {
		transform: scale(1);
		opacity: 0.3;
	}
	100% {
		transform: scale(0.85);
		opacity: 0.7;
	}
}

.full-width-view {
	width: 100vw;
	max-width: 100vw;
	margin-left: calc(-50vw + 50%);
	padding: 0;
	overflow-x: hidden;
	position: relative;
	left: 0;
	right: 0;
}

.full-width-view > * {
	max-width: 100vw !important;
	width: 100vw !important;
	margin: 0 !important;
	padding: 0 !important;
	overflow-x: hidden !important;
}

.site-footer {
	width: 100%;
	background: linear-gradient(90deg, #e4eafc 0%, #f5f7fa 100%);
	color: #333;
	padding: 2rem 0 1.2rem 0;
	text-align: center;
	font-size: 1rem;
	border-top: 1px solid #dbeafe;
	box-shadow: 0 -2px 8px rgba(76, 110, 245, 0.05);
}
.footer-content {
	max-width: 700px;
	margin: 0 auto;
	padding: 0 1rem;
}
.footer-content ul {
	list-style: disc inside;
	margin: 0.5rem 0 1rem 0;
	padding: 0;
	text-align: left;
}
.footer-offer {
	margin-top: 0.7rem;
	font-size: 0.98rem;
	color: #444;
}
.footer-link {
	display: inline-block;
	margin-top: 0.5rem;
	color: #4c6ef5;
	text-decoration: underline;
	font-weight: 500;
	transition: color 0.2s;
}
.footer-link:hover {
	color: #2c3e50;
	text-decoration: none;
}
</style>
