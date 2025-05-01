<template>
	<div class="welcome-page">
		<div class="hero-section">
			<div class="hero-content">
				<h1>RusTV - Российское телевидение онлайн</h1>
				<p class="subtitle">
					Ваш персональный портал в мир российского телевидения. Наслаждайтесь
					любимыми каналами и передачами в HD-качестве из любой точки мира!
				</p>
				<router-link to="/register" class="hero-cta"
					>Попробовать бесплатно</router-link
				>
				<p class="trial-note">7 дней бесплатного доступа без обязательств</p>
			</div>
			<div class="hero-image">
				<div class="tv-frame">
					<div class="tv-screen">
						<div class="tv-content">
							<div class="channel channel-1">
								<div class="channel-logo">
									<span class="logo-text">Первый</span>
								</div>
								<div class="program-info">
									<div class="program-title">Прямой эфир</div>
								</div>
								<div class="channel-preview">
									<video
										autoplay
										muted
										playsinline
										ref="firstChannelVideo"
										class="preview-video"
										crossorigin="anonymous"
									></video>
								</div>
							</div>
							<div class="channel channel-2">
								<div class="channel-logo">
									<span class="logo-text">Россия 1</span>
								</div>
								<div class="program-info">
									<div class="program-title">Прямой эфир</div>
								</div>
								<div class="channel-preview">
									<video
										autoplay
										muted
										playsinline
										ref="secondChannelVideo"
										class="preview-video"
										crossorigin="anonymous"
									></video>
								</div>
							</div>
							<div class="channel channel-3">
								<div class="channel-logo">
									<span class="logo-text">ТНТ</span>
								</div>
								<div class="program-info">
									<div class="program-title">Прямой эфир</div>
								</div>
								<div class="channel-preview">
									<video
										autoplay
										muted
										playsinline
										ref="thirdChannelVideo"
										class="preview-video"
										crossorigin="anonymous"
									></video>
								</div>
							</div>
							<div class="channel channel-4">
								<div class="channel-logo">
									<span class="logo-text">МАТЧ! Боец</span>
								</div>
								<div class="program-info">
									<div class="program-title">Прямой эфир</div>
								</div>
								<div class="channel-preview">
									<video
										autoplay
										muted
										playsinline
										ref="fourthChannelVideo"
										class="preview-video"
										crossorigin="anonymous"
									></video>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="section features-section">
			<h2 class="section-title">Откройте мир российского телевидения</h2>
			<p class="section-subtitle">
				Богатый выбор каналов и уникальных возможностей для вашего комфортного
				просмотра
			</p>

			<div class="advantages">
				<div class="advantage-card">
					<div class="advantage-icon">📺</div>
					<h3>Обширная коллекция каналов</h3>
					<p>
						Более 150 популярных российских телеканалов в отличном качестве,
						включая федеральные, развлекательные, спортивные, познавательные и
						детские.
					</p>
				</div>

				<div class="advantage-card">
					<div class="advantage-icon">🌐</div>
					<h3>Доступ без границ</h3>
					<p>
						Смотрите российское ТВ из любой страны мира без региональных
						ограничений. Наши прокси-серверы обеспечивают стабильный доступ даже
						в странах с ограничениями.
					</p>
				</div>

				<div class="advantage-card">
					<div class="advantage-icon">📱</div>
					<h3>Кросс-платформенность</h3>
					<p>
						Смотрите на любом устройстве: компьютере, смартфоне, планшете или
						Smart TV. Адаптивный интерфейс обеспечивает комфортный просмотр на
						экране любого размера.
					</p>
				</div>

				<div class="advantage-card">
					<div class="advantage-icon">⚡</div>
					<h3>Высокая производительность</h3>
					<p>
						Наши серверы обеспечивают высокую скорость и стабильность трансляций
						без буферизации. Специальная технология адаптации потока под ваше
						интернет-соединение.
					</p>
				</div>

				<div class="advantage-card">
					<div class="advantage-icon">🔄</div>
					<h3>Архив передач</h3>
					<p>
						Пропустили любимую программу? Не беда! С функцией архива вы можете
						посмотреть любую передачу, вышедшую в эфир за последние 7 дней.
					</p>
				</div>

				<div class="advantage-card">
					<div class="advantage-icon">🔍</div>
					<h3>Удобный поиск</h3>
					<p>
						Быстро находите нужные каналы и программы с помощью
						интеллектуального поиска. Сортировка по категориям и возможность
						создания списка избранного.
					</p>
				</div>

				<div class="advantage-card">
					<div class="advantage-icon">🔒</div>
					<h3>Безопасность</h3>
					<p>
						Защищенное соединение и полная конфиденциальность ваших данных. Мы
						используем современные методы шифрования и не храним вашу личную
						информацию.
					</p>
				</div>

				<div class="advantage-card">
					<div class="advantage-icon">💰</div>
					<h3>Выгодная цена</h3>
					<p>
						Доступные тарифы и различные варианты подписки. Гибкая система
						оплаты позволяет выбрать оптимальный для вас вариант: от месячной до
						годовой подписки.
					</p>
				</div>
			</div>
		</div>

		<div class="section how-it-works">
			<h2 class="section-title">Как это работает</h2>
			<div class="steps">
				<div class="step">
					<div class="step-number">1</div>
					<h3>Регистрация</h3>
					<p>Создайте аккаунт всего за 30 секунд, указав только ваш email</p>
				</div>
				<div class="step-arrow">→</div>
				<div class="step">
					<div class="step-number">2</div>
					<h3>Активация</h3>
					<p>Получите доступ к вашей бесплатной 7-дневной пробной подписке</p>
				</div>
				<div class="step-arrow">→</div>
				<div class="step">
					<div class="step-number">3</div>
					<h3>Наслаждайтесь</h3>
					<p>Смотрите любимые каналы на любом устройстве без ограничений</p>
				</div>
			</div>
		</div>

		<div class="section testimonials">
			<h2 class="section-title">Что говорят наши пользователи</h2>
			<div class="testimonial-grid">
				<div class="testimonial">
					<div class="quote">
						"Лучший сервис для просмотра российского ТВ за границей. Использую
						уже год, качество и стабильность на высоте!"
					</div>
					<div class="author">Анна К., Берлин</div>
				</div>
				<div class="testimonial">
					<div class="quote">
						"Наконец-то могу смотреть любимые передачи в хорошем качестве.
						Огромный выбор каналов и простой интерфейс."
					</div>
					<div class="author">Михаил Д., Нью-Йорк</div>
				</div>
				<div class="testimonial">
					<div class="quote">
						"Пробовал многие сервисы, но остановился на RusTV. Стабильная работа
						без зависаний и отличная поддержка клиентов."
					</div>
					<div class="author">Сергей В., Торонто</div>
				</div>
			</div>
		</div>

		<div class="section cta-section">
			<h2>Готовы окунуться в мир российского телевидения?</h2>
			<p>
				Зарегистрируйтесь сейчас и получите полный доступ ко всем каналам на 7
				дней абсолютно бесплатно!
			</p>
			<router-link to="/register" class="try-free-btn"
				>Попробовать бесплатно</router-link
			>
			<p class="no-obligation">Без обязательств и автоматического продления</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const channelUrls = {
	pervyi: import.meta.env.VITE_PERVYI_URL,
	rossiya: import.meta.env.VITE_ROSSIYA_URL,
	tnt: import.meta.env.VITE_TNT_URL,
	match: import.meta.env.VITE_MATCH_URL,
}

