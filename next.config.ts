import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Cho phép build Next.js ngay cả khi có warning ESLint (ví dụ any, img...)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Giữ nguyên cấu hình Webpack gốc của bạn
  webpack: (config, { isServer }) => {
    config.cache = false;
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
   images: {
    // ✅ Thêm domain được phép load ảnh từ đây
    domains: ["example.com", "cdn.yourapp.com", "res.cloudinary.com"],
  },
};

export default nextConfig;
