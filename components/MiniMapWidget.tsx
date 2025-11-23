'use client'

import { useEffect, useRef, useState } from 'react'
import { haversineKm, findNearest } from '@/lib/geo'

type Branch = {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
}

type LatLng = { latitude: number; longitude: number }

export default function MiniMapWidget() {
  const miniMapRef = useRef<HTMLDivElement | null>(null)
  const bigMapRef = useRef<HTMLDivElement | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [minimized, setMinimized] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])
  const [userLoc, setUserLoc] = useState<LatLng | null>(null)
  const [nearest, setNearest] = useState<{ item: Branch | null; distance: number } | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)

  const LRef = useRef<typeof import('leaflet') | null>(null)
  const miniMapInst = useRef<any>(null)
  const bigMapInst = useRef<any>(null)
  const miniLayerGroup = useRef<any>(null)
  const bigLayerGroup = useRef<any>(null)

  useEffect(() => {
    let ignore = false
    fetch('/api/branches')
      .then((r) => r.json())
      .then((data: Branch[]) => {
        if (!ignore) setBranches(data)
      })
      .catch(() => {})
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
      () => {
        setGeoError('Không thể lấy vị trí của bạn. Vui lòng bật Location.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
    ;(async () => {
      if (!LRef.current) {
        const L = await import('leaflet')
        LRef.current = L
      }
    })()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (userLoc && branches.length) {
      const n = findNearest(userLoc, branches)
      setNearest(n)
    }
  }, [userLoc, branches])

  const renderMarkers = (layerGroup: any) => {
    const L = LRef.current!
    layerGroup.clearLayers()
    if (userLoc) {
      L.circleMarker([userLoc.latitude, userLoc.longitude], {
        radius: 6,
        color: '#16a34a',
        weight: 2,
        fillColor: '#22c55e',
        fillOpacity: 0.6,
      })
        .addTo(layerGroup)
        .bindPopup('Vị trí của bạn')
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
        .addTo(layerGroup)
        .bindPopup(
          `${isNearest ? '⭐ ' : ''}${b.name}<br/>${b.address}` +
            (userLoc
              ? `<br/>Khoảng cách: ${haversineKm(userLoc.latitude, userLoc.longitude, b.latitude, b.longitude).toFixed(2)} km`
              : '')
        )
    })
  }

  // Init mini map once
  useEffect(() => {
    const initMini = async () => {
      const container = miniMapRef.current
      if (!container || miniMapInst.current) return
      const L = LRef.current ?? (await import('leaflet'))
      LRef.current = L
      miniMapInst.current = L.map(container, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      })
      const center = userLoc
        ? [userLoc.latitude, userLoc.longitude]
        : [branches[0]?.latitude ?? 21.028511, branches[0]?.longitude ?? 105.804817]
      miniMapInst.current.setView(center as any, 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(miniMapInst.current)
      miniLayerGroup.current = L.layerGroup().addTo(miniMapInst.current)
      renderMarkers(miniLayerGroup.current)
      setTimeout(() => {
        try { miniMapInst.current?.invalidateSize() } catch {}
      }, 0)
    }
    if (!minimized) {
      initMini()
    } else {
      if (miniMapInst.current) {
        try { miniMapInst.current.remove() } catch {}
        miniMapInst.current = null
        miniLayerGroup.current = null
      }
    }
    return () => {
      // clean on unmount
      if (miniMapInst.current) {
        try { miniMapInst.current.remove() } catch {}
        miniMapInst.current = null
        miniLayerGroup.current = null
      }
    }
  }, [minimized])

  // Re-render markers when data changes
  useEffect(() => {
    if (miniLayerGroup.current) renderMarkers(miniLayerGroup.current)
    if (bigLayerGroup.current) renderMarkers(bigLayerGroup.current)
  }, [branches, userLoc, nearest])

  // Recenter maps when user location updates
  useEffect(() => {
    if (userLoc) {
      try {
        if (miniMapInst.current) miniMapInst.current.setView([userLoc.latitude, userLoc.longitude], 11)
        if (bigMapInst.current) bigMapInst.current.setView([userLoc.latitude, userLoc.longitude], 13)
      } catch {}
    }
  }, [userLoc])

  // Ensure Leaflet recalculates size when showing mini map after minimized
  useEffect(() => {
    if (!minimized && miniMapInst.current) {
      try {
        miniMapInst.current.invalidateSize()
      } catch {}
    }
  }, [minimized])

  // Init/cleanup big map on expand toggle
  useEffect(() => {
    const manageBig = async () => {
      const L = LRef.current ?? (await import('leaflet'))
      LRef.current = L
      if (expanded) {
        const container = bigMapRef.current
        if (!container || bigMapInst.current) return
        bigMapInst.current = L.map(container, {
          zoomControl: true,
          attributionControl: true,
        })
        const center = userLoc
          ? [userLoc.latitude, userLoc.longitude]
          : [branches[0]?.latitude ?? 21.028511, branches[0]?.longitude ?? 105.804817]
        bigMapInst.current.setView(center as any, 13)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(bigMapInst.current)
        bigLayerGroup.current = L.layerGroup().addTo(bigMapInst.current)
        renderMarkers(bigLayerGroup.current)
        setTimeout(() => {
          try {
            bigMapInst.current.invalidateSize()
          } catch {}
        }, 0)
      } else {
        if (bigMapInst.current) {
          try {
            bigMapInst.current.remove()
          } catch {}
          bigMapInst.current = null
          bigLayerGroup.current = null
        }
      }
    }
    manageBig()
  }, [expanded])

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {minimized ? (
        <button
          className="px-3 py-2 rounded-full shadow-lg bg-[#1c1f27] border border-[#3b4354] text-white text-sm"
          onClick={() => {
            if (!userLoc) {
              navigator.geolocation.getCurrentPosition(
                (pos) => setUserLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => setGeoError('Không thể lấy vị trí của bạn. Vui lòng bật Location.'),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
              )
            } else {
              setMinimized(false)
            }
          }}
          aria-label="Hiển thị gợi ý chi nhánh gần nhất"
        >
          {userLoc && nearest?.item
            ? `Chi nhánh gần bạn nhất là: ${nearest.item.name} – ${nearest.distance.toFixed(2)} km`
            : 'Hãy bật vị trí để thấy chi nhánh gần bạn'}
        </button>
      ) : (
        <div className="bg-[#1c1f27] text-white rounded-lg shadow-lg border border-[#3b4354] overflow-hidden max-w-[90vw]">
          <div className="flex items-center justify-between px-2 py-1 border-b border-[#3b4354]">
            <div className="text-sm font-medium">Mini Map</div>
            <div className="flex items-center gap-2">
              <button className="text-xs px-2 py-1 border border-[#3b4354] rounded hover:bg-[#282d39]" onClick={() => setExpanded(true)}>Mở rộng</button>
              <button className="text-xs px-2 py-1 border border-[#3b4354] rounded hover:bg-[#282d39]" onClick={() => setMinimized(true)}>Thu nhỏ</button>
            </div>
          </div>
          <div className="relative">
            <div
              ref={miniMapRef}
              className="w-[220px] h-[220px]"
            />
            {nearest?.item && (
              <div className="absolute left-2 bottom-2 bg-[#1c1f27]/90 text-white text-xs rounded px-2 py-1 shadow border border-[#3b4354]">
                Chi nhánh gần bạn nhất là: {nearest.item.name} – {nearest.distance.toFixed(2)} km
              </div>
            )}
          </div>
        </div>
      )}

      {expanded && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setExpanded(false)}>
          <div className="bg-[#1c1f27] text-white rounded-lg shadow-xl border border-[#3b4354] w-[80vw] h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#3b4354]">
              <div className="font-semibold">Bản đồ chi tiết</div>
              <button className="text-sm px-3 py-1 border border-[#3b4354] rounded hover:bg-[#282d39]" onClick={() => setExpanded(false)}>Đóng</button>
            </div>
            <div ref={bigMapRef} className="w-full h-[calc(80vh-44px)]" />
          </div>
        </div>
      )}
    </div>
  )
}
