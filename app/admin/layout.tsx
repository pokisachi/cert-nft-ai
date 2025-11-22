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
      {/* Header admin đã loại bỏ theo yêu cầu */}

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
              href="/admin/teachers"
              className={cn(
                "block px-3 py-2 rounded hover:bg-indigo-50 hover:text-indigo-600",
                pathname.startsWith("/admin/teachers") && "bg-indigo-100 text-indigo-700"
              )}
            >
           Giáo Viên 
            </Link>
            <Link
              href="/admin"
              className={cn(
                "block px-3 py-2 rounded hover:bg-indigo-50 hover:text-indigo-600",
                pathname.startsWith("/admin") && "bg-indigo-100 text-indigo-700"
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
            <Link
              href="/admin/rooms"
              className={cn(
                "block px-3 py-2 rounded hover:bg-indigo-50 hover:text-indigo-600",
                pathname.startsWith("/admin/rooms") && "bg-indigo-100 text-indigo-700"
              )}
            >
              Rooms
            </Link>
            <Link
              href="/admin/branches"
              className={cn(
                "block px-3 py-2 rounded hover:bg-indigo-50 hover:text-indigo-600",
                pathname.startsWith("/admin/branches") && "bg-indigo-100 text-indigo-700"
              )}
            >
              Quản lý Chi nhánh
            </Link>
          </nav>
        </aside>

        {/* Nội dung chính */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
