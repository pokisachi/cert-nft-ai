"use client";

import { Toaster as Sonner } from "sonner";

// ✅ Đây là component hiển thị tất cả toast notifications
export function Toaster() {
  return <Sonner richColors position="top-right" closeButton />;
}
