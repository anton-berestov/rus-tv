import axios from 'axios'
import { Request, Response } from 'express'
import config from '../config/env'
import { Channel } from '../models/Channel'

interface M3UChannel {
	name: string
	group: string
	logo?: string
	url: string
	epgId?: string
}

async function parseM3U(content: string): Promise<M3UChannel[]> {
	const channels: M3UChannel[] = []
	const lines = content.split('\n')
	let currentChannel: Partial<M3UChannel> = {}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()

		if (line.startsWith('#EXTINF:')) {
			// Парсим информацию о канале
			currentChannel = {}

			// Получаем название группы
			const groupMatch = line.match(/group-title="([^"]*)"/)
			currentChannel.group = groupMatch ? groupMatch[1] : 'Без группы'

			// Получаем лого
			const logoMatch = line.match(/tvg-logo="([^"]*)"/)
			if (logoMatch) {
				currentChannel.logo = logoMatch[1]
			}

			// Получаем EPG ID
			const epgMatch = line.match(/tvg-id="([^"]*)"/)
			if (epgMatch) {
				currentChannel.epgId = epgMatch[1]
			}

			// Получаем название канала
			const nameMatch = line.match(/,(.*)$/)
			if (nameMatch) {
				currentChannel.name = nameMatch[1].trim()
			}
		} else if (line.startsWith('http')) {
			// Это URL канала
			currentChannel.url = line
			if (currentChannel.name && currentChannel.group) {
				channels.push(currentChannel as M3UChannel)
			}
			currentChannel = {}
		}
	}

	return channels
}

async function updateChannelsDatabase(channels: M3UChannel[]): Promise<void> {
	try {
		// Очищаем существующие каналы
		await Channel.deleteMany({})

		// Группируем каналы по категориям для правильного порядка
		const channelsByCategory: Record<string, M3UChannel[]> = {}

		channels.forEach(channel => {
			if (!channelsByCategory[channel.group]) {
				channelsByCategory[channel.group] = []
			}
			channelsByCategory[channel.group].push(channel)
		})

		// Добавляем новые каналы с порядковыми номерами
		let order = 0
		const channelsToInsert = []

		// Обрабатываем каждую категорию
		for (const category in channelsByCategory) {
			const channelsInCategory = channelsByCategory[category]
			for (const channel of channelsInCategory) {
				channelsToInsert.push({
					name: channel.name,
					category: channel.group,
					logoUrl: channel.logo || '',
					streamUrl: channel.url,
					order: order++,
					isActive: true,
					language: 'Русский',
				})
			}
		}

		await Channel.insertMany(channelsToInsert)
		console.log(`Обновлено ${channelsToInsert.length} каналов в базе данных`)
	} catch (error) {
		console.error('Error updating channels database:', error)
		throw error
	}
}

export const updatePlaylist = async (req: Request, res: Response) => {
	try {
		console.log(`Загрузка плейлиста с ${config.playlist.url}`)
		const response = await axios.get(config.playlist.url)

		const channels = await parseM3U(response.data)
		console.log(`Найдено ${channels.length} каналов в плейлисте`)

		await updateChannelsDatabase(channels)

		res.json({
			success: true,
			message: 'Плейлист успешно обновлен',
			channelsCount: channels.length,
		})
	} catch (error: any) {
		console.error('Error updating playlist:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка при обновлении плейлиста',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

export const getPlaylist = async (req: Request, res: Response) => {
	try {
		// Проверяем количество каналов в базе
		const count = await Channel.countDocuments()

		// Если каналов нет, попробуем обновить плейлист
		if (count === 0) {
			console.log('База данных каналов пуста, обновляем плейлист...')
			const response = await axios.get(config.playlist.url)
			const channels = await parseM3U(response.data)
			await updateChannelsDatabase(channels)
		}

		const { category } = req.query
		let query = {}

		if (category) {
			query = { category }
		}

		// Получаем каналы из базы данных
		const channels = await Channel.find(query)
			.sort({ order: 1 })
			.select('-__v')
			.exec()

		// Получаем уникальные категории для фильтрации
		const categories = await Channel.distinct('category')

		res.json({
			success: true,
			channels,
			categories,
			total: channels.length,
		})
	} catch (error: any) {
		console.error('Error fetching playlist:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка при получении списка каналов',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

export const getStream = async (req: Request, res: Response) => {
	try {
		const { url } = req.query

		if (!url) {
			return res.status(400).json({
				success: false,
				error: 'URL потока не указан',
			})
		}

		const streamUrl = decodeURIComponent(url as string)

		// Проксируем запрос к стриму
		const response = await axios.get(streamUrl, {
			responseType: 'stream',
		})

		// Устанавливаем правильные заголовки
		res.setHeader('Content-Type', 'application/x-mpegURL')
		response.data.pipe(res)
	} catch (error: any) {
		console.error('Error fetching stream:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка при получении потока',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

export const getLogo = async (req: Request, res: Response) => {
	try {
		const { url } = req.query

		if (!url) {
			return res.status(400).json({
				success: false,
				error: 'URL логотипа не указан',
			})
		}

		const logoUrl = decodeURIComponent(url as string)

		// Проксируем запрос к логотипу
		const response = await axios.get(logoUrl, {
			responseType: 'stream',
		})

		// Устанавливаем правильные заголовки
		res.setHeader('Content-Type', response.headers['content-type'])
		response.data.pipe(res)
	} catch (error: any) {
		console.error('Error fetching logo:', error)
		res.status(500).json({
			success: false,
			error: 'Ошибка при получении логотипа',
			details:
				config.server.nodeEnv === 'development' ? error.message : undefined,
		})
	}
}

// Добавляем маршрут для ручного обновления плейлиста
export const refreshPlaylist = async (req: Request, res: Response) => {
	await updatePlaylist(req, res)
}
