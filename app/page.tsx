"use client";
import { motion } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import FeatureGrid from "@/components/FeatureGrid";
import StatsBar from "@/components/StatsBar";
import Footer from "@/components/Footer";
import home from "@/lib/i18n/home.json";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white text-gray-900">
    
      <HeroSection content={home.home.hero} />
      <FeatureGrid content={home.home.features} />
      <StatsBar content={home.home.stats} />
    </main>
  );
}
