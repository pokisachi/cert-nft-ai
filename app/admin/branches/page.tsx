'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Branch } from '@/lib/branchStore'
import { haversineKm, findNearest } from '@/lib/geo'

export default function AdminBranchesPage() {
  const router = useRouter()
  const [items, setItems] = useState<Branch[]>([])
  const [form, setForm] = useState<Partial<Branch>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/branches', { cache: 'no-store' })
      const data: Branch[] = await res.json()
      setItems(data)
    } catch {
      setError('Không thể tải danh sách chi nhánh')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm({ id: '', name: '', address: '', latitude: 0, longitude: 0 })
    setEditingId(null)
  }

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/branches/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('UPDATE_FAILED')
      } else {
        const res = await fetch('/api/admin/branches', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('CREATE_FAILED')
      }
      await load(); router.refresh(); resetForm()
    } catch {
      setError('Lưu chi nhánh thất bại')
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/branches/${id}`, { method: 'DELETE', cache: 'no-store' })
      if (!res.ok) throw new Error('DELETE_FAILED')
      await load(); router.refresh()
    } catch {
      setError('Xóa chi nhánh thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Quản lý chi nhánh</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="ID" value={form.id ?? ''} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <input className="border rounded px-3 py-2" placeholder="Tên chi nhánh" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Địa chỉ" value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="border rounded px-3 py-2" placeholder="Latitude" type="number" value={form.latitude ?? 0} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} />
          <input className="border rounded px-3 py-2" placeholder="Longitude" type="number" value={form.longitude ?? 0} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} />
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={submit} disabled={loading}>{editingId ? 'Cập nhật' : 'Thêm mới'}</button>
          <button className="px-3 py-2 border rounded" onClick={resetForm}>Làm mới</button>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Tên</th>
              <th className="text-left p-2">Địa chỉ</th>
              <th className="text-left p-2">Lat</th>
              <th className="text-left p-2">Lng</th>
              <th className="text-left p-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="p-2">{b.id}</td>
                <td className="p-2">{b.name}</td>
                <td className="p-2">{b.address}</td>
                <td className="p-2">{b.latitude}</td>
                <td className="p-2">{b.longitude}</td>
                <td className="p-2 flex gap-2">
                  <button className="px-2 py-1 border rounded" onClick={() => { setForm(b); setEditingId(b.id) }}>Sửa</button>
                  <button className="px-2 py-1 border rounded" onClick={() => remove(b.id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
