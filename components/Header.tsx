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

  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          FnNFT
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="/courses" className="hover:text-indigo-600">
            Khóa học
          </Link>
          <Link href="/verify" className="hover:text-indigo-600">
            Xác thực
          </Link>
          <Link href="/branches" className="hover:text-indigo-600">
            Chi nhánh
          </Link>
        </nav>

        {/* User area */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3" ref={menuRef}>
              {/* 🔔 Chuông thông báo */}
              <button
                onClick={() => router.push("/me/announcements")}
                className="relative p-2 rounded-full hover:bg-indigo-50 transition-colors"
                title="Thông báo"
              >
                <Bell className="w-5 h-5 text-gray-600 hover:text-indigo-600 transition-colors" />
                {/* Nếu bạn có API thông báo chưa đọc, bật phần badge này: */}
                {/* <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">
                  3
                </span> */}
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
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {user.name || user.email}
                  </span>
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white/95 
                               backdrop-blur-sm shadow-lg text-sm animate-fadeInScale transition-all duration-200 ease-out z-50"
                  >
                    <div className="py-2 px-1">
                      {user.role === "ADMIN" ? (
                        <>
                          <Link
                            href="/admin"
                            className="block px-4 py-2.5 rounded-md hover:bg-indigo-50 text-gray-700 transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            🧭 Bảng điều khiển
                          </Link>
                          <Link
                            href="/admin/courses"
                            className="block px-4 py-2.5 rounded-md hover:bg-indigo-50 text-gray-700 transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            📚 Quản lý khóa học
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/me"
                            className="block px-4 py-2.5 rounded-md hover:bg-indigo-50 text-gray-700 transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            👤 Hồ sơ cá nhân
                          </Link>
                          <Link
                            href="/me/courses"
                            className="block px-4 py-2.5 rounded-md hover:bg-indigo-50 text-gray-700 transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                          📚 Khóa học của tôi
                          </Link>
                          <Link
                            href="/me/certificates"
                            className="block px-4 py-2.5 rounded-md hover:bg-indigo-50 text-gray-700 transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            🎓 Chứng chỉ của tôi
                          </Link>
                          <Link
                            href="/me/profile"
                            className="block px-4 py-2.5 rounded-md hover:bg-indigo-50 text-gray-700 transition-colors"
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
                        className="block w-full text-left px-4 py-2.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
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
              className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
            >
              Đăng nhập
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
