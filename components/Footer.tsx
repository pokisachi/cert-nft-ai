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
    <footer className="py-10 bg-background text-center border-t border-border">
      <h4 className="text-lg font-semibold text-foreground mb-2">{data.tagline}</h4>
      <p className="text-sm text-foreground/70 mb-6">{data.subline}</p>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {data.links.map((link: string) => (
          <a key={link} href="#" className="text-foreground/70 hover:text-foreground transition-colors">
            {link}
          </a>
        ))}
      </div>
    </footer>
  );
}
