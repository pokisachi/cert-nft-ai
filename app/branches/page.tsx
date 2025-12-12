'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Branch } from '@/lib/branchStore'
import { haversineKm, findNearest } from '@/lib/geo'

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null)
  const userLocRef = useRef<{ latitude: number; longitude: number } | null>(null)
  const [nearest, setNearest] = useState<{ item: Branch | null; distance: number } | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [geoError, setGeoError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)
  const mapInst = useRef<any>(null)
  const layerGroup = useRef<any>(null)
  const routeLayer = useRef<any>(null)

  const [routeGeometry, setRouteGeometry] = useState<any>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null)
  const [branchDistances, setBranchDistances] = useState<Record<string, { distance: number; duration: number }>>({})
  const [isRouting, setIsRouting] = useState(false)
  const routingSeqRef = useRef(0)

  useEffect(() => {
    fetch('/api/branches').then(r => r.json()).then((data: Branch[]) => setBranches(data))
    try {
      const cached = localStorage.getItem('userLoc')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          setUserLoc(parsed)
          userLocRef.current = parsed
        }
      }
    } catch {}
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        setUserLoc(loc)
        userLocRef.current = loc
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

  // Fetch driving distances for all branches when userLoc changes
  // DISABLED to prevent OSRM Rate Limiting (429) which breaks the main routing feature
  /*
  useEffect(() => {
    if (!userLoc || branches.length === 0) return

    const fetchAllDistances = async () => {
      // ... (batch fetch logic disabled)
    }
    // ...
  }, [userLoc, branches, selectedBranch])
  */

  useEffect(() => {
    if (userLoc && branches.length) {
      const near = findNearest(userLoc, branches)
      setNearest(near)
      if (!selectedBranch && near?.item) {
        setSelectedBranch(near.item)
      }
    }
  }, [userLoc, branches, selectedBranch])

  // Fetch route when userLoc or selectedBranch changes
  useEffect(() => {
    if (!userLoc || !selectedBranch) {
        setRouteGeometry(null)
        setRouteInfo(null)
        return
    }
    
    const fetchRoute = async () => {
        setIsRouting(true)
        routingSeqRef.current += 1
        const seq = routingSeqRef.current
        try {
            // Call local proxy API to avoid CORS issues
            const start = `${userLoc.longitude},${userLoc.latitude}`;
            const end = `${selectedBranch.longitude},${selectedBranch.latitude}`;
            const res = await fetch(`/api/routing?start=${start}&end=${end}`, { cache: 'no-store' })
            
            if (!res.ok) {
               throw new Error(`Routing API Error: ${res.statusText}`)
            }

            const data = await res.json()
            if (seq === routingSeqRef.current && data.code === 'Ok' && data.routes && data.routes.length > 0) {
                setRouteGeometry(data.routes[0].geometry)
                setRouteInfo({ distance: data.routes[0].distance, duration: data.routes[0].duration })
            } else {
                // Keep silent and fallback to straight line
                if (seq === routingSeqRef.current) {
                  setRouteGeometry(null)
                  setRouteInfo(null)
                }
            }
        } catch (e) {
            console.error('Routing failed:', e)
            if (seq === routingSeqRef.current) {
              setRouteGeometry(null)
              setRouteInfo(null)
            }
        } finally {
            setIsRouting(false)
        }
    }

    // Debounce slightly to avoid rapid switching
    const timer = setTimeout(fetchRoute, 150)
    return () => { clearTimeout(timer) }
  }, [userLoc, selectedBranch])

  const filteredBranches = branches
    .filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const da = branchDistances[a.id]?.distance ?? (haversineKm(userLoc?.latitude ?? a.latitude, userLoc?.longitude ?? a.longitude, a.latitude, a.longitude) * 1000)
      const db = branchDistances[b.id]?.distance ?? (haversineKm(userLoc?.latitude ?? b.latitude, userLoc?.longitude ?? b.longitude, b.latitude, b.longitude) * 1000)
      return da - db
    })

  const renderMarkers: () => void = useCallback(() => {
    const L = LRef.current!
    if (!layerGroup.current) return
    layerGroup.current.clearLayers()
    if (routeLayer.current) {
        routeLayer.current.remove()
        routeLayer.current = null
    }

    // Custom Icons
    const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: `<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    })

    const branchIcon = (isSelected: boolean) => L.divIcon({
        className: 'custom-branch-icon',
        html: `<div style="background-color: ${isSelected ? '#EA4335' : '#FBBC04'}; width: ${isSelected ? 24 : 20}px; height: ${isSelected ? 24 : 20}px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%; transform: rotate(45deg);"></div>
               </div>`,
        iconSize: isSelected ? [30, 30] : [24, 24],
        iconAnchor: isSelected ? [15, 30] : [12, 24],
        popupAnchor: [0, -30]
    })

    if (userLoc) {
      L.marker([userLoc.latitude, userLoc.longitude], { icon: userIcon })
        .addTo(layerGroup.current).bindPopup('Vị trí của bạn')
    }
    branches.forEach((b) => {
      const isSelected = selectedBranch?.id === b.id
      
      
      const marker = L.marker([b.latitude, b.longitude], {
        icon: branchIcon(isSelected)
      })
        .addTo(layerGroup.current)
        .bindPopup(
          `<div class="text-gray-800">
             <div class="font-bold text-sm">${b.name}</div>
             <div class="text-xs mt-1">${b.address}</div>
             ${userLoc ? `<div class="text-xs text-blue-600 mt-1 font-medium">Cách bạn: ${haversineKm(userLoc.latitude, userLoc.longitude, b.latitude, b.longitude).toFixed(2)} km</div>` : ''}
           </div>`
        )
      
      marker.on('click', () => setSelectedBranch(b))
      if (isSelected) marker.openPopup()
    })

    // Draw real route if available
    if (routeGeometry) {
        // Create a white outline for the route (to make it pop like Google Maps)
        const outline = L.geoJSON(routeGeometry, {
            style: { color: 'white', weight: 8, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }
        })

        // Main route line (Blue)
        const mainLine = L.geoJSON(routeGeometry, {
            style: { color: '#4285F4', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }
        })

        const layers: any[] = [outline, mainLine]

        // Add info bubble at the midpoint of the route
        if (routeInfo && routeGeometry.coordinates && routeGeometry.coordinates.length > 0) {
            const coords = routeGeometry.coordinates
            const midIndex = Math.floor(coords.length / 2)
            // GeoJSON is [lon, lat], Leaflet needs [lat, lon]
            const midPoint = [coords[midIndex][1], coords[midIndex][0]] as [number, number]

            const durationMins = Math.round(routeInfo.duration / 60)
            const distanceKm = (routeInfo.distance / 1000).toFixed(1)

            const bubbleIcon = L.divIcon({
                className: 'route-info-bubble',
                html: `
                    <div style="background: white; padding: 4px 8px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid #ccc; font-family: sans-serif; text-align: center; min-width: 80px; transform: translate(-50%, -50%); white-space: nowrap;">
                        <div style="font-weight: bold; color: #202124; font-size: 14px; line-height: 1.2;">${durationMins} phút</div>
                        <div style="font-size: 12px; color: #5f6368;">${distanceKm} km</div>
                        <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid white;"></div>
                    </div>
                `,
                iconSize: [0, 0], // Size handled by CSS/content
                iconAnchor: [0, 0] // Centered via transform in HTML
            })

            const bubbleMarker = L.marker(midPoint, { icon: bubbleIcon, interactive: false, zIndexOffset: 1000 })
            layers.push(bubbleMarker)
        }

        routeLayer.current = L.layerGroup(layers).addTo(mapInst.current)
        
        // Fit bounds to show the route with some padding
        try {
            // We use the mainLine for bounds
            mapInst.current.fitBounds(mainLine.getBounds(), { padding: [50, 50] })
        } catch {}
    } else if (isRouting) {
         // Show loading indicator or temp line?
         // Just clear layer or show nothing until loaded
    } else if (userLoc && selectedBranch) {
         // Fallback to straight line
         const latlngs: [number, number][] = [
            [userLoc.latitude, userLoc.longitude],
            [selectedBranch.latitude, selectedBranch.longitude]
        ];
        routeLayer.current = L.polyline(latlngs, {color: '#999', dashArray: '5, 10', weight: 3}).addTo(mapInst.current);
        try { mapInst.current.fitBounds(routeLayer.current.getBounds(), { padding: [50, 50] }) } catch {}
    }
  }, [branches, userLoc, selectedBranch, routeGeometry, isRouting, routeInfo])

  useEffect(() => {
    const init = async () => {
      const L = LRef.current ?? (await import('leaflet'))
      LRef.current = L
      const container = mapRef.current
      if (!container || mapInst.current) return
      mapInst.current = L.map(container)
      const center = userLoc ? [userLoc.latitude, userLoc.longitude] : [branches[0]?.latitude ?? 21.028511, branches[0]?.longitude ?? 105.804817]
      mapInst.current.setView(center as any, 12)
      
      // Use Standard OpenStreetMap tiles (Light/Bright)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
      }).addTo(mapInst.current)

      // Add Custom Locate Control
      const LocateControl = L.Control.extend({
        options: { position: 'bottomright' },
        onAdd: function () {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-touch');
            const btn = L.DomUtil.create('a', 'leaflet-control-locate', container);
            btn.href = '#';
            btn.title = 'Vị trí của tôi';
            btn.role = 'button';
            btn.style.width = '34px';
            btn.style.height = '34px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.backgroundColor = 'white';
            btn.style.cursor = 'pointer';
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`;
            
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (userLocRef.current && mapInst.current) {
                    mapInst.current.setView([userLocRef.current.latitude, userLocRef.current.longitude], 14);
                } else if (!userLocRef.current) {
                    alert("Đang lấy vị trí của bạn...");
                }
            };
            return container;
        }
      });
      mapInst.current.addControl(new LocateControl());
      
      layerGroup.current = L.layerGroup().addTo(mapInst.current)
      renderMarkers()
      setTimeout(() => { try { mapInst.current.invalidateSize() } catch {} }, 0)
    }
    init()
    return () => { if (mapInst.current) { try { mapInst.current.remove() } catch {}; mapInst.current = null; layerGroup.current = null } }
  }, [branches, renderMarkers, userLoc, selectedBranch])

  useEffect(() => { if (layerGroup.current) renderMarkers() }, [branches, userLoc, nearest, selectedBranch, routeGeometry, renderMarkers])

  // Progressive fetch driving distances for sorting (sequential to avoid rate limit)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!userLoc || branches.length === 0) return
      for (const b of branches) {
        if (cancelled) break
        if (branchDistances[b.id]) continue
        try {
          const start = `${userLoc.longitude},${userLoc.latitude}`
          const end = `${b.longitude},${b.latitude}`
          const res = await fetch(`/api/routing?start=${start}&end=${end}`, { cache: 'no-store' })
          const data = await res.json().catch(() => null)
          if (data && data.routes && data.routes[0]) {
            const r = data.routes[0]
            setBranchDistances(prev => ({ ...prev, [b.id]: { distance: r.distance, duration: r.duration } }))
          }
        } catch {}
        await new Promise(rs => setTimeout(rs, 250))
      }
    }
    run()
    return () => { cancelled = true }
  }, [userLoc, branches, branchDistances])

  // Recenter to user location when available
  useEffect(() => {
    if (userLoc && mapInst.current) {
      try { mapInst.current.setView([userLoc.latitude, userLoc.longitude], 12) } catch {}
    }
  }, [userLoc])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-[#F7F8FA] text-slate-800">
      <h1 className="text-2xl font-semibold text-slate-900">Danh sách chi nhánh</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-[65vh]">
          <div className="p-4 border-b border-slate-200">
            <input
              type="text"
              placeholder="Tìm kiếm chi nhánh..."
              className="w-full p-2 bg-white border border-slate-300 rounded text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-100 z-10">
                <tr className="border-b border-slate-200">
                  <th className="text-left p-2">Tên</th>
                  <th className="text-left p-2">Địa chỉ</th>
                  <th className="text-left p-2">Khoảng cách</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((b) => {
                   const isSelected = selectedBranch?.id === b.id
                   return (
                    <tr 
                      key={b.id} 
                      className={`border-b border-slate-200 cursor-pointer hover:bg-slate-100 ${isSelected ? 'bg-slate-100 border-l-4 border-l-blue-500' : ''}`}
                      onClick={() => setSelectedBranch(b)}
                    >
                      <td className="p-2 font-medium text-slate-900">{b.name}</td>
                      <td className="p-2 text-slate-700">{b.address}</td>
                      <td className="p-2 text-slate-700">
                        {userLoc ? (
                          branchDistances[b.id] ? (
                            <span title="Khoảng cách di chuyển"> { (branchDistances[b.id].distance / 1000).toFixed(1) } km</span>
                          ) : (
                            <span className="text-slate-500" title="Đang tính toán...">
                               {haversineKm(userLoc.latitude, userLoc.longitude, b.latitude, b.longitude).toFixed(1)} km*
                            </span>
                          )
                        ) : '-'}
                      </td>
                    </tr>
                  )
                })}
                {filteredBranches.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-500">Không tìm thấy chi nhánh nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2 flex flex-col shadow-sm">
          <div ref={mapRef} className="w-full flex-1 min-h-[400px] rounded relative z-0">
            {isRouting && (
              <div className="absolute inset-0 bg-slate-200/40 backdrop-blur-sm flex items-center justify-center z-[500] pointer-events-none">
                <div className="bg-white text-slate-800 px-4 py-3 rounded shadow border border-slate-200 text-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><circle cx="12" cy="12" r="10"/></svg>
                  Đang tính đường đi…
                </div>
              </div>
            )}
          </div>
          {/* Locate Me Button - moved into map using Leaflet Control standard positioning style */}
          {/* We render it here but it's absolute positioned over the map. Standard Leaflet controls are usually inside the map container but custom divs work too if positioned right. 
              To match user request "inside map", bottom-right is standard. */}
          
          {routeInfo && selectedBranch && (
             <div className="absolute top-4 right-4 z-[400] bg-white p-3 rounded shadow-lg text-slate-800 max-w-xs border border-slate-200">
               <div className="flex items-start gap-3">
                   <div className="bg-blue-500 text-white p-2 rounded-full mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 19h-6a8 8 0 0 1-8-8V5"/><polyline points="11 9 5 3 19 3"/></svg>
                   </div>
                   <div>
                      <div className="font-bold text-lg text-slate-900">{(routeInfo.duration / 60).toFixed(0)} phút</div>
                      <div className="text-sm text-slate-600">{(routeInfo.distance / 1000).toFixed(1)} km</div>
                      <div className="text-xs text-slate-500 mt-1">Đến: {selectedBranch.name}</div>
                   </div>
               </div>
             </div>
          )}
          <div className="text-sm mt-2 p-2 bg-white rounded border border-slate-200">
            {selectedBranch ? (
              <div className="flex items-center justify-between">
                <div>
                   <div className="font-semibold text-slate-900">{selectedBranch.name}</div>
                   <div className="text-xs text-slate-600">{selectedBranch.address}</div>
                   {userLoc && (
                     <div className="text-xs mt-1 text-slate-600">
                       {routeInfo ? (
                           <span>Khoảng cách di chuyển: <span className="text-slate-900 font-medium">{(routeInfo.distance / 1000).toFixed(1)} km</span></span>
                       ) : (
                           <span>Khoảng cách (thẳng): {haversineKm(userLoc.latitude, userLoc.longitude, selectedBranch.latitude, selectedBranch.longitude).toFixed(2)} km</span>
                       )}
                     </div>
                   )}
                </div>
                
              </div>
            ) : (
              <div className="text-slate-600">{geoError ?? 'Chọn một chi nhánh để xem chi tiết…'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
