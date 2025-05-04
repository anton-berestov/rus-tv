import config from '../config/env'

/**
 * Проверяет корректность настроек ЮKassa
 */
export const validateYookassaConfig = (): boolean => {
	const { yookassa } = config.payment

	let isValid = true
	const warnings = []
	const errors = []

	// Проверяем необходимые параметры
	if (!yookassa.shopId) {
		isValid = false
		errors.push(
			'ОШИБКА: Не указан идентификатор магазина ЮKassa (YOOKASSA_SHOP_ID)'
		)
	}

	if (!yookassa.secretKey) {
		isValid = false
		errors.push('ОШИБКА: Не указан секретный ключ ЮKassa (YOOKASSA_SECRET_KEY)')
	}

	if (!yookassa.returnUrl) {
		warnings.push(
			'ПРЕДУПРЕЖДЕНИЕ: Не указан URL для возврата после оплаты (YOOKASSA_RETURN_URL)'
		)
	}

	if (!yookassa.webhookUrl) {
		warnings.push(
			'ПРЕДУПРЕЖДЕНИЕ: Не указан URL для вебхуков (YOOKASSA_WEBHOOK_URL)'
		)
	}

	// Проверяем, что URL не является локальным в production-окружении
	if (config.server.nodeEnv === 'production') {
		if (yookassa.returnUrl && yookassa.returnUrl.includes('localhost')) {
			isValid = false
			errors.push(
				'ОШИБКА: В production-окружении URL для возврата не может быть локальным (YOOKASSA_RETURN_URL)'
			)
		}

		if (yookassa.webhookUrl && yookassa.webhookUrl.includes('localhost')) {
			isValid = false
			errors.push(
				'ОШИБКА: В production-окружении URL для вебхуков не может быть локальным (YOOKASSA_WEBHOOK_URL)'
			)
		}
	}

	// Выводим предупреждения
	if (warnings.length > 0) {
		console.warn('--- Предупреждения конфигурации ЮKassa ---')
		warnings.forEach(warning => console.warn(warning))
		console.warn('----------------------------------------')
	}

	// Выводим ошибки
	if (errors.length > 0) {
		console.error('--- Ошибки конфигурации ЮKassa ---')
		errors.forEach(error => console.error(error))
		console.error('------------------------------------')
	}

	return isValid
}

export default validateYookassaConfig
