"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { ToastProviderWrapper } from "@/components/ui/use-toast"; // ✅ thêm Toast Provider
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: ReactNode }) {
  // Prevent hydration mismatch by using client-side only rendering for theme
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  // ✅ Cấu hình React Query client (cache, retry, UX mượt)
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // cache 5 phút
            gcTime: 10 * 60 * 1000,   // xóa sau 10 phút
            retry: 1,                 // retry 1 lần
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
        },
      })
  );

  useEffect(() => {
    const onUnhandled = (e: PromiseRejectionEvent) => {
      const r: any = e.reason
      const msg = String(r?.message || r || '').toLowerCase()
      const stack = String(r?.stack || '').toLowerCase()
      if (msg.includes('payload') && stack.includes('givefreely.tsx')) {
        e.preventDefault()
        return
      }
    }
    const onError = (ev: ErrorEvent) => {
      const src = String(ev?.filename || '').toLowerCase()
      const msg = String(ev?.message || '').toLowerCase()
      if (src.includes('givefreely.tsx') || msg.includes('givefreely.tsx')) {
        ev.preventDefault()
        return
      }
    }
    const origError = console.error
    const origWarn = console.warn
    const shouldFilter = (...args: any[]) => {
      try {
        for (const a of args) {
          const s = String(a ?? '').toLowerCase()
          if (s.includes('givefreely.tsx')) return true
        }
      } catch {}
      return false
    }
    console.error = (...args: any[]) => {
      if (shouldFilter(...args)) return
      origError(...args)
    }
    console.warn = (...args: any[]) => {
      if (shouldFilter(...args)) return
      origWarn(...args)
    }
    window.addEventListener('unhandledrejection', onUnhandled)
    window.addEventListener('error', onError)
    return () => {
      window.removeEventListener('unhandledrejection', onUnhandled)
      window.removeEventListener('error', onError)
      console.error = origError
      console.warn = origWarn
    }
  }, [])

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <ToastProviderWrapper>
          {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
        </ToastProviderWrapper>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
