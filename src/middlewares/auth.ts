import { jwt } from 'hono/jwt'
import 'dotenv/config'
import type { Context, Next } from 'hono'

const SECRET = process.env.JWT_SECRET

if (!SECRET) {
  throw new Error('JWT_SECRET is not defined in .env file')
}

export const authMiddleware = (c: Context, next: Next) => {
  console.log("Middleware jalan! Sedang cek token...")
  const jwtMiddleware = jwt({
    secret: SECRET!,
    alg: 'HS256',
  })
  return jwtMiddleware(c, next)
}