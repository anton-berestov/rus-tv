<template>
	<div class="login-page">
		<div class="login-form">
			<LoginForm />
		</div>
	</div>
</template>

<script setup lang="ts">
import LoginForm from '../components/Auth/LoginForm.vue'
</script>

<style scoped>
.login-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #f8f9fa;
}
.login-form {
	width: 100%;
}
</style>
