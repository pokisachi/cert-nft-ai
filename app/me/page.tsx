"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Mail, Calendar, Wallet } from "lucide-react";

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

  if (!profile) return <p className="p-6 bg-[#111318] text-white">Đang tải...</p>;

  return (
    <main className="p-6 bg-[#111318] text-white">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Xin chào, {profile.name || "Học viên"}!</h1>
          <p className="text-white/70">Quản lý thông tin cá nhân của bạn tại đây.</p>
        </div>

        <section aria-label="Thông tin cá nhân">
          <div className="flex items-start gap-6">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt={profile.name || "Avatar"} width={96} height={96} className="rounded-full border" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-[#282d39] flex items-center justify-center text-white text-3xl font-semibold">
                {(profile.name?.[0] || "U").toUpperCase()}
              </div>
            )}

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <div className="text-[#9da6b9]">{profile.email}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="h-4 w-4" />
                  <span>Ngày sinh</span>
                </div>
                <div className="text-[#9da6b9]">{profile.dob ? new Date(profile.dob).toLocaleDateString("vi-VN") : "-"}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-white">
                  <Wallet className="h-4 w-4" />
                  <span>Địa chỉ ví</span>
                </div>
                <div className="text-[#9da6b9] break-all">{profile.walletAddress || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-white">Họ tên</div>
                <div className="text-[#9da6b9]">{profile.name}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Link href="/me/profile" className="inline-flex">
              <Button variant="outline" className="border-indigo-600 text-indigo-300 hover:bg-indigo-900/20">Chỉnh sửa hồ sơ</Button>
            </Link>
            <Link href="/me/certificates" className="inline-flex">
              <Button variant="outline" className="border-[#3b4354] text-white hover:bg-[#282d39]">Chứng chỉ của tôi</Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
