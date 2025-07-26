<!-- VideoPlayer.vue -->
<template>
	<div class="video-player">
		<div class="player-header">
			<h2>{{ channelName }}</h2>
		</div>
		<div class="player-container" ref="playerContainer"></div>
		<div class="player-controls">
			<button @click="togglePlay" class="control-button">
				<span v-if="isPlaying">⏸</span>
				<span v-else>▶</span>
				{{ isPlaying ? 'Пауза' : 'Воспроизвести' }}
			</button>
			<button @click="toggleMute" class="control-button">
				<span v-if="isMuted">🔇</span>
				<span v-else>🔊</span>
				{{ isMuted ? 'Включить звук' : 'Выключить звук' }}
			</button>
			<div class="volume-control">
				<input
					type="range"
					min="0"
					max="100"
					v-model="volume"
					@input="updateVolume"
				/>
			</div>
		</div>

		<div v-if="error" class="player-error">
			<p>{{ error }}</p>
			<button @click="retryPlayback" class="retry-button">
				Повторить воспроизведение
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import Hls from 'hls.js'
import { onMounted, onUnmounted, ref, watch } from 'vue'

// Добавляем экспорт по умолчанию
defineOptions({
	name: 'VideoPlayer',
})

const props = defineProps<{
	streamUrl: string
	channelName: string
}>()

const playerContainer = ref<HTMLElement | null>(null)
const hls = ref<Hls | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const isMuted = ref(false)
const volume = ref(80)
const error = ref('')
const retryCount = ref(0)

const createVideoElement = () => {
	// Создаем видео элемент
	video.value = document.createElement('video')
	video.value.style.width = '100%'
	video.value.style.height = '100%'
	video.value.style.position = 'absolute'
	video.value.style.top = '0'
	video.value.style.left = '0'
	video.value.setAttribute('playsinline', '') // Для iOS
	video.value.setAttribute('controls', '') // Добавляем нативные контролы как запасной вариант

	// Установка громкости на основе состояния
	video.value.volume = Number(volume.value) / 100
	video.value.muted = isMuted.value

	playerContainer.value?.appendChild(video.value)
	return video.value
}

const initPlayer = () => {
	if (!playerContainer.value) return

	error.value = ''

	if (video.value && playerContainer.value.contains(video.value)) {
		playerContainer.value.removeChild(video.value)
	}

	const videoElement = createVideoElement()

	// Проверяем поддержку HLS через Hls.js
	if (Hls.isSupported()) {
		console.log('Инициализация HLS.js для воспроизведения')

		if (hls.value) {
			hls.value.destroy()
		}

		hls.value = new Hls({
			maxBufferLength: 30,
			maxMaxBufferLength: 600,
			enableWorker: true,
			lowLatencyMode: true,
			backBufferLength: 60,
		})

		hls.value.loadSource(props.streamUrl)
		hls.value.attachMedia(videoElement)

		hls.value.on(Hls.Events.MANIFEST_PARSED, () => {
			videoElement
				.play()
				.then(() => {
					isPlaying.value = true
				})
				.catch(e => {
					console.error('Ошибка автоматического воспроизведения:', e)
					error.value =
						'Не удалось начать воспроизведение автоматически. Нажмите кнопку воспроизведения.'
				})
		})

		hls.value.on(Hls.Events.ERROR, (event, data) => {
			console.error('HLS ошибка:', data.type, data.details)

			if (data.fatal) {
				switch (data.type) {
					case Hls.ErrorTypes.NETWORK_ERROR:
						if (retryCount.value < 3) {
							console.info(
								`Повторная попытка загрузки сети (${retryCount.value + 1}/3)...`
							)
							retryCount.value++
							hls.value?.startLoad()
						} else {
							error.value =
								'Ошибка загрузки видеопотока. Проверьте соединение с интернетом.'
						}
						break

					case Hls.ErrorTypes.MEDIA_ERROR:
						if (retryCount.value < 3) {
							console.info(
								`Восстановление после ошибки медиа (${
									retryCount.value + 1
								}/3)...`
							)
							retryCount.value++
							hls.value?.recoverMediaError()
						} else {
							error.value =
								'Проблема с воспроизведением медиа. Попробуйте еще раз.'
						}
						break

					default:
						error.value = 'Произошла ошибка воспроизведения видео.'
						destroyPlayer()
						break
				}
			}
		})
	} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
		// Для Safari, который поддерживает HLS нативно
		console.log('Использование нативной поддержки HLS')
		videoElement.src = props.streamUrl

		videoElement.addEventListener('loadedmetadata', () => {
			videoElement
				.play()
				.then(() => {
					isPlaying.value = true
				})
				.catch(e => {
					console.error('Ошибка автоматического воспроизведения:', e)
					error.value =
						'Не удалось начать воспроизведение автоматически. Нажмите кнопку воспроизведения.'
				})
		})

		videoElement.addEventListener('error', () => {
			error.value = `Ошибка воспроизведения видео (код ${
				videoElement.error?.code || 'неизвестный'
			}).`
		})
	} else {
		error.value = 'Ваш браузер не поддерживает воспроизведение HLS-потоков.'
	}
}

