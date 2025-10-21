"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

export default function MePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/me/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setProfile(data);

      // ⚠️ Nếu chưa hoàn thiện hồ sơ → chuyển sang form
      if (data.profileCompleted === false) {
        router.push("/me/profile?firstLogin=1");
      }
    }
    fetchProfile();
  }, [router]);

  if (!profile) return <p>Đang tải...</p>;

  return (
    
    <div className="p-6">
      <h1 className="text-xl font-bold">Xin chào, {profile.name || "Học viên"}!</h1>
      <p>Email: {profile.email}</p>
      <p>Tên: {profile.name}</p>
      <p>Ngày tháng năm sinh: {profile.dob}</p>
      <p>Địa chỉ ví: {profile.walletAddress}</p>
    </div>
  );
}
