import axios from 'axios'
import { defineStore } from 'pinia'

interface User {
	id: string
	email: string
	username: string
	subscription: {
		active: boolean
		deviceLimit: number
		expireDate: Date
	}
}

interface AuthState {
	user: User | null
	token: string | null
	isAuthenticated: boolean
	isLoading: boolean
	isInitialized: boolean
}

export const useAuthStore = defineStore('auth', {
	state: (): AuthState => ({
		user: null,
		token: localStorage.getItem('token'),
		isAuthenticated: false,
		isLoading: false,
		isInitialized: false,
	}),

	getters: {
		hasActiveSubscription(): boolean {
			if (!this.user || !this.user.subscription) return false
			return (
				this.user.subscription.active &&
				new Date(this.user.subscription.expireDate) > new Date()
			)
		},
	},

	actions: {
		async init() {
			try {
				const token = localStorage.getItem('token')
				if (!token) {
					this.isInitialized = true
					return
				}

				this.token = token
				axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
				await this.fetchUser()
			} catch (error) {
				console.error('Ошибка при инициализации авторизации:', error)
				this.logout()
			} finally {
				this.isInitialized = true
			}
		},

		async login(username: string, password: string) {
			try {
				const response = await axios.post('/api/auth/login', {
					username,
					password,
				})
				this.token = response.data.token
				if (this.token) {
					localStorage.setItem('token', this.token)
					axios.defaults.headers.common[
						'Authorization'
					] = `Bearer ${this.token}`
					this.user = response.data.user
					this.isAuthenticated = true
				}
			} catch (error) {
				console.error('Ошибка при входе:', error)
				throw error
			}
		},

		async register(email: string) {
			try {
				const response = await axios.post('/api/auth/register', {
					email,
				})
				return response.data
			} catch (error) {
				console.error('Ошибка при регистрации:', error)
				throw error
			}
		},

		async fetchUser() {
			if (!this.token) return

			this.isLoading = true
			try {
				const response = await axios.get('/api/auth/me', {
					headers: { Authorization: `Bearer ${this.token}` },
				})
				if (response.data && response.data.user) {
					this.user = response.data.user
					this.isAuthenticated = true
				}
			} catch (error: any) {
				console.error('Ошибка при получении данных пользователя:', error)
				if (error.response?.status === 401) {
					this.logout()
				}
				throw error
			} finally {
				this.isLoading = false
			}
		},

		async subscribe(months: number) {
			if (!this.token) return

			try {
				const response = await axios.post(
					'/api/auth/subscribe',
					{ months },
					{ headers: { Authorization: `Bearer ${this.token}` } }
				)
				if (response.data && response.data.subscription) {
					this.user = {
						...this.user!,
						subscription: response.data.subscription,
					}
				}
				return response.data
			} catch (error) {
				console.error('Ошибка при оформлении подписки:', error)
				throw error
			}
		},

		logout() {
			this.user = null
			this.token = null
			this.isAuthenticated = false
			localStorage.removeItem('token')
			delete axios.defaults.headers.common['Authorization']
		},
	},
})
