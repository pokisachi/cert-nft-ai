"use client";
import { motion } from "framer-motion";

export default function StatsBar({ content }: any) {
  return (
    <section className="py-16 bg-indigo-600 text-white text-center">
      <h2 className="text-2xl font-semibold mb-10">{content.headline}</h2>
      <div className="flex flex-wrap justify-center gap-12">
        {content.items.map((item: any, idx: number) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.2 }}
            className="flex flex-col"
          >
            <span className="text-4xl font-bold">{item.value}</span>
            <span className="text-sm">{item.label}</span>
            <span className="text-xs opacity-70">cập nhật theo thời gian thực</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
