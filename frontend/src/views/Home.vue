<template>
	<div class="home-container">
		<div class="content-wrapper" :class="{ 'has-player': currentChannel }">
			<!-- Список каналов -->
			<ChannelList
				:grouped-channels="groupedChannels"
				:has-player="!!currentChannel"
				@play-channel="playChannel"
			/>

			<!-- Видеоплеер -->
			<VideoPlayer
				v-if="currentChannel"
				:url="currentChannel.url"
				:channel-title="currentChannel.title"
				:current-program="currentChannel.currentProgram"
				:next-program="currentChannel.nextProgram"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import ChannelList from '@/components/ChannelList.vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const channels = ref([])
const currentChannel = ref(null)
const loading = ref(true)
const error = ref(null)

const groupedChannels = computed(() => {
	// Функция для группировки каналов по категориям
	const groups = {}

	channels.value.forEach(channel => {
		// Используем category как ключ группы
		const groupKey = channel.group || 'Без категории'

		if (!groups[groupKey]) {
			groups[groupKey] = []
		}

		groups[groupKey].push(channel)
	})

	return groups
})

const fetchChannels = async () => {
	loading.value = true
	error.value = null

	try {
		// Проверяем авторизацию
		if (!authStore.token) {
			error.value = 'Для просмотра каналов необходимо авторизоваться'
			loading.value = false
			return
		}

		// Загружаем список каналов из M3U8 плейлиста через бэкенд с токеном авторизации
		const response = await axios.get('/api/playlist', {
			headers: { Authorization: `Bearer ${authStore.token}` },
		})

		if (response.data && response.data.success) {
			// Каналы могут быть в разных форматах, в зависимости от вашей реализации бэкенда
			if (Array.isArray(response.data.channels)) {
				channels.value = response.data.channels.map(channel => ({
					title: `tvg-name="${channel.name}", ${channel.name}`, // Формат, ожидаемый компонентом
					group: channel.category,
					logo: channel.logoUrl, // Используем logoUrl сервера как logo для компонента
					url: channel.streamUrl,
				}))
			} else {
				console.error('Unexpected response format:', response.data)
			}
		} else {
			throw new Error('Failed to fetch channels')
		}
	} catch (err) {
		console.error('Error fetching channels:', err)
		error.value =
			err.response?.data?.error || 'Не удалось загрузить список каналов'
	} finally {
		loading.value = false
	}
}

const playChannel = channel => {
	// Добавляем прокси для стрима
	const baseUrl = import.meta.env.DEV ? '' : 'https://api.rus-tv.live'
	const proxyUrl = `${baseUrl}/api/playlist/stream?url=${encodeURIComponent(
		channel.url
	)}`
	currentChannel.value = {
		...channel,
		url: proxyUrl,
	}
}

onMounted(fetchChannels)
</script>

<style scoped>
.home-container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 20px;
}

.content-wrapper {
	display: flex;
	flex-direction: column;
	gap: 30px;
}

@media (min-width: 1200px) {
	.content-wrapper.has-player {
		flex-direction: row;
		align-items: flex-start;
	}
}
</style>
