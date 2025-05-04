// Типы для работы с API ЮKassa
// Документация: https://yookassa.ru/developers/api

// Статусы платежа
export enum YooKassaPaymentStatus {
	PENDING = 'pending', // Ожидает оплаты
	WAITING_FOR_CAPTURE = 'waiting_for_capture', // Ожидает подтверждения
	SUCCEEDED = 'succeeded', // Успешно оплачен
	CANCELED = 'canceled', // Отменен
}

// Запрос на создание платежа
export interface CreatePaymentRequest {
	amount: {
		value: string
		currency: string
	}
	confirmation: {
		type: string
		return_url: string
	}
	capture: boolean
	description: string
	metadata?: {
		userId: string
		planId: string
		planName: string
		planDuration: string
		twoStepPayment?: string
	}
	save_payment_method: boolean
}

// Запрос на создание автоплатежа
export interface CreateRecurringPaymentRequest {
	amount: {
		value: string
		currency: string
	}
	capture: boolean
	payment_method_id: string
	description: string
	metadata?: {
		userId: string
		planId: string
		planName: string
		planDuration: string
		isRecurring: string
	}
}

// Ответ от API при создании платежа
export interface YooKassaPaymentResponse {
	id: string
	status: YooKassaPaymentStatus
	paid: boolean
	amount: {
		value: string
		currency: string
	}
	confirmation?: {
		type: string
		confirmation_url: string
	}
	created_at: string
	description: string
	metadata?: {
		userId: string
		planId: string
		planName: string
		planDuration: string
		twoStepPayment?: string
	}
	payment_method?: any
	payment_method_id?: string
	payment_method_saved?: boolean
}
