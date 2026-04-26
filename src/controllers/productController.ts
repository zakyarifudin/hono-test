import { type Context } from 'hono'
import { db } from '../database/index.js'
import { products } from '../database/schema.js'
import { eq, count, like, or } from 'drizzle-orm' // Tambah like & or
import { deleteImage, uploadImage } from '../helpers/uploadHelper.js'

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

export const createProduct = async (c: Context) => {
  try {
    const body = await c.req.json()
    
    // 1. Handle Image (Base64 to Path)
    let finalImagePath = body.image

    if (body.image) {
      // Cek apakah ini format base64 yang valid
      const isBase64 = body.image.startsWith('data:image')
      
      if (isBase64) {
        try {
          finalImagePath = await uploadImage(body.image)
        } catch (uploadError) {
          return c.json({ success: false, message: 'Format gambar tidak didukung atau rusak' }, 400)
        }
      } else if (!body.image.startsWith('http')) {
        // Kalau bukan base64 dan bukan URL, kita anggap format salah
        return c.json({ success: false, message: 'Format image harus Base64 atau URL valid' }, 400)
      }
    }

    // 2. Insert ke DB
    const [result] = await db.insert(products).values({
      name: body.name,
      sku: body.sku,
      barcode: body.barcode,
      image: finalImagePath, // Simpan path hasil upload
      price: body.price,
      stock: body.stock
    })

    // 3. Ambil data ter-update
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
    // Handle error JSON parsing atau DB error
    return c.json({ success: false, message: error.message }, 400)
  }
}



export const updateProduct = async (c: Context) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  
  try {
    // 1. Cari data lama buat referensi gambar lama
    const oldProduct = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .then(res => res[0])

    if (!oldProduct) {
      return c.json({ success: false, message: 'Produk tidak ditemukan' }, 404)
    }

    // 2. Logic Filter Image
    let finalImagePath = oldProduct.image // Default pake yang lama
    
    if (body.image) {
      if (body.image.startsWith('data:image')) {
        // A. Jika Base64: Upload baru & Hapus yang lama
        finalImagePath = await uploadImage(body.image)
        
        // Hapus file lama jika filenya ada (bukan URL luar)
        if (oldProduct.image && oldProduct.image.startsWith('/uploads/')) {
          await deleteImage(oldProduct.image)
        }
      } 
      // B. Jika isinya URL (http...) atau Path sama, biarkan saja
      // C. Jika body.image kosong/undefined, finalImagePath tetep pake oldProduct.image
    }

    // 3. Eksekusi Update
    // Kita susun objek update-nya biar yang kosong nggak ikut ke-update
    const updateData = {
      ...body,
      image: finalImagePath,
      updatedAt: new Date() // Kalau kamu ada kolom updatedAt
    }

    await db.update(products)
      .set(updateData)
      .where(eq(products.id, id))
    
    // 4. Return data terbaru
    const updatedData = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .then(res => res[0])

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
    // 1. Cek dulu apakah barangnya ada (kita butuh path imagenya)
    const existingProduct = await db.select()
      .from(products)
      .where(eq(products.id, id))
      .then(res => res[0])

    if (!existingProduct) {
      return c.json({ success: false, message: 'Produk tidak ditemukan' }, 404)
    }

    // 2. Hapus filenya dari disk jika path-nya mengarah ke folder uploads kita
    // Kita cek startsWith('/uploads/') biar nggak nyoba hapus URL luar (seperti http://...)
    if (existingProduct.image && existingProduct.image.startsWith('/uploads/')) {
      await deleteImage(existingProduct.image)
    }

    // 3. Jalankan perintah delete di Database
    await db.delete(products)
      .where(eq(products.id, id))
    
    return c.json({ 
      success: true, 
      message: 'Produk dan gambar berhasil dihapus',
      deletedId: id 
    })
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400)
  }
}