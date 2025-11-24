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
        .ql-toolbar.ql-snow { background:#0f1318; border-color:#3b4354; color:#e5e7eb }
        .ql-container.ql-snow { border-color:#3b4354; background:#0f1318 }
        .ql-editor { color:#ffffff }
        .ql-snow .ql-picker, .ql-snow .ql-picker-label { color:#e5e7eb }
        .ql-snow .ql-picker-options { background:#1c1f27; color:#ffffff; border-color:#3b4354 }
        .ql-snow .ql-stroke { stroke:#cbd5e1 }
        .ql-snow .ql-fill { fill:#cbd5e1 }
        .ql-snow .ql-picker.ql-expanded .ql-picker-label { color:#ffffff }
        .ql-snow .ql-tooltip { background:#1c1f27; border-color:#3b4354; color:#ffffff }
        .ql-snow .ql-tooltip input[type=text] { background:#0f1318; border-color:#3b4354; color:#ffffff }
      `}</style>
    </div>
  );
}
