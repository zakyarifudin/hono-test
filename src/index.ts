import { serve } from '@hono/node-server'
import 'dotenv/config'
import { Hono } from 'hono'
import { authMiddleware} from './middlewares/auth.js'
import { register, login } from './controllers/authController.js'
import { getAllProducts, createProduct, updateProduct, deleteProduct } from './controllers/productController.js'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()

// Upload folder 'public' untuk file upload
app.use('/uploads/*', serveStatic({ root: './public' }))

// --- Public Routes ---
app.post('/auth/register', register)
app.post('/auth/login', login)

// --- Protected Routes ---
// Semua route yang pakai prefix /api/ akan dicek tokennya
app.use('/api/*', authMiddleware)
app.get('/api/products', getAllProducts)
app.post('/api/products', createProduct)
app.put('/api/products/:id', updateProduct)
app.delete("/api/products/:id", deleteProduct);


app.get('/', (c) => c.text('Hono is running!'))

serve({
  fetch: app.fetch,
  port: 4000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
