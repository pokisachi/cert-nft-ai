"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    instructor?: string;
    instructorAvatar?: string;
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    startDate?: string;
    progress?: number;
    isNew?: boolean;
    isHot?: boolean;
  };
}

// Helper function to generate gradient and first letter for course icon placeholder
function generateCourseIconPlaceholder(title: string) {
  // Generate a consistent color based on the course title
  const colors = [
    'from-blue-400 to-indigo-500',
    'from-emerald-400 to-cyan-500',
    'from-pink-400 to-rose-500',
    'from-amber-400 to-orange-500',
    'from-violet-400 to-purple-500',
    'from-green-400 to-teal-500',
  ];
  
  const colorIndex = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
  const gradientClass = colors[colorIndex];
  const firstLetter = title.charAt(0).toUpperCase();
  
  return { gradientClass, firstLetter };
}

export default function CourseCard({ course }: CourseCardProps) {
  const { gradientClass, firstLetter } = generateCourseIconPlaceholder(course.title);
  
  // Map difficulty to appropriate badge style
  const difficultyStyles = {
    beginner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
    advanced: 'bg-purple-100 text-purple-700 border-purple-200'
  };
  
  const difficultyText = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative shadow-sm hover:shadow-md"
    >
      <div className="flex flex-col md:flex-row">
        {/* Course Icon/Thumbnail Area (Left) */}
        <div className="relative w-full md:w-1/3 aspect-square md:aspect-auto">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className={`flex items-center justify-center h-full bg-gradient-to-br ${gradientClass}`}>
              <span className="text-4xl font-bold text-white">{firstLetter}</span>
            </div>
          )}
          
          <div className="absolute top-2 left-2 flex gap-2">
            {course.isNew && (
              <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                Mới
              </Badge>
            )}
            {course.isHot && (
              <Badge variant="default" className="bg-red-500 hover:bg-red-600">
                Hot
              </Badge>
            )}
          </div>
        </div>
        
        {/* Course Content Area (Right) */}
        <div className="p-5 flex flex-col justify-between w-full md:w-2/3">
          <div>
            {/* Top row with category and difficulty */}
            <div className="flex justify-between items-center mb-2">
              {course.category && (
                <span className="text-xs text-muted-foreground">
                  {course.category}
                </span>
              )}
              
              {/* Difficulty badges removed */}
            </div>
            
            {/* Course Title */}
            <h3 className="text-xl font-bold mb-2 line-clamp-2">
              {course.title}
            </h3>
            
            {/* Course Description */}
            {course.description && (
              <div 
                className="text-sm text-muted-foreground line-clamp-3 mb-4 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: course.description }}
              ></div>
            )}
          </div>
          
          {/* Progress bar */}
          {typeof course.progress === 'number' && (
            <div className="w-full h-1 bg-muted rounded-full mb-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" 
                style={{ width: `${course.progress}%` }}
              />
            </div>
          )}
          
          {/* Footer with instructor avatar and action button */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary overflow-hidden">
                {course.instructorAvatar ? (
                  <img src={course.instructorAvatar} alt={course.instructor || 'Instructor'} className="h-full w-full object-cover" />
                ) : (
                  <span>{course.instructor?.charAt(0) || 'I'}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{course.instructor || 'Giảng viên'}</span>
            </div>
            
            <Link href={`/courses/${course.id}`}>
              <Button variant="outline" size="sm" className="text-xs">
                Xem chi tiết
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
