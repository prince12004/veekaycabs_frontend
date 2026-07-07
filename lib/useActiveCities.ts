"use client";

import { useState, useEffect } from "react";
import { citiesAPI } from "@/lib/api";

export interface CityOption {
  name: string;
  slug: string;
}

// Shown instantly while the real (active-only) list loads, so selects/links
// aren't empty for a beat — replaced as soon as the API responds.
const FALLBACK: CityOption[] = [
  { name: "Delhi", slug: "delhi" },
  { name: "Noida", slug: "noida" },
  { name: "Gurgaon", slug: "gurgaon" },
];

export function useActiveCities() {
  const [cities, setCities] = useState<CityOption[]>(FALLBACK);

  useEffect(() => {
    citiesAPI
      .getAll()
      .then(({ data }) => {
        if (data?.data?.length) {
          setCities(data.data.map((c: { name: string; slug: string }) => ({ name: c.name, slug: c.slug })));
        }
      })
      .catch(() => {});
  }, []);

  return cities;
}
