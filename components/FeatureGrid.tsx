"use client";
import { motion } from "framer-motion";
import { LucideSearch, LucideLink2, LucideMapPin } from "lucide-react";

export default function FeatureGrid({ content }: any) {
  const icons = [LucideSearch, LucideLink2, LucideMapPin];
  const featureKeys = ["ai", "sbt", "gis"];

  return (
    <section className="py-16 md:py-24 bg-[#111318]">
      <div className="container mx-auto grid md:grid-cols-3 gap-6 md:gap-12 px-6">
        {featureKeys.map((key, idx) => {
          const f = content[key];
          const Icon = icons[idx];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="p-6 rounded-xl border border-[#3b4354] bg-[#1c1f27] hover:bg-[#272b33] transition"
            >
              <Icon className="w-10 h-10 mb-4 text-white" />
              <h3 className="text-white text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-white/80 mb-4">{f.oneliner}</p>
              <ul className="space-y-2 text-sm text-white/80">
                {f.bullets.map((b: string) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
