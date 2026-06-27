"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";

// ── Load Google Maps script once globally ────────────────────────────────────
let scriptLoaded = false;
let scriptLoading = false;
const callbacks: (() => void)[] = [];

function loadGoogleMaps(): Promise<void> {
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

// ── Debounce helper ──────────────────────────────────────────────────────────
function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Google Places fetch ──────────────────────────────────────────────────────
interface Suggestion {
  label: string;    // full description
  value: string;    // short display name
  placeId: string;
}

async function fetchPlaces(query: string): Promise<Suggestion[]> {
  if (!query || query.length < 2) return [];
  await loadGoogleMaps();
  return new Promise((resolve) => {
    const svc = new google.maps.places.AutocompleteService();
    svc.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: "in" },
        types: ["geocode", "establishment"],
      },
      (predictions, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }
        resolve(
          predictions.map((p) => ({
            label: p.description,
            value: p.structured_formatting.main_text,
            placeId: p.place_id,
          }))
        );
      }
    );
  });
}

// ── Shared dropdown logic ────────────────────────────────────────────────────
function useLocationDropdown(onChange: (v: string) => void) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const search = useCallback(
    debounce(async (q: string) => {
      if (!q || q.length < 2) { setSuggestions([]); setOpen(false); return; }
      setLoading(true);
      const results = await fetchPlaces(q);
      setSuggestions(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, 300),
    []
  );

  const select = (s: Suggestion) => {
    onChange(s.value);
    setSuggestions([]);
    setOpen(false);
  };

  return { suggestions, loading, open, search, select, setOpen };
}

// ── LocationAutocomplete — with icon wrapper (used in tempo search card) ─────
interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export function LocationAutocomplete({
  value, onChange, placeholder = "Enter a location", error, className,
}: LocationAutocompleteProps) {
  const { suggestions, loading, open, search, select, setOpen } = useLocationDropdown(onChange);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setOpen]);

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ""}`}>
      <div
        className={`flex items-center gap-2 border rounded-xl px-4 py-3 bg-white transition-colors ${
          error ? "border-red-400" : "border-gray-200 focus-within:border-[#0EA5E9]"
        }`}
      >
        <MapPin size={16} className="text-gray-400 shrink-0" />
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value); search(e.target.value); }}
          onFocus={() => value && suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          autoComplete="off"
        />
        {loading && <Loader2 size={14} className="text-gray-400 animate-spin shrink-0" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={s.placeId || i}
              onMouseDown={() => select(s)}
              className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-orange-50 cursor-pointer text-sm transition-colors border-b border-gray-50 last:border-0"
            >
              <MapPin size={13} className="text-[#E8540A] shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-800 font-medium leading-tight">{s.value}</p>
                <p className="text-gray-400 text-[11px] mt-0.5 leading-tight">{s.label}</p>
              </div>
            </li>
          ))}
          <li className="px-4 py-1.5 flex items-center justify-end gap-1 bg-gray-50">
            <span className="text-[10px] text-gray-300">Powered by</span>
            <img src="https://www.gstatic.com/images/branding/googlelogo/1x/googlelogo_color_68x28dp.png" alt="Google" className="h-3 opacity-40" />
          </li>
        </ul>
      )}
    </div>
  );
}

// ── LocationInput — plain variant (used in booking forms) ────────────────────
interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationInput({ value, onChange, placeholder, className }: LocationInputProps) {
  const { suggestions, loading, open, search, select, setOpen } = useLocationDropdown(onChange);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setOpen]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value); search(e.target.value); }}
          onFocus={() => value && suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        {loading && (
          <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-[#E4E5EF] rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={s.placeId || i}
              onMouseDown={() => select(s)}
              className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-[#FFF3ED] cursor-pointer text-sm transition-colors border-b border-gray-50 last:border-0"
            >
              <MapPin size={12} className="text-[#E8540A] shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-800 font-medium text-xs leading-tight">{s.value}</p>
                <p className="text-gray-400 text-[10px] mt-0.5 leading-tight">{s.label}</p>
              </div>
            </li>
          ))}
          <li className="px-3 py-1 flex items-center justify-end gap-1 bg-gray-50">
            <span className="text-[10px] text-gray-300">Powered by</span>
            <img src="https://www.gstatic.com/images/branding/googlelogo/1x/googlelogo_color_68x28dp.png" alt="Google" className="h-3 opacity-40" />
          </li>
        </ul>
      )}
    </div>
  );
}
