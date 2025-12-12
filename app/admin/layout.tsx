"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Home, BookOpen, FileText, Users, UsersRound, BadgeCheck, Megaphone, DoorOpen, Building2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen] = useState(false);


  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] text-slate-600">
        Đang tải thông tin quản trị...
      </div>
    );

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-800 flex flex-col">
      <div className="flex flex-1">
        <aside
          className={cn(
            "bg.white border-r border-slate-200 w-60 p-4 flex-shrink-0 transform md:transform-none transition-all",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="mb-3 text-slate-900 font-semibold">FnNFT</div>
          <nav className="space-y-2 text-sm font-medium">
            <Link
              href="/admin"
              className={cn(
                "block px-3 py-2 rounded bg-transparent hover:bg-slate-100 text-slate-700",
                pathname === "/admin" && "bg-slate-100"
              )}
            >
              <span className="inline-flex items-center gap-2"><Home className="h-4 w-4" />Bảng điều khiển</span>
            </Link>
            <Link
              href="/admin/courses"
              className={cn(
                "block px-3 py-2 rounded bg-transparent hover:bg-slate-100 text-slate-700",
                pathname.startsWith("/admin/courses") && "bg-slate-100"
              )}
            >
            <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" />Khóa học</span>
            </Link>
            <Link
              href="/admin/exams"
              className={cn(
                "block px-3 py-2 rounded bg-transparent hover:bg-slate-100 text-slate-700",
                pathname.startsWith("/admin/exams") && "bg-slate-100"
              )}
            >
            <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" />Kỳ thi</span>
            </Link>
            <Link
              href="/admin/learners"
              className={cn(
                "block px-3 py-2 rounded bg-transparent hover:bg-slate-100 text-slate-700",
                pathname.startsWith("/admin/learners") && "bg-slate-100"
              )}
            >
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />Người học</span>
            </Link>
            <Link
              href="/admin/teachers"
              className={cn(
                "block px-3 py-2 rounded bg-transparent hover:bg-slate-100 text-slate-700",
                pathname.startsWith("/admin/teachers") && "bg-slate-100"
              )}
            >
            <span className="inline-flex items-center gap-2"><UsersRound className="h-4 w-4" />Giảng viên</span>
            </Link>
            <Link
              href="/admin/certificates"
              className={cn(
                "block px-3 py-2 rounded bg-transparent hover:bg-slate-100 text-slate-700",
                pathname.startsWith("/admin/certificates") && "bg-slate-100"
              )}
            >
            <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4" />Chứng chỉ</span>
            </Link>
            <Link
              href="/admin/announcements"
              className={cn(
                "block px-3 py-2 rounded bg-transparent hover:bg-slate-100 text-slate-700",
                pathname.startsWith("/admin/announcements") && "bg-slate-100"
              )}
            >
              <span className="inline-flex items-center gap-2"><Megaphone className="h-4 w-4" />Thông báo</span>
            </Link>
            <Link
              href="/admin/rooms"
              className={cn(
                "block px-3 py-2 rounded bg-transparent hover:bg-slate-100 text-slate-700",
                pathname.startsWith("/admin/rooms") && "bg-slate-100"
              )}
            >
              <span className="inline-flex items-center gap-2"><DoorOpen className="h-4 w-4" />Phòng học</span>
            </Link>
            <Link
              href="/admin/branches"
              className={cn(
                "block px-3 py-2 rounded bg-transparent hover:bg-slate-100 text-slate-700",
                pathname.startsWith("/admin/branches") && "bg-slate-100"
              )}
            >
              <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4" />Chi nhánh</span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6 text-slate-800">{children}</main>
      </div>
    </div>
  );
}
