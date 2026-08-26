import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface a clear error instead of a cryptic Supabase failure later on.
  console.error(
    'Thiếu cấu hình Supabase. Hãy tạo file .env (xem .env.example) với ' +
    'VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY, sau đó khởi động lại app.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const PHOTO_BUCKET = 'kitchen-photos'
