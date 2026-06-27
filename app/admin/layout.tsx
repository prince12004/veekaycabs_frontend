"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, FileCheck, RefreshCw,
  Link as LinkIcon, Navigation, BarChart3, BookOpen, Tag,
  MapPin, MessageSquare, LogOut, Menu, X,
  Plus, List, Info, Share2, Globe, Bell, Search,
  ChevronRight, Activity, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null }],
  },
  {
    label: "Fleet",
    items: [
      { href: "/admin/cars", label: "Car Listing", icon: List, badge: "101" },
      { href: "/admin/cars/add", label: "Add Car", icon: Plus, badge: null },
    ],
  },
  {
    label: "Bookings",
    items: [
      { href: "/admin/bookings", label: "All Bookings", icon: Calendar, badge: "6" },
      { href: "/admin/bookings/offline", label: "Offline Booking", icon: Activity, badge: null },
    ],
  },
  {
    label: "Users & KYC",
    items: [
      { href: "/admin/users", label: "User List", icon: Users, badge: null },
      { href: "/admin/documents", label: "KYC Review", icon: FileCheck, badge: "8" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/refunds", label: "Refunds", icon: RefreshCw, badge: null },
      { href: "/admin/payment-links", label: "Payment Links", icon: LinkIcon, badge: null },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/gps", label: "GPS Tracking", icon: Navigation, badge: null },
      { href: "/admin/reports", label: "Reports", icon: BarChart3, badge: null },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blogs", label: "Blogs", icon: BookOpen, badge: null },
      { href: "/admin/slider", label: "Slider / Banners", icon: Globe, badge: null },
      { href: "/admin/offers", label: "Offers & Banners", icon: Tag, badge: null },
      { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquare, badge: null },
      { href: "/admin/policy-pages", label: "Policy Pages", icon: Info, badge: null },
      { href: "/admin/coupons", label: "Coupons", icon: Tag, badge: null },
      { href: "/admin/cities", label: "Manage Cities", icon: MapPin, badge: null },
      { href: "/admin/contact-requests", label: "Contact Requests", icon: MessageSquare, badge: "3" },
      { href: "/admin/seo", label: "SEO Pages", icon: Globe, badge: null },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/basic-details", label: "Basic Details", icon: Info, badge: null },
      { href: "/admin/social-media", label: "Social Media", icon: Share2, badge: null },
      { href: "/admin/manage-admins", label: "Manage Admins", icon: Users, badge: null },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    if (isLoginPage) return;
    const token = localStorage.getItem("vk_admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    const rawUser = localStorage.getItem("vk_admin_user");
    if (rawUser) setAdminUser(JSON.parse(rawUser));
    setAuthChecked(true);
  }, [isLoginPage, router]);

  const handleLogout = () => {
    localStorage.removeItem("vk_admin_token");
    localStorage.removeItem("vk_admin_refresh_token");
    localStorage.removeItem("vk_admin_user");
    router.replace("/admin/login");
  };

  if (isLoginPage) return <>{children}</>;
  if (!authChecked) return null;

  const allItems = navGroups.flatMap(g => g.items);
  const currentPage = allItems.find(
    item => pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"))
  );

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const dayStr = now.toLocaleDateString("en-IN", { weekday: "long" });

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg, #08080F 0%, #0D0D1A 100%)" }}>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center shadow-[0_4px_16px_rgba(232,84,10,0.4)]">
              <span className="text-white font-black text-sm font-syne">VK</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full border-2 border-[#08080F]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm font-syne leading-none mb-0.5">Veekay Cabs</p>
            <p className="text-white/30 text-[10px] font-medium">Admin Panel v2.0</p>
          </div>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl">
          <Search size={13} className="text-white/25 shrink-0" />
          <span className="text-white/25 text-xs">Quick search...</span>
          <span className="ml-auto text-[10px] text-white/15 font-mono bg-white/5 px-1.5 py-0.5 rounded">⌘K</span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 px-2 mb-1.5">
              <span className="text-white/20 text-[9px] font-bold uppercase tracking-[0.18em]">{group.label}</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, badge }) => {
                const active = pathname === href ||
                  (href !== "/admin/dashboard" && pathname.startsWith(href + "/")) ||
                  (href !== "/admin/dashboard" && pathname === href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group relative",
                      active
                        ? "bg-gradient-to-r from-[#E8540A] to-[#FF6B35] text-white shadow-[0_4px_20px_rgba(232,84,10,0.3)]"
                        : "text-white/45 hover:text-white hover:bg-white/[0.05]"
                    )}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-full opacity-50" />
                    )}
                    <Icon size={14} className="shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge && !active && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E8540A]/20 text-[#E8540A]">
                        {badge}
                      </span>
                    )}
                    {!active && (
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-30 transition-opacity shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="p-3 border-t border-white/[0.06] space-y-1 shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.05] transition-all text-[13px] font-medium group"
        >
          <ExternalLink size={13} className="shrink-0" />
          <span>View Website</span>
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-bold text-xs shadow-[0_2px_8px_rgba(232,84,10,0.3)]">
              A
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#08080F]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{adminUser?.name || "Admin"}</p>
            <p className="text-white/25 text-[10px] truncate">{adminUser?.email || ""}</p>
          </div>
          <button onClick={handleLogout} className="text-white/20 hover:text-[#EF4444] transition-colors">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F0F1F6] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 shadow-[4px_0_30px_rgba(0,0,0,0.12)]">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
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
            {/* Mobile menu */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 rounded-xl bg-[#F8F9FC] flex items-center justify-center text-[#4A4A6A] hover:bg-[#E8540A] hover:text-white transition-all"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[#9090A8] text-xs">
                <span>Admin</span>
                <ChevronRight size={12} />
                <span className="text-[#0F0F1A] font-semibold">{currentPage?.label ?? "Dashboard"}</span>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Date */}
              <div className="hidden md:flex items-center gap-2 bg-[#F8F9FC] border border-[#E4E5EF] px-3 py-1.5 rounded-xl text-xs">
                <span className="text-[#0F0F1A] font-semibold">{dateStr}</span>
                <span className="text-[#E4E5EF]">|</span>
                <span className="text-[#E8540A] font-medium">{dayStr}</span>
              </div>

              {/* Notifications */}
              <button className="relative w-9 h-9 rounded-xl bg-[#F8F9FC] border border-[#E4E5EF] flex items-center justify-center text-[#4A4A6A] hover:border-[#E8540A] hover:text-[#E8540A] transition-all">
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border border-white" />
              </button>

              {/* Tempo Admin switch */}
              <Link
                href="/admin/tempo-admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9D4EDD] text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
              >
                <span>🚐</span>
                Tempo Admin
              </Link>

              {/* View site */}
              <Link
                href="/"
                target="_blank"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8540A]/30 text-[#E8540A] text-xs font-semibold hover:bg-[#FFF3ED] transition-colors"
              >
                <ExternalLink size={13} />
                Live Site
              </Link>

              {/* Avatar */}
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8540A] to-[#FF6B35] flex items-center justify-center text-white font-bold text-sm shadow-[0_2px_8px_rgba(232,84,10,0.3)] cursor-pointer">
                  A
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
