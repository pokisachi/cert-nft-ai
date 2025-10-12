"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function HeaderWrapper() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isAuthPage = pathname.startsWith("/login");

  // ✅ Ẩn Header ở /admin và /login
  if (isAdmin || isAuthPage) return null;

  return <Header />;
}
