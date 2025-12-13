'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
// Đảm bảo bạn đã định nghĩa type Branch trong lib/branchStore hoặc thay bằng interface trực tiếp ở đây
import { Branch } from '@/lib/branchStore' 
import { Building2, MapPin, Search, Edit, Trash2, CheckCircle2, RefreshCw, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AdminBranchesPage() {
  const router = useRouter()
  const [items, setItems] = useState<Branch[]>([])
  
  // State form chính
  const [form, setForm] = useState<Partial<Branch>>({})
  
  // State hỗ trợ UI
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State cho tìm kiếm địa chỉ
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [apiAddressHint, setApiAddressHint] = useState<string | null>(null) // Lưu tên đường API trả về để hiển thị gợi ý
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Hàm xử lý khi nhập địa chỉ (Auto-complete logic)
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Reset tọa độ và hint khi người dùng gõ mới để tránh sai lệch
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

  // Hàm chọn địa chỉ từ gợi ý (Logic tối ưu: KHÔNG GHI ĐÈ ADDRESS)
  const selectAddress = (item: any) => {
    setForm(prev => ({
      ...prev,
      // address: item.display_name, // <-- DÒNG NÀY ĐÃ BỎ ĐỂ KHÔNG MẤT SỐ NHÀ
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon)
    }))
    setApiAddressHint(item.display_name) // Lưu tên gợi ý để hiển thị Badge
    setSearchResults([]) // Đóng dropdown
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
    setApiAddressHint(null)
  }

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        ...form,
        // Đảm bảo gửi số, nếu rỗng thì gửi 0
        latitude: form.latitude || 0,
        longitude: form.longitude || 0
      }

      if (editingId) {
        const res = await fetch(`/api/admin/branches/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('UPDATE_FAILED')
      } else {
        const res = await fetch('/api/admin/branches', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
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
    if(!confirm("Bạn có chắc muốn xóa chi nhánh này?")) return;
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

  // Helper để fill dữ liệu lên form khi sửa
  const handleEdit = (b: Branch) => {
    setForm(b)
    setEditingId(b.id)
    // Khi sửa, giả định là tọa độ đã khớp với địa chỉ, reset hint
    setApiAddressHint(null) 
    // Scroll lên đầu trang
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Hệ thống Chi nhánh
            </h1>
            <p className="text-sm text-gray-500">Quản lý vị trí và tọa độ các cơ sở đào tạo</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm">
            Lỗi: {error}
          </div>
        )}

        {/* FORM CARD - UI TỐI ƯU */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">
            {editingId ? 'Cập nhật thông tin' : 'Thêm chi nhánh mới'}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tên Chi Nhánh */}
            <div className="lg:col-span-4 space-y-2">
              <label className="text-sm font-medium text-gray-700">Tên chi nhánh</label>
              <Input 
                className="bg-white border-gray-200 focus:ring-blue-500" 
                placeholder="VD: Chi nhánh Quận 1" 
                value={form.name ?? ''} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
              />
            </div>

            {/* Địa chỉ (Smart Input) */}
            <div className="lg:col-span-8 space-y-2">
              <label className="text-sm font-medium text-gray-700">Địa chỉ (Tự động tìm tọa độ)</label>
              <div className="relative">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    className="pl-9 bg-white border-gray-200 focus:ring-blue-500" 
                    placeholder="Nhập số nhà, tên đường, quận..." 
                    value={form.address ?? ''} 
                    onChange={handleAddressChange} 
                  />
                  {/* Loading spinner nhỏ nếu cần */}
                </div>

                {/* Dropdown Gợi ý */}
                {searchResults.length > 0 && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-xl ring-1 ring-black/5">
                    {searchResults.map((item, i) => (
                      <li 
                        key={i} 
                        className="p-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0"
                        onClick={() => selectAddress(item)}
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Badge Trạng thái Tọa độ (Thay cho 2 ô Input xấu xí) */}
              <div className="flex items-center gap-2 mt-2">
                {(form.latitude && form.latitude !== 0) ? (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-md text-xs font-medium border border-green-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Đã ghim vị trí: [{form.latitude?.toFixed(4)}, {form.longitude?.toFixed(4)}]
                    {apiAddressHint && <span className="text-green-600/70 italic ml-1">- Gợi ý bản đồ: {apiAddressHint}</span>}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Hãy nhập địa chỉ cụ thể để hệ thống tự động lấy tọa độ.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-50">
            <Button 
              variant="outline" 
              onClick={resetForm}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button 
              onClick={submit} 
              disabled={loading} 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {loading ? 'Đang xử lý...' : (
                <>
                  {editingId ? <Edit className="h-4 w-4 mr-2"/> : <Plus className="h-4 w-4 mr-2"/>}
                  {editingId ? 'Cập nhật chi nhánh' : 'Lưu chi nhánh'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Danh sách chi nhánh ({items.length})</h3>
            {/* Thanh tìm kiếm bảng nếu muốn thêm sau */}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Tên chi nhánh</th>
                  <th className="px-6 py-4">Địa chỉ</th>
                  <th className="px-6 py-4">Tọa độ</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">
                      Chưa có dữ liệu chi nhánh
                    </td>
                  </tr>
                ) : items.map((b) => (
                  <tr key={b.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{b.name}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-md truncate" title={b.address || ''}>
                      {b.address}
                    </td>
                    <td className="px-6 py-4">
                      {b.latitude ? (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-mono border border-gray-200">
                          {b.latitude.toFixed(3)}, {b.longitude?.toFixed(3)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Chưa có</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleEdit(b)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => remove(b.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  )
}