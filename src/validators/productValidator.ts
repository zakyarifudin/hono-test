import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, "Nama produk jangan dikosongin ya bre"),
  sku: z.string().min(1, "SKU wajib diisi buat stok"),
  barcode: z.string().optional(),
  price: z.union([z.string(), z.number()]).refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0, 
    "Harga harus berupa angka dan lebih dari 0"
  ),
  stock: z.number().min(0, "Stok nggak boleh minus"),
  image: z.string().optional()
})