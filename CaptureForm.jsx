import { useRef, useState } from 'react'
import { supabase, PHOTO_BUCKET } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'

const CATEGORIES = ['Nhận nguyên liệu', 'Lưu mẫu', 'Sơ chế', 'Bảo quản', 'Khác']

export default function CaptureForm({ onSaved }) {
  const { user } = useAuth()
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setCategory(CATEGORIES[0])
    setNote('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Vui lòng chụp hoặc chọn một ảnh trước khi lưu.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('records').insert({
        user_id: user.id,
        image_path: path,
        category,
        note,
      })
      if (insertError) throw insertError

      reset()
      onSaved?.()
    } catch (err) {
      console.error(err)
      setError('Lưu thất bại: ' + (err.message || 'Lỗi không xác định'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="capture-card" onSubmit={handleSubmit}>
      {error && <div className="error-box">{error}</div>}

      <label className="photo-picker">
        {preview ? (
          <img src={preview} alt="Xem trước" className="photo-preview" />
        ) : (
          <span>📷 Chạm để chụp ảnh hoặc chọn từ thư viện</span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
        />
      </label>

      <div className="row-2">
        <div className="field">
          <label htmlFor="category">Loại ghi nhận</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="note">Ghi chú (tên nguyên liệu, NCC…)</label>
          <input id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Thịt bò - Cty ABC" />
        </div>
      </div>

      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? 'Đang lưu…' : 'Lưu ghi nhận'}
      </button>
    </form>
  )
}
