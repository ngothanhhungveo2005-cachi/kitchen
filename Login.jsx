import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Sai email hoặc mật khẩu. Vui lòng thử lại.')
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-mark">Nhật ký bếp</div>
        <h1 className="login-title">Đăng nhập</h1>
        <p className="login-sub">Ghi nhận nguyên liệu &amp; lưu mẫu bằng ảnh, đồng bộ tức thì.</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#948E7D', marginTop: 18, textAlign: 'center' }}>
          Chưa có tài khoản? Liên hệ quản trị viên để được cấp.
        </p>
      </div>
    </div>
  )
}