const destroyPlayer = () => {
	if (hls.value) {
		hls.value.destroy()
		hls.value = null
	}

	if (video.value && playerContainer.value) {
		playerContainer.value.removeChild(video.value)
		video.value = null
	}
}

const togglePlay = () => {
	if (!video.value) return

	if (video.value.paused) {
		video.value
			.play()
			.then(() => {
				isPlaying.value = true
				error.value = ''
			})
			.catch(e => {
				console.error('Ошибка при попытке воспроизведения:', e)
				error.value =
					'Не удалось начать воспроизведение. Возможно, браузер блокирует автовоспроизведение.'
			})
	} else {
		video.value.pause()
		isPlaying.value = false
	}
}

const toggleMute = () => {
	if (!video.value) return

	video.value.muted = !video.value.muted
	isMuted.value = video.value.muted
}

const updateVolume = () => {
	if (!video.value) return

	video.value.volume = Number(volume.value) / 100
}

const retryPlayback = () => {
	error.value = ''
	retryCount.value = 0
	initPlayer()
}

// Следим за изменением URL потока
watch(
	() => props.streamUrl,
	() => {
		destroyPlayer()
		retryCount.value = 0
		error.value = ''
		initPlayer()
	}
)

onMounted(() => {
	initPlayer()
})

onUnmounted(() => {
	destroyPlayer()
})
</script>

<script lang="ts">
// Добавляем export default для компонента
export default {
	name: 'VideoPlayer',
}
</script>

<style scoped>
.video-player {
	width: 100%;
	background: #000;
	border-radius: 8px;
	overflow: hidden;
}

.player-header {
	padding: 1rem;
	background: #1a1a1a;
	color: white;
}

.player-header h2 {
	margin: 0;
	font-size: 1.2rem;
}

.player-container {
	position: relative;
	width: 100%;
	padding-top: 56.25%; /* 16:9 соотношение сторон */
	background: #000;
}

.player-controls {
	padding: 1rem;
	background: #1a1a1a;
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-wrap: wrap;
}

.control-button {
	padding: 0.5rem 1rem;
	background: #333;
	border: none;
	border-radius: 4px;
	color: white;
	cursor: pointer;
	transition: background 0.3s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.control-button:hover {
	background: #444;
}

.control-button span {
	font-size: 1.2rem;
}

.volume-control {
	flex: 1;
	display: flex;
	align-items: center;
	min-width: 120px;
}

.volume-control input[type='range'] {
	width: 100%;
	max-width: 200px;
}

.player-error {
	padding: 1rem;
	background: #ffebee;
	color: #d32f2f;
	text-align: center;
}

.retry-button {
	margin-top: 0.5rem;
	padding: 0.5rem 1rem;
	background: #d32f2f;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	transition: background 0.3s ease;
}

.retry-button:hover {
	background: #c62828;
}

@media (max-width: 768px) {
	.player-controls {
		flex-direction: column;
		align-items: stretch;
	}

	.volume-control {
		width: 100%;
		max-width: none;
	}
}
</style>
