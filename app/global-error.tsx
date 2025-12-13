'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex items-center justify-center bg-white text-gray-900" style={{ fontFamily: 'Noto Sans, Arial, Helvetica, sans-serif' }}>
        <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl border border-gray-200/70 rounded-3xl shadow-2xl shadow-black/10 text-center">
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-fuchsia-700 to-cyan-700">Đã có lỗi xảy ra</h1>
          <p className="mb-4 text-sm text-gray-600">{error.message || 'Lỗi không xác định.'}</p>
          <button onClick={reset} className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-500/20 ring-1 ring-black/5">
            Thử tải lại
          </button>
        </div>
      </body>
    </html>
  );
}
