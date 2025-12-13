"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Sample course data
const sampleCourses = [
  {
    id: "blockchain-fundamentals",
    title: "Blockchain Fundamentals: Từ Cơ Bản Đến Nâng Cao",
    description: "Khóa học toàn diện về công nghệ blockchain, từ những khái niệm cơ bản đến ứng dụng thực tế trong các lĩnh vực kinh doanh và tài chính.",
    thumbnail: "/course/Master.png",
    slug: "/courses/blockchain-fundamentals"
  },
  {
    id: "smart-contracts",
    title: "Smart Contracts: Xây Dựng Hợp Đồng Thông Minh",
    description: "Học cách phát triển và triển khai các hợp đồng thông minh trên nền tảng Ethereum với Solidity và các công cụ hiện đại.",
    thumbnail: "/course/Tinhoc.png",
    slug: "/courses/smart-contracts"
  },
  {
    id: "nft-development",
    title: "NFT Development: Từ Ý Tưởng Đến Thị Trường",
    description: "Khám phá cách tạo, phát hành và kinh doanh NFT từ A-Z với các kỹ thuật tiên tiến và chiến lược marketing hiệu quả.",
    thumbnail: "/course/Tinhocchuan.png",
    slug: "/courses/nft-development"
  },
  {
    id: "defi-mastery",
    title: "DeFi Mastery: Tài Chính Phi Tập Trung",
    description: "Hiểu sâu về hệ sinh thái DeFi, các giao thức tài chính, yield farming và cách tham gia vào thị trường tài chính phi tập trung.",
    thumbnail: "/course/Master.png",
    slug: "/courses/defi-mastery"
  }
];

interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  slug?: string;
}

interface TravelCoursesProps {
  courses?: Course[];
  theme?: "dark" | "light";
}

export default function TravelCourses({ courses = sampleCourses, theme = "light" }: TravelCoursesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isDark = theme === "dark";
  
  // Handle auto-play functionality
  useEffect(() => {
    if (isHovering) {
      // Clear the timer when hovering
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // Set up the timer for auto-play
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % courses.length);
    }, 5000);
    
    // Clean up the timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isHovering, courses.length]);
  
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % courses.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + courses.length) % courses.length);
  };
  
  const currentCourse = courses[currentSlide];
  
  return (
    <section 
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 h-[600px] md:h-[700px]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Enhanced interactive overlay with hover effects */}
      <Link 
        href={currentCourse.slug || `/courses/${currentCourse.id}`} 
        className="absolute inset-0 z-10 cursor-pointer group overflow-hidden"
        aria-label={`View ${currentCourse.title} course details`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Interactive elements that appear on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out flex flex-col gap-4">
          {/* Course progress bar */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-white text-xs font-medium">Tiến độ khóa học</span>
              <span className="text-white/80 text-xs">30%</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full w-[30%] transition-all duration-700 ease-out group-hover:w-[30%] origin-left" style={{ transform: 'scaleX(0)', opacity: 0 }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scaleX(1)'; e.currentTarget.style.opacity = '1'; }} />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center group-hover:bg-blue-600/80 transition-colors duration-300">
              <span className="text-white text-sm font-medium mr-2">Xem chi tiết</span>
              <svg className="w-4 h-4 text-white transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="bg-blue-600/80 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-xs font-medium">Khóa học mới</span>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Background image with fade transitions */}
      <div className="absolute inset-0 w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCourse.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <Image 
              src={currentCourse.thumbnail || "/course/Master.png"} 
              alt={currentCourse.title}
              fill
              className="object-cover"
              priority
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Main content container */}
      <div className="container mx-auto px-6 h-full relative z-20 pointer-events-none">
        {/* Course category badge */}
        <div className="absolute top-6 left-6 bg-blue-600/80 backdrop-blur-sm px-4 py-1.5 rounded-full z-30 pointer-events-none">
          <span className="text-white text-xs font-medium uppercase tracking-wider">Blockchain</span>
        </div>
        
        {/* Course level indicator */}
        <div className="absolute top-6 right-6 flex items-center gap-1 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full z-30 pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
          <span className="text-white text-xs font-medium ml-1">Nâng cao</span>
        </div>
        
        <div className="flex flex-col h-full py-16">
          {/* Course info with fade transitions */}
          <div className="mt-16 md:mt-24 mb-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCourse.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.7 }}
              >
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 max-w-3xl">
                  {currentCourse.title}
                </h1>
                
                <p className="text-white/80 text-lg md:text-xl mb-8 max-w-2xl">
                  {currentCourse.description}
                </p>
                
                <div className="pointer-events-auto">
                  <Link
                    href={currentCourse.slug || `/courses/${currentCourse.id}`}
                    className="inline-flex items-center px-8 py-3 rounded-lg font-medium text-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 shadow-md"
                  >
                    Khám phá
                    <svg className="ml-2 w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Navigation controls */}
          <div className="mt-auto pb-8 flex justify-between items-center pointer-events-auto">
            {/* Indicator dots */}
            <div className="flex justify-center space-x-2">
              {courses.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentSlide 
                    ? "bg-blue-500 scale-110" 
                    : "bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            
            {/* Navigation arrows */}
            <div className="flex gap-3">
              <button 
                onClick={prevSlide}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                aria-label="Previous course"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextSlide}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                aria-label="Next course"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
