"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null); // 👈 ref để phát hiện click ngoài menu

  // 🔐 Bảo vệ route
  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // 🚀 Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Đang tải thông tin quản trị...
      </div>
    );

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 🔹 Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo bên trái */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <Link
              href="/admin"
              className="text-xl font-bold text-indigo-600 whitespace-nowrap"
            >
              FnNFT Admin
            </Link>
          </div>

          {/* Menu giữa */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
            <Link href="/admin/verify" className="hover:text-indigo-600 transition">
              Xác thực
            </Link>
            <Link href="/admin/branches" className="hover:text-indigo-600 transition">
              Chi nhánh
            </Link>
          </nav>

          {/* Avatar + Dropdown bên phải */}
          <div className="relative flex items-center gap-3" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full border"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                  {user.name?.[0]?.toUpperCase() || "A"}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {user.name}
              </span>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-12 w-44 bg-white border rounded-md shadow-md py-2 text-sm animate-fadeIn">
                <Link
                  href="/admin/profile"
                  className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Hồ sơ quản trị
                </Link>
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
        </div>
      </header>

      {/* 🔹 Layout gồm sidebar + content */}
      <div className="flex flex-1">
        <aside
          className={cn(
            "bg-white border-r w-60 p-4 flex-shrink-0 transform md:transform-none transition-all",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <nav className="space-y-2 text-sm font-medium text-gray-700">
            <Link
              href="/admin"
              className={cn(
                "block px-3 py-2 rounded hover:bg-indigo-50 hover:text-indigo-600",
                pathname === "/admin" && "bg-indigo-100 text-indigo-700"
              )}
            >
              📊Dashboard
            </Link>
            <Link
              href="/admin/courses"
              className={cn(
                "block px-3 py-2 rounded hover:bg-indigo-50 hover:text-indigo-600",
                pathname.startsWith("/admin/courses") && "bg-indigo-100 text-indigo-700"
              )}
            >
            Quản lý Khóa học
            </Link>
            <Link
              href="/admin/exams"
              className={cn(
                "block px-3 py-2 rounded hover:bg-indigo-50 hover:text-indigo-600",
                pathname.startsWith("/admin/courses") && "bg-indigo-100 text-indigo-700"
              )}
            >
            Quản lý Khóa thi
            </Link>
            <Link
              href="/admin/learners"
              className={cn(
                "block px-3 py-2 rounded hover:bg-indigo-50 hover:text-indigo-600",
                pathname.startsWith("/admin/learners") && "bg-indigo-100 text-indigo-700"
              )}
            >
            Quản lý Người dùng
            </Link>
            <Link
              href="/admin/cc"
              className={cn(
                "block px-3 py-2 rounded hover:bg-indigo-50 hover:text-indigo-600",
                pathname.startsWith("/admin/cc") && "bg-indigo-100 text-indigo-700"
              )}
            >
            Quản lý Chứng chỉ
            </Link>
            <Link
              href="/admin/announcements"
              className={cn(
                "block px-3 py-2 rounded hover:bg-indigo-50 hover:text-indigo-600",
                pathname.startsWith("/admin/announcements") && "bg-indigo-100 text-indigo-700"
              )}
            >
              Quản lý thông báo
            </Link>
          </nav>
        </aside>

        {/* Nội dung chính */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
