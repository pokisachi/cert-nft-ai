"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { ToastProviderWrapper } from "@/components/ui/use-toast"; // ✅ thêm Toast Provider

export default function Providers({ children }: { children: ReactNode }) {
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

  return (
    <QueryClientProvider client={client}>
      {/* ✅ Bọc toàn app trong ToastProviderWrapper để useToast hoạt động */}
      <ToastProviderWrapper>{children}</ToastProviderWrapper>
    </QueryClientProvider>
  );
}
