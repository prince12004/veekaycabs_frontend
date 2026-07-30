"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Plus, List, Calendar, Globe, LogOut, Menu, X,
  ChevronRight, ExternalLink, Bell, Car
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/tempo-admin", label: "Add Tempo Traveller", icon: Plus, exact: true },
  { href: "/admin/tempo-admin/list", label: "Tempo Traveller Listing", icon: List },
  { href: "/admin/tempo-admin/bookings", label: "Booking Listing", icon: Calendar },
  { href: "/admin/tempo-admin/seo", label: "SEO Page", icon: Globe },
];

export default function TempoAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name?: string; email?: string } | null>(null);

  // Lock background scroll while the mobile sidebar drawer is open.
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [sidebarOpen]);

  useEffect(() => {
    const token = localStorage.getItem("vk_admin_token");
    if (!token) { router.replace("/admin/login"); return; }
    const rawUser = localStorage.getItem("vk_admin_user");
    if (rawUser) setAdminUser(JSON.parse(rawUser));
    setAuthChecked(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("vk_admin_token");
    localStorage.removeItem("vk_admin_refresh_token");
    localStorage.removeItem("vk_admin_user");
    router.replace("/admin/login");
  };

  if (!authChecked) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const dayStr = now.toLocaleDateString("en-IN", { weekday: "long" });

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg, #0A0A18 0%, #12103A 100%)" }}>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <Link href="/admin/tempo-admin" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#9D4EDD] flex items-center justify-center shadow-[0_4px_16px_rgba(124,58,237,0.4)]">
            <span className="text-white text-lg">🚐</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm font-syne leading-none mb-0.5">Tempo Admin</p>
            <p className="text-white/30 text-[10px] font-medium">Veekay Cabs</p>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
          <X size={14} />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium transition-all group",
                active
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#9D4EDD] text-white shadow-[0_4px_20px_rgba(124,58,237,0.35)]"
                  : "text-white/45 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <Icon size={15} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {!active && <ChevronRight size={12} className="opacity-0 group-hover:opacity-30 transition-opacity shrink-0" />}
            </Link>
          );
        })}
      </div>

      {/* Bottom */}
      <div className="p-3 border-t border-white/[0.06] space-y-1 shrink-0">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#E8540A] hover:bg-[#E8540A]/10 transition-all text-[13px] font-semibold group"
        >
          <Car size={13} className="shrink-0" />
          <span>Car Admin</span>
        </Link>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.05] transition-all text-[13px] font-medium group"
        >
          <ExternalLink size={13} className="shrink-0" />
          <span>View Website</span>
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#9D4EDD] flex items-center justify-center text-white font-bold text-xs">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{adminUser?.name || "Admin"}</p>
            <p className="text-white/25 text-[10px] truncate">{adminUser?.email || ""}</p>
          </div>
          <button onClick={handleLogout} className="text-white/20 hover:text-red-400 transition-colors">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  const currentPage = navItems.find(item => item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <div className="flex h-screen bg-[#F0F1F6] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 shadow-[4px_0_30px_rgba(0,0,0,0.15)]">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden shadow-2xl">
            <SidebarContent />
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <div className="bg-white border-b border-[#E4E5EF] shadow-sm shrink-0">
          <div className="px-6 py-3.5 flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 rounded-xl bg-[#F8F9FC] flex items-center justify-center text-[#4A4A6A] hover:bg-[#7C3AED] hover:text-white transition-all">
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[#9090A8] text-xs">
                <span>Tempo Admin</span>
                <ChevronRight size={12} />
                <span className="text-[#0F0F1A] font-semibold">{currentPage?.label ?? "Dashboard"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 bg-[#F8F9FC] border border-[#E4E5EF] px-3 py-1.5 rounded-xl text-xs">
                <span className="text-[#0F0F1A] font-semibold">{dateStr}</span>
                <span className="text-[#E4E5EF]">|</span>
                <span className="text-[#7C3AED] font-medium">{dayStr}</span>
              </div>
              <button className="relative w-9 h-9 rounded-xl bg-[#F8F9FC] border border-[#E4E5EF] flex items-center justify-center text-[#4A4A6A] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all">
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border border-white" />
              </button>
              <Link
                href="/admin/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8540A]/30 text-[#E8540A] text-xs font-semibold hover:bg-[#FFF3ED] transition-colors"
              >
                <Car size={13} />
                Car Admin
              </Link>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#9D4EDD] flex items-center justify-center text-white font-bold text-sm shadow-[0_2px_8px_rgba(124,58,237,0.3)] cursor-pointer">
                A
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
