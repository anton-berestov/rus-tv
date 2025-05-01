<template>
	<div class="channels-container">
		<div class="main-content" :class="{ 'with-player': currentChannel }">
			<VideoPlayer
				v-if="currentChannel"
				:url="currentChannel.url"
				:channel-title="currentChannel.title"
				:current-program="currentChannel.currentProgram"
				:next-program="currentChannel.nextProgram"
			/>
			<ChannelList
				:grouped-channels="groupedChannels"
				:has-player="!!currentChannel"
				@play-channel="handlePlayChannel"
			/>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Parser } from 'm3u8-parser'
import VideoPlayer from '../components/VideoPlayer.vue'
import ChannelList from '../components/ChannelList.vue'

const groupedChannels = ref({})
const currentChannel = ref(null)

const handlePlayChannel = channel => {
	currentChannel.value = channel
}

onMounted(() => {
	fetch(import.meta.env.VITE_PLAYLIST_URL)
		.then(response => response.text())
		.then(data => {
			const parser = new Parser()
			parser.push(data)
			parser.end()

			const parsed = parser.manifest

			const grouped = parsed.segments.reduce((acc, segment) => {
				const groupTitle = getGroupTitle(segment.title)
				const channel = {
					title: segment.title || 'Без названия',
					url: segment.uri,
					logo: getLogoUrl(segment.title),
				}

				if (!acc[groupTitle]) {
					acc[groupTitle] = []
				}

				acc[groupTitle].push(channel)
				return acc
			}, {})

			groupedChannels.value = grouped
		})
		.catch(err => console.error('Ошибка при загрузке канала:', err))
})

const getGroupTitle = title => {
	const groupMatch = title.match(/group-title="([^"]+)"/)
	return groupMatch ? groupMatch[1] : 'Без группы'
}

const getLogoUrl = title => {
	const logoMatch = title.match(/tvg-logo="([^"]+)"/)
	return logoMatch ? logoMatch[1] : ''
}
</script>

<style scoped>
.channels-container {
	width: 100%;
	min-height: 100vh;
	background: #f5f6fa;
}

.main-content {
	display: flex;
	gap: 20px;
	padding: 20px;
	max-width: 1200px;
	margin: 0 auto;
}

.main-content.with-player {
	display: grid;
	grid-template-columns: 1fr 1fr;
}

@media (max-width: 1200px) {
	.main-content.with-player {
		grid-template-columns: 1fr;
	}
}
</style>
