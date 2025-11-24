'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Branch } from '@/lib/branchStore'
import { Building2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
    <main className="p-6 bg-[#111318] text-white min-h-[calc(100vh-64px)]">
      <div className="space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold inline-flex items-center gap-2"><Building2 className="h-5 w-5" />Quản lý chi nhánh</h1>
        {error && <div className="text-red-400 text-sm">{error}</div>}

        <Card variant="dark" className="p-4 space-y-3 border-[#3b4354]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input className="border border-[#3b4354] bg-[#12151b] text-white" placeholder="ID" value={form.id ?? ''} onChange={(e) => setForm({ ...form, id: e.target.value })} />
            <Input className="border border-[#3b4354] bg-[#12151b] text-white" placeholder="Tên chi nhánh" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input className="md:col-span-2 border border-[#3b4354] bg-[#12151b] text-white" placeholder="Địa chỉ" value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input className="border border-[#3b4354] bg-[#12151b] text-white" placeholder="Latitude" type="number" value={form.latitude ?? 0} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} />
            <Input className="border border-[#3b4354] bg-[#12151b] text-white" placeholder="Longitude" type="number" value={form.longitude ?? 0} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={loading} className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">{editingId ? 'Cập nhật' : 'Thêm mới'}</Button>
            <Button variant="outline" className="border-[#3b4354] text-white" onClick={resetForm}>Làm mới</Button>
          </div>
        </Card>

        <Card variant="dark" className="border-[#3b4354]">
          <table className="min-w-full text-sm bg-[#1c1f27] text-white">
            <thead>
              <tr className="bg-[#232734]">
                <th className="text-left p-3 border-b border-[#3b4354]">ID</th>
                <th className="text-left p-3 border-b border-[#3b4354]">Tên</th>
                <th className="text-left p-3 border-b border-[#3b4354]">Địa chỉ</th>
                <th className="text-left p-3 border-b border-[#3b4354]">Lat</th>
                <th className="text-left p-3 border-b border-[#3b4354]">Lng</th>
                <th className="text-left p-3 border-b border-[#3b4354]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-t border-[#2b3040] hover:bg-[#242833]">
                  <td className="p-3">{b.id}</td>
                  <td className="p-3">{b.name}</td>
                  <td className="p-3 text-[#9da6b9]">{b.address}</td>
                  <td className="p-3 text-[#9da6b9]">{b.latitude}</td>
                  <td className="p-3 text-[#9da6b9]">{b.longitude}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button variant="outline" className="border-[#3b4354] text-white" onClick={() => { setForm(b); setEditingId(b.id) }}>Sửa</Button>
                      <Button variant="destructive" onClick={() => remove(b.id)}>Xóa</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </main>
  )
}
