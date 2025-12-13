"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Mail, Calendar, Wallet, BookOpen, Award, Clock, Copy, Check, Settings, LayoutDashboard, ArrowRight, Folder } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [sidebarTab, setSidebarTab] = useState<"overview" | "courses" | "certs" | "settings">("overview");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/me/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setProfile(data);
      if (data.profileCompleted === false) {
        router.push("/me/profile?firstLogin=1");
      }
    }
    fetchProfile();
  }, [router]);

  const { data: coursesResp } = useQuery({
    queryKey: ["me", "courses", { limit: 12, offset: 0 }],
    queryFn: async () => {
      const url = new URL("/api/me/courses", window.location.origin);
      url.searchParams.set("limit", "12");
      url.searchParams.set("offset", "0");
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("fetch courses failed");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const { data: certsResp, isLoading: certsLoading, isError: certsError, refetch: refetchCerts } = useQuery({
    queryKey: ["me", "certificates", { limit: 12, offset: 0 }],
    queryFn: async () => {
      const url = new URL("/api/me/certificates", window.location.origin);
      url.searchParams.set("limit", "12");
      url.searchParams.set("offset", "0");
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("fetch certificates failed");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  function shortenAddress(addr: string | undefined) {
    if (!addr || addr.length < 10) return addr || "-";
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }

  async function handleCopyWallet() {
    if (!profile?.walletAddress) return;
    try {
      await navigator.clipboard.writeText(profile.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  if (!profile)
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
          <p className="text-gray-700">Đang tải...</p>
        </div>
      </main>
    );

  const courses: any[] = Array.isArray(coursesResp?.items) ? coursesResp.items : [];
  const stats = {
    courses: courses.length || profile?.coursesCount || 0,
    certificates: (Array.isArray(certsResp?.items) ? certsResp.items.length : 0) || profile?.certificatesCount || 0,
    hours: profile?.hoursStudied || 0,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Xin chào, {profile.name || "Học viên"}!</h1>
          <p className="text-gray-600">Bảng điều khiển học tập của bạn.</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col items-center">
                {profile.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt={profile.name || "Avatar"} width={128} height={128} className="rounded-full ring-4 ring-white shadow w-32 h-32 object-cover" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-4xl font-semibold ring-4 ring-white shadow">
                    {(profile.name?.[0] || "U").toUpperCase()}
                  </div>
                )}
                <h2 className="mt-4 text-2xl font-bold text-gray-900 text-center">{profile.name || "Học viên"}</h2>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">{profile.role === "ADMIN" ? "Admin" : "Learner"}</div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{profile.email}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Wallet className="h-4 w-4 text-gray-500" />
                    <span>Địa chỉ ví</span>
                  </div>
                  <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 font-mono text-gray-800 flex items-center justify-between">
                    <span>{shortenAddress(profile.walletAddress)}</span>
                    <button onClick={handleCopyWallet} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-200">
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      <span>{copied ? "Đã copy" : "Copy"}</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{profile.dob ? new Date(profile.dob).toLocaleDateString("vi-VN") : "-"}</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <nav className="space-y-2">
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${sidebarTab === "overview" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                    onClick={() => setSidebarTab("overview")}
                    aria-selected={sidebarTab === "overview"}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Tổng quan</span>
                  </button>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${sidebarTab === "courses" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                    onClick={() => setSidebarTab("courses")}
                    aria-selected={sidebarTab === "courses"}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Khóa học của tôi</span>
                  </button>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${sidebarTab === "certs" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                    onClick={() => setSidebarTab("certs")}
                    aria-selected={sidebarTab === "certs"}
                  >
                    <Award className="h-4 w-4" />
                    <span>Chứng chỉ</span>
                  </button>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${sidebarTab === "settings" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                    onClick={() => setSidebarTab("settings")}
                    aria-selected={sidebarTab === "settings"}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Cài đặt</span>
                  </button>
                </nav>
                <Link href="/me/profile" className="block w-full">
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">Chỉnh sửa hồ sơ</Button>
                </Link>
                <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => router.push("/logout")}>
                  Đăng xuất
                </Button>
              </div>
            </div>
          </aside>

          <section className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                  <div className="ml-auto text-right">
                    <div className="text-sm text-gray-500">Khóa học đang học</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.courses}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-indigo-600" />
                  <div className="ml-auto text-right">
                    <div className="text-sm text-gray-500">Chứng chỉ đã nhận</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.certificates}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-indigo-600" />
                  <div className="ml-auto text-right">
                    <div className="text-sm text-gray-500">Giờ học tích lũy</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.hours}</div>
                  </div>
                </div>
              </div>
            </div>
            {sidebarTab === "overview" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100 text-lg font-semibold text-gray-900">Tiếp tục học tập</div>
                <div className="p-4 space-y-4">
                  {courses.length === 0 && <div className="text-gray-600">Chưa có khóa học.</div>}
                  {courses.map((c: any, idx: number) => (
                    <div key={c.id || idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-40 h-24 rounded-lg bg-gray-100 border border-gray-200" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold text-gray-900">{c.title || "Khóa học"}</div>
                          <Link href={c.href || "#"} className="inline-flex">
                            <Button className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white">Tiếp tục học</Button>
                          </Link>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Tiến độ</span>
                            <span>{typeof c.progress === "number" ? `${c.progress}%` : "0%"}</span>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                            <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${typeof c.progress === "number" ? c.progress : 0}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sidebarTab === "courses" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100 text-lg font-semibold text-gray-900">Khóa học của tôi</div>
                <div className="p-4">
                  {courses.length === 0 ? (
                    <div className="text-gray-600">Chưa có khóa học.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.map((c: any, idx: number) => (
                        <div key={c.id || idx} className="relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          <div className="relative w-full pb-[56.25%]">
                            <img src={c.thumbnailUrl || c.thumbnail || c.image || `https://picsum.photos/seed/profile-course-${c.id || idx}/800/450`} alt={c.title || "Khóa học"} className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="text-lg font-semibold text-gray-900">{c.title || "Khóa học"}</div>
                              <Link href={c.href || `/courses/${c.id || ''}`} className="inline-flex">
                                <Button className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm">Tiếp tục</Button>
                              </Link>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">Ngày hết hạn: {c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "-"}</div>
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Tiến độ</span>
                                <span>{typeof c.progress === "number" ? `${c.progress}%` : "0%"}</span>
                              </div>
                              <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                                <div className="h-2 rounded-full bg-green-600" style={{ width: `${typeof c.progress === "number" ? c.progress : 0}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {sidebarTab === "certs" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100 text-lg font-semibold text-gray-900">Chứng chỉ của tôi</div>
                <div className="p-4">
                  {certsLoading ? (
                    <div className="space-y-3">
                      <div className="h-20 bg-gray-100 rounded-xl border border-gray-200" />
                      <div className="h-20 bg-gray-100 rounded-xl border border-gray-200" />
                      <div className="h-20 bg-gray-100 rounded-xl border border-gray-200" />
                    </div>
                  ) : certsError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                      <div>Không thể tải chứng chỉ.</div>
                      <Button variant="outline" className="mt-3 border-gray-300" onClick={() => refetchCerts()}>Thử lại</Button>
                    </div>
                  ) : (Array.isArray(certsResp?.items) ? certsResp.items.length : 0) === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                      <Folder className="h-12 w-12 text-gray-300" />
                      <div className="mt-3 text-gray-800 font-medium">Bạn chưa có chứng chỉ nào được cấp.</div>
                    </div>
                  ) : (
                    <div>
                      {(certsResp!.items).map((it: any) => (
                        <div
                          key={it.id}
                          className="bg-white rounded-xl border border-gray-200 p-5 mb-4 flex items-center gap-4 hover:shadow-md transition-all hover:border-blue-200"
                        >
                          <div className="basis-[15%] flex items-center justify-center">
                            <div className="bg-blue-50 rounded-full p-3">
                              <Award className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="basis-[60%] min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 truncate">{it.courseTitle}</h3>
                            <div className="mt-1 text-sm text-gray-500 truncate">Ngày cấp: {new Date(it.issuedAt).toLocaleDateString("vi-VN")} • Token ID: #{it.tokenId || "-"}</div>
                          </div>
                          <div className="basis-[25%] flex flex-col items-end justify-center gap-2">
                            <Badge className={`${(it.status || "VALID") === "VALID" ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>{it.status || "VALID"}</Badge>
                            <Link href={`/me/certificates/${it.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
                              <span>Xem chi tiết</span>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {sidebarTab === "settings" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100 text-lg font-semibold text-gray-900">Cài đặt</div>
                <div className="p-4 text-gray-700">
                  <Link href="/me/profile" className="text-indigo-600 hover:text-indigo-700">Chỉnh sửa hồ sơ</Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
