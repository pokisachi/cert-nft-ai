"use client";
import { motion } from "framer-motion";

export default function StatsBar({ content }: any) {
  return (
    <section className="py-16 bg-[#111318] text-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-6">{content.headline}</h2>
        <div className="flex flex-wrap gap-4">
          {content.items.map((item: any, idx: number) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 bg-[#282d39]"
            >
              <span className="text-base font-medium">{item.label}</span>
              <span className="text-2xl font-bold tracking-tight">{item.value}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
