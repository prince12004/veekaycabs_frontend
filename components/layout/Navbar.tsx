"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Menu, X, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contact", label: "Contact Us" },
];

interface AuthUser { name: string; email?: string; mobile?: string }

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem("vk_token");
      const stored = localStorage.getItem("vk_user");
      setAuthUser(token && stored ? JSON.parse(stored) : null);
    };
    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const logout = () => {
    localStorage.removeItem("vk_token");
    localStorage.removeItem("vk_user");
    setAuthUser(null);
    router.push("/");
  };

  const initials = authUser?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const opaque = !isHome || scrolled;

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-500",
          opaque
            ? "bg-[#0F0F1A] backdrop-blur-xl border-b border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
            : "bg-gradient-to-b from-black/40 to-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/logowhite.png"
              alt="Veekay Cabs"
              width={160}
              height={29}
              className="h-9 w-auto object-contain group-hover:opacity-90 transition-opacity"
              priority
            />
          </Link>

          {/* Center Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors relative pb-1",
                  pathname === link.href
                    ? "text-[#E8540A] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#E8540A] after:rounded-full"
                    : "text-white/80 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/tempo-traveller"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 hover:border-white/50 transition-all"
            >
              🚐 Tempo Traveller
            </Link>
            <a
              href="tel:+919999926867"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 hover:border-white/50 transition-all"
            >
              <Phone size={14} className="text-[#E8540A]" />
              +91 99999 26867
            </a>
            {authUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/account"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8540A]/10 border border-[#E8540A]/30 text-white text-sm font-semibold hover:bg-[#E8540A]/20 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-[#E8540A] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {initials}
                  </div>
                  {authUser.name.split(" ")[0]}
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-gradient px-5 py-2 rounded-xl text-white font-semibold text-sm"
              >
                Login / My Account
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-white p-2"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-[#0F0F1A] z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <Image
                  src="/logowhite.png"
                  alt="Veekay Cabs"
                  width={140}
                  height={25}
                  className="h-8 w-auto object-contain"
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-white/60 hover:text-white"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 p-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      pathname === link.href
                        ? "bg-[#E8540A] text-white"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {link.label}
                    <ChevronRight size={16} />
                  </Link>
                ))}
                <Link
                  href="/tempo-traveller"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                >
                  🚐 Tempo Traveller
                  <ChevronRight size={16} />
                </Link>
              </div>
              <div className="p-6 border-t border-white/10 space-y-3">
                <a
                  href="tel:+919999926867"
                  className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm"
                >
                  <Phone size={16} className="text-[#E8540A]" />
                  +91 99999 26867
                </a>
                {authUser ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 w-full py-3 px-4 rounded-xl bg-[#E8540A]/10 border border-[#E8540A]/30 text-white font-semibold text-sm"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#E8540A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      {authUser.name}
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl border border-white/20 text-white/60 text-sm font-medium hover:text-white transition-all"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-gradient w-full py-3 rounded-xl text-white font-semibold text-sm text-center block"
                  >
                    Login / My Account
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
