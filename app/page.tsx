"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import FeatureGrid from "@/components/FeatureGrid";
import StatsBar from "@/components/StatsBar";
import Footer from "@/components/Footer";
import home from "@/lib/i18n/home.json";

// 🧱 Interface cho dữ liệu thông báo
interface Notification {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export default function HomePage() {
  const [pinned, setPinned] = useState<Notification[]>([]);
  const [active, setActive] = useState(0);

  // 📦 Gọi API lấy tin nổi bật
  useEffect(() => {
    const fetchPinned = async () => {
      try {
        const res = await fetch("/api/notifications/pinned");
        if (!res.ok) throw new Error("Không thể tải thông báo nổi bật");
        const data = await res.json();
        setPinned(data);
      } catch (error) {
        console.error("Error fetching pinned announcements:", error);
      }
    };
    fetchPinned();
  }, []);

  // ⏱️ Tự động đổi tin mỗi 4 giây
  useEffect(() => {
    if (pinned.length === 0) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % pinned.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [pinned]);

  return (
    <main className="min-h-screen flex flex-col bg-[#111318] text-white">
      {/* ✅ PHẦN TIN NỔI BẬT - NHỎ GỌN */}
      {pinned.length > 0 && (
        <section className="bg-[#1c1f27] border-b border-[#282d39] py-2">
          <div className="max-w-3xl mx-auto px-3 text-center">
            <h2 className="text-base font-semibold text-white/80 mb-2 flex items-center justify-center gap-1">
              📢 Tin nổi bật
            </h2>

            <div className="relative min-h-[70px] flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pinned[active].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="bg-[#282d39] border border-[#3b4354] rounded-md py-2 px-4 inline-block max-w-md"
                >
                  <h3 className="font-medium text-sm text-white truncate">
                    {pinned[active].title}
                  </h3>
                  <p className="text-xs text-white/80 mt-1 line-clamp-2">
                    {pinned[active].content}
                  </p>
                  <p className="text-[10px] text-white/60 mt-1">
                    {new Date(pinned[active].createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-center gap-1 mt-2">
              {pinned.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    i === active ? "bg-white scale-125" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 🔹 Các section chính của trang chủ */}
      <HeroSection content={home.home.hero} />
      <FeatureGrid content={home.home.features} />
      <StatsBar content={home.home.stats} />
    </main>
  );
}
