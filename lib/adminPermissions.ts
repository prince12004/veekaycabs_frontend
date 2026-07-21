// Reads the logged-in admin's role/permissions from the same localStorage
// entry the admin login flow already writes (see app/admin/login/page.tsx).
// Used purely for UI gating (hide/show buttons, sidebar items) — the server
// independently re-enforces every permission via requirePermission()/
// requireAnyPermission()/superAdminOnly, so a stale or tampered client value
// can never actually grant access.

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

const has = (section: string, op: string): boolean => {
  const admin = getAdminUser();
  if (!admin) return false;
  if (admin.role === "super_admin") return true;
  return admin.permissions?.[`${section}_${op}`] === true;
};

// e.g. canView("carListing"), canAdd("blogs"), canEdit("userList"), canDelete("carListing")
export function canView(section: string): boolean {
  return has(section, "view");
}
export function canAdd(section: string): boolean {
  return has(section, "add");
}
export function canEdit(section: string): boolean {
  return has(section, "edit");
}
export function canDelete(section: string): boolean {
  return has(section, "delete");
}
