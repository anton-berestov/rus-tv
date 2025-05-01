<template>
	<div class="player-section">
		<div class="player-container">
			<video ref="videoPlayer" controls autoplay></video>
			<h2 class="current-channel-title">{{ channelTitle }}</h2>
			<ProgramInfo
				v-if="currentProgram"
				:current-program="currentProgram"
				:next-program="nextProgram"
			/>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import Hls from 'hls.js'
import ProgramInfo from './ProgramInfo.vue'

const props = defineProps({
	url: {
		type: String,
		required: true,
	},
	channelTitle: {
		type: String,
		required: true,
	},
	currentProgram: {
		type: Object,
		default: null,
	},
	nextProgram: {
		type: Object,
		default: null,
	},
})

const videoPlayer = ref(null)
const hlsInstance = ref(null)

const initPlayer = async () => {
	await nextTick()

	if (!videoPlayer.value) {
		console.error('Video player element not found')
		return
	}

	if (hlsInstance.value) {
		hlsInstance.value.destroy()
		hlsInstance.value = null
	}

	try {
		if (Hls.isSupported()) {
			hlsInstance.value = new Hls({
				debug: false,
				enableWorker: true,
				lowLatencyMode: true,
				backBufferLength: 90,
				xhrSetup: function (xhr, url) {
					xhr.withCredentials = false
				},
			})

			hlsInstance.value.loadSource(props.url)
			hlsInstance.value.attachMedia(videoPlayer.value)

			hlsInstance.value.on(Hls.Events.MANIFEST_PARSED, () => {
				videoPlayer.value.play().catch(error => {
					console.error('Ошибка воспроизведения:', error)
				})
			})

			hlsInstance.value.on(Hls.Events.ERROR, (event, data) => {
				if (data.fatal) {
					switch (data.type) {
						case Hls.ErrorTypes.NETWORK_ERROR:
							setTimeout(() => {
								hlsInstance.value.startLoad()
							}, 1000)
							break
						case Hls.ErrorTypes.MEDIA_ERROR:
							hlsInstance.value.recoverMediaError()
							break
						default:
							hlsInstance.value.destroy()
							break
					}
				}
			})
		} else if (videoPlayer.value.canPlayType('application/vnd.apple.mpegurl')) {
			videoPlayer.value.src = props.url
			videoPlayer.value.addEventListener('loadedmetadata', () => {
				videoPlayer.value.play().catch(error => {
					console.error('Ошибка воспроизведения:', error)
				})
			})
		} else {
			console.error('HLS не поддерживается в этом браузере')
		}
	} catch (error) {
		console.error('Ошибка инициализации плеера:', error)
	}
}

watch(
	() => props.url,
	async newUrl => {
		if (newUrl) {
			await initPlayer()
		}
	}
)

onMounted(() => {
	if (props.url) {
		initPlayer()
	}
})

onUnmounted(() => {
	if (hlsInstance.value) {
		hlsInstance.value.destroy()
		hlsInstance.value = null
	}
})
</script>

<style scoped>
.player-section {
	position: sticky;
	top: 20px;
	height: fit-content;
}

.player-container {
	background: #fff;
	border-radius: 10px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	padding: 20px;
}

.player-container video {
	width: 100%;
	aspect-ratio: 16/9;
	background: #000;
	border-radius: 8px;
	margin-bottom: 15px;
}

.current-channel-title {
	margin: 0 0 15px 0;
	text-align: center;
	color: #2c3e50;
	font-size: 1.4em;
}
</style>
