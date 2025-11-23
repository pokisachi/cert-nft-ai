"use client";
import { motion } from "framer-motion";

export default function HeroSection({ content }: any) {
  return (
    <section
      className="flex flex-col items-start justify-end text-left py-16 md:py-24 px-6 md:px-10 bg-[#111318]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%), url(https://lh3.googleusercontent.com/aida-public/AB6AXuCUk4w3VJdhxeFJt_VwBo7Wbb4ZBXPklU4zC0PuiBGdkVNQeHddadzu4v7FEvMRGznOj2DtllCo2a8P2wOYgz_dz19KGaeJ0mGR2scH-2DNLyG9rEfq5HnpxUZ1XQveiQrg-qPW1UCCTSw1y3JMMntEDQxKwLQhqJPXL19Q2GcD5yXGfS57fxV6-0wSoFss96uI863W6hed9oZY_kATgrCWf8FtUFyxLXEQFnLqr9yVgJXfw9ppbWnHGwyuEVE-ZNXjLoDzWD5J13g)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-3xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight"
        >
          {content.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/90 text-sm md:text-base mt-2 max-w-2xl"
        >
          {content.subtitle}
        </motion.p>
        <div className="flex flex-wrap gap-3 mt-6">
          <button className="h-10 md:h-12 px-4 md:px-5 rounded-xl bg-[#2161ed] text-white text-sm md:text-base font-bold">
            {content.ctaPrimary}
          </button>
          <button className="h-10 md:h-12 px-4 md:px-5 rounded-xl bg-[#282d39] text-white text-sm md:text-base font-bold">
            {content.ctaSecondary}
          </button>
        </div>
        <div className="flex gap-2 mt-6">
          {content.badges.map((badge: string) => (
            <span key={badge} className="text-xs text-white/80 px-3 py-1 rounded-full border border-[#3b4354]">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
