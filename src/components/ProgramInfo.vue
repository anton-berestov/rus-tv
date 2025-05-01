<template>
	<div class="program-info">
		<div class="program-current">
			<h3>Сейчас в эфире:</h3>
			<p class="program-title">{{ currentProgram.title }}</p>
			<p class="program-time">{{ currentProgram.time }}</p>
		</div>
		<div class="program-next" v-if="nextProgram">
			<h3>Следующая передача:</h3>
			<p class="program-title">{{ nextProgram.title }}</p>
			<p class="program-time">{{ nextProgram.time }}</p>
		</div>
	</div>
</template>

<script setup>
defineProps({
	currentProgram: {
		type: Object,
		required: true,
	},
	nextProgram: {
		type: Object,
		default: null,
	},
})
</script>

<style scoped>
.program-info {
	margin-top: 20px;
	padding: 15px;
	background: #f8f9fa;
	border-radius: 8px;
}

.program-current,
.program-next {
	margin-bottom: 15px;
}

.program-current h3,
.program-next h3 {
	color: #2c3e50;
	font-size: 1.1em;
	margin: 0 0 10px 0;
}

.program-title {
	font-size: 1.2em;
	color: #2c3e50;
	margin: 5px 0;
	font-weight: 500;
}

.program-time {
	color: #666;
	font-size: 0.9em;
	margin: 5px 0;
}

.program-next {
	padding-top: 15px;
	border-top: 1px solid #dee2e6;
}
</style>
