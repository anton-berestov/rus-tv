<!-- ChannelList.vue -->
<template>
	<div class="channel-list">
		<div class="filters">
			<div class="search">
				<input
					type="text"
					v-model="searchQuery"
					placeholder="Поиск каналов..."
				/>
			</div>
			<div class="categories">
				<button
					v-for="category in categories"
					:key="category"
					:class="{ active: selectedCategory === category }"
					@click="selectCategory(category)"
				>
					{{ category }}
				</button>
			</div>
		</div>

		<div v-if="loading" class="loading-container">
			<div class="spinner"></div>
			<p>Загрузка списка каналов...</p>
		</div>

		<div v-else-if="error" class="error-container">
			<p>{{ error }}</p>
			<button @click="fetchChannels" class="retry-button">Повторить</button>
		</div>

		<div v-else-if="filteredChannels.length === 0" class="empty-result">
			<p>Каналы не найдены</p>
		</div>

		<div v-else class="channels-grid">
			<div
				v-for="channel in filteredChannels"
				:key="channel._id"
				class="channel-card"
				@click="selectChannel(channel)"
			>
				<div class="channel-logo">
					<img
						:src="getProxyLogoUrl(channel.logoUrl)"
						:alt="channel.name"
						loading="lazy"
						@error="e => handleImageError(e, channel)"
					/>
					<div v-if="!channel.logoUrl" class="channel-placeholder">
						{{ getChannelInitials(channel.name) }}
					</div>
				</div>
				<div class="channel-info">
					<h3>{{ channel.name }}</h3>
					<p class="category">{{ channel.category }}</p>
				</div>
			</div>
		</div>

		<!-- Модальное окно для просмотра канала -->
		<div v-if="selectedChannel" class="modal" @click="closeModal">
			<div class="modal-content" @click.stop>
				<button class="close-button" @click="closeModal">&times;</button>
				<VideoPlayer
					v-if="selectedChannel"
					:stream-url="getProxyStreamUrl(selectedChannel.streamUrl)"
					:channel-name="selectedChannel.name"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import VideoPlayer from './VideoPlayer.vue'

interface Channel {
	_id: string
	name: string
	logoUrl: string
	streamUrl: string
	category: string
	language: string
	order: number
}

