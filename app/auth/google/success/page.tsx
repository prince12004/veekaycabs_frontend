"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usersAPI } from "@/lib/api";

export default function GoogleSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");

    if (!token) {
      setError(true);
      return;
    }

    localStorage.setItem("vk_token", token);
    if (refreshToken) localStorage.setItem("vk_refresh_token", refreshToken);

    const dest = localStorage.getItem("vk_login_redirect") || "/account";
    localStorage.removeItem("vk_login_redirect");

    usersAPI
      .getProfile()
      .then((res) => {
        const user = res.data.data.user;
        localStorage.setItem("vk_user", JSON.stringify(user));
        router.replace(dest);
      })
      .catch(() => {
        router.replace(dest);
      });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="text-[#0F0F1A] font-bold mb-2">Sign-in failed</p>
          <p className="text-[#9090A8] text-sm">No token received from Google. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#4A4A6A]">
        <Loader2 size={20} className="animate-spin text-[#E8540A]" />
        Signing you in...
      </div>
    </div>
  );
}
