import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import config from './config/env'
import authRoutes from './routes/auth'
import channelRoutes from './routes/channelRoutes'
import playlistRoutes from './routes/playlist'

const app = express()

// Настройка CORS
app.use(
	cors({
		origin: config.cors.origin,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
)

// Middleware
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/playlist', playlistRoutes)
app.use('/api/channels', channelRoutes)

// Подключение к MongoDB
mongoose
	.connect(config.db.uri)
	.then(() => {
		console.log('Connected to MongoDB')
		// Запуск сервера только после успешного подключения к БД
		app.listen(config.server.port, () => {
			console.log(
				`Server is running on port ${config.server.port} in ${config.server.nodeEnv} mode`
			)
		})
	})
	.catch(error => {
		console.error('Error connecting to MongoDB:', error)
		process.exit(1)
	})
