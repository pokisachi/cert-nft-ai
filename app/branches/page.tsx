'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Branch } from '@/lib/branchStore'
import { haversineKm, findNearest } from '@/lib/geo'
import { Phone, Navigation, MapPin, Search, Map as MapIcon, X } from 'lucide-react'

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
  const [showMapMobile, setShowMapMobile] = useState(false)
  const [showRouteNotification, setShowRouteNotification] = useState(false)
  const [routeNotificationFading, setRouteNotificationFading] = useState(false)

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
                setShowRouteNotification(true)
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

        // Bind a sticky tooltip to the route that follows the cursor
        if (routeInfo) {
            const durationMins = Math.round(routeInfo.duration / 60)
            const distanceKm = (routeInfo.distance / 1000).toFixed(1)

            const tooltipHtml = `
                <div style="background: white; padding: 4px 8px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid #ccc; font-family: sans-serif; text-align: center; min-width: 80px; white-space: nowrap;">
                    <div style="font-weight: bold; color: #202124; font-size: 14px; line-height: 1.2;">${durationMins} phút</div>
                    <div style="font-size: 12px; color: #5f6368;">${distanceKm} km</div>
                </div>
            `

            mainLine.bindTooltip(tooltipHtml, {
                sticky: true,
                permanent: false,
                direction: 'top',
                offset: [0, -8],
                className: 'route-info-tooltip'
            })

            mainLine.on('mouseover', () => {
                try { (mainLine as any).openTooltip() } catch {}
            })
            mainLine.on('mouseout', () => {
                try { (mainLine as any).closeTooltip() } catch {}
            })
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

  // Auto-dismiss route notification after 5 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (showRouteNotification) {
      timeoutId = setTimeout(() => {
        setRouteNotificationFading(true);
        setTimeout(() => {
          setShowRouteNotification(false);
          setRouteNotificationFading(false);
        }, 300); // Match the transition duration
      }, 5000);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showRouteNotification]);

  // Format distance for display
  const formatDistance = (branch: Branch) => {
    if (!userLoc) return null;

    if (branchDistances[branch.id]) {
      return (branchDistances[branch.id].distance / 1000).toFixed(1) + ' km';
    } else {
      return haversineKm(userLoc.latitude, userLoc.longitude, branch.latitude, branch.longitude).toFixed(1) + ' km';
    }
  };

  // Handle phone call
  const handlePhoneCall = (e: React.MouseEvent, branch: Branch) => {
    e.stopPropagation();
    // This would typically use the branch's phone number, but we'll use a placeholder
    window.open(`tel:+84123456789`, '_self');
  };

  // Handle directions
  const handleDirections = (e: React.MouseEvent, branch: Branch) => {
    e.stopPropagation();
    if (!userLoc) {
      alert("Vui lòng bật vị trí để sử dụng tính năng chỉ đường");
      return;
    }
    setSelectedBranch(branch);
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Mobile View with Floating Map Button */}
      <div className="md:hidden h-full">
        {showMapMobile ? (
          <div className="fixed inset-0 z-50 bg-white h-full">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold text-lg">Bản đồ chi nhánh</h2>
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={() => setShowMapMobile(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 relative">
                <div ref={mapRef} className="absolute inset-0 w-full h-full">
                  {isRouting && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-[500] pointer-events-none">
                      <div className="bg-white text-slate-800 px-4 py-3 rounded-lg shadow-lg border border-slate-200 text-sm flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        Đang tính đường đi…
                      </div>
                    </div>
                  )}
                </div>
                {showRouteNotification && routeInfo && selectedBranch && (
                  <div 
                    className={`absolute top-4 right-4 z-[400] bg-white p-3 rounded-lg shadow-lg text-slate-800 max-w-xs border border-slate-200 transition-all duration-300 cursor-pointer ${
                      routeNotificationFading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                    }`}
                    onClick={() => {
                      setRouteNotificationFading(true);
                      setTimeout(() => {
                        setShowRouteNotification(false);
                        setRouteNotificationFading(false);
                      }, 300);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white p-2 rounded-full mt-1">
                        <Navigation size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-900">{(routeInfo.duration / 60).toFixed(0)} phút</div>
                        <div className="text-sm text-slate-600">{(routeInfo.distance / 1000).toFixed(1)} km</div>
                        <div className="text-xs text-slate-500 mt-1">Đến: {selectedBranch.name}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {selectedBranch && (
                <div className="p-4 border-t border-gray-200">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="font-semibold text-slate-900">{selectedBranch.name}</div>
                    <div className="text-sm text-slate-600 mt-1">{selectedBranch.address}</div>
                    <div className="flex gap-3 mt-3">
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                        onClick={(e) => handlePhoneCall(e, selectedBranch)}
                      >
                        <Phone size={14} />
                        Gọi điện
                      </button>
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                        onClick={(e) => handleDirections(e, selectedBranch)}
                      >
                        <Navigation size={14} />
                        Chỉ đường
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowMapMobile(true)}
            className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
          >
            <MapIcon size={24} />
          </button>
        )}
      </div>

      {/* Desktop Full-Screen Split View Layout */}
      <div className="hidden md:flex h-full">
        {/* Left Side - Branch List (Fixed Width) */}
        <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col h-full">
          {/* Header with Title and Search */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Danh sách chi nhánh</h1>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm chi nhánh..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Branch Cards List - Independent Scrolling */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredBranches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy chi nhánh nào
              </div>
            ) : (
              filteredBranches.map((branch) => {
                const isSelected = selectedBranch?.id === branch.id;
                const distance = formatDistance(branch);

                return (
                  <div
                    key={branch.id}
                    onClick={() => setSelectedBranch(branch)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{branch.address}</p>
                        </div>
                      </div>
                      {distance && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                          {distance}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                        onClick={(e) => handlePhoneCall(e, branch)}
                      >
                        <Phone size={14} />
                        Gọi điện
                      </button>
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                        onClick={(e) => handleDirections(e, branch)}
                      >
                        <Navigation size={14} />
                        Chỉ đường
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side - Map (Flexible Width) */}
        <div className="flex-1 relative">
          <div className="h-full">
            <div ref={mapRef} className="w-full h-full">
              {isRouting && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-[500] pointer-events-none">
                  <div className="bg-white text-slate-800 px-4 py-3 rounded-lg shadow-lg border border-slate-200 text-sm flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    Đang tính đường đi…
                  </div>
                </div>
              )}
            </div>

            {showRouteNotification && routeInfo && selectedBranch && (
              <div 
                className={`absolute top-4 right-4 z-[400] bg-white p-3 rounded-lg shadow-lg text-slate-800 max-w-xs border border-slate-200 transition-all duration-300 cursor-pointer ${
                  routeNotificationFading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                }`}
                onClick={() => {
                  setRouteNotificationFading(true);
                  setTimeout(() => {
                    setShowRouteNotification(false);
                    setRouteNotificationFading(false);
                  }, 300);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white p-2 rounded-full mt-1">
                    <Navigation size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-slate-900">{(routeInfo.duration / 60).toFixed(0)} phút</div>
                    <div className="text-sm text-slate-600">{(routeInfo.distance / 1000).toFixed(1)} km</div>
                    <div className="text-xs text-slate-500 mt-1">Đến: {selectedBranch.name}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
