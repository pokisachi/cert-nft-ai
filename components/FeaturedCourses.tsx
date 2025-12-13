"use client";

import { motion } from "framer-motion";
import CourseCard from "./CourseCard";

interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  instructor?: string;
  startDate?: string;
  progress?: number;
  isNew?: boolean;
  isHot?: boolean;
}

interface FeaturedCoursesProps {
  title: string;
  subtitle?: string;
  courses: Course[];
}

export default function FeaturedCourses({ title, subtitle, courses }: FeaturedCoursesProps) {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">{title}</h2>
          {subtitle && (
            <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <CourseCard course={course} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