const authStore = useAuthStore()
const channels = ref<Channel[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedCategory = ref('Все')
const selectedChannel = ref<Channel | null>(null)

// Компьютед-свойство для получения списка категорий
const categories = computed(() => {
	if (!channels.value.length) return ['Все']

	const uniqueCategories = new Set(
		channels.value.map(channel => channel.category)
	)
	return ['Все', ...Array.from(uniqueCategories).sort()]
})

// Отфильтрованный список каналов
const filteredChannels = computed(() => {
	return channels.value.filter(channel => {
		const matchesSearch = channel.name
			.toLowerCase()
			.includes(searchQuery.value.toLowerCase())
		const matchesCategory =
			selectedCategory.value === 'Все' ||
			channel.category === selectedCategory.value
		return matchesSearch && matchesCategory
	})
})

// Множество для отслеживания каналов с ошибками загрузки логотипов
const failedLogos = ref(new Set<string>())

// Получение инициалов канала для плейсхолдера
const getChannelInitials = (name: string) => {
	if (!name) return '?'

	// Разбиваем имя канала на слова и берем первые буквы первых двух слов
	const words = name.split(/\s+/)

	if (words.length === 1) {
		return words[0].charAt(0).toUpperCase()
	}

	return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
}

// Получение URL логотипа через прокси
const getProxyLogoUrl = (logoUrl: string) => {
	if (!logoUrl) return ''

	// Проверка, является ли URL корректным
	try {
		// Если URL уже абсолютный и начинается с http, используем его через прокси
		if (logoUrl.startsWith('http')) {
			const baseUrl = import.meta.env.DEV ? '' : 'https://api.rus-tv.live'
			return `${baseUrl}/api/playlist/logo?url=${encodeURIComponent(logoUrl)}`
		}

		// Если URL относительный, добавляем базовый URL
		if (logoUrl.startsWith('/')) {
			const originUrl = window.location.origin
			const baseUrl = import.meta.env.DEV ? '' : 'https://api.rus-tv.live'
			return `${baseUrl}/api/playlist/logo?url=${encodeURIComponent(
				originUrl + logoUrl
			)}`
		}

		return logoUrl
	} catch (e) {
		console.error('Ошибка формирования URL логотипа:', e)
		return ''
	}
}

// Получение URL стрима через прокси
const getProxyStreamUrl = (streamUrl: string) => {
	if (!streamUrl) return ''
	try {
		const baseUrl = import.meta.env.DEV ? '' : 'https://api.rus-tv.live'
		return `${baseUrl}/api/playlist/stream?url=${encodeURIComponent(streamUrl)}`
	} catch (e) {
		return streamUrl
	}
}

// Обработка ошибок загрузки изображений
const handleImageError = (event: Event, channel: Channel) => {
	const target = event.target as HTMLImageElement

	// Скрываем элемент img при ошибке и показываем placeholder
	target.style.display = 'none'

	// Сохраняем информацию о неудачной загрузке
	if (channel && channel._id) {
		// Помечаем каналы с ошибками загрузки изображений
		failedLogos.value.add(channel._id)
	}
}

// Загрузка списка каналов с бэкенда
const fetchChannels = async () => {
	if (!authStore.token) return

	loading.value = true
	error.value = ''

	try {
		const response = await axios.get('/api/playlist', {
			headers: { Authorization: `Bearer ${authStore.token}` },
		})

		if (response.data.success) {
			channels.value = response.data.channels
		} else {
			error.value = 'Не удалось загрузить список каналов'
		}
	} catch (err: any) {
		console.error('Ошибка при загрузке каналов:', err)
		error.value =
			err.response?.data?.error ||
			'Произошла ошибка при загрузке списка каналов'
	} finally {
		loading.value = false
	}
}

const selectCategory = (category: string) => {
	selectedCategory.value = category
}

const selectChannel = (channel: Channel) => {
	selectedChannel.value = channel
}

const closeModal = () => {
	selectedChannel.value = null
}

// Загрузка каналов при монтировании компонента
onMounted(() => {
	if (authStore.isAuthenticated && authStore.hasActiveSubscription) {
		fetchChannels()
	}
})

// Следим за изменением состояния авторизации
watch(
	() => authStore.isAuthenticated,
	isAuthenticated => {
		if (isAuthenticated && authStore.hasActiveSubscription) {
			fetchChannels()
		}
	}
)
</script>

<style scoped>
.channel-list {
	padding: 2rem;
	min-height: calc(100vh - 60px);
	background-color: #f8f9fa;
}

.filters {
	margin-bottom: 2rem;
}

.search input {
	width: 100%;
	max-width: 400px;
	padding: 0.8rem;
	border: 1px solid #ddd;
	border-radius: 8px;
	font-size: 1rem;
	margin-bottom: 1rem;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.categories {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
	margin-bottom: 1.5rem;
	overflow-x: auto;
	padding-bottom: 0.5rem;
}

.categories button {
	padding: 0.5rem 1rem;
	border: 1px solid #ddd;
	border-radius: 20px;
	background: white;
	cursor: pointer;
	transition: all 0.3s ease;
	white-space: nowrap;
}

.categories button.active {
	background: #4caf50;
	color: white;
	border-color: #4caf50;
}

.channels-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	gap: 1.5rem;
}

.channel-card {
	background: white;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	cursor: pointer;
	transition: transform 0.3s ease, box-shadow 0.3s ease;
	display: flex;
	flex-direction: column;
}

.channel-card:hover {
	transform: translateY(-5px);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.channel-logo {
	width: 100%;
	height: 120px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f5f5f5;
	overflow: hidden;
	position: relative;
}

.channel-logo img {
	max-width: 80%;
	max-height: 80%;
	object-fit: contain;
}

.channel-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(45deg, #e0e0e0, #f0f0f0);
	color: #757575;
	font-size: 2rem;
	font-weight: bold;
}

.channel-info {
	padding: 1rem;
	flex: 1;
	display: flex;
	flex-direction: column;
}

.channel-info h3 {
	margin: 0;
	font-size: 1rem;
	color: #333;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.category {
	margin: 0.5rem 0 0;
	font-size: 0.85rem;
	color: #666;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.loading-container,
.error-container,
.empty-result {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 300px;
	text-align: center;
}

.spinner {
	width: 40px;
	height: 40px;
	border: 4px solid #f3f3f3;
	border-top: 4px solid #4caf50;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 1rem;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.error-container p {
	color: #d32f2f;
	margin-bottom: 1rem;
}

.retry-button {
	padding: 0.5rem 1rem;
	background: #4caf50;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
}

.empty-result {
	color: #666;
}

.modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 1rem;
}

.modal-content {
	background: white;
	border-radius: 12px;
	position: relative;
	width: 90%;
	max-width: 1200px;
	overflow: hidden;
}

.close-button {
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: none;
	border: none;
	font-size: 2rem;
	cursor: pointer;
	color: white;
	z-index: 1001;
}

/* Медиа-запросы для адаптивности */
@media (max-width: 768px) {
	.channel-list {
		padding: 1rem;
	}

	.channels-grid {
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1rem;
	}

	.channel-logo {
		height: 100px;
	}

	.channel-info {
		padding: 0.75rem;
	}

	.channel-info h3 {
		font-size: 0.9rem;
	}

	.category {
		font-size: 0.75rem;
	}
}

@media (max-width: 480px) {
	.channels-grid {
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.channel-logo {
		height: 90px;
	}

	.modal-content {
		width: 95%;
	}
}
</style>
