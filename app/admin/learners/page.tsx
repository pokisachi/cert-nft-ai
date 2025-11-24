"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import Link from "next/link";
import toast from "react-hot-toast";
import { fetcher } from "@/lib/fetcher";

type Learner = {
  id: number;
  name: string | null;
  email: string;
  phone?: string | null;
  walletAddress?: string | null;
  createdAt: string;
};

type LearnerListResponse = {
  items: Learner[];
  page: number;
  size: number;
  total: number;
};

export default function LearnersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, refetch } = useQuery<LearnerListResponse>({
    queryKey: ["learners", page, search],
    queryFn: () =>
      fetcher<LearnerListResponse>(
        `/api/admin/learners?page=${page}&search=${encodeURIComponent(search)}`
      ),
  });

  const handleSearch = async () => {
    setPage(1);
    setSearch(searchTerm.trim());
    await new Promise((r) => setTimeout(r, 10));
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-[#111318] text-white/70 animate-pulse">
        Đang tải danh sách học viên...
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#111318] text-white">
      <h1 className="text-2xl font-semibold mb-4">Quản lý học viên</h1>

      {/* 🔍 Thanh tìm kiếm */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Tìm kiếm theo tên/email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          className="border border-[#3b4354] bg-[#12151b] text-white"
        />
        <Button onClick={handleSearch} className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white">Tìm</Button>
      </div>

      {/* 🧩 Bảng danh sách học viên */}
      <div className="border border-[#3b4354] rounded-2xl overflow-x-auto">
      <Table className="min-w-full text-sm bg-[#1c1f27] text-white" variant="dark">
        {/* ✅ Header đúng chuẩn HTML */}
        <TableHeader variant="dark">
          <TableRow variant="dark">
            <TableHead variant="dark">ID</TableHead>
            <TableHead variant="dark">Họ tên</TableHead>
            <TableHead variant="dark">Email</TableHead>
            <TableHead variant="dark">Điện thoại</TableHead>
            <TableHead variant="dark">Địa chỉ cấp chứng chỉ</TableHead>
            <TableHead variant="dark">Ngày tạo</TableHead>
            <TableHead variant="dark">Hành động</TableHead>
          </TableRow>
        </TableHeader>

        {/* ✅ Body */}
        <TableBody>
          {data?.items?.length ? (
            data.items.map((u) => (
              <TableRow key={u.id} variant="dark" className="hover:bg-[#272b33]">
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.name || "-"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.phone || "-"}</TableCell>
                <TableCell>
                  {u.walletAddress ? (
                    <code className="bg-[#1c1f27] border border-[#3b4354] text-white px-2 py-1 rounded text-xs">
                      {u.walletAddress}
                    </code>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                </TableCell>
                <TableCell className="flex gap-2">
                  <Link href={`/admin/learners/${u.id}`}>
                    <Button size="sm" variant="outline" className="border-[#3b4354] text-white hover:bg-[#232734]">
                      Xem
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      if (confirm("Bạn có chắc muốn xóa học viên này?")) {
                        try {
                          await fetcher(`/api/admin/learners/${u.id}`, {
                            method: "DELETE",
                          });
                          toast.success("Đã xóa học viên");
                          refetch();
                        } catch (err) {
                          console.error(err);
                          toast.error("Không thể xóa học viên");
                        }
                      }
                    }}
                  >
                    Xóa
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow variant="dark">
              <TableCell colSpan={7} className="text-center text-white/70">
                Không có học viên nào
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      {/* 📄 Phân trang */}
      <div className="flex items-center justify-between mt-4 text-sm text-white/70">
        <span>
          Trang {page} /{" "}
          {Math.ceil((data?.total || 0) / (data?.size || 10)) || 1}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border-[#3b4354] text-white hover:bg-[#232734]"
          >
            Trước
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={data && page >= Math.ceil(data.total / data.size)}
            onClick={() => setPage((p) => p + 1)}
            className="border-[#3b4354] text-white hover:bg-[#232734]"
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
