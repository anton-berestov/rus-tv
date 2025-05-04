import mongoose, { Document, Schema } from 'mongoose'

export enum PaymentStatus {
	PENDING = 'pending',
	SUCCEEDED = 'succeeded',
	CANCELED = 'canceled',
	WAITING_FOR_CAPTURE = 'waiting_for_capture',
	REFUNDED = 'refunded',
}

export interface IPayment extends Document {
	userId: Schema.Types.ObjectId
	subscriptionPlanId: Schema.Types.ObjectId
	paymentId: string
	status: PaymentStatus
	amount: number
	currency: string
	description: string
	confirmationUrl: string
	paidAt: Date | null
	expiresAt: Date | null
	createdAt: Date
	updatedAt: Date
	gateway: string // Платежная система (yookassa)
	isRecurring: boolean // Является ли платеж автоплатежом
	paymentMethodId?: string // ID сохраненного метода оплаты
}

const paymentSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		subscriptionPlanId: {
			type: Schema.Types.ObjectId,
			ref: 'SubscriptionPlan',
			required: true,
		},
		paymentId: {
			type: String,
			required: true,
			unique: true,
		},
		status: {
			type: String,
			enum: Object.values(PaymentStatus),
			default: PaymentStatus.PENDING,
		},
		amount: {
			type: Number,
			required: true,
		},
		currency: {
			type: String,
			default: 'RUB',
		},
		description: {
			type: String,
			required: true,
		},
		confirmationUrl: {
			type: String,
			required: true,
		},
		paidAt: {
			type: Date,
			default: null,
		},
		expiresAt: {
			type: Date,
			default: null,
		},
		gateway: {
			type: String,
			enum: ['yookassa'],
			default: 'yookassa',
		},
		isRecurring: {
			type: Boolean,
			default: false,
		},
		paymentMethodId: {
			type: String,
			default: null,
		},
	},
	{
		timestamps: true,
	}
)

// Индексы для быстрого поиска
paymentSchema.index({ userId: 1, status: 1 })
paymentSchema.index({ userId: 1, subscriptionPlanId: 1 })

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema)
