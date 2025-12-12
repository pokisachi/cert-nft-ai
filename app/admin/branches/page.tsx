'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [searchResults, setSearchResults] = useState<any[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm({ ...form, address: value })

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    if (value.length > 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`)
          const data = await res.json()
          setSearchResults(data)
        } catch {
          setSearchResults([])
        }
      }, 500)
    } else {
      setSearchResults([])
    }
  }

  const selectAddress = (item: any) => {
    setForm({
      ...form,
      address: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon)
    })
    setSearchResults([])
  }

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
    <main className="p-6 md:p-8 bg-[#F7F8FA] text-slate-800 min-h-[calc(100vh-44px)]">
      <div className="space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold inline-flex items-center gap-2 text-slate-900"><Building2 className="h-5 w-5" />Quản lý chi nhánh</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}

        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input className="md:col-span-2" placeholder="Tên chi nhánh" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="md:col-span-2 relative">
              <Input 
                placeholder="Nhập địa chỉ để tìm kiếm..." 
                value={form.address ?? ''} 
                onChange={handleAddressChange} 
              />
              {searchResults.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-md mt-1 max-h-60 overflow-auto shadow-md">
                  {searchResults.map((item, i) => (
                    <li 
                      key={i} 
                      className="p-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700"
                      onClick={() => selectAddress(item)}
                    >
                      {item.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Input 
              placeholder="Latitude" 
              type="number" 
              value={form.latitude ?? 0} 
              readOnly 
            />
            <Input 
              placeholder="Longitude" 
              type="number" 
              value={form.longitude ?? 0} 
              readOnly 
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={loading}>{editingId ? 'Cập nhật' : 'Thêm mới'}</Button>
            <Button variant="outline" onClick={resetForm}>Làm mới</Button>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2">ID</th>
                  <th className="text-left px-4 py-2">Tên</th>
                  <th className="text-left px-4 py-2">Địa chỉ</th>
                  <th className="text-left px-4 py-2">Lat</th>
                  <th className="text-left px-4 py-2">Lng</th>
                  <th className="text-left px-4 py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{b.id}</td>
                    <td className="px-4 py-2">{b.name}</td>
                    <td className="px-4 py-2 text-slate-600">{b.address}</td>
                    <td className="px-4 py-2 text-slate-600">{b.latitude}</td>
                    <td className="px-4 py-2 text-slate-600">{b.longitude}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setForm(b); setEditingId(b.id) }}>Sửa</Button>
                        <Button variant="destructive" onClick={() => remove(b.id)}>Xóa</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  )
}
