import bcrypt from 'bcryptjs'
import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
	email: string
	password: string
	username: string
	isAdmin: boolean
	subscription: {
		active: boolean
		deviceLimit: number
		expireDate: Date
	}
	activeDevices: {
		deviceId: string
		lastActive: Date
	}[]
	comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
		subscription: {
			active: {
				type: Boolean,
				default: false,
			},
			deviceLimit: {
				type: Number,
				default: 0,
			},
			expireDate: {
				type: Date,
			},
		},
		activeDevices: [
			{
				deviceId: String,
				lastActive: {
					type: Date,
					default: Date.now,
				},
			},
		],
	},
	{
		timestamps: true,
	}
)

// Хэширование пароля перед сохранением
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next()

	try {
		const salt = await bcrypt.genSalt(10)
		this.password = await bcrypt.hash(this.password, salt)
		next()
	} catch (error: any) {
		next(error)
	}
})

// Метод для сравнения паролей
userSchema.methods.comparePassword = async function (
	candidatePassword: string
): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.password)
}

export const User = mongoose.model<IUser>('User', userSchema)
