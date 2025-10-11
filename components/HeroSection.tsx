"use client";
import { motion } from "framer-motion";

export default function HeroSection({ content }: any) {
  return (
    <section className="flex flex-col items-center justify-center text-center py-20 px-6 bg-gradient-to-b from-indigo-50 to-white">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
      >
        {content.title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg text-gray-600 max-w-2xl mb-8"
      >
        {content.subtitle}
      </motion.p>
      <div className="flex gap-4">
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition">
          {content.ctaPrimary}
        </button>
        <button className="px-6 py-3 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition">
          {content.ctaSecondary}
        </button>
      </div>
      <div className="flex gap-3 mt-6">
        {content.badges.map((badge: string) => (
          <span
            key={badge}
            className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full"
          >
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}
