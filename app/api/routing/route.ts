import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start"); // "lng,lat"
  const end = searchParams.get("end");     // "lng,lat"

  if (!start || !end) {
    return NextResponse.json({ error: "Missing start or end coordinates" }, { status: 400 });
  }

  // Use OSRM public API
  // Primary: router.project-osrm.org
  const [sLon, sLat] = start.split(',').map(Number);
  const [eLon, eLat] = end.split(',').map(Number);

  // Snap start/end to nearest road to reduce NoRoute errors
  const snappedStart = await snapToRoad(sLon, sLat);
  const snappedEnd = await snapToRoad(eLon, eLat);

  const routeTemplate = (lon1: number, lat1: number, lon2: number, lat2: number) =>
    `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&alternatives=false`;
  const primaryUrl = routeTemplate(snappedStart.lon, snappedStart.lat, snappedEnd.lon, snappedEnd.lat);

  try {
    const res = await fetch(primaryUrl, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error(`OSRM Primary Error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Primary OSRM failed:", error);
    
    // Fallback: routing.openstreetmap.de
    // Note: keep params minimal to improve success rate
    const fallbackUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${snappedStart.lon},${snappedStart.lat};${snappedEnd.lon},${snappedEnd.lat}?overview=full&alternatives=false`;
    try {
        const res2 = await fetch(fallbackUrl, { cache: 'no-store' });
        if (!res2.ok) {
             throw new Error(`OSRM Fallback Error: ${res2.status} ${res2.statusText}`);
        }
        const data2 = await res2.json();
        // Normalize to OSRM-like GeoJSON if server returns polyline
        // If geometry is a string (polyline), convert to GeoJSON LineString coordinates order [lon, lat]
        try {
          if (data2?.routes?.[0]?.geometry && typeof data2.routes[0].geometry === 'string') {
            const decoded = decodePolyline(data2.routes[0].geometry);
            data2.routes[0].geometry = { type: 'LineString', coordinates: decoded.map(([lat, lon]: number[]) => [lon, lat]) };
          }
        } catch {}
        return NextResponse.json(data2);
    } catch (err2) {
        console.error("Fallback OSRM failed:", err2);
        // Return soft error to avoid noisy 502 on client; FE will fallback to straight line
        return NextResponse.json({ code: 'NoRoute', message: 'Failed to fetch route from providers', routes: [] });
    }
  }
}

// Minimal polyline decoder (Google/OSRM) → array of [lat, lon]
function decodePolyline(str: string, precision = 5): number[][] {
  let index = 0, lat = 0, lon = 0; const coordinates: number[][] = [];
  const factor = Math.pow(10, precision);
  while (index < str.length) {
    let b, shift = 0, result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    shift = 0; result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlon = (result & 1) ? ~(result >> 1) : (result >> 1);
    lon += dlon;
    coordinates.push([lat / factor, lon / factor]);
  }
  return coordinates;
}

// Try to snap a coordinate to nearest road using OSRM nearest endpoint
async function snapToRoad(lon: number, lat: number): Promise<{ lon: number; lat: number }> {
  const primary = `https://router.project-osrm.org/nearest/v1/driving/${lon},${lat}`;
  try {
    const res = await fetch(primary, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const wp = data?.waypoints?.[0]?.location;
      if (Array.isArray(wp) && wp.length === 2) {
        return { lon: wp[0], lat: wp[1] };
      }
    }
  } catch {}
  // Fallback server
  const fallback = `https://routing.openstreetmap.de/routed-car/nearest/v1/driving/${lon},${lat}`;
  try {
    const res2 = await fetch(fallback, { cache: 'no-store' });
    if (res2.ok) {
      const data2 = await res2.json();
      const wp2 = data2?.waypoints?.[0]?.location;
      if (Array.isArray(wp2) && wp2.length === 2) {
        return { lon: wp2[0], lat: wp2[1] };
      }
    }
  } catch {}
  // If both fail, return original
  return { lon, lat };
}
