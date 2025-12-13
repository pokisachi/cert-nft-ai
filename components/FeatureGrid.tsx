"use client";
import { motion } from "framer-motion";
import { LucideSearch, LucideLink2, LucideMapPin } from "lucide-react";

export default function FeatureGrid({ content }: any) {
  const icons = [LucideSearch, LucideLink2, LucideMapPin];
  const featureKeys = ["ai", "sbt", "gis"];

  return (
    <section className="py-16 md:py-24 bg-gray-50">
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
              className="p-6 rounded-xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-gray-800 text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600 mb-4">{f.oneliner}</p>
              <ul className="space-y-2 text-sm text-gray-600">
                {f.bullets.map((b: string) => (
                  <li key={b} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
