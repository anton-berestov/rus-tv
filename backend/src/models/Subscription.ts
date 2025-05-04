import mongoose, { Document, Model, Schema } from 'mongoose'

// Интерфейс для плана подписки
export interface ISubscriptionPlan extends Document {
	name: string // Название плана
	description: string // Описание плана
	monthDuration: number // Длительность подписки в месяцах
	priceEur: number // Стоимость подписки в рублях (для совместимости используем старое имя поля)
	discount: number // Скидка в процентах
	deviceLimit: number // Ограничение на количество устройств
	isPopular: boolean // Флаг для отметки популярных планов
	sortOrder: number // Порядок сортировки
}

// Схема для плана подписки
const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		description: {
			type: String,
			required: true,
		},
		monthDuration: {
			type: Number,
			required: true,
			min: 1,
		},
		priceEur: {
			type: Number,
			required: true,
			min: 0,
			description: 'Стоимость подписки в рублях',
		},
		discount: {
			type: Number,
			default: 0,
			min: 0,
			max: 100,
		},
		deviceLimit: {
			type: Number,
			required: true,
			min: 1,
		},
		isPopular: {
			type: Boolean,
			default: false,
		},
		sortOrder: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
)

// Создаем и экспортируем модель
export const SubscriptionPlan: Model<ISubscriptionPlan> =
	mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema)
