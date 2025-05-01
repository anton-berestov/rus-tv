import { JwtPayload as JsonWebTokenPayload } from 'jsonwebtoken'

export interface JwtPayload extends JsonWebTokenPayload {
	userId: string
	deviceId: string
}

export interface JwtResponse {
	token: string
	deviceId: string
}
