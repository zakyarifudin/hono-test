import { zValidator } from '@hono/zod-validator'
import { type Context } from 'hono'

export const validateJSON = (schema: any) => {
  return zValidator('json', schema, (result, c: Context) => {
    if (!result.success) {
      // Kita susun manual error-nya biar gak ribet sama tipe data Hono
      const allErrors: Record<string, string[]> = {}

      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string
        if (!allErrors[path]) {
          allErrors[path] = []
        }
        allErrors[path].push(issue.message)
      })
      
      return c.json({
        success: false,
        message: 'Validasi gagal, cek inputan kamu bre!',
        errors: allErrors 
      }, 400)
    }
  })
}