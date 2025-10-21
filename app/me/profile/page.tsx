"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation'; // Import useRouter

export default function ProfileFormPage() {
  const router = useRouter(); // Khởi tạo router
  const [form, setForm] = useState({
    name: "",
    dob: "",
    idcard: "", // SỬA LỖI: Đổi idCard thành idcard
    phone: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(""); // Xóa thông báo cũ khi submit

    // 🧩 Không cần gọi API /check ở đây nữa vì logic đã được tích hợp trong API PUT
    //    Việc này giúp giảm số lượng request không cần thiết.

    // 🧠 Gửi lưu dữ liệu
    const res = await fetch("/api/me/profile/identity", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    // SỬA LỖI: Xử lý phản hồi từ API một cách chi tiết
    if (res.ok) {
      setMessage("✅ Hồ sơ đã được lưu thành công! Đang chuyển hướng...");
      setTimeout(() => router.push("/me"), 1500); // Sử dụng router.push
    } else {
      // Nếu có lỗi (ví dụ 409, 500), đọc nội dung lỗi từ server
      const errorData = await res.json();
      setMessage(`❌ ${errorData.message || errorData.error || 'Có lỗi khi lưu hồ sơ.'}`);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Hoàn thiện hồ sơ học viên</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Họ và tên"
          required
          className="border p-3 w-full rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Ngày sinh (YYYY-MM-DD)"
          type="date"
          required
          className="border p-3 w-full rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
        />
        <input
          placeholder="Số CMND/CCCD"
          required
          className="border p-3 w-full rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
          onChange={(e) => setForm({ ...form, idcard: e.target.value })} // SỬA LỖI: Đổi idCard
        />
        <input
          placeholder="Số điện thoại"
          required
          type="tel"
          className="border p-3 w-full rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="Địa chỉ"
          required
          className="border p-3 w-full rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Đang xử lý...' : 'Lưu hồ sơ'}
        </button>
      </form>

      {message && (
        <p className={`mt-4 text-center p-3 rounded-md ${message.startsWith('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
