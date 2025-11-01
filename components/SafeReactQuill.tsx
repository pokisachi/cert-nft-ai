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
    </div>
  );
}
