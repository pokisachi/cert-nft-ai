"use client";

import * as React from "react";
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

// ✅ Tạo context
const ToastContext = React.createContext<{
  toast: (props: ToastProps) => void;
} | null>(null);

// ✅ Hook tiện dụng
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProviderWrapper");
  }
  return context;
}

// ✅ Provider gói toàn app
export function ToastProviderWrapper({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = (props: ToastProps) => setToasts((prev) => [...prev, props]);
  const close = (index: number) =>
    setToasts((prev) => prev.filter((_, i) => i !== index));

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProvider>
        {children}
        {toasts.map((t, i) => (
          <Toast
            key={i}
            variant={t.variant}
            open
            onOpenChange={() => close(i)}
          >
            <div className="flex flex-col space-y-1">
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && (
                <ToastDescription>{t.description}</ToastDescription>
              )}
            </div>
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

// ✅ Hàm tiện lợi để gọi toast trực tiếp (giống shadcn)
export function toast(props: ToastProps) {
  const event = new CustomEvent("toast", { detail: props });
  window.dispatchEvent(event);
}
