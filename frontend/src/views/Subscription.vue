<template>
	<div class="subscription-page">
		<SubscriptionForm />
	</div>
</template>

<script setup lang="ts">
import SubscriptionForm from '../components/Subscription/SubscriptionForm.vue'
</script>

<style scoped>
.subscription-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #f8f9fa;
}
</style>
