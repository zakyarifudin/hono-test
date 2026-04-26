import { defineConfig } from 'drizzle-kit'; // Pastikan tidak ada /subpath
import 'dotenv/config';

// Susun URL secara dinamis
const dbUrl = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`;

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: dbUrl,
    // host: process.env.DB_HOST || 'localhost',
    // user: process.env.DB_USER || 'root',
    // password: process.env.DB_PASSWORD || '',
    // database: process.env.DB_NAME || 'hono_test',
    // port: 3306,
  },
});