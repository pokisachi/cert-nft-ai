'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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
  const userLocRef = useRef<LatLng | null>(null)

  const LRef = useRef<typeof import('leaflet') | null>(null)
  const miniMapInst = useRef<any>(null)
  const bigMapInst = useRef<any>(null)
  const miniLayerGroup = useRef<any>(null)
  const bigLayerGroup = useRef<any>(null)
  const miniCarMarker = useRef<any>(null)
  const miniRouteLayer = useRef<any>(null)
  const bigRouteLayer = useRef<any>(null)
  const [routeGeometry, setRouteGeometry] = useState<any>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null)
  const [isRouting, setIsRouting] = useState(false)
  const [targetBranch, setTargetBranch] = useState<Branch | null>(null)
  const routingSeqRef = useRef(0)
  const geoWatchIdRef = useRef<number | null>(null)
  const bestAccuracyRef = useRef<number>(Number.POSITIVE_INFINITY)
  const autoTargetRef = useRef(true)

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
    const onSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude
      const acc = typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : Number.POSITIVE_INFINITY
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return
      if (Math.abs(lat) < 0.0001 && Math.abs(lon) < 0.0001) return
      if (acc >= bestAccuracyRef.current && bestAccuracyRef.current !== Number.POSITIVE_INFINITY && userLocRef.current) return
      bestAccuracyRef.current = acc
      const loc = { latitude: lat, longitude: lon }
      setUserLoc(loc)
      userLocRef.current = loc
      setGeoError(null)
      try { localStorage.setItem('userLoc', JSON.stringify(loc)) } catch {}
    }
    const tryIpFallback = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        const lat = Number(data?.latitude)
        const lon = Number(data?.longitude)
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const loc = { latitude: lat, longitude: lon }
          setUserLoc(loc)
          userLocRef.current = loc
          setGeoError(null)
          try { localStorage.setItem('userLoc', JSON.stringify(loc)) } catch {}
        }
      } catch {}
    }
    try {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        () => {
          setGeoError('Không thể lấy vị trí của bạn. Vui lòng bật Location.')
          try {
            navigator.geolocation.getCurrentPosition(
              onSuccess,
              () => {},
              { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
            )
          } catch {}
          tryIpFallback()
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
      try {
        geoWatchIdRef.current = navigator.geolocation.watchPosition(
          onSuccess,
          () => {},
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        )
      } catch {}
      setTimeout(() => { if (!userLocRef.current) tryIpFallback() }, 5000)
    } catch {}
    ;(async () => {
      if (!LRef.current) {
        const L = await import('leaflet')
        LRef.current = L
      }
    })()
    return () => {
      ignore = true
      if (geoWatchIdRef.current != null) {
        try { navigator.geolocation.clearWatch(geoWatchIdRef.current) } catch {}
        geoWatchIdRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (userLoc && branches.length) {
      const n = findNearest(userLoc, branches)
      setNearest(n)
      if (autoTargetRef.current && n?.item) setTargetBranch(n.item)
    }
  }, [userLoc, branches])

  const renderMarkers = useCallback((layerGroup: any) => {
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
      const mk = L.circleMarker([b.latitude, b.longitude], {
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
      try { mk.on('click', () => { autoTargetRef.current = false; setTargetBranch(b) }) } catch {}
    })
  }, [branches, userLoc, nearest])

  const redrawRoute = useCallback(() => {
    const L = LRef.current
    if (!L) return
    try { miniRouteLayer.current?.remove() } catch {}
    miniRouteLayer.current = null
    try { bigRouteLayer.current?.remove() } catch {}
    bigRouteLayer.current = null
    if (routeGeometry) {
      try {
        if (miniMapInst.current) {
          const outline = L.geoJSON(routeGeometry, { style: { color: 'white', weight: 6, opacity: 0.9 } })
          const main = L.geoJSON(routeGeometry, { style: { color: '#4285F4', weight: 4, opacity: 1 } })
          const layers: any[] = [outline, main]
          try {
            const coords = (routeGeometry as any)?.coordinates
            if (routeInfo && Array.isArray(coords) && coords.length) {
              const mid = coords[Math.floor(coords.length / 2)]
              const midPoint: [number, number] = [mid[1], mid[0]]
              const bubbleIcon = L.divIcon({
                className: 'route-info-bubble',
                html: `<div style="background: white; padding: 3px 6px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid #ccc; font-family: sans-serif; text-align: center; min-width: 60px; transform: translate(-50%, -50%); white-space: nowrap;">
                        <div style="font-weight: bold; color: #202124; font-size: 12px; line-height: 1.2;">${Math.round(routeInfo.duration/60)} phút</div>
                        <div style="font-size: 11px; color: #5f6368;">${(routeInfo.distance/1000).toFixed(1)} km</div>
                      </div>`,
                iconSize: [0,0],
                iconAnchor: [0,0]
              })
              layers.push(L.marker(midPoint, { icon: bubbleIcon, interactive: false }))
            }
          } catch {}
          miniRouteLayer.current = L.layerGroup(layers).addTo(miniMapInst.current)
          try { miniMapInst.current.fitBounds(main.getBounds(), { padding: [10, 10], animate: false }) } catch {}
        }
        if (bigMapInst.current) {
          const outline2 = L.geoJSON(routeGeometry, { style: { color: 'white', weight: 8, opacity: 0.9 } })
          const main2 = L.geoJSON(routeGeometry, { style: { color: '#4285F4', weight: 5, opacity: 1 } })
          const layers2: any[] = [outline2, main2]
          try {
            const coords2 = (routeGeometry as any)?.coordinates
            if (routeInfo && Array.isArray(coords2) && coords2.length) {
              const mid2 = coords2[Math.floor(coords2.length / 2)]
              const midPoint2: [number, number] = [mid2[1], mid2[0]]
              const bubbleIcon2 = L.divIcon({
                className: 'route-info-bubble',
                html: `<div style="background: white; padding: 4px 8px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid #ccc; font-family: sans-serif; text-align: center; min-width: 80px; transform: translate(-50%, -50%); white-space: nowrap;">
                        <div style="font-weight: bold; color: #202124; font-size: 14px; line-height: 1.2;">${Math.round(routeInfo.duration/60)} phút</div>
                        <div style="font-size: 12px; color: #5f6368;">${(routeInfo.distance/1000).toFixed(1)} km</div>
                      </div>`,
                iconSize: [0,0],
                iconAnchor: [0,0]
              })
              layers2.push(L.marker(midPoint2, { icon: bubbleIcon2, interactive: false }))
            }
          } catch {}
          bigRouteLayer.current = L.layerGroup(layers2).addTo(bigMapInst.current)
          try { bigMapInst.current.fitBounds(main2.getBounds(), { padding: [40, 40], animate: false }) } catch {}
        }
      } catch {}
      return
    }
    if (userLoc && targetBranch) {
      try {
        const latlngs = [
          [userLoc.latitude, userLoc.longitude],
          [targetBranch.latitude, targetBranch.longitude],
        ] as [number, number][]
        if (miniMapInst.current) {
          const pl = L.polyline(latlngs, { color: '#999', dashArray: '5, 10', weight: 3 })
          miniRouteLayer.current = L.layerGroup([pl]).addTo(miniMapInst.current)
          try { miniMapInst.current.fitBounds(pl.getBounds(), { padding: [10, 10], animate: false }) } catch {}
        }
        if (bigMapInst.current) {
          const pl2 = L.polyline(latlngs, { color: '#999', dashArray: '5, 10', weight: 3 })
          bigRouteLayer.current = L.layerGroup([pl2]).addTo(bigMapInst.current)
          try { bigMapInst.current.fitBounds(pl2.getBounds(), { padding: [40, 40], animate: false }) } catch {}
        }
      } catch {}
    }
  }, [routeGeometry, routeInfo, userLoc, targetBranch])

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
        zoomAnimation: false,
      })
      const center = userLoc
        ? [userLoc.latitude, userLoc.longitude]
        : [branches[0]?.latitude ?? 21.028511, branches[0]?.longitude ?? 105.804817]
      miniMapInst.current.setView(center as any, 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(miniMapInst.current)
      miniLayerGroup.current = L.layerGroup().addTo(miniMapInst.current)
      renderMarkers(miniLayerGroup.current)
      setTimeout(() => {
        try { if (miniMapInst.current) miniMapInst.current.invalidateSize() } catch {}
      }, 0)
      redrawRoute()
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
  }, [minimized, userLoc, branches, renderMarkers, redrawRoute])

  // Re-render markers when data changes
  useEffect(() => {
    if (miniLayerGroup.current) renderMarkers(miniLayerGroup.current)
    if (bigLayerGroup.current) renderMarkers(bigLayerGroup.current)
  }, [branches, userLoc, nearest, renderMarkers])

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

  useEffect(() => {
    if (minimized || !miniMapInst.current || !miniLayerGroup.current || !userLoc || !nearest?.item) return
    const L = LRef.current!
    const start = L.latLng(userLoc.latitude, userLoc.longitude)
    const end = L.latLng(nearest.item.latitude, nearest.item.longitude)
    const carIcon = L.divIcon({ className: 'mini-car-icon', html: '<div style="font-size:14px">🚗</div>', iconSize: [14,14], iconAnchor: [7,7] })
    miniCarMarker.current = L.marker(start, { icon: carIcon }).addTo(miniLayerGroup.current)
    let i = 0
    const steps = 60
    const t = setInterval(() => {
      i = (i + 1) % (steps + 1)
      const lat = start.lat + (end.lat - start.lat) * (i / steps)
      const lng = start.lng + (end.lng - start.lng) * (i / steps)
      try { miniCarMarker.current?.setLatLng([lat, lng]) } catch {}
    }, 120)
    return () => {
      clearInterval(t)
      if (miniCarMarker.current) { try { miniCarMarker.current.remove() } catch {} ; miniCarMarker.current = null }
    }
  }, [minimized, userLoc, nearest])

  // Fetch route for targetBranch (seq-latest, không AbortController để tránh hủy khi toggle UI)
  useEffect(() => {
    if (!userLoc || !targetBranch) { setRouteGeometry(null); setRouteInfo(null); return }
    const run = async () => {
      setIsRouting(true)
      routingSeqRef.current += 1
      const seq = routingSeqRef.current
      try {
        const start = `${userLoc.longitude},${userLoc.latitude}`
        const end = `${targetBranch.longitude},${targetBranch.latitude}`
        const res = await fetch(`/api/routing?start=${start}&end=${end}`, { cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (seq === routingSeqRef.current && data && data.code === 'Ok' && data.routes && data.routes[0]) {
          setRouteGeometry(data.routes[0].geometry)
          setRouteInfo({ distance: data.routes[0].distance, duration: data.routes[0].duration })
        } else {
          if (seq === routingSeqRef.current) {
            setRouteGeometry(null)
            setRouteInfo(null)
          }
        }
      } catch {
        if (seq === routingSeqRef.current) {
          setRouteGeometry(null)
          setRouteInfo(null)
        }
      } finally {
        setIsRouting(false)
      }
    }
    const timer = setTimeout(run, 150)
    return () => { clearTimeout(timer) }
  }, [userLoc, targetBranch])

  
  useEffect(() => { redrawRoute() }, [redrawRoute])

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
          zoomAnimation: false,
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
            if (bigMapInst.current) bigMapInst.current.invalidateSize()
          } catch {}
        }, 0)
        redrawRoute()
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
  }, [expanded, userLoc, branches, renderMarkers, redrawRoute])

  // Khi mở mini hoặc big map, tự động chọn chi nhánh gần nhất và tính route
  useEffect(() => {
    if ((expanded || !minimized) && userLoc && branches.length) {
      const n = findNearest(userLoc, branches)
      setNearest(n)
      if (n?.item) setTargetBranch(n.item)
    }
  }, [expanded, minimized, userLoc, branches])

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!expanded && minimized ? (
        <>
        <button
          className="px-3 py-2 rounded-full shadow-lg bg-white border border-slate-300 text-slate-800 text-sm"
          onClick={() => {
            if (!userLoc) {
              navigator.geolocation.getCurrentPosition(
                (pos) => { setUserLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setGeoError(null) },
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
        {geoError && !userLoc && (
          <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
            {geoError}
          </div>
        )}
        </>
      ) : (!expanded && (
        <div className="bg-white text-slate-800 rounded-lg shadow-lg border border-slate-200 overflow-hidden max-w-[90vw]">
          <div className="flex items-center justify-between px-2 py-1 border-b border-slate-200">
            <div className="text-sm font-medium">Mini Map</div>
            <div className="flex items-center gap-2">
              <button className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-100" onClick={() => { setExpanded(true); setMinimized(true) }}>Mở rộng</button>
              <button className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-100" onClick={() => setMinimized(true)}>Thu nhỏ</button>
            </div>
          </div>
          <div className="relative">
            <div
              ref={miniMapRef}
              className="w-[220px] h-[220px]"
            />
            {isRouting && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-[500] pointer-events-none">
                <div className="bg-white text-gray-800 px-3 py-2 rounded shadow border text-xs flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><circle cx="12" cy="12" r="10"/></svg>
                  Đang tính đường đi…
                </div>
              </div>
            )}
            {nearest?.item && (
              <div className="absolute left-2 bottom-2 bg-white/95 text-slate-800 text-xs rounded px-2 py-1 shadow border border-slate-300">
                Chi nhánh gần bạn nhất là: {nearest.item.name} – {nearest.distance.toFixed(2)} km
              </div>
            )}
          </div>
        </div>
      ))}

      {expanded && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setExpanded(false)}>
          <div className="bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 w-[80vw] h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
              <div className="font-semibold">Bản đồ chi tiết</div>
              <button className="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-100" onClick={() => setExpanded(false)}>Đóng</button>
            </div>
            <div className="relative">
              <div ref={bigMapRef} className="w-full h-[calc(80vh-44px)]" />
              {isRouting && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-[500] pointer-events-none">
                  <div className="bg-white text-gray-800 px-4 py-3 rounded shadow border text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><circle cx="12" cy="12" r="10"/></svg>
                    Đang tính đường đi…
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
