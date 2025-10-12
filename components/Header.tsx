"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // 👈 ref để phát hiện click ngoài menu

  // ✅ Nếu user là ADMIN → khi click logo FnNFT, chuyển tới /admin
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user?.role === "ADMIN") router.push("/admin");
    else router.push("/");
  };

  // 👇 Đóng menu khi click ra ngoài vùng dropdown
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
          className="text-xl font-bold text-indigo-600"
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

        {/* User Area */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2"
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
                <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-md text-sm animate-fadeIn">
                  {user.role === "ADMIN" ? (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Quản trị
                    </Link>
                  ) : (
                    <Link
                      href="/me"
                      className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Hồ sơ cá nhân
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
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
