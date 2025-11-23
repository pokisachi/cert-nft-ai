'use client'

import { useEffect, useRef, useState } from 'react'
import type { Branch } from '@/lib/branchStore'
import { haversineKm, findNearest } from '@/lib/geo'

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null)
  const [nearest, setNearest] = useState<{ item: Branch | null; distance: number } | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)
  const mapInst = useRef<any>(null)
  const layerGroup = useRef<any>(null)

  useEffect(() => {
    fetch('/api/branches').then(r => r.json()).then((data: Branch[]) => setBranches(data))
    try {
      const cached = localStorage.getItem('userLoc')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          setUserLoc(parsed)
        }
      }
    } catch {}
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        setUserLoc(loc)
        try { localStorage.setItem('userLoc', JSON.stringify(loc)) } catch {}
      },
      () => setGeoError('Vui lòng bật Location để gợi ý chi nhánh gần bạn'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
    ;(async () => {
      const L = await import('leaflet');
      LRef.current = L
    })()
  }, [])

  useEffect(() => {
    if (userLoc && branches.length) setNearest(findNearest(userLoc, branches))
  }, [userLoc, branches])

  const renderMarkers = () => {
    const L = LRef.current!
    layerGroup.current.clearLayers()
    if (userLoc) {
      L.circleMarker([userLoc.latitude, userLoc.longitude], { radius: 6, color: '#16a34a', weight: 2, fillColor: '#22c55e', fillOpacity: 0.6 })
        .addTo(layerGroup.current).bindPopup('Vị trí của bạn')
    }
    branches.forEach((b) => {
      const isNearest = nearest?.item?.id === b.id
      L.circleMarker([b.latitude, b.longitude], {
        radius: isNearest ? 8 : 6,
        color: isNearest ? '#ef4444' : '#2563eb',
        weight: isNearest ? 3 : 2,
        fillColor: isNearest ? '#f87171' : '#60a5fa',
        fillOpacity: 0.7,
      })
        .addTo(layerGroup.current)
        .bindPopup(
          `${isNearest ? '⭐ ' : ''}${b.name}<br/>${b.address}` + (userLoc ? `<br/>Khoảng cách: ${haversineKm(userLoc.latitude, userLoc.longitude, b.latitude, b.longitude).toFixed(2)} km` : '')
        )
    })
  }

  useEffect(() => {
    const init = async () => {
      const L = LRef.current ?? (await import('leaflet'))
      LRef.current = L
      const container = mapRef.current
      if (!container || mapInst.current) return
      mapInst.current = L.map(container)
      const center = userLoc ? [userLoc.latitude, userLoc.longitude] : [branches[0]?.latitude ?? 21.028511, branches[0]?.longitude ?? 105.804817]
      mapInst.current.setView(center as any, 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapInst.current)
      layerGroup.current = L.layerGroup().addTo(mapInst.current)
      renderMarkers()
      setTimeout(() => { try { mapInst.current.invalidateSize() } catch {} }, 0)
    }
    init()
    return () => { if (mapInst.current) { try { mapInst.current.remove() } catch {}; mapInst.current = null; layerGroup.current = null } }
  }, [])

  useEffect(() => { if (layerGroup.current) renderMarkers() }, [branches, userLoc, nearest])

  // Recenter to user location when available
  useEffect(() => {
    if (userLoc && mapInst.current) {
      try { mapInst.current.setView([userLoc.latitude, userLoc.longitude], 12) } catch {}
    }
  }, [userLoc])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-[#111318] text-white">
      <h1 className="text-2xl font-semibold">Danh sách chi nhánh</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1c1f27] rounded-lg border border-[#3b4354]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#3b4354] bg-[#282d39]">
                <th className="text-left p-2">Tên</th>
                <th className="text-left p-2">Địa chỉ</th>
                <th className="text-left p-2">Khoảng cách</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="border-b border-[#3b4354]">
                  <td className="p-2">{b.name}</td>
                  <td className="p-2">{b.address}</td>
                  <td className="p-2">{userLoc ? `${haversineKm(userLoc.latitude, userLoc.longitude, b.latitude, b.longitude).toFixed(2)} km` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-[#1c1f27] rounded-lg border border-[#3b4354] p-2">
          <div ref={mapRef} className="w-full h-[60vh]" />
          <div className="text-sm mt-2">
            {nearest?.item ? (
              <div>Chi nhánh gần bạn nhất là: <span className="font-semibold">{nearest.item.name}</span> – {nearest.distance.toFixed(2)} km</div>
            ) : (
              <div>{geoError ?? 'Đang xác định vị trí…'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