const activeChannelIndex = ref(0)
const channelSwitchInterval = ref(null)

const hlsPlayers = ref([])

const getProxyUrl = url => {
	return `/api/playlist/stream?url=${encodeURIComponent(url)}`
}

const switchChannel = () => {
	const channels = document.querySelectorAll('.channel')

	channels.forEach(channel => {
		channel.classList.remove('active')
	})

	activeChannelIndex.value = (activeChannelIndex.value + 1) % channels.length

	const nextChannel = channels[activeChannelIndex.value]
	nextChannel.classList.add('active')

	refreshActiveChannelPlayback()
}

const refreshActiveChannelPlayback = async () => {
	try {
		destroyAllHlsInstances()

		const activeChannel = document.querySelector('.channel.active')
		if (!activeChannel) return

		const videoElement = activeChannel.querySelector('video')
		if (!videoElement) return

		let streamUrl = ''
		if (activeChannel.classList.contains('channel-1')) {
			streamUrl = channelUrls.pervyi
		} else if (activeChannel.classList.contains('channel-2')) {
			streamUrl = channelUrls.rossiya
		} else if (activeChannel.classList.contains('channel-3')) {
			streamUrl = channelUrls.tnt
		} else if (activeChannel.classList.contains('channel-4')) {
			streamUrl = channelUrls.match
		}

		if (!streamUrl) return

		await setupNewPlayer(videoElement, streamUrl)
	} catch (err) {
		console.error('Ошибка при обновлении воспроизведения:', err)
	}
}

