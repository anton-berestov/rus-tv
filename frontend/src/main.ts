import axios from 'axios'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import { pendingNavigations, router } from './router'
import { useAuthStore } from './stores/auth'

// Настройка базового URL для axios
axios.defaults.baseURL = 'http://localhost:3001'

// Создаем interceptor для axios
axios.interceptors.response.use(
	response => response,
	error => {
		// Проверяем наличие authStore перед использованием
		if (error.response?.status === 401) {
			console.warn('Получена ошибка авторизации:', error.response.data)

			// Получаем store через функцию, чтобы избежать циклической зависимости
			const getStore = () => {
				try {
					return useAuthStore()
				} catch {
					return null
				}
			}

			const store = getStore()
			// Очищаем авторизацию, если store доступен
			if (store) {
				console.log('Очищаем авторизацию из-за ошибки JWT токена')
				store.clearAuth()

				// Перенаправляем на страницу входа, если не на ней
				if (router.currentRoute.value.name !== 'login') {
					router.push('/login')
				}
			}
		}
		return Promise.reject(error)
	}
)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Инициализация store авторизации и монтирование приложения
const authStore = useAuthStore(pinia)
authStore.init().finally(() => {
	// Запуск отложенных навигаций
	while (pendingNavigations.length) {
		const pendingNavigation = pendingNavigations.shift()
		if (pendingNavigation) {
			// Проверяем условия авторизации для отложенной навигации
			if (
				pendingNavigation.to.meta.requiresAuth &&
				!authStore.isAuthenticated
			) {
				router.push({ name: 'login' })
			} else if (
				pendingNavigation.to.meta.requiresSubscription &&
				!authStore.hasActiveSubscription
			) {
				router.push({ name: 'subscription' })
			} else {
				// Продолжаем навигацию
				pendingNavigation.next()
			}
		}
	}

	app.mount('#app')
})
