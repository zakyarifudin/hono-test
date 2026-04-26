import { type Context } from 'hono'
import { sign } from 'hono/jwt';
import { db } from '../database/index.js'
import { users } from '../database/schema.js';
import { eq } from 'drizzle-orm';

export const register = async (c: Context) => {
  const { username, password } = await c.req.json();
  
  // Drizzle Insert
  await db.insert(users).values({
    username,
    password, // Ingat nanti tambahin hash!
  });

  return c.json({ success: true, message: 'User registered via Drizzle' });
};

export const login = async (c: Context) => {
  const { username, password } = await c.req.json();
  
  // Drizzle Select
  const result = await db.select().from(users).where(eq(users.username, username));
  const user = result[0];

  if (!user || user.password !== password) {
    return c.json({ message: 'Invalid' }, 401);
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    // 60 detik * 60 menit * 24 jam * 30 hari
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) 
  }

  const token = await sign(payload, process.env.JWT_SECRET!, 'HS256');
  return c.json({ status: "success", token });
};