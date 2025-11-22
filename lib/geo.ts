const R = 6371;

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearest<T extends { latitude: number; longitude: number }>(
  origin: { latitude: number; longitude: number },
  points: T[]
) {
  let min: { item: T | null; distance: number } = { item: null, distance: Number.POSITIVE_INFINITY };
  for (const p of points) {
    const d = haversineKm(origin.latitude, origin.longitude, p.latitude, p.longitude);
    if (d < min.distance) min = { item: p, distance: d };
  }
  return min;
}

