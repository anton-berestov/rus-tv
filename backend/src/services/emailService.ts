import nodemailer from 'nodemailer'
import config from '../config/env'

interface EmailOptions {
	to: string
	subject: string
	text?: string
	html?: string
}

/**
 * Сервис для отправки email
 */
export const emailService = {
	/**
	 * Отправляет email с реквизитами доступа (username и пароль)
	 */
	async sendCredentials(
		email: string,
		username: string,
		password: string
	): Promise<boolean> {
		try {
			const subject = 'Регистрация на сервисе RusTV'
			const html = `
        <h2>Добро пожаловать в RusTV!</h2>
        <p>Ваша регистрация успешно завершена.</p>
        <p>Ваши данные для входа:</p>
        <ul>
          <li><strong>Имя пользователя:</strong> ${username}</li>
          <li><strong>Пароль:</strong> ${password}</li>
        </ul>
        <p>Для входа в систему используйте ваше имя пользователя и пароль.</p>
        <p>С уважением,<br>Команда RusTV</p>
      `

			return await this.sendEmail({
				to: email,
				subject,
				html,
			})
		} catch (error) {
			console.error('Ошибка при отправке email с реквизитами:', error)
			return false
		}
	},

	/**
	 * Отправляет email
	 */
	async sendEmail(options: EmailOptions): Promise<boolean> {
		try {
			const transporter = nodemailer.createTransport({
				host: config.email.host,
				port: config.email.port,
				secure: config.email.secure,
				auth: {
					user: config.email.user,
					pass: config.email.password,
				},
			})

			const mailOptions = {
				from: `"RusTV" <${config.email.user}>`,
				to: options.to,
				subject: options.subject,
				text: options.text,
				html: options.html,
			}

			const info = await transporter.sendMail(mailOptions)
			console.log('Email отправлен:', info.messageId)
			return true
		} catch (error) {
			console.error('Ошибка при отправке email:', error)
			return false
		}
	},
}
