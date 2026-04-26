import { mysqlTable, serial, varchar, int, decimal, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

// --- TABLE USERS ---
export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'staff']).default('staff'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// --- TABLE PRODUCTS ---
export const products = mysqlTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 50 }).unique(), // Untuk internal code
  barcode: varchar('barcode', { length: 100 }).unique(), // Untuk hasil scan barcode/EAN
  image: varchar('image', { length: 255 }), // URL atau path file gambar
  price: decimal('price', { precision: 12, scale: 2 }).notNull().default('0.00'),
  stock: int('stock').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});