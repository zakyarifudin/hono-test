import { type Context } from 'hono'
import { db } from '../database/index.js'
import { products } from '../database/schema.js'
import { eq, count, like, or } from 'drizzle-orm' // Tambah like & or

export const getAllProducts = async (c: Context) => {
  try {
    const page = Number(c.req.query('page')) || 1
    const limit = Number(c.req.query('limit')) || 10
    const offset = (page - 1) * limit
    
    // Ambil keyword search dari query param ?search=...
    const searchQuery = c.req.query('search')

    // 1. Definisikan Filter (Jika ada search query)
    const filters = searchQuery 
      ? or(
          like(products.name, `%${searchQuery}%`), 
          eq(products.barcode, searchQuery),
          eq(products.sku, searchQuery)
        )
      : undefined

    // 2. Query ambil data dengan Filter + Pagination
    const allProducts = await db.select()
      .from(products)
      .where(filters) // Masukkan filter di sini
      .limit(limit)
      .offset(offset)

    // 3. Query total data berdasarkan Filter tersebut
    const [totalResult] = await db.select({ value: count() })
      .from(products)
      .where(filters)
    
    const totalCount = totalResult.value

    return c.json({ 
      success: true, 
      data: allProducts,
      pagination: {
        total_count: totalCount,
        current_page: page,
        limit: limit,
        total_pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500)
  }
}

// 2. Tambah produk baru & Return data barunya
export const createProduct = async (c: Context) => {
  try {
    const body = await c.req.json()
    
    // 1. Insert ke DB
    const [result] = await db.insert(products).values({
      name: body.name,
      sku: body.sku,
      barcode: body.barcode,
      image: body.image,
      price: body.price,
      stock: body.stock
    })

    // 2. Ambil data yang barusan di-insert pakai insertId
    const newProduct = await db.select()
      .from(products)
      .where(eq(products.id, result.insertId))
      .then(res => res[0])

    return c.json({ 
      success: true, 
      message: 'Produk berhasil ditambah',
      data: newProduct 
    }, 201)
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400)
  }
}

// 3. Update produk & Return data terbarunya
export const updateProduct = async (c: Context) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  
  try {
    // 1. Jalankan Update
    await db.update(products)
      .set(body)
      .where(eq(products.id, id))
    
    // 2. Ambil data terbarunya
    const updatedData = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .then(res => res[0])

    if (!updatedData) {
      return c.json({ success: false, message: 'Produk tidak ditemukan' }, 404)
    }

    return c.json({ 
      success: true, 
      message: 'Produk berhasil diupdate',
      data: updatedData 
    })
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400)
  }
}

// 4. Hapus produk
export const deleteProduct = async (c: Context) => {
  const id = Number(c.req.param('id'))
  
  try {
    // 1. Cek dulu apakah barangnya ada
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .then(res => res[0])

    if (!existingProduct) {
      return c.json({ success: false, message: 'Produk tidak ditemukan' }, 404)
    }

    // 2. Jalankan perintah delete
    await db.delete(products)
      .where(eq(products.id, id))
    
    return c.json({ 
      success: true, 
      message: 'Produk berhasil dihapus',
      deletedId: id 
    })
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400)
  }
}