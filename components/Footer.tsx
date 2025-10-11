"use client";

export default function Footer({ content }: { content?: any }) {
  // ✅ Nếu không truyền gì, dùng nội dung mặc định
  const data =
    content || {
      tagline: "FnNFT – Hạ tầng mở cho giáo dục minh bạch.",
      subline: "© 2025 FnNFT • Blockchain • AI • WebGIS",
      links: ["Tài liệu", "GitHub", "Liên hệ", "Chính sách", "Demo"],
    };

  return (
    <footer className="py-10 bg-gray-900 text-gray-300 text-center">
      <h4 className="text-lg font-semibold text-white mb-2">
        {data.tagline}
      </h4>
      <p className="text-sm mb-6">{data.subline}</p>

      <div className="flex justify-center gap-4 text-sm">
        {data.links.map((link: string) => (
          <a
            key={link}
            href="#"
            className="hover:text-white transition-colors"
          >
            {link}
          </a>
        ))}
      </div>
    </footer>
  );
}
