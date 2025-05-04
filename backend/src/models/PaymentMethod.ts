import mongoose, { Document, Schema } from 'mongoose'

export interface IPaymentMethod extends Document {
	userId: mongoose.Types.ObjectId
	paymentMethodId: string // ID метода оплаты из ЮKassa
	type: string // bank_card, yoo_money, etc.
	title: string // Название для отображения пользователю
	card?: {
		first6: string // Первые 6 цифр карты
		last4: string // Последние 4 цифры карты
		expiryMonth: string // Месяц истечения срока
		expiryYear: string // Год истечения срока
		cardType: string // Тип карты (MasterCard, Visa, МИР)
	}
	isDefault: boolean // Метод оплаты по умолчанию
	createdAt: Date
	updatedAt: Date
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		paymentMethodId: {
			type: String,
			required: true,
			unique: true,
		},
		type: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		card: {
			first6: String,
			last4: String,
			expiryMonth: String,
			expiryYear: String,
			cardType: String,
		},
		isDefault: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
)

// Индексы для быстрого поиска
PaymentMethodSchema.index({ userId: 1, isDefault: 1 })

export const PaymentMethod = mongoose.model<IPaymentMethod>(
	'PaymentMethod',
	PaymentMethodSchema
)
