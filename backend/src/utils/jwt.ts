export const generateToken = (payload: JwtPayload): string => {
	return jwt.sign(payload, config.security.jwt.secret as Secret, {
		expiresIn: config.security.jwt.expiresIn,
	})
}

export const verifyToken = (token: string): JwtPayload => {
	return jwt.verify(token, config.security.jwt.secret as Secret) as JwtPayload
}
