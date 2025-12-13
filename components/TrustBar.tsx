"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Partner {
  name: string;
  logo: string;
}

interface Stat {
  label: string;
  value: string;
}

interface TrustBarProps {
  partners?: Partner[];
  stats?: Stat[];
}

export default function TrustBar({ partners, stats }: TrustBarProps) {
  return (
    <section className="py-12 border-y border-gray-200 bg-gray-50">
      <div className="container mx-auto px-6">
        {partners && partners.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              >
                {partner.logo ? (
                  <div className="relative h-8 w-24">
                    <Image 
                      src={partner.logo} 
                      alt={partner.name} 
                      fill
                      className="object-contain" 
                    />
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm font-medium">{partner.name}</span>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
                  {stat.value}
                </p>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
