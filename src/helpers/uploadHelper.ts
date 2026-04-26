// src/services/uploadService.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

export const uploadImage = async (base64String: string): Promise<string> => {
  // 1. Deteksi extension (png, jpg, webp, dll)
  const mimeType = base64String.match(/[^://]\w+(?=[;|,])/)?.[0] || 'jpg';
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  
  // 2. Siapkan path
  const fileName = `${uuidv4()}.${mimeType}`;
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  // 3. Pastikan folder uploads ada (biar gak error kalau belum dibuat manual)
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, fileName);
  
  // 4. Tulis file
  await fs.writeFile(filePath, base64Data, 'base64');
  
  return `/uploads/${fileName}`;
};

export const deleteImage = async (imagePath: string) => {
  try {
    // imagePath biasanya: /uploads/namafile.jpg
    const fullPath = path.join(process.cwd(), 'public', imagePath)
    await fs.unlink(fullPath)
  } catch (err) {
    console.error('Gagal hapus gambar lama:', err)
    // Kita nggak throw error biar proses update utama tetep jalan
  }
}