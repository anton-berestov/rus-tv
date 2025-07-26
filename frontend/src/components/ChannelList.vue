<template>
	<div class="channels-section" :class="{ 'with-player': hasPlayer }">
		<h1 class="main-title">Список Каналов</h1>

		<div class="filter-container">
			<div class="search-box">
				<input
					type="text"
					v-model="searchQuery"
					placeholder="Поиск каналов..."
					class="search-input"
				/>
				<button
					@click="searchQuery = ''"
					class="clear-button"
					v-if="searchQuery"
				>
					×
				</button>
			</div>

			<div class="category-filter" v-if="categories.length > 0">
				<select v-model="selectedCategory" class="category-select">
					<option value="">Все категории</option>
					<option
						v-for="category in categories"
						:key="category"
						:value="category"
					>
						{{ category }}
					</option>
				</select>
			</div>
		</div>

		<div v-if="filteredGroups.length === 0" class="no-results">
			<p>Каналы не найдены. Попробуйте изменить критерии поиска.</p>
		</div>

		<div class="groups-container">
			<div
				v-for="groupData in filteredGroups"
				:key="groupData.title"
				class="channel-group"
			>
				<h2 @click="toggleGroup(groupData.title)" class="group-title">
					{{ groupData.title }}
					<span class="group-count">({{ groupData.channels.length }})</span>
					<span class="toggle-icon">{{
						isGroupOpen(groupData.title) ? '−' : '+'
					}}</span>
				</h2>
				<div v-if="isGroupOpen(groupData.title)" class="channels-grid">
					<div
						v-for="channel in groupData.channels"
						:key="channel.url"
						class="channel-card"
					>
						<div class="channel-logo">
							<img
								v-if="channel.logo && getChannelImageUrl(channel)"
								:src="getChannelImageUrl(channel)"
								:alt="getChannelName(channel.title)"
								@error="handleImageError"
								ref="channelLogo"
							/>
							<div v-else class="channel-logo-placeholder">
								{{ getChannelInitials(getChannelName(channel.title)) }}
							</div>
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
import { computed, ref, watch } from 'vue'

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
const channelLogo = ref(null)
const searchQuery = ref('')
const selectedCategory = ref('')

// Вычисляем доступные категории из сгруппированных каналов
const categories = computed(() => {
	return Object.keys(props.groupedChannels).sort()
})

// Фильтрация каналов на основе поискового запроса и выбранной категории
const filteredGroups = computed(() => {
	// Преобразуем groupedChannels в массив для фильтрации
	let result = []

	// Если выбрана категория, фильтруем только по ней
	const categoriesToProcess = selectedCategory.value
		? [selectedCategory.value]
		: Object.keys(props.groupedChannels)

	for (const category of categoriesToProcess) {
		if (!props.groupedChannels[category]) continue

		// Фильтруем каналы в группе по поисковому запросу
		const filteredChannels = props.groupedChannels[category].filter(channel => {
			const channelName = getChannelName(channel.title).toLowerCase()
			return (
				!searchQuery.value ||
				channelName.includes(searchQuery.value.toLowerCase())
			)
		})

		// Добавляем группу в результат, только если есть каналы
		if (filteredChannels.length > 0) {
			result.push({
				title: category,
				channels: filteredChannels,
			})
		}
	}

	// Сортируем группы по алфавиту
	return result.sort((a, b) => a.title.localeCompare(b.title))
})

// Автоматически открываем группы, если фильтрация активна
const isGroupOpen = groupTitle => {
	// Автоматически открывать группы, если есть поисковый запрос
	if (searchQuery.value) return true
	// Иначе используем сохраненное состояние
	return openGroups.value.has(groupTitle)
}

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

const selectedChannel = ref(null)

// Кэш для blob URLs изображений
const imageCache = ref(new Map())

