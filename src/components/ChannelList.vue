<template>
	<div class="channels-section" :class="{ 'with-player': hasPlayer }">
		<h1 class="main-title">Список Каналов</h1>
		<div class="groups-container">
			<div
				v-for="(group, groupTitle) in groupedChannels"
				:key="groupTitle"
				class="channel-group"
			>
				<h2 @click="toggleGroup(groupTitle)" class="group-title">
					{{ groupTitle }}
					<span class="toggle-icon">{{
						isGroupOpen(groupTitle) ? '−' : '+'
					}}</span>
				</h2>
				<div v-if="isGroupOpen(groupTitle)" class="channels-grid">
					<div v-for="channel in group" :key="channel.url" class="channel-card">
						<div class="channel-logo">
							<img
								:src="getProxyImageUrl(channel.logo)"
								:alt="getChannelName(channel.title)"
							/>
						</div>
						<div class="channel-info">
							<h3 class="channel-name">{{ getChannelName(channel.title) }}</h3>
							<button @click="playChannel(channel)" class="watch-button">
								Смотреть
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
	groupedChannels: {
		type: Object,
		required: true,
	},
	hasPlayer: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['play-channel'])

const openGroups = ref(new Set())

const isGroupOpen = groupTitle => openGroups.value.has(groupTitle)

const toggleGroup = groupTitle => {
	if (openGroups.value.has(groupTitle)) {
		openGroups.value.delete(groupTitle)
	} else {
		openGroups.value.add(groupTitle)
	}
}

const getChannelName = title => {
	const match = title.match(/,\s*([^,]+)$/)
	return match ? match[1] : 'Неизвестный канал'
}

const getProxyImageUrl = url => {
	if (!url) return ''
	return url
}

const getProgramInfo = title => {
	const programMatch = title.match(/tvg-now="([^"]+)"/)
	const nextMatch = title.match(/tvg-next="([^"]+)"/)

	const now = programMatch ? programMatch[1].split(' - ') : null
	const next = nextMatch ? nextMatch[1].split(' - ') : null

	return {
		current: now
			? {
					time: now[0],
					title: now[1] || 'Нет информации',
			  }
			: null,
		next: next
			? {
					time: next[0],
					title: next[1] || 'Нет информации',
			  }
			: null,
	}
}

const playChannel = channel => {
	const programInfo = getProgramInfo(channel.title)
	emit('play-channel', {
		url: channel.url,
		title: getChannelName(channel.title),
		currentProgram: programInfo.current,
		nextProgram: programInfo.next,
	})
}
</script>

<style scoped>
.channels-section {
	flex: 1;
}

.channels-section.with-player {
	max-width: 800px;
}

.main-title {
	text-align: center;
	color: #2c3e50;
	margin-bottom: 30px;
	font-size: 2.5em;
}

.groups-container {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.channel-group {
	background: #fff;
	border-radius: 10px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	overflow: hidden;
}

.group-title {
	background: #f8f9fa;
	padding: 15px 20px;
	margin: 0;
	cursor: pointer;
	display: flex;
	justify-content: space-between;
	align-items: center;
	color: #2c3e50;
	font-size: 1.4em;
	transition: background-color 0.3s;
}

.group-title:hover {
	background: #e9ecef;
}

.toggle-icon {
	font-size: 1.5em;
	font-weight: bold;
	color: #6c757d;
}

.channels-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 20px;
	padding: 20px;
}

.channel-card {
	background: #fff;
	border-radius: 8px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	transition: transform 0.2s;
	overflow: hidden;
}

.channel-card:hover {
	transform: translateY(-2px);
}

.channel-logo {
	width: 100%;
	height: 120px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f8f9fa;
	padding: 10px;
}

.channel-logo img {
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
}

.channel-info {
	padding: 15px;
	text-align: center;
}

.channel-name {
	margin: 0 0 10px 0;
	font-size: 1.1em;
	color: #2c3e50;
}

.watch-button {
	display: inline-block;
	padding: 8px 20px;
	background: #3498db;
	color: white;
	text-decoration: none;
	border-radius: 5px;
	transition: background-color 0.3s;
	border: none;
	cursor: pointer;
	width: 100%;
}

.watch-button:hover {
	background: #2980b9;
}

@media (max-width: 1200px) {
	.channels-section.with-player {
		max-width: none;
	}
}
</style>
