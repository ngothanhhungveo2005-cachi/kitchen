import { useEffect, useState, useCallback } from 'react'
import { supabase, PHOTO_BUCKET } from '../lib/supabaseClient'

const CATEGORIES = ['Tất cả', 'Nhận nguyên liệu', 'Lưu mẫu', 'Sơ chế', 'Bảo quản', 'Khác']

function formatStamp(iso) {
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function RecordList({ scope, allowDelete = false }) {
  // scope: { onlyOwn: boolean, userId?: string }
  const [records, setRecords] = useState([])
  const [urls, setUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('Tất cả')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('records')
      .select('id, image_path, category, note, created_at, user_id, profiles(full_name, email)')
      .order('created_at', { ascending: false })

    if (scope?.onlyOwn && scope?.userId) {
      query = query.eq('user_id', scope.userId)
    }
    if (category !== 'Tất cả') {
      query = query.eq('category', category)
    }
    if (dateFrom) {
      query = query.gte('created_at', new Date(dateFrom).toISOString())
    }
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      query = query.lte('created_at', end.toISOString())
    }

    const { data, error } = await query.limit(200)
    if (error) {
      console.error('Lỗi tải danh sách:', error.message)
      setRecords([])
    } else {
      setRecords(data)
      const entries = await Promise.all(
        data.map(async (r) => {
          const { data: signed } = await supabase.storage
            .from(PHOTO_BUCKET)
            .createSignedUrl(r.image_path, 3600)
          return [r.id, signed?.signedUrl]
        })
      )
      setUrls(Object.fromEntries(entries))
    }
    setLoading(false)
  }, [scope?.onlyOwn, scope?.userId, category, dateFrom, dateTo])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (record) => {
    if (!confirm('Xoá ghi nhận này? Hành động không thể hoàn tác.')) return
    await supabase.storage.from(PHOTO_BUCKET).remove([record.image_path])
    await supabase.from('records').delete().eq('id', record.id)
    load()
  }

  return (
    <div>
      <div className="filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="Từ ngày" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="Đến ngày" />
      </div>

      {loading ? (
        <div className="loading-center">Đang tải…</div>
      ) : records.length === 0 ? (
        <div className="empty-state">Chưa có ghi nhận nào phù hợp bộ lọc.</div>
      ) : (
        records.map((r) => (
          <div className="record-card" key={r.id}>
            {urls[r.id] ? (
              <img className="record-thumb" src={urls[r.id]} alt={r.category} />
            ) : (
              <div className="record-thumb" />
            )}
            <div className="record-body">
              <div className="record-top">
                <span className="record-category">{r.category}</span>
                <span className="record-stamp">{formatStamp(r.created_at)}</span>
              </div>
              {r.note && <p className="record-note">{r.note}</p>}
              <div className="record-meta">
                <span>{r.profiles?.full_name || r.profiles?.email || 'Không rõ người ghi nhận'}</span>
                {allowDelete && (
                  <div className="record-actions">
                    <button type="button" onClick={() => handleDelete(r)}>Xoá</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