// Загрузка изображения через fetch API для обхода CORS
const loadImageAsBlob = async logoUrl => {
	if (!logoUrl) return null

	// Проверяем кэш
	if (imageCache.value.has(logoUrl)) {
		return imageCache.value.get(logoUrl)
	}

	try {
		// Формируем URL для прокси
		const baseUrl = import.meta.env.DEV ? '' : 'https://api.rus-tv.live'
		const proxyUrl = logoUrl.startsWith('http')
			? `${baseUrl}/api/playlist/logo?url=${encodeURIComponent(logoUrl)}`
			: logoUrl

		// Загружаем изображение через fetch
		const response = await fetch(proxyUrl)

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`)
		}

		const blob = await response.blob()
		const blobUrl = URL.createObjectURL(blob)

		// Сохраняем в кэш
		imageCache.value.set(logoUrl, blobUrl)

		return blobUrl
	} catch (error) {
		console.warn(`Ошибка загрузки логотипа ${logoUrl}:`, error)
		return null
	}
}

// Реактивные URL изображений для каналов
const channelImages = ref(new Map())

// Загрузка изображений для каналов
const loadChannelImages = async () => {
	if (!props.groupedChannels) return

	const allChannels = Object.values(props.groupedChannels).flat()
	const imagePromises = allChannels.map(async channel => {
		if (!channelImages.value.has(channel.title) && channel.logo) {
			const imageUrl = await loadImageAsBlob(channel.logo)
			if (imageUrl) {
				channelImages.value.set(channel.title, imageUrl)
			}
		}
	})

	await Promise.all(imagePromises)
}

// Получение URL изображения канала
const getChannelImageUrl = channel => {
	return channelImages.value.get(channel.title) || ''
}

const getProxyImageUrl = url => {
	// Устаревшая функция - оставляем пустой для обратной совместимости
	return ''
}

// Следим за изменениями каналов и загружаем изображения
watch(
	() => props.groupedChannels,
	async () => {
		await loadChannelImages()
	},
	{ immediate: true }
)

// Очищаем blob URLs при размонтировании компонента
onUnmounted(() => {
	imageCache.value.forEach(blobUrl => {
		URL.revokeObjectURL(blobUrl)
	})
	channelImages.value.forEach(blobUrl => {
		URL.revokeObjectURL(blobUrl)
	})
})

const getChannelInitials = name => {
	if (!name) return '??'
	const words = name.split(' ')
	if (words.length === 1) {
		return name.substring(0, 2).toUpperCase()
	}
	return (words[0][0] + words[1][0]).toUpperCase()
}

const handleImageError = event => {
	// Заменить изображение с ошибкой на плейсхолдер
	const target = event.target
	const parent = target.parentNode

	// Создаем плейсхолдер и убираем img из DOM
	const placeholder = document.createElement('div')
	placeholder.className = 'channel-logo-placeholder'
	placeholder.innerText = getChannelInitials(target.alt)
	parent.replaceChild(placeholder, target)
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
	margin-bottom: 20px;
	font-size: 2.5em;
}

.filter-container {
	display: flex;
	justify-content: space-between;
	margin-bottom: 30px;
	flex-wrap: wrap;
	gap: 15px;
}

.search-box {
	position: relative;
	flex: 1;
	min-width: 200px;
}

.search-input {
	width: 100%;
	padding: 12px 35px 12px 15px;
	border: 2px solid #ddd;
	border-radius: 8px;
	font-size: 1em;
	transition: border-color 0.3s;
}

.search-input:focus {
	border-color: #3498db;
	outline: none;
}

.clear-button {
	position: absolute;
	right: 10px;
	top: 50%;
	transform: translateY(-50%);
	background: none;
	border: none;
	color: #666;
	font-size: 1.5em;
	cursor: pointer;
}

.category-filter {
	min-width: 200px;
}

.category-select {
	width: 100%;
	padding: 10px 15px;
	border: 2px solid #ddd;
	border-radius: 8px;
	font-size: 1em;
	background-color: white;
	cursor: pointer;
}

.category-select:focus {
	border-color: #3498db;
	outline: none;
}

.no-results {
	background: #f8f9fa;
	border-radius: 10px;
	padding: 40px;
	text-align: center;
	color: #6c757d;
	font-size: 1.2em;
	margin-bottom: 30px;
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

.group-count {
	font-size: 0.7em;
	color: #6c757d;
	margin-left: 10px;
	margin-right: auto;
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

.channel-logo-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #e9ecef;
	color: #6c757d;
	font-size: 2rem;
	font-weight: bold;
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
