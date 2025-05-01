<template>
	<div class="auth-container">
		<div class="auth-form">
			<Logo class="auth-logo" />
			<h2 class="auth-title">Создание аккаунта</h2>
			<form @submit.prevent="handleSubmit" class="form">
				<div class="form-group">
					<label for="email">Email</label>
					<div class="input-group">
						<i class="icon">📧</i>
						<input
							type="email"
							id="email"
							v-model="email"
							required
							class="form-control"
							placeholder="Введите ваш email"
						/>
					</div>
				</div>
				<p class="info-text">
					После регистрации вам будет отправлено письмо с логином и паролем для
					входа в систему.
				</p>
				<button type="submit" class="btn-submit">
					<span>Зарегистрироваться</span>
					<i class="icon">→</i>
				</button>
			</form>
			<p v-if="error" class="error">{{ error }}</p>
			<p v-if="success" class="success">{{ success }}</p>
			<p class="auth-link">
				Уже есть аккаунт?
				<router-link to="/login">Войти</router-link>
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import Logo from '../Logo.vue'

const email = ref('')
const error = ref('')
const success = ref('')
const router = useRouter()
const authStore = useAuthStore()

const handleSubmit = async () => {
	try {
		const result = await authStore.register(email.value)
		success.value =
			result.message ||
			'Регистрация успешна! Проверьте вашу почту для получения доступа.'
		setTimeout(() => {
			router.push('/login')
		}, 5000)
	} catch (err: any) {
		error.value =
			err.response?.data?.error || err.message || 'Ошибка при регистрации'
	}
}
</script>

<style scoped>
.auth-container {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--primary-gradient);
	padding: 20px;
	width: 100%;
}

.auth-form {
	background: var(--background-color);
	padding: clamp(20px, 5vw, 40px);
	border-radius: 16px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	width: min(100%, 400px);
	margin: 0 auto;
}

.auth-logo {
	margin-bottom: 24px;
}

.auth-title {
	color: var(--text-primary);
	font-size: clamp(20px, 4vw, 24px);
	font-weight: 600;
	margin-bottom: 30px;
	text-align: center;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.form-group label {
	color: var(--text-secondary);
	font-size: 14px;
	font-weight: 500;
}

.input-group {
	position: relative;
	display: flex;
	align-items: center;
}

.icon {
	position: absolute;
	left: 12px;
	font-style: normal;
	color: var(--text-secondary);
	opacity: 0.7;
}

.form-control {
	width: 100%;
	padding: 12px 12px 12px 40px;
	border: 2px solid var(--border-color);
	border-radius: 8px;
	font-size: 16px;
	transition: all 0.3s ease;
}

.form-control:focus {
	outline: none;
	border-color: var(--primary-color);
	box-shadow: 0 0 0 3px rgba(110, 142, 251, 0.1);
}

.form-control::placeholder {
	color: var(--text-secondary);
	opacity: 0.6;
}

.info-text {
	font-size: 14px;
	color: var(--text-secondary);
	line-height: 1.4;
	background-color: #f8f9fa;
	padding: 10px;
	border-radius: 6px;
	border-left: 3px solid var(--primary-color);
}

.btn-submit {
	background: var(--primary-gradient);
	color: white;
	border: none;
	border-radius: 8px;
	padding: 14px;
	font-size: 16px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	position: relative;
}

.btn-submit:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(110, 142, 251, 0.3);
}

.btn-submit:active {
	transform: translateY(0);
}

.error {
	color: var(--error-color);
	font-size: 14px;
	margin-top: 12px;
	text-align: center;
	padding: 8px;
	background-color: #fff5f5;
	border-radius: 6px;
}

.success {
	color: #4caf50;
	font-size: 14px;
	margin-top: 12px;
	text-align: center;
	padding: 8px;
	background-color: #e8f5e9;
	border-radius: 6px;
}

.auth-link {
	margin-top: 20px;
	text-align: center;
	color: var(--text-secondary);
	font-size: 14px;
}

.auth-link a {
	color: var(--primary-color);
	text-decoration: none;
	font-weight: 600;
	margin-left: 4px;
	transition: color 0.3s ease;
}

.auth-link a:hover {
	color: var(--secondary-color);
	text-decoration: underline;
}

@media (max-width: 480px) {
	.auth-form {
		padding: 20px;
		margin: 10px;
	}

	.form-control {
		font-size: 14px;
		padding: 10px 10px 10px 36px;
	}

	.icon {
		font-size: 14px;
		left: 10px;
	}

	.btn-submit {
		padding: 12px;
		font-size: 14px;
	}
}
</style>
