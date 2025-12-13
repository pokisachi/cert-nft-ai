import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl border border-gray-200/70 rounded-3xl shadow-2xl shadow-black/10 text-center">
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-fuchsia-700 to-cyan-700">Không tìm thấy trang</h1>
        <p className="mb-4 text-sm text-gray-600">Trang bạn yêu cầu không tồn tại.</p>
        <Link href="/" className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-500/20 ring-1 ring-black/5">
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
