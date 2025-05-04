import app from './app'
import config from './config/env'

// Используем порт 3001 вместо 3000, чтобы избежать конфликта
const PORT = process.env.PORT || 3001

// Запускаем сервер
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT} in ${config.server.nodeEnv} mode`)
})
