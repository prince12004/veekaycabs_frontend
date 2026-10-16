"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/**
 * Records the visitor's ad click / referrer once, on the page they land on,
 * so any lead form later in the visit can send the right source to the CRM
 * (see lib/attribution.ts).
 */
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
