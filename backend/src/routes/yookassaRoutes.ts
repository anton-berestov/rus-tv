import express from 'express'
import {
	capturePayment,
	checkYookassaStatus,
	createRecurringPayment,
	createYookassaPayment,
	deletePaymentMethod,
	getPaymentMethods,
	handleYookassaWebhook,
	setDefaultPaymentMethod,
} from '../controllers/yookassaController'
import { auth } from '../middleware/auth'

const router = express.Router()

// Создание платежа через ЮKassa
router.post('/payment', auth, createYookassaPayment)

// Создание автоплатежа с использованием сохраненного метода оплаты
router.post('/recurring-payment', auth, createRecurringPayment)

// Проверка статуса платежа
router.get('/payment/:paymentId/status', auth, checkYookassaStatus)

// Явное подтверждение платежа (для двухэтапной оплаты)
router.post('/payment/:paymentId/capture', auth, capturePayment)

// Получение списка сохраненных методов оплаты
router.get('/payment-methods', auth, getPaymentMethods)

// Установка метода оплаты по умолчанию
router.post('/payment-methods/:methodId/default', auth, setDefaultPaymentMethod)

// Удаление метода оплаты
router.delete('/payment-methods/:methodId', auth, deletePaymentMethod)

// Обработка webhook уведомлений от ЮKassa
router.post('/webhook', handleYookassaWebhook)

export default router
