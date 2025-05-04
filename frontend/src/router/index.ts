import { useAuthStore } from '@/stores/auth'
import {
	createRouter,
	createWebHistory,
	NavigationGuardNext,
	RouteLocationNormalized,
} from 'vue-router'

// Описание типа для pendingNavigations
interface PendingNavigation {
	to: RouteLocationNormalized
	from: RouteLocationNormalized
	next: NavigationGuardNext
}

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'welcome',
			component: () => import('@/views/Welcome.vue'),
			meta: { requiresAuth: false },
		},
		{
			path: '/home',
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
			path: '/subscription/:paymentId',
			name: 'subscription-payment',
			component: () => import('@/components/Subscription/SubscriptionPage.vue'),
			meta: { requiresAuth: true },
			props: true,
		},
		{
			path: '/channels',
			name: 'channels',
			component: () => import('@/components/Channel/ChannelList.vue'),
			meta: { requiresAuth: true, requiresSubscription: true },
		},
		{
			path: '/offer',
			name: 'offer',
			component: () => import('@/views/Offer.vue'),
			meta: { requiresAuth: false },
		},
	],
})

// Хранилище маршрутов, ожидающих инициализацию
const pendingNavigations: PendingNavigation[] = []

// Навигационный охранник работает после инициализации авторизации
router.beforeEach((to, from, next) => {
	const authStore = useAuthStore()

	// Если инициализация не завершена, откладываем навигацию
	if (!authStore.isInitialized && to.meta.requiresAuth) {
		// Сохраняем маршрут и функцию next для выполнения после инициализации
		pendingNavigations.push({ to, from, next })
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

// Экспортируем маршрутизатор и массив отложенных навигаций для использования в main.ts
export { pendingNavigations, router }
export default router
