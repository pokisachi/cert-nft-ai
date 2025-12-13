'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CourseCard from '@/components/CourseCard';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { CourseStatus } from '@prisma/client';

const statusColor: Record<CourseStatus, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  ONGOING: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CLOSED: 'bg-slate-100 text-slate-700',
};

// Available course categories for filtering
const categories = [
  { id: 'all', name: 'Tất cả khóa học' },
  { id: 'toeic250', name: 'TOEIC 250+' },
  { id: 'toeic350', name: 'TOEIC 350+' },
  { id: 'toeic450', name: 'TOEIC 450+' },
  { id: 'toeic600', name: 'TOEIC 600+' },
  { id: 'toeic750', name: 'TOEIC 750+' },
  { id: 'toeic900', name: 'TOEIC 900+' },
  { id: 'toeic990', name: 'TOEIC 990' },
];

export default function CoursesPage() {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortOption, setSortOption] = useState('newest');

  // Fetch courses data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['public', 'courses'],
    queryFn: async () => {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Không thể tải danh sách khóa học.');
      return res.json();
    },
  });

  // Process courses data
  const allCourses = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];

  // Filter and sort courses based on user selections
  const filteredCourses = allCourses
    .filter((course: any) => {
      // Apply category filter
      if (activeCategory !== 'all') {
        // Extract TOEIC level from course title or level field
        const courseTitle = course.title?.toLowerCase() || '';
        const courseLevel = course.level?.toLowerCase() || '';
        
        // Check if the course matches the selected TOEIC level
        if (activeCategory === 'toeic250' && (courseTitle.includes('toeic 250') || courseLevel.includes('250'))) {
          return true;
        } else if (activeCategory === 'toeic350' && (courseTitle.includes('toeic 350') || courseLevel.includes('350'))) {
          return true;
        } else if (activeCategory === 'toeic450' && (courseTitle.includes('toeic 450') || courseLevel.includes('450'))) {
          return true;
        } else if (activeCategory === 'toeic600' && (courseTitle.includes('toeic 600') || courseLevel.includes('600'))) {
          return true;
        } else if (activeCategory === 'toeic750' && (courseTitle.includes('toeic 750') || courseLevel.includes('750'))) {
          return true;
        } else if (activeCategory === 'toeic900' && (courseTitle.includes('toeic 900') || courseLevel.includes('900'))) {
          return true;
        } else if (activeCategory === 'toeic990' && (courseTitle.includes('toeic 990') || courseLevel.includes('990'))) {
          return true;
        } else {
          return false;
        }
      }
      
      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          course.title?.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a: any, b: any) => {
      // Apply sorting
      if (sortOption === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else if (sortOption === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortOption === 'a-z') {
        return a.title.localeCompare(b.title);
      } else if (sortOption === 'z-a') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

  // Map courses to include difficulty level for display
  const coursesWithDifficulty = filteredCourses.map((course: any) => ({
    ...course,
    difficulty: course.level?.toLowerCase() || 'beginner',
    category: course.category || 'Blockchain',
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Gradient Background */}
      <section className="bg-gradient-to-r from-blue-500 to-blue-400 text-white py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Khóa học Public
          </motion.h1>
          <p className="text-white/90 text-lg max-w-2xl">
            Khám phá các khóa học nổi bật được phát hành công khai.
            Học tập minh bạch, xác thực bằng chứng chỉ NFT!
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto max-w-7xl px-6 py-10">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              className="pl-10 pr-4 h-12 text-base rounded-full border-border/50 focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Badge
                key={category.id}
                className={`px-4 py-2 rounded-full cursor-pointer transition-all ${activeCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
            
            {/* Sort Button */}
            <div className="ml-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 rounded-full"
                onClick={() => {
                  // Cycle through sort options
                  const options = ['newest', 'oldest', 'a-z', 'z-a'];
                  const currentIndex = options.indexOf(sortOption);
                  const nextIndex = (currentIndex + 1) % options.length;
                  setSortOption(options[nextIndex]);
                }}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Sắp xếp: {sortOption === 'newest' ? 'Mới nhất' : 
                  sortOption === 'oldest' ? 'Cũ nhất' : 
                  sortOption === 'a-z' ? 'A-Z' : 
                  sortOption === 'z-a' ? 'Z-A' : ''}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive" className="max-w-lg mx-auto text-center">
            <AlertTitle>Đã có lỗi xảy ra</AlertTitle>
            <AlertDescription>
              <Button variant="link" onClick={() => refetch()}>
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        ) : coursesWithDifficulty.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-lg">
              Không tìm thấy khóa học nào phù hợp với tiêu chí tìm kiếm.
            </p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coursesWithDifficulty.map((course: any, i: number) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
