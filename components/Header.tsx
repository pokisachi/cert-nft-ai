"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useMyAnnouncements } from "@/app/me/hooks/useMyAnnouncements";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { data: notifData, isLoading: notifLoading, markAllRead } = useMyAnnouncements(5, !!user);

  // ✅ Click logo → Admin vào /admin, user thường vào /
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user?.role === "ADMIN") router.push("/admin");
    else router.push("/");
  };

  // ✅ Click ngoài để đóng các dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);
  
  // Handle scroll detection for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    // Initial check
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

  const cancelNotifClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleNotifClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setNotifOpen(false);
    }, 200);
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300",
      scrolled 
        ? "bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm" 
        : "bg-transparent border-none"
    )}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="text-lg font-bold text-foreground tracking-tight"
        >
          FnNFT
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground">
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
            <div className="h-8 w-20 bg-muted rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3" ref={menuRef}>
              <div className="relative" ref={notifRef}
                   onMouseEnter={() => { setNotifOpen(true); cancelNotifClose(); }}
                   onMouseLeave={scheduleNotifClose}>
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  onMouseEnter={cancelNotifClose}
                  onMouseLeave={scheduleNotifClose}
                  className="relative p-2 rounded-full hover:bg-accent transition-colors"
                  title="Thông báo"
                  >
                  <Bell className="w-5 h-5 text-foreground/80 hover:text-foreground transition-colors" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] leading-none">
                      {unread > 9 ? "9+" : String(unread)}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full -mt-2 pt-4 w-96 rounded-xl border border-gray-100 bg-white shadow-xl z-50"
                       onMouseEnter={cancelNotifClose}
                       onMouseLeave={scheduleNotifClose}>
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900">Thông báo mới</div>
                      <button
                        className="text-sm px-3 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                        disabled={!notifData || (notifData?.unreadCount || 0) === 0 || markAllRead.isPending}
                        onClick={() => markAllRead.mutate()}
                      >
                        Đánh dấu đã đọc
                      </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                      {notifLoading ? (
                        <div className="p-4 text-sm text-gray-600">Đang tải...</div>
                      ) : (notifData?.items?.length || 0) === 0 ? (
                        <div className="p-4 text-sm text-gray-600">Không có thông báo mới.</div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {notifData!.items.slice(0, 5).map((a) => (
                            <li key={a.id} className="p-4 hover:bg-blue-50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 opacity-90" style={{ visibility: a.isRead ? 'hidden' : 'visible' }} />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 truncate">{a.title}</div>
                                  <div className="text-xs text-gray-600 line-clamp-2">{a.content}</div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="sticky bottom-0 bg-white border-t border-gray-100">
                      <Link href="/notifications" className="block w-full px-4 py-2 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50">
                        Xem tất cả
                      </Link>
                    </div>
                  </div>
                )}
              </div>

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
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground hidden sm:inline">
                    {user.name || user.email}
                  </span>
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-muted bg-background/95 backdrop-blur-sm shadow-lg text-sm animate-fadeInScale transition-all duration-200 ease-out z-50"
                  >
                    <div className="py-2 px-1">
                      {user.role === "ADMIN" ? (
                        <>
                          <Link
                            href="/admin"
                            className="block px-4 py-2.5 rounded-md hover:bg-muted text-foreground transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            🧭 Bảng điều khiển
                          </Link>
                          <Link
                            href="/admin/courses"
                            className="block px-4 py-2.5 rounded-md hover:bg-muted text-foreground transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            📚 Quản lý khóa học
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/me"
                            className="block px-4 py-2.5 rounded-md hover:bg-muted text-foreground transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            👤 Hồ sơ cá nhân
                          </Link>
                          <Link
                            href="/me/courses"
                            className="block px-4 py-2.5 rounded-md hover:bg-muted text-foreground transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                          📚 Khóa học của tôi
                          </Link>
                      <Link
                        href="/me/certificates"
                        className="block px-4 py-2.5 rounded-md hover:bg-muted text-foreground transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        🎓 Chứng chỉ của tôi
                      </Link>
                      <Link
                        href="/me/schedule"
                        className="block px-4 py-2.5 rounded-md hover:bg-muted text-foreground transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        🗓 Lịch học của tôi
                      </Link>
                      <Link
                        href="/me/profile"
                        className="block px-4 py-2.5 rounded-md hover:bg-muted text-foreground transition-colors"
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
                        className="block w-full text-left px-4 py-2.5 rounded-md text-red-400 hover:bg-muted transition-colors"
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
              className="px-6 py-2 font-semibold text-white transition-all bg-blue-600 rounded-full shadow-sm hover:bg-blue-700 hover:shadow-md border border-transparent"
            >
              Đăng nhập
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