const setupNewPlayer = async (videoElement, streamUrl) => {
	try {
		const proxyUrl = getProxyUrl(streamUrl)

		videoElement.pause()
		videoElement.removeAttribute('src')
		videoElement.load()

		if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
			videoElement.src = proxyUrl
			await videoElement.play().catch(e => {
				console.error('Ошибка воспроизведения видео:', e)
				setTimeout(
					() =>
						videoElement
							.play()
							.catch(e => console.error('Повторная ошибка:', e)),
					500
				)
			})
		} else {
			try {
				const Hls = (await import('hls.js')).default

				if (Hls.isSupported()) {
					const hls = new Hls({
						maxBufferLength: 30,
						maxMaxBufferLength: 60,
						enableWorker: true,
						lowLatencyMode: true,
						xhrSetup: xhr => {
							xhr.withCredentials = false
						},
					})

					hlsPlayers.value.push(hls)

					hls.loadSource(proxyUrl)
					hls.attachMedia(videoElement)

					hls.on(Hls.Events.MANIFEST_PARSED, () => {
						videoElement.play().catch(e => {
							console.error(
								'Ошибка воспроизведения после загрузки манифеста:',
								e
							)
							setTimeout(
								() =>
									videoElement
										.play()
										.catch(e =>
											console.error('Повторная ошибка манифеста:', e)
										),
								500
							)
						})
					})

					hls.on(Hls.Events.ERROR, (event, data) => {
						if (data.fatal) {
							console.error('Фатальная ошибка HLS:', data.type, data.details)
							switch (data.type) {
								case Hls.ErrorTypes.NETWORK_ERROR:
									console.log(
										'Сетевая ошибка, пробуем восстановить соединение...'
									)
									hls.startLoad()
									break
								case Hls.ErrorTypes.MEDIA_ERROR:
									console.log('Ошибка медиа, пробуем восстановить...')
									hls.recoverMediaError()
									break
								default:
									console.error(
										'Неустранимая ошибка, уничтожаем инстанс:',
										data
									)
									hls.destroy()
									setTimeout(
										() => setupNewPlayer(videoElement, streamUrl),
										1000
									)
									break
							}
						}
					})
				} else {
					console.error('HLS не поддерживается в этом браузере')
					videoElement.src = proxyUrl
					videoElement
						.play()
						.catch(e => console.error('Ошибка прямого воспроизведения:', e))
				}
			} catch (err) {
				console.error('Ошибка загрузки hls.js:', err)
				videoElement.src = proxyUrl
				videoElement
					.play()
					.catch(e => console.error('Ошибка прямого воспроизведения:', e))
			}
		}
	} catch (err) {
		console.error('Критическая ошибка настройки плеера:', err)
	}
}

