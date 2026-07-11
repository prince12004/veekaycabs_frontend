// Loads the Google Maps JS SDK once for the whole app (Places + core map/marker
// APIs). Multiple components (LocationAutocomplete, FleetMap, ...) share this
// single script tag — Maps JS doesn't support loading it twice on one page.
let scriptLoaded = false;
let scriptLoading = false;
const callbacks: (() => void)[] = [];

export function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if (scriptLoaded) { resolve(); return; }
    callbacks.push(resolve);
    if (scriptLoading) return;
    scriptLoading = true;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=en`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      callbacks.forEach((cb) => cb());
      callbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}
