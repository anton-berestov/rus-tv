// Типы для работы с API ЮKassa
// Документация: https://yookassa.ru/developers/api

// Статусы платежа
export enum YooKassaPaymentStatus {
	PENDING = 'pending', // Ожидает оплаты
	WAITING_FOR_CAPTURE = 'waiting_for_capture', // Ожидает подтверждения
	SUCCEEDED = 'succeeded', // Успешно оплачен
	CANCELED = 'canceled', // Отменен
}

// Метод оплаты
export enum YooKassaPaymentMethod {
	BANK_CARD = 'bank_card', // Банковская карта
	YOO_MONEY = 'yoo_money', // ЮMoney
	SBP = 'sbp', // Система быстрых платежей
	SBERBANK = 'sberbank', // СберБанк
	TINKOFF_BANK = 'tinkoff_bank', // Тинькофф
}

// Интерфейс для создания платежа
export interface CreatePaymentRequest {
	amount: {
		value: string // Сумма в формате "10.00"
		currency: string // Валюта (RUB, USD, EUR)
	}
	capture?: boolean // Автоматически принять платеж
	confirmation: {
		type: 'redirect' // Тип подтверждения
		return_url: string // URL для возврата после оплаты
	}
	description?: string // Описание платежа
	metadata?: Record<string, string> // Дополнительные данные
	payment_method_data?: {
		type: string // Тип метода оплаты
	}
	// Для сохранения способа оплаты
	save_payment_method?: boolean
}

// Интерфейс для создания платежа с сохраненным способом оплаты
export interface CreateRecurringPaymentRequest {
	amount: {
		value: string
		currency: string
	}
	capture?: boolean
	payment_method_id: string // ID сохраненного метода оплаты
	description?: string
	metadata?: Record<string, string>
}

// Данные о банковской карте
export interface BankCardInfo {
	first6: string // Первые 6 цифр карты
	last4: string // Последние 4 цифры карты
	expiry_month: string // Месяц истечения срока
	expiry_year: string // Год истечения срока
	card_type: string // Тип карты (MasterCard, Visa, МИР)
}

// Информация о способе оплаты
export interface PaymentMethodInfo {
	type: string // Тип способа оплаты
	id: string // Идентификатор способа оплаты
	saved: boolean // Сохранен ли способ оплаты
	title?: string // Название способа оплаты
	card?: BankCardInfo // Информация о карте
}

// Интерфейс ответа при создании платежа
export interface YooKassaPaymentResponse {
	id: string // Идентификатор платежа
	status: YooKassaPaymentStatus // Статус платежа
	amount: {
		value: string // Сумма платежа
		currency: string // Валюта
	}
	description?: string // Описание платежа
	recipient: {
		account_id: string // Идентификатор магазина
		gateway_id: string // Идентификатор шлюза
	}
	created_at: string // Время создания
	confirmation: {
		type: string // Тип подтверждения
		confirmation_url?: string // URL для подтверждения платежа
	}
	payment_method?: PaymentMethodInfo // Информация о способе оплаты
	metadata?: Record<string, string> // Дополнительные данные
	captured_at?: string // Время подтверждения платежа
	test: boolean // Тестовый платеж или нет
	paid: boolean // Оплачен ли платеж
	refundable: boolean // Можно ли вернуть платеж
	payment_method_saved?: boolean // Сохранен ли способ оплаты
}
