export function mapsLinkForLatitudeLongitude(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat + ',' + lng)}`;
}

export function mapsLinkForBranch(b: { latitude: number; longitude: number }) {
  return mapsLinkForLatitudeLongitude(b.latitude, b.longitude);
}
