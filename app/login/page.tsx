"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getMagic } from "@/lib/magic";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast"; // ✅ dùng hệ thống toast của shadcn
import { useAuth } from "@/hooks/useAuth"; 

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Vui lòng nhập email.");
    if (!isValidEmail(email)) return setError("Email không hợp lệ.");
    setError(null);
    setLoading(true);

    try {
      // 1️⃣ Magic OTP → lấy DID token
      const magic = getMagic();
      if (!magic) throw new Error("Magic chưa sẵn sàng trên client");

      const didToken = await magic.auth.loginWithEmailOTP({ email });

      // 2️⃣ Gọi API backend xác thực + set cookie
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { Authorization: `Bearer ${didToken}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Đăng nhập thất bại");

      // 3️⃣ Điều hướng theo vai trò
      if (data.role === "ADMIN") router.replace("/admin");
      else router.replace("/me");
    } catch (err: any) {
      // ✅ Trường hợp người dùng hủy Magic OTP
      if (err.message?.includes("User canceled action")) {
        toast({
          title: "Bạn đã hủy đăng nhập",
          description: "Thử lại khi sẵn sàng nhé!",
          variant: "default",
        });
        return; // không cần setError
      }

      console.error(err);
      setError(err.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111318] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-xl border border-[#3b4354] bg-[#1c1f27] p-8 shadow-lg backdrop-blur-sm"
      >
        <h1 className="mb-2 text-3xl font-bold text-center text-white">
          Đăng nhập
        </h1>
        <p className="mb-6 text-sm text-white/70 text-center">
          Nhập email để nhận mã đăng nhập (Magic OTP).
        </p>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-white/90">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className={`w-full rounded-md border px-3 py-2 outline-none transition focus:ring-2 bg-[#111318] text-white ${
                error
                  ? "border-red-500 focus:ring-red-200"
                  : "border-[#3b4354] focus:ring-[#2161ed]/30"
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {error && (
              <p className="mt-1 text-sm text-red-400 animate-pulse">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#2161ed] px-4 py-2 text-white font-bold transition hover:bg-[#1c51d6] disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Gửi mã đăng nhập"}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500 text-center">
          Chưa có tài khoản? Hệ thống sẽ tạo tự động với vai trò{" "}
          <span className="text-indigo-600 font-medium">Learner</span>.
        </div>
      </motion.div>

      <p className="mt-8 text-xs text-white/60">
        © 2025 FnNFT • Blockchain • AI • WebGIS
      </p>
    </div>
  );
}
