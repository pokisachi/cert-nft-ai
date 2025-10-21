import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "avatars"; 
    // ✅ Cho phép "type=courses" khi upload ảnh khóa học

    if (!file) {
      return NextResponse.json({ error: "Thiếu file upload" }, { status: 400 });
    }

    // ✅ Kiểm tra MIME hợp lệ
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Định dạng ảnh không hợp lệ" }, { status: 400 });
    }

    // ✅ Đọc buffer & đảm bảo thư mục đúng loại
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Thư mục upload linh hoạt (avatars hoặc courses)
    const uploadDir = path.join(process.cwd(), "public", type);
    await fs.mkdir(uploadDir, { recursive: true });

    // ✅ Đặt tên file an toàn
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "png";
    const fileName = `${Date.now()}.${safeExt}`;
    const filePath = path.join(uploadDir, fileName);

    // ✅ Ghi file
    await fs.writeFile(filePath, buffer);

    // ✅ Trả về URL public — cần có dấu `/` đầu
    const url = `/${type}/${fileName}`;
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Lỗi server khi tải ảnh" }, { status: 500 });
  }
}
