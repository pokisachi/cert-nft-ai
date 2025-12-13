"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Calendar, Phone, MapPin, Camera } from "lucide-react";

export default function ProfileFormPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    dob: "",
    idcard: "",
    phone: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const res = await fetch("/api/me/profile/identity", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setMessage("✅ Hồ sơ đã được lưu thành công! Đang chuyển hướng...");
      setTimeout(() => router.push("/me"), 1500);
    } else {
      const errorData = await res.json();
      setMessage(`❌ ${errorData.message || errorData.error || "Có lỗi khi lưu hồ sơ."}`);
    }
    setIsLoading(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl mx-auto py-10 px-6">
        <div className="mb-6">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">Trang chủ</Link>
            <span className="mx-2">›</span>
            <Link href="/me" className="hover:text-gray-900">Hồ sơ</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">Chỉnh sửa</span>
          </nav>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Cài đặt tài khoản</h1>
          <p className="text-gray-600">Quản lý thông tin cá nhân và bảo mật</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar" width={96} height={96} className="h-24 w-24 object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">Avatar</div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 shadow-sm cursor-pointer">
                <Camera className="h-3.5 w-3.5" />
                <span>Thay đổi ảnh</span>
                <input type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="text-sm text-gray-600">Cho phép JPG, GIF hoặc PNG. Tối đa 5MB</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: +84901234567"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CCCD/CMND</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={form.idcard}
                    onChange={(e) => setForm({ ...form, idcard: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập số CCCD/CMND"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/me")}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>

          {message && (
            <p className={`mt-4 p-3 rounded-md text-center ${message.startsWith("❌") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
