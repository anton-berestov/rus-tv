<template>
	<div class="logo">
		<div class="logo-text">
			<span class="rus">RUS</span>
			<span class="tv">TV</span>
		</div>
		<div class="logo-line"></div>
		<div class="logo-slogan">Российское телевидение</div>
	</div>
</template>

<style scoped>
.logo {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
}

.logo-text {
	font-size: clamp(32px, 6vw, 48px);
	font-weight: 800;
	letter-spacing: -0.5px;
	background: var(--primary-gradient);
	-webkit-background-clip: text;
	background-clip: text;
	-webkit-text-fill-color: transparent;
	text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.rus {
	font-weight: 900;
}

.tv {
	font-weight: 700;
	margin-left: 4px;
}

.logo-line {
	width: 40px;
	height: 3px;
	background: var(--primary-gradient);
	border-radius: 2px;
	margin: 4px 0;
}

.logo-slogan {
	font-size: clamp(12px, 2vw, 14px);
	color: var(--text-secondary);
	font-weight: 500;
	opacity: 0.8;
}

@media (max-width: 480px) {
	.logo {
		gap: 6px;
	}

	.logo-line {
		width: 32px;
		height: 2px;
	}
}
</style>
