"use client";

import { useEffect, useState } from "react";
import AnnouncementBar from "@/components/AnnouncementBar";
import StatsAndFeatures from "@/components/StatsAndFeatures";
import TravelCourses from "@/components/TravelCourses";
import home from "@/lib/i18n/home.json";
import { useCourses } from "@/hooks/useCourses";
import { useTheme } from "next-themes";

// Interface cho dữ liệu thông báo
interface Notification {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export default function HomePage() {
  const [pinned, setPinned] = useState<Notification[]>([]);
  const { data: courses, isLoading } = useCourses();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle theme mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Gọi API lấy tin nổi bật
  useEffect(() => {
    const fetchPinned = async () => {
      try {
        const res = await fetch("/api/notifications/pinned");
        if (!res.ok) throw new Error("Không thể tải thông báo nổi bật");
        const data = await res.json();
        setPinned(data);
      } catch (error) {
        console.error("Error fetching pinned announcements:", error);
        // Fallback data when API fails
        setPinned([
          {
            id: 1,
            title: "Khóa học mới",
            content: "Chúng tôi vừa ra mắt khóa học Blockchain cơ bản",
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            title: "Chứng chỉ NFT",
            content: "Tất cả học viên sẽ nhận được chứng chỉ dưới dạng NFT",
            createdAt: new Date().toISOString()
          }
        ]);
      }
    };
    fetchPinned();
  }, []);

  // Stats section removed as requested

  // Add location and rating properties to courses for travel-style display
  const enhancedCourses = courses?.map((course, index) => ({
    ...course,
    location: ["Hà Nội", "TP. Hồ Chí Minh", "Hải Phòng", "Cần Thơ", "Đà Nẵng", "Huế"][index % 6],
    rating: Math.floor(Math.random() * 2) + 3, // Ratings between 3-5
  })) || [];

  // Determine current theme
  const currentTheme = mounted ? theme : "light";
  const isDark = currentTheme === "dark";

  // Select featured course and other courses
  const featuredCourse = enhancedCourses[0] || {
    id: "featured",
    title: "Khám phá các khóa học chứng chỉ blockchain",
    description: "Trải nghiệm các khóa học được thiết kế bởi chuyên gia hàng đầu, tích hợp công nghệ blockchain để cấp chứng chỉ minh bạch và xác thực toàn cầu.",
    thumbnail: "/course/Master.png",
  };
  const otherCourses = enhancedCourses.slice(1) || [];

  return (
    <>
      {/* Announcement Bar */}
      <AnnouncementBar notifications={pinned} theme="dark" />

      {/* Auto-playing Courses Carousel */}
      <TravelCourses theme="dark" />
      
      {/* Features Section (Stats removed) */}
      <StatsAndFeatures 
        features={home.home.features}
        theme="dark"
      />
    </>
  );
}
