import mongoose, { Document, Schema } from 'mongoose'

export interface IChannel extends Document {
	name: string
	logoUrl: string
	streamUrl: string
	category: string
	language: string
	isActive: boolean
	order: number
}

const channelSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		logoUrl: {
			type: String,
			required: true,
		},
		streamUrl: {
			type: String,
			required: true,
		},
		category: {
			type: String,
			required: true,
			default: 'Общие',
		},
		language: {
			type: String,
			required: true,
			default: 'Русский',
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		order: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
)

// Создаем индексы для быстрого поиска
channelSchema.index({ name: 1 })
channelSchema.index({ order: 1 })

export const Channel = mongoose.model<IChannel>('Channel', channelSchema)
