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
      <div className="p-6 text-gray-600 animate-pulse">
        Đang tải danh sách học viên...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Quản lý học viên</h1>

      {/* 🔍 Thanh tìm kiếm */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Tìm kiếm theo tên/email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <Button onClick={handleSearch}>Tìm</Button>
      </div>

      {/* 🧩 Bảng danh sách học viên */}
      <Table className="min-w-full border text-sm">
        {/* ✅ Header đúng chuẩn HTML */}
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Họ tên</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Điện thoại</TableHead>
            <TableHead>Địa chỉ cấp chứng chỉ</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>

        {/* ✅ Body */}
        <TableBody>
          {data?.items?.length ? (
            data.items.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.name || "-"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.phone || "-"}</TableCell>
                <TableCell>
                  {u.walletAddress ? (
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
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
                    <Button size="sm" variant="outline">
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
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500">
                Không có học viên nào
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 📄 Phân trang */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
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
          >
            Trước
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={data && page >= Math.ceil(data.total / data.size)}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
