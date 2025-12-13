"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { fetcher } from "@/lib/fetcher";
import Image from "next/image";
import { useMemo, useState } from "react";

const schema = z.object({
  name: z.string().min(1, "Tên bắt buộc"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type Enrollment = {
  id: string;
  courseName: string;
  progress: number;
  status: string;
  lastAccess: string;
};

type CertificateItem = {
  id: number;
  courseId: number;
  courseTitle: string;
  tokenId: string | null;
  issuedAt: string | null;
  status: "VALID" | "REVOKED";
  pdfUrl: string | null;
  explorerUrl: string | null;
};

type LearnerDetail = {
  id: number;
  name: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  walletAddress?: string | null;
  avatarUrl?: string | null;
  _count: {
    examResults: number;
    certificates: number;
  };
  enrollments?: Enrollment[];
  certificates?: CertificateItem[];
};

type LearnerUpdatePayload = {
  name: string;
  phone?: string;
  address?: string;
};

export default function LearnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"info" | "path" | "nft">("info");
  const [copied, setCopied] = useState(false);

  const { data, isLoading, refetch } = useQuery<LearnerDetail>({
    queryKey: ["learner", id],
    queryFn: () => fetcher<LearnerDetail>(`/api/admin/learners/${id}`),
  });

  const form = useForm<LearnerUpdatePayload>({
    resolver: zodResolver(schema),
    values: {
      name: data?.name || "",
      phone: data?.phone || "",
      address: data?.address || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: LearnerUpdatePayload) =>
      fetcher(`/api/admin/learners/${id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Cập nhật thành công");
      refetch();
    },
    onError: () => {
      toast.error("Cập nhật thất bại");
    },
  });

  const isSaving =
    (mutation as any).isPending ||
    (mutation as any).status === "pending" ||
    false;

  const copyWallet = async () => {
    if (data?.walletAddress) {
      await navigator.clipboard.writeText(data.walletAddress);
      toast.success("Đã sao chép địa chỉ ví");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shorten = (addr?: string | null) => {
    if (!addr) return "";
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const enrollments = useMemo(() => data?.enrollments || [], [data]);
  const certificates = useMemo(() => data?.certificates || [], [data]);

  if (isLoading) return <div className="min-h-screen bg-gray-50 grid place-items-center text-gray-600">Đang tải...</div>;
  if (!data) return <div className="min-h-screen bg-gray-50 grid place-items-center text-gray-600">Không tìm thấy học viên.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto p-6">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full ring-4 ring-emerald-500 overflow-hidden">
                {data.avatarUrl ? (
                  <Image src={data.avatarUrl} alt="Avatar" width={128} height={128} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 grid place-items-center text-gray-600 text-3xl">
                    {(data.name || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <div className="text-xl font-bold text-gray-900">{data.name || "-"}</div>
                <div className="text-sm text-gray-600">{data.email}</div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase">Ví liên kết</div>
                {data.walletAddress ? (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-200">
                      {shorten(data.walletAddress)}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={copyWallet}
                    >
                      {copied ? "Đã copy" : "Copy"}
                    </Button>
                  </div>
                ) : (
                  <span className="mt-2 inline-flex items-center px-2 py-1 text-xs rounded bg-gray-100 text-gray-500 border border-gray-200">Chưa liên kết</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-xs text-gray-500">Khóa học</div>
                  <div className="text-lg font-semibold text-gray-900">{data._count.examResults}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-xs text-gray-500">Chứng chỉ NFT</div>
                  <div className="text-lg font-semibold text-gray-900">{data._count.certificates}</div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button className="w-full bg-rose-100 text-rose-700 hover:bg-rose-200" onClick={() => toast.error("Đã gửi yêu cầu khóa tài khoản")}>
                Khoá tài khoản
              </Button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200 px-4">
              <div className="flex gap-2">
                <button
                  className={`px-4 py-3 text-sm font-medium ${activeTab === "info" ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-600"}`}
                  onClick={() => setActiveTab("info")}
                >
                  Thông tin cá nhân
                </button>
                <button
                  className={`px-4 py-3 text-sm font-medium ${activeTab === "path" ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-600"}`}
                  onClick={() => setActiveTab("path")}
                >
                  Lộ trình học
                </button>
                <button
                  className={`px-4 py-3 text-sm font-medium ${activeTab === "nft" ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-600"}`}
                  onClick={() => setActiveTab("nft")}
                >
                  Chứng chỉ
                </button>
              </div>
            </div>
            {activeTab === "info" && (
              <div className="p-6">
                <form
                  onSubmit={form.handleSubmit((values) => mutation.mutate(values as LearnerUpdatePayload))}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                      <Input {...form.register("name")} placeholder="Nhập họ tên" className="border border-gray-200 bg-white text-gray-900 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <Input {...form.register("phone")} placeholder="Nhập số điện thoại" className="border border-gray-200 bg-white text-gray-900 rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <Input {...form.register("address")} placeholder="Nhập địa chỉ" className="border border-gray-200 bg-white text-gray-900 rounded-lg" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving} className="px-6 bg-blue-600 text-white hover:bg-blue-700">
                      {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
            {activeTab === "path" && (
              <div className="p-6 space-y-4">
                {enrollments.length ? (
                  enrollments.map((e) => (
                    <div key={e.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="text-sm font-medium text-gray-900">{e.courseName}</div>
                      <div className="mt-1 text-xs text-gray-600">Trạng thái: {e.status} • Lần truy cập cuối: {new Date(e.lastAccess).toLocaleDateString("vi-VN")}</div>
                      <div className="mt-2 h-2 w-full rounded bg-gray-100">
                        <div className={`h-2 rounded ${e.progress >= 100 ? "bg-emerald-600" : "bg-blue-600"}`} style={{ width: `${Math.min(100, Math.max(0, e.progress))}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-gray-600">Đã học {Math.min(100, Math.max(0, Math.round(e.progress)))}%</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600">Chưa có lộ trình học</div>
                )}
              </div>
            )}
            {activeTab === "nft" && (
              <div className="p-6">
                {certificates.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificates.map((c) => (
                      <div key={c.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                        <div className="text-sm font-semibold text-gray-900">{c.courseTitle}</div>
                        <div className="mt-2 text-xs text-gray-600">Mã token: {c.tokenId ?? "—"}</div>
                        <div className="mt-1 text-xs text-gray-600">Ngày cấp: {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString("vi-VN") : "—"}</div>
                        <div className="mt-2 text-xs"><span className={`inline-flex items-center px-2 py-1 text-xs rounded ${c.status === "VALID" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>{c.status === "VALID" ? "Hợp lệ" : "Đã thu hồi"}</span></div>
                        <div className="mt-2 flex gap-2">
                          {c.pdfUrl ? <a className="text-blue-600 hover:underline text-xs" href={c.pdfUrl} target="_blank">Xem PDF</a> : null}
                          {c.explorerUrl ? <a className="text-blue-600 hover:underline text-xs" href={c.explorerUrl} target="_blank">Explorer</a> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">Chưa có chứng chỉ</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
