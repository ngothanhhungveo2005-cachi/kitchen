import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'

export default function UserManagement() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: true })
    if (error) console.error(error.message)
    setProfiles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const changeRole = async (id, role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) {
      alert('Không đổi được quyền: ' + error.message)
      return
    }
    load()
  }

  if (loading) return <div className="loading-center">Đang tải…</div>

  return (
    <div>
      <div className="hint-box">
        Để cấp tài khoản mới cho nhân viên, tạo người dùng trong Supabase Dashboard
        (Authentication → Users → Add user). Tài khoản mới sẽ tự động xuất hiện ở
        đây với quyền "staff" — bạn chỉ cần đổi quyền nếu muốn cấp quyền admin.
      </div>
      {profiles.map((p) => (
        <div className="user-row" key={p.id}>
          <div>
            <div className="user-row-name">{p.full_name || '(chưa đặt tên)'}</div>
            <div className="user-row-email">{p.email}</div>
          </div>
          <select
            className="role-select"
            value={p.role}
            disabled={p.id === user.id}
            onChange={(e) => changeRole(p.id, e.target.value)}
          >
            <option value="staff">Nhân viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>
      ))}
    </div>
  )
}
