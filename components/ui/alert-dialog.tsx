"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AlertDialogContextValue = { open: boolean; onOpenChange: (v: boolean) => void };
const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null);

function AlertDialog({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (v: boolean) => void; children: React.ReactNode }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const value = { open: open ?? internalOpen, onOpenChange: onOpenChange ?? setInternalOpen };
  return <AlertDialogContext.Provider value={value}>{children}</AlertDialogContext.Provider>;
}

function AlertDialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  const ctx = React.useContext(AlertDialogContext);
  if (!ctx) return <>{children}</>;
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, { onClick: () => ctx.onOpenChange(true) } as any);
  }
  return (
    <button type="button" onClick={() => ctx.onOpenChange(true)}>
      {children}
    </button>
  );
}

function AlertDialogOverlay({ className }: { className?: string }) {
  return <div className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-md", className)} />;
}

function AlertDialogContent({ className, variant = "dark", children }: { className?: string; variant?: "light" | "dark"; children: React.ReactNode }) {
  const ctx = React.useContext(AlertDialogContext);
  if (!ctx || !ctx.open) return null;
  return (
    <>
      <AlertDialogOverlay />
      <div
        className={cn(
          "fixed z-50 grid w-full max-w-md gap-4 border p-6 shadow-lg rounded-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          variant === "dark" ? "bg-[#1c1f27] border-[#3b4354] text-white" : "bg-white border-gray-200 text-gray-900",
          className
        )}
      >
        {children}
      </div>
    </>
  );
}

function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />;
}

const AlertDialogTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<"h2">>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<"p">>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm", className)} {...props} />
));
AlertDialogDescription.displayName = "AlertDialogDescription";

function AlertDialogAction({ asChild, children, ...props }: { asChild?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, props);
  }
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

function AlertDialogCancel({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(AlertDialogContext);
  return (
    <button type="button" className={className} onClick={() => ctx?.onOpenChange(false)}>
      {children}
    </button>
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
