"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, ChevronLeft, ChevronRight } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

interface AnnouncementBarProps {
  notifications: Notification[];
  theme?: "dark" | "light";
}

export default function AnnouncementBar({ notifications, theme = "light" }: AnnouncementBarProps) {
  const [active, setActive] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem("announcementDismissed");
    if (dismissed && JSON.parse(dismissed).timestamp > Date.now() - 86400000) { // 24 hours
      setIsVisible(false);
    }
  }, []);

  // Auto-rotate announcements
  useEffect(() => {
    if (notifications.length <= 1) return;
    
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % notifications.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [notifications]);

  // Dismiss handler
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("announcementDismissed", JSON.stringify({ 
      timestamp: Date.now() 
    }));
  };

  if (!mounted || !isVisible || notifications.length === 0) return null;

  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full overflow-hidden ${isDark 
        ? "bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-purple-900/80 backdrop-blur-sm border-b border-white/10" 
        : "bg-gradient-to-r from-blue-100/90 via-indigo-50/90 to-purple-100/90 backdrop-blur-sm border-b border-blue-200/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between relative">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full ${isDark 
            ? "bg-blue-900/50 text-blue-300" 
            : "bg-blue-100 text-blue-600"
          } mr-2.5`}>
            <Bell size={12} className="animate-pulse" />
          </div>
          <span className={`text-sm font-medium tracking-wide ${isDark 
            ? "text-blue-200" 
            : "text-blue-700"
          }`}>
            THÔNG BÁO
          </span>
        </div>

        <div className="flex-1 mx-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={notifications[active].id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-sm truncate flex items-center"
            >
              <span className={`px-1.5 py-0.5 text-xs rounded ${isDark 
                ? "bg-blue-900/50 text-blue-300 border border-blue-800" 
                : "bg-blue-100 text-blue-700 border border-blue-200"
              } mr-2.5 hidden sm:inline-block`}>
                {new Date(notifications[active].createdAt).toLocaleDateString("vi-VN")}
              </span>
              <span className={`font-medium ${isDark 
                ? "text-white" 
                : "text-gray-800"
              }`}>
                {notifications[active].title}
              </span>
              <span className={`mx-2 ${isDark 
                ? "text-indigo-300/50" 
                : "text-indigo-500/50"
              }`}>
                •
              </span>
              <span className={`${isDark 
                ? "text-slate-300" 
                : "text-gray-600"
              }`}>
                {notifications[active].content}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center space-x-3">
          {notifications.length > 1 && (
            <div className="hidden md:flex items-center space-x-2">
              <button 
                onClick={() => setActive((active - 1 + notifications.length) % notifications.length)}
                className={`w-5 h-5 rounded-full flex items-center justify-center ${isDark 
                  ? "text-slate-400 hover:text-white hover:bg-white/10" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                } transition-colors`}
                aria-label="Previous announcement"
              >
                <ChevronLeft size={14} />
              </button>
              
              <div className="flex space-x-1.5">
                {notifications.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === active 
                      ? isDark 
                        ? "bg-blue-400 scale-150" 
                        : "bg-blue-500 scale-150"
                      : isDark 
                        ? "bg-slate-700 hover:bg-slate-600" 
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`View announcement ${i + 1}`}
                  />
                ))}
              </div>
              
              <button 
                onClick={() => setActive((active + 1) % notifications.length)}
                className={`w-5 h-5 rounded-full flex items-center justify-center ${isDark 
                  ? "text-slate-400 hover:text-white hover:bg-white/10" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                } transition-colors`}
                aria-label="Next announcement"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          
          <button
            onClick={handleDismiss}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isDark 
              ? "bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700" 
              : "bg-gray-100/70 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            } border ${isDark ? "border-slate-700" : "border-gray-200"}`}
            aria-label="Dismiss announcement"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
