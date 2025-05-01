/**
 * Генерирует случайный пароль заданной длины
 * @param length Длина пароля (по умолчанию 10 символов)
 * @returns Сгенерированный пароль
 */
export function generatePassword(length: number = 10): string {
	const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
	const numberChars = '0123456789'
	const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'

	const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars

	// Убедимся, что пароль содержит хотя бы один символ из каждой категории
	let password =
		getRandomChar(uppercaseChars) +
		getRandomChar(lowercaseChars) +
		getRandomChar(numberChars) +
		getRandomChar(specialChars)

	// Дополнить пароль до нужной длины случайными символами
	for (let i = 4; i < length; i++) {
		password += getRandomChar(allChars)
	}

	// Перемешать символы в пароле
	return shuffleString(password)
}

/**
 * Возвращает случайный символ из строки
 */
function getRandomChar(str: string): string {
	return str.charAt(Math.floor(Math.random() * str.length))
}

/**
 * Перемешивает символы в строке
 */
function shuffleString(str: string): string {
	const array = str.split('')
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]] // Обмен элементов
	}
	return array.join('')
}
