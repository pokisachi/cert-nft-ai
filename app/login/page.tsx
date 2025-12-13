"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getMagic } from "@/lib/magic";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast"; // ✅ dùng hệ thống toast của shadcn
 

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
    <div className="relative min-h-screen bg-white text-gray-900 overflow-hidden lg:grid lg:grid-cols-[3fr_2fr]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-80px] -left-40 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-25 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-[140px] opacity-25 animate-blob animation-delay-4000"></div>
      </div>
      <div className="relative hidden lg:flex items-center justify-center p-10">
        <motion.svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 800 800" preserveAspectRatio="none" initial={{ opacity: 0.18 }} animate={{ opacity: [0.18, 0.24, 0.18] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}>
          <defs>
            <radialGradient id="g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00ffff" stopOpacity="0.05" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="800" height="800" fill="url(#g)" />
          {Array.from({ length: 14 }).map((_, i) => (
            <circle key={`c-${i}`} cx={60 + i * 50} cy={80 + (i % 7) * 90} r={2.5} fill="#fff" />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`vl-${i}`} x1={i * 70} y1={0} x2={i * 70} y2={800} stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`hl-${i}`} x1={0} y1={i * 80} x2={800} y2={i * 80} stroke="#7dd3fc" strokeOpacity="0.12" strokeWidth="1" />
          ))}
          <path d="M100 120 L180 200 L240 160 L320 240" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.5" fill="none" />
          <path d="M420 180 L500 260 L560 220 L640 300" stroke="#7dd3fc" strokeOpacity="0.16" strokeWidth="1.5" fill="none" />
          <rect x="520" y="120" width="22" height="22" fill="none" stroke="#ffffff" strokeOpacity="0.15" transform="rotate(18 531 131)" />
          <rect x="260" y="420" width="18" height="18" fill="none" stroke="#7dd3fc" strokeOpacity="0.12" transform="rotate(-12 269 429)" />
        </motion.svg>

        <div className="relative w-full max-w-3xl flex flex-col items-center gap-10 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-fuchsia-700 to-cyan-700">Tương lai của Chứng chỉ số</h1>
          <p className="mt-2 text-lg font-medium text-gray-600">Bảo mật bằng Blockchain, tối ưu bởi AI cho giáo dục hiện đại.</p>
          <motion.div
            className="relative w-4/5 max-w-2xl"
            initial={{ y: 0 }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative rounded-3xl p-[2px] bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-indigo-600 shadow-2xl shadow-indigo-200/40">
              <div className="relative rounded-3xl bg-white overflow-hidden">
                <div className="absolute inset-0 mesh-card opacity-30"></div>
                <div className="absolute inset-0 rounded-3xl holo-foil opacity-35 mix-blend-multiply"></div>
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-fuchsia-400/50 blur-2xl rounded-full mix-blend-multiply"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-cyan-400/50 blur-2xl rounded-full mix-blend-multiply"></div>
                <div className="px-10 py-14">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-medium text-slate-500">NFT Certificate</span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-sm">Verified</span>
                  </div>
                  <h3 className="text-5xl font-extrabold tracking-tight text-slate-900">NFT Cert</h3>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 md:p-12 bg-white/80 backdrop-blur-xl border border-gray-200/70 rounded-3xl shadow-2xl shadow-black/10"
        >
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-fuchsia-700 to-cyan-700">Đăng nhập</h1>
          <p className="mb-6 text-sm text-gray-600 text-center">Nhập email để nhận mã đăng nhập (Magic OTP).</p>

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={`w-full rounded-2xl border px-3 py-2 outline-none transition bg-white text-gray-900 placeholder:text-gray-400 ${
                  error ? "border-rose-500 focus:ring-2 focus:ring-rose-400/30" : "border-gray-300 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-500/20 ring-1 ring-black/5 hover:scale-[1.02] hover:shadow-xl disabled:opacity-60 transition"
            >
              {loading ? "Đang gửi..." : "Gửi mã đăng nhập"}
            </button>
          </form>

          <div className="mt-6 text-xs text-gray-600 text-center">
            Chưa có tài khoản? Hệ thống sẽ tạo tự động với vai trò <span className="text-indigo-600 font-medium">Learner</span>.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
