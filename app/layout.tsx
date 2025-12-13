import type { Metadata } from "next";
import "./globals.css";
import HeaderWrapper from "@/components/layout/HeaderWrapper";
import Footer from "@/components/Footer";
import Providers from "./providers"; 
import { Toaster } from "@/components/ui/toaster";
import MiniMapWidget from "@/components/MiniMapWidget";
import { Noto_Sans } from "next/font/google";

const noto = Noto_Sans({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "700", "900"], display: "swap", variable: "--font-sans" });

export const metadata: Metadata = {
  title: "FnNFT – Nền tảng chứng chỉ NFT cho giáo dục",
  description:
    "Cấp & xác thực chứng chỉ minh bạch với NFT/SBT, AI OCR & WebGIS. Chống giả mạo, tra cứu on-chain, xác minh tức thì cho cơ sở đào tạo & doanh nghiệp.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className="dark">
      <body className={`${noto.className} ${noto.variable} min-h-screen flex flex-col bg-background`} suppressHydrationWarning>
        <Providers>
          {/*  Header và Footer được render bên trong provider */}
          <HeaderWrapper />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
          <Toaster />
          <MiniMapWidget />
        </Providers>
      </body>
    </html>
  );
}
