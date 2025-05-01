<template>
	<div class="register-page">
		<div class="register-form">
			<RegisterForm />
		</div>
	</div>
</template>

<script setup lang="ts">
import RegisterForm from '../components/Auth/RegisterForm.vue'
</script>

<style scoped>
.register-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #f8f9fa;
}
.register-form {
	width: 100%;
}
</style>
