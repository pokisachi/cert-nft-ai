"use client";

import { Toaster as Sonner } from "sonner";
import { CheckCircle, OctagonX, Info, TriangleAlert, Loader2 } from "lucide-react";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      visibleToasts={1}
      offset={24}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "!w-full !min-w-[400px] !max-w-[560px] !rounded-2xl !border !border-gray-200 !bg-white !text-gray-900 !shadow-2xl !px-6 !py-5",
          title: "!text-lg !font-semibold",
          description: "!text-base !text-gray-700",
          actionButton:
            "!rounded-md !border !border-gray-200 !bg-gray-50 !text-sm !font-medium !px-3 !py-1.5",
          closeButton: "!rounded-md !text-gray-500 hover:!text-gray-900",
          success: "!border-green-300",
          error: "!border-red-300",
          info: "!border-blue-300",
          warning: "!border-amber-300",
          loading: "",
        },
      }}
      icons={{
        success: <CheckCircle className="h-7 w-7 text-green-600" />,
        error: <OctagonX className="h-7 w-7 text-red-600" />,
        info: <Info className="h-7 w-7 text-blue-600" />,
        warning: <TriangleAlert className="h-7 w-7 text-amber-600" />,
        loading: <Loader2 className="h-6 w-6 animate-spin text-gray-600" />,
      }}
    />
  );
}
