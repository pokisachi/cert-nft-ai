"use client";
import { motion } from "framer-motion";
import { LucideSearch, LucideLink2, LucideMapPin } from "lucide-react";

export default function FeatureGrid({ content }: any) {
  const icons = [LucideSearch, LucideLink2, LucideMapPin];
  const featureKeys = ["ai", "sbt", "gis"];

  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="container mx-auto grid md:grid-cols-3 gap-12 px-6">
        {featureKeys.map((key, idx) => {
          const f = content[key];
          const Icon = icons[idx];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <Icon className="w-10 h-10 mb-4 text-indigo-600" />
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600 mb-4">{f.oneliner}</p>
              <ul className="space-y-2 text-sm text-gray-700">
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
