// Reads the logged-in admin's role/permissions from the same localStorage
// entry the admin login flow already writes (see app/admin/login/page.tsx).
// Used purely for UI gating (hide/show buttons) — the server independently
// re-enforces every permission via requirePermission()/superAdminOnly, so a
// stale or tampered client value can never actually grant access.

export type AdminUser = {
  name?: string;
  email?: string;
  role?: string;
  permissions?: Record<string, boolean>;
};

export function getAdminUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("vk_admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isSuperAdmin(): boolean {
  return getAdminUser()?.role === "super_admin";
}

// e.g. canDelete("fleet") checks role === super_admin || permissions.fleet_delete
export function canDelete(section: string): boolean {
  const admin = getAdminUser();
  if (!admin) return false;
  if (admin.role === "super_admin") return true;
  return admin.permissions?.[`${section}_delete`] === true;
}
