import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
          'Thieu cau hinh Supabase. Hay tao file .env (xem .env.example) voi ' +
          'VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY, sau do khoi dong lai app.'
        )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
          persistSession: true,
          autoRefreshToken: true,
    },
})

export const PHOTO_BUCKET = 'kitchen-photos'
