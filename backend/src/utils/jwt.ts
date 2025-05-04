import jwt, { SignOptions } from 'jsonwebtoken'
import config from '../config/env'
import { JwtPayload } from '../types/jwt'

const jwtSecret: string = config.security.jwt.secret as string

export const generateToken = (payload: Record<string, any>): string => {
	const options: SignOptions = {
		expiresIn: config.security.jwt.expiresIn as any,
	}
	return jwt.sign(payload, jwtSecret, options)
}

export const verifyToken = (token: string): JwtPayload => {
	return jwt.verify(token, jwtSecret) as JwtPayload
}