const destroyAllHlsInstances = () => {
	hlsPlayers.value.forEach(hls => {
		try {
			hls.destroy()
		} catch (e) {
			console.error('Ошибка при уничтожении HLS плеера:', e)
		}
	})
	hlsPlayers.value = []
}

onMounted(() => {
	setTimeout(() => {
		try {
			document.querySelector('.channel-1').classList.add('active')

			refreshActiveChannelPlayback()

			channelSwitchInterval.value = setInterval(switchChannel, 5000)
		} catch (err) {
			console.error('Ошибка при инициализации компонента:', err)
		}
	}, 1000)
})

onBeforeUnmount(() => {
	if (channelSwitchInterval.value) {
		clearInterval(channelSwitchInterval.value)
	}

	destroyAllHlsInstances()
})
</script>

<style scoped>
.welcome-page {
	max-width: 100%;
	overflow-x: hidden;
	background-color: #f9f9f9;
}

.hero-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
	color: white;
	padding: 80px 20px;
	text-align: center;
}

@media (min-width: 992px) {
	.hero-section {
		flex-direction: row;
		text-align: left;
		padding: 100px 10%;
	}
}

.hero-content {
	max-width: 600px;
}

.hero-image {
	margin-top: 50px;
}

@media (min-width: 992px) {
	.hero-image {
		margin-top: 0;
	}
}

.tv-frame {
	width: 300px;
	height: 200px;
	background: #000;
	border-radius: 10px;
	padding: 10px;
	box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
	position: relative;
}

.tv-screen {
	width: 100%;
	height: 100%;
	background: #0a0a1a;
	overflow: hidden;
	position: relative;
}

