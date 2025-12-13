"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
interface SafeReactQuillProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SafeReactQuill({ value, onChange }: SafeReactQuillProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="border rounded p-2 text-gray-400">
        Đang tải trình soạn thảo...
      </div>
    );
  }

  return (
    <div suppressHydrationWarning>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "clean"],
          ],
        }}
      />
      <style>{`
        .ql-toolbar.ql-snow { background:#ffffff; border-color:#e5e7eb; color:#111827 }
        .ql-container.ql-snow { border-color:#e5e7eb; background:#ffffff }
        .ql-editor { color:#111827 }
        .ql-snow .ql-picker, .ql-snow .ql-picker-label { color:#374151 }
        .ql-snow .ql-picker-options { background:#ffffff; color:#111827; border-color:#e5e7eb }
        .ql-snow .ql-stroke { stroke:#6b7280 }
        .ql-snow .ql-fill { fill:#6b7280 }
        .ql-snow .ql-picker.ql-expanded .ql-picker-label { color:#111827 }
        .ql-snow .ql-tooltip { background:#ffffff; border-color:#e5e7eb; color:#111827 }
        .ql-snow .ql-tooltip input[type=text] { background:#ffffff; border-color:#e5e7eb; color:#111827 }
      `}</style>
    </div>
  );
}
