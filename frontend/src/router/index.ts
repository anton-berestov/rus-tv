import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'home',
			redirect: to => {
				const authStore = useAuthStore()
				return authStore.hasActiveSubscription
					? { name: 'channels' }
					: { name: 'subscription' }
			},
			meta: { requiresAuth: true },
		},
		{
			path: '/login',
			name: 'login',
			component: () => import('@/views/Login.vue'),
		},
		{
			path: '/register',
			name: 'register',
			component: () => import('@/views/Register.vue'),
		},
		{
			path: '/subscription',
			name: 'subscription',
			component: () => import('@/components/Subscription/SubscriptionPage.vue'),
			meta: { requiresAuth: true },
		},
		{
			path: '/channels',
			name: 'channels',
			component: () => import('@/components/Channel/ChannelList.vue'),
			meta: { requiresAuth: true, requiresSubscription: true },
		},
	],
})

// Навигационный охранник работает после инициализации авторизации
router.beforeEach((to, from, next) => {
	const authStore = useAuthStore()

	// Если инициализация не завершена, откладываем навигацию
	if (!authStore.isInitialized && to.meta.requiresAuth) {
		// Просто возвращаемся без вызова next(), инициализация в main.ts вызовет next() позже
		return
	}

	// Если маршрут требует авторизации и пользователь не авторизован
	if (to.meta.requiresAuth && !authStore.isAuthenticated) {
		next({ name: 'login' })
		return
	}

	// Если маршрут требует подписки и у пользователя нет активной подписки
	if (to.meta.requiresSubscription && !authStore.hasActiveSubscription) {
		next({ name: 'subscription' })
		return
	}

	next()
})

export default router