.tv-content {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.channel-1,
.channel-2,
.channel-3,
.channel-4 {
	position: absolute;
	opacity: 0;
	width: 100%;
	height: 100%;
	background-color: #0a0a1a;
	padding: 5px;
	box-sizing: border-box;
	color: white;
	display: flex;
	flex-direction: column;
	transition: opacity 0.3s ease;
	visibility: hidden;
}

.channel.active {
	opacity: 1;
	visibility: visible;
}

.channel-logo {
	background: rgba(255, 255, 255, 0.1);
	padding: 3px 8px;
	border-radius: 4px;
	display: inline-block;
	margin-bottom: 4px;
	align-self: flex-start;
}

.logo-text {
	font-weight: bold;
	font-size: 12px;
	text-transform: uppercase;
}

.program-info {
	margin-bottom: 4px;
	text-align: left;
}

.program-title {
	font-weight: bold;
	font-size: 12px;
}

.channel-preview {
	flex-grow: 1;
	border-radius: 2px;
	overflow: hidden;
	position: relative;
	background-color: #000;
}

.preview-video {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

h1 {
	font-size: 2.8rem;
	margin-bottom: 1rem;
	font-weight: 700;
	line-height: 1.2;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
	font-size: 1.3rem;
	margin-bottom: 2.5rem;
	line-height: 1.5;
	opacity: 0.9;
}

.hero-cta {
	display: inline-block;
	background-color: #4caf50;
	color: white;
	font-size: 1.2rem;
	font-weight: 600;
	padding: 15px 40px;
	border-radius: 50px;
	text-decoration: none;
	transition: all 0.3s;
	box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
}

.hero-cta:hover {
	background-color: #3d9140;
	transform: translateY(-3px);
	box-shadow: 0 6px 20px rgba(76, 175, 80, 0.6);
}

.trial-note {
	margin-top: 15px;
	font-size: 0.9rem;
	opacity: 0.8;
}

.section {
	padding: 80px 20px;
}

.section-title {
	text-align: center;
	font-size: 2.2rem;
	margin-bottom: 15px;
	color: #2c3e50;
}

.section-subtitle {
	text-align: center;
	font-size: 1.2rem;
	color: #5a6a7a;
	max-width: 700px;
	margin: 0 auto 50px;
}

.features-section {
	background-color: white;
}

.advantages {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 40px;
	max-width: 1200px;
	margin: 0 auto;
}

.advantage-card {
	background: #fff;
	border-radius: 12px;
	padding: 30px;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
	transition: transform 0.3s, box-shadow 0.3s;
	border: 1px solid #f0f0f0;
}

.advantage-card:hover {
	transform: translateY(-10px);
	box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.advantage-icon {
	font-size: 3rem;
	margin-bottom: 20px;
}

.advantage-card h3 {
	color: #2c3e50;
	margin-bottom: 15px;
	font-size: 1.3rem;
}

.advantage-card p {
	color: #5a6a7a;
	line-height: 1.6;
}

.how-it-works {
	background-color: #f1f5f9;
}

.steps {
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: 1000px;
	margin: 0 auto;
}

@media (min-width: 768px) {
	.steps {
		flex-direction: row;
		justify-content: space-between;
	}
}

.step {
	background: white;
	padding: 30px;
	border-radius: 12px;
	text-align: center;
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
	margin-bottom: 30px;
	width: 100%;
	max-width: 250px;
}

@media (min-width: 768px) {
	.step {
		margin-bottom: 0;
	}
}

.step-number {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 50px;
	height: 50px;
	background: #4caf50;
	color: white;
	border-radius: 50%;
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0 auto 20px;
}

.step h3 {
	color: #2c3e50;
	margin-bottom: 10px;
}

.step-arrow {
	display: none;
	color: #4caf50;
	font-size: 2rem;
	font-weight: 700;
}

@media (min-width: 768px) {
	.step-arrow {
		display: block;
	}
}

.testimonials {
	background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
}

.testimonial-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 30px;
	max-width: 1200px;
	margin: 0 auto;
}

@media (min-width: 768px) {
	.testimonial-grid {
		grid-template-columns: repeat(3, 1fr);
	}
}

.testimonial {
	background: white;
	padding: 30px;
	border-radius: 12px;
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.quote {
	font-style: italic;
	line-height: 1.6;
	color: #2c3e50;
	margin-bottom: 15px;
	position: relative;
	padding: 0 10px;
}

.quote::before,
.quote::after {
	content: '"';
	font-size: 2rem;
	color: #4caf50;
	position: absolute;
	opacity: 0.3;
}

.quote::before {
	left: -10px;
	top: -10px;
}

.quote::after {
	right: -10px;
	bottom: -30px;
}

.author {
	text-align: right;
	font-weight: 700;
	color: #5a6a7a;
}

.cta-section {
	text-align: center;
	background: #2c3e50;
	color: white;
	padding: 80px 20px;
	border-radius: 0;
}

.cta-section h2 {
	font-size: 2.2rem;
	margin-bottom: 20px;
	color: white;
}

.cta-section p {
	color: rgba(255, 255, 255, 0.8);
	margin-bottom: 30px;
	font-size: 1.2rem;
	max-width: 700px;
	margin-left: auto;
	margin-right: auto;
}

.try-free-btn {
	display: inline-block;
	background-color: #4caf50;
	color: white;
	font-size: 1.2rem;
	font-weight: 600;
	padding: 15px 40px;
	border-radius: 50px;
	text-decoration: none;
	transition: all 0.3s;
	box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
}

.try-free-btn:hover {
	background-color: #3d9140;
	transform: translateY(-3px);
	box-shadow: 0 6px 20px rgba(76, 175, 80, 0.6);
}

.no-obligation {
	font-size: 0.9rem;
	opacity: 0.7;
	margin-top: 15px;
}

@media (min-width: 992px) {
	.tv-frame {
		width: 400px;
		height: 280px;
	}
}
</style>
