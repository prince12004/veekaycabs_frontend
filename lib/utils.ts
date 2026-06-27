import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MIN_BOOKING_HOURS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateBookingId(carName: string, userName: string) {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  const car = carName.replace(/\s+/g, "").substring(0, 12);
  const user = userName.replace(/\s+/g, "").substring(0, 10);
  return `DL_${car}_${user}_${digits}_${year}`;
}

export function maskAadhaar(aadhaar: string) {
  return `XXXX XXXX ${aadhaar.slice(-4)}`;
}

export function getDurationLabel(hours: number) {
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem ? `${days}d ${rem}h` : `${days} day${days > 1 ? "s" : ""}`;
}

// ─── Booking date/time helpers ──────────────────────────────────────────────
// All "slot" strings use the "YYYY-MM-DD HH:MM" format produced by DateTimePicker.

function parseSlot(value: string): Date | null {
  if (!value) return null;
  const [d, t] = value.split(" ");
  if (!d) return null;
  return new Date(`${d}T${t || "00:00"}:00`);
}

function toSlot(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const t = `${pad(date.getHours())}:00`;
  return `${d} ${t}`;
}

// Rounds a date forward to the next full hour.
function roundUpToHour(date: Date): Date {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  rounded.setMinutes(0);
  if (date.getMinutes() > 0 || date.getSeconds() > 0) {
    rounded.setHours(rounded.getHours() + 1);
  }
  return rounded;
}

export function addHoursToSlot(value: string, hours: number): string {
  const date = parseSlot(value);
  if (!date) return "";
  date.setHours(date.getHours() + hours);
  return toSlot(date);
}

// Earliest valid pickup: now, rounded up to the next full hour.
export function getEarliestPickup(): string {
  return toSlot(roundUpToHour(new Date()));
}

// Default booking window for "Book Now" shortcuts: starts 1 hour from now,
// runs for the site's minimum booking duration.
export function getDefaultBookingWindow(): { start: string; end: string } {
  const start = toSlot(roundUpToHour(new Date(Date.now() + 60 * 60 * 1000)));
  const end = addHoursToSlot(start, MIN_BOOKING_HOURS);
  return { start, end };
}

export function isSlotBefore(a: string, b: string): boolean {
  const da = parseSlot(a);
  const db = parseSlot(b);
  if (!da || !db) return false;
  return da.getTime() < db.getTime();
}

// Whole hours between two slots, floored at the site's minimum booking duration.
export function getSlotHours(start: string, end: string): number {
  const da = parseSlot(start);
  const db = parseSlot(end);
  if (!da || !db) return MIN_BOOKING_HOURS;
  const hours = Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60));
  return Math.max(hours, MIN_BOOKING_HOURS);
}
