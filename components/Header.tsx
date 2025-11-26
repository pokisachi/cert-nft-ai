"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [unread, setUnread] = useState(0);

  // ✅ Click logo → Admin vào /admin, user thường vào /
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user?.role === "ADMIN") router.push("/admin");
    else router.push("/");
  };

  // ✅ Click ngoài menu để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    let timer: any;
    const load = async () => {
      if (!user) {
        setUnread(0);
        return;
      }
      try {
        const url = new URL("/api/me/announcements", window.location.origin);
        url.searchParams.set("limit", "1");
        url.searchParams.set("offset", "0");
        url.searchParams.set("t", String(Date.now()));
        const r = await fetch(url.toString(), { credentials: "include", cache: "no-store", headers: { "cache-control": "no-cache" } });
        const j = await r.json();
        if (r.ok && typeof j.unreadCount === "number") setUnread(j.unreadCount);
      } catch {}
    };
    load();
    timer = setInterval(load, 30000);
    const handler = (e: any) => {
      if (e?.detail && typeof e.detail.unreadCount === 'number') setUnread(e.detail.unreadCount);
      else load();
    };
    window.addEventListener('notifications:updated', handler as any);
    return () => {
      timer && clearInterval(timer);
      window.removeEventListener('notifications:updated', handler as any);
    };
  }, [user]);

  return (
    <header className="border-b border-b-[#282d39] bg-[#111318] sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="text-lg font-bold text-white tracking-tight"
        >
          FnNFT
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white">
          <Link href="/courses" className="hover:opacity-80">
            Khóa học
          </Link>
          <Link href="/cert" className="hover:opacity-80">
            Xác thực / Chứng chỉ
          </Link>
          <Link href="/branches" className="hover:opacity-80">
            Chi nhánh
          </Link>
        </nav>

        {/* User area */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 bg-[#282d39] rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3" ref={menuRef}>
              {/* 🔔 Chuông thông báo */}
              <button
                onClick={() => router.push("/me/announcements")}
                className="relative p-2 rounded-full hover:bg-[#282d39] transition-colors"
                title="Thông báo"
              >
                <Bell className="w-5 h-5 text-white/80 hover:text-white transition-colors" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] leading-none">
                    {unread > 9 ? "9+" : String(unread)}
                  </span>
                )}
              </button>

              {/* Avatar + Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || "User"}
                      width={32}
                      height={32}
                      className="rounded-full border"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-[#282d39] flex items-center justify-center text-white font-semibold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-white hidden sm:inline">
                    {user.name || user.email}
                  </span>
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-[#3b4354] bg-[#1c1f27]/95 backdrop-blur-sm shadow-lg text-sm animate-fadeInScale transition-all duration-200 ease-out z-50"
                  >
                    <div className="py-2 px-1">
                      {user.role === "ADMIN" ? (
                        <>
                          <Link
                            href="/admin"
                            className="block px-4 py-2.5 rounded-md hover:bg-[#282d39] text-white transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            🧭 Bảng điều khiển
                          </Link>
                          <Link
                            href="/admin/courses"
                            className="block px-4 py-2.5 rounded-md hover:bg-[#282d39] text-white transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            📚 Quản lý khóa học
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/me"
                            className="block px-4 py-2.5 rounded-md hover:bg-[#282d39] text-white transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            👤 Hồ sơ cá nhân
                          </Link>
                          <Link
                            href="/me/courses"
                            className="block px-4 py-2.5 rounded-md hover:bg-[#282d39] text-white transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                          📚 Khóa học của tôi
                          </Link>
                      <Link
                        href="/me/certificates"
                        className="block px-4 py-2.5 rounded-md hover:bg-[#282d39] text-white transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        🎓 Chứng chỉ của tôi
                      </Link>
                      <Link
                        href="/me/schedule"
                        className="block px-4 py-2.5 rounded-md hover:bg-[#282d39] text-white transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        🗓 Lịch học của tôi
                      </Link>
                      <Link
                        href="/me/profile"
                        className="block px-4 py-2.5 rounded-md hover:bg-[#282d39] text-white transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                            ⚙️ Chỉnh sửa hồ sơ
                          </Link>
                        </>
                      )}

                      {/* Divider */}
                      <div className="border-t my-2"></div>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-2.5 rounded-md text-red-400 hover:bg-[#282d39] transition-colors"
                      >
                        🚪 Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              className="text-white border-white/30 bg-[#282d39] hover:bg-[#3b4354]"
            >
              Đăng nhập
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
