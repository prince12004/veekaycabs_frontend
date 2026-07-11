export type FleetStatus = "online" | "idle" | "offline";

// Single source of truth for status colors so the fleet list, stat chips,
// and satellite map pins can't drift out of sync with each other.
export const FLEET_STATUS: Record<FleetStatus, { label: string; solid: string; bg: string; text: string }> = {
  online: { label: "Online", solid: "#4C8C6E", bg: "#E7F0EB", text: "#2F5C46" },
  idle: { label: "Idle", solid: "#B98A46", bg: "#F5EDE0", text: "#7A5A2B" },
  offline: { label: "Offline", solid: "#B5555A", bg: "#F5E4E5", text: "#7A393C" },
};
