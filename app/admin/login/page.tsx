"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { adminAuthAPI } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminAuthAPI.login(email.trim(), password);
      const { token, refreshToken, user } = res.data;
      localStorage.setItem("vk_admin_token", token);
      localStorage.setItem("vk_admin_refresh_token", refreshToken);
      localStorage.setItem("vk_admin_user", JSON.stringify(user));
      const redirect = localStorage.getItem("vk_admin_redirect") || "/admin/dashboard";
      localStorage.removeItem("vk_admin_redirect");
      router.push(redirect);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#17172A] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <Image src="/logowhite.png" alt="Veekay Cabs" width={160} height={29} className="h-9 w-auto object-contain mb-4" priority />
          <h1 className="text-white font-bold font-syne text-lg">Admin Login</h1>
          <p className="text-white/40 text-xs mt-1">Veekay Cabs Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
              Email
            </label>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.07] border border-white/15 focus-within:border-[#E8540A]/70">
              <Mail size={14} className="text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                placeholder="admin@veekaycabs.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
              Password
            </label>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.07] border border-white/15 focus-within:border-[#E8540A]/70">
              <Lock size={14} className="text-white/40" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-white/40 hover:text-white/70 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
              <AlertCircle size={13} /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
