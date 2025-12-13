"use client";

import { motion } from "framer-motion";
import { LucideSearch, LucideLink2, LucideMapPin } from "lucide-react";

interface Stat {
  label: string;
  value: string;
}

interface StatsAndFeaturesProps {
  stats?: Stat[];
  features: any;
  theme?: "dark" | "light";
}

export default function StatsAndFeatures({ stats, features, theme = "light" }: StatsAndFeaturesProps) {
  const icons = [LucideSearch, LucideLink2, LucideMapPin];
  const featureKeys = ["ai", "sbt", "gis"];
  // Always use light mode regardless of theme prop
  const isDark = false;
  
  return (
    <section className="py-16 bg-white border-y border-gray-200">
      <div className="container mx-auto px-6">
        {/* Stats Row */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`text-center p-4 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-white"} shadow-sm`}
              >
                <p className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
                  isDark ? "from-blue-400 to-purple-400" : "from-blue-600 to-indigo-700"
                }`}>
                  {stat.value}
                </p>
                <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {featureKeys.map((key, idx) => {
            const f = features[key];
            const Icon = icons[idx];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`p-6 rounded-xl ${
                  isDark 
                    ? "bg-slate-800 border border-slate-700 hover:border-blue-500/30" 
                    : "bg-white border border-gray-200 hover:border-blue-200"
                } hover:shadow-md transition-all duration-300`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                  isDark ? "bg-slate-700" : "bg-blue-50"
                }`}>
                  <Icon className={`w-6 h-6 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                </div>
                
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>
                  {f.title}
                </h3>
                
                <p className={`mb-4 ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                  {f.oneliner}
                </p>
                
                <ul className={`space-y-2 text-sm ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                  {f.bullets.map((bullet: string) => (
                    <li key={bullet} className="flex items-start">
                      <span className={`mr-2 ${isDark ? "text-blue-400" : "text-blue-500"}`}>•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
