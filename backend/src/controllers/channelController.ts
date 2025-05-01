import { Request, Response } from 'express'
import { Channel } from '../models/Channel'

// Получение списка всех активных каналов
export const getChannels = async (req: Request, res: Response) => {
	try {
		const channels = await Channel.find({ isActive: true })
			.sort({ order: 1 })
			.select('-createdAt -updatedAt -__v')

		res.json({
			success: true,
			data: channels,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Ошибка при получении списка каналов',
		})
	}
}

// Получение информации о конкретном канале
export const getChannel = async (req: Request, res: Response) => {
	try {
		const channel = await Channel.findById(req.params.id).select(
			'-createdAt -updatedAt -__v'
		)

		if (!channel) {
			return res.status(404).json({
				success: false,
				message: 'Канал не найден',
			})
		}

		res.json({
			success: true,
			data: channel,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Ошибка при получении информации о канале',
		})
	}
}

// Добавление нового канала (только для админов)
export const createChannel = async (req: Request, res: Response) => {
	try {
		const channel = new Channel(req.body)
		await channel.save()

		res.status(201).json({
			success: true,
			data: channel,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Ошибка при создании канала',
		})
	}
}

// Обновление информации о канале (только для админов)
export const updateChannel = async (req: Request, res: Response) => {
	try {
		const channel = await Channel.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		})

		if (!channel) {
			return res.status(404).json({
				success: false,
				message: 'Канал не найден',
			})
		}

		res.json({
			success: true,
			data: channel,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Ошибка при обновлении канала',
		})
	}
}

// Удаление канала (только для админов)
export const deleteChannel = async (req: Request, res: Response) => {
	try {
		const channel = await Channel.findByIdAndDelete(req.params.id)

		if (!channel) {
			return res.status(404).json({
				success: false,
				message: 'Канал не найден',
			})
		}

		res.json({
			success: true,
			message: 'Канал успешно удален',
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Ошибка при удалении канала',
		})
	}
}
