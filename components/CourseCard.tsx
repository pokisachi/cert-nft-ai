"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CourseCard({ course }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-gray-100 shadow-sm hover:shadow-md bg-white transition p-4"
    >
      <div className="relative w-full h-44 rounded-md overflow-hidden mb-4 bg-gray-50">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Không có ảnh
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-1 text-gray-900 line-clamp-2">
        {course.title}
      </h3>
      <p className="text-sm text-gray-600 line-clamp-3 mb-3">
        {course.description}
      </p>

      <div className="flex justify-between items-center text-sm text-gray-500">
        {course.instructor && <span>👨‍🏫 {course.instructor}</span>}
        {course.startDate && (
          <span>📅 {new Date(course.startDate).toLocaleDateString("vi-VN")}</span>
        )}
      </div>

      <Link
        href={`/courses/${course.id}`}
        className="mt-4 inline-block w-full rounded-md bg-indigo-600 text-white text-center py-2 text-sm font-medium hover:bg-indigo-700 transition"
      >
        Xem chi tiết
      </Link>
    </motion.div>
  );
}
