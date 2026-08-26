import { useState } from 'react'
import { useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import CaptureForm from './components/CaptureForm'
import RecordList from './components/RecordList'
import UserManagement from './components/UserManagement'

export default function App() {
  const { session, profile, isAdmin, loading, signOut } = useAuth()
  const [tab, setTab] = useState('capture')
  const [refreshKey, setRefreshKey] = useState(0)

  if (loading) {
    return <div className="loading-center">Đang tải…</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="stamp-dot" />
          Nhật Ký Bếp
        </div>
        <div className="topbar-user">
          <span className="role-pill">{isAdmin ? 'Admin' : 'Nhân viên'}</span>
          <button className="btn-ghost" onClick={signOut}>Đăng xuất</button>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab-btn ${tab === 'capture' ? 'active' : ''}`}
          onClick={() => setTab('capture')}
        >
          Ghi nhận mới
        </button>
        <button
          className={`tab-btn ${tab === 'mine' ? 'active' : ''}`}
          onClick={() => setTab('mine')}
        >
          Ghi nhận của tôi
        </button>
        {isAdmin && (
          <>
            <button
              className={`tab-btn ${tab === 'all' ? 'active' : ''}`}
              onClick={() => setTab('all')}
            >
              Toàn bộ dữ liệu
            </button>
            <button
              className={`tab-btn ${tab === 'users' ? 'active' : ''}`}
              onClick={() => setTab('users')}
            >
              Quản lý tài khoản
            </button>
          </>
        )}
      </nav>

      <main className="main">
        {tab === 'capture' && (
          <>
            <div className="section-head">
              <h1 className="section-title">Chụp &amp; ghi nhận</h1>
              <span className="section-sub">{profile?.full_name || profile?.email}</span>
            </div>
            <CaptureForm onSaved={() => { setRefreshKey((k) => k + 1); setTab('mine') }} />
          </>
        )}

        {tab === 'mine' && (
          <>
            <div className="section-head">
              <h1 className="section-title">Ghi nhận của tôi</h1>
            </div>
            <RecordList key={`mine-${refreshKey}`} scope={{ onlyOwn: true, userId: session.user.id }} />
          </>
        )}

        {tab === 'all' && isAdmin && (
          <>
            <div className="section-head">
              <h1 className="section-title">Toàn bộ dữ liệu bếp</h1>
              <span className="section-sub">Xem &amp; quản lý mọi ghi nhận</span>
            </div>
            <RecordList key={`all-${refreshKey}`} scope={{ onlyOwn: false }} allowDelete />
          </>
        )}

        {tab === 'users' && isAdmin && (
          <>
            <div className="section-head">
              <h1 className="section-title">Quản lý tài khoản</h1>
            </div>
            <UserManagement />
          </>
        )}
      </main>
    </div>
  )
}
