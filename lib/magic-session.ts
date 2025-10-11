// ✅ File: D:\2025-2026\src_Code\cert-nft\lib\magic-session.ts

import { Magic } from "@magic-sdk/admin";

/**
 * Khởi tạo Magic Admin SDK với secret key
 * (chỉ dùng ở server — không bao giờ để lộ key này ra client)
 */
const magic = new Magic(process.env.MAGIC_SECRET_KEY!);

/**
 * Xác thực DID Token & trả metadata của user
 * @param didToken Chuỗi token (DID) được gửi từ cookie magic_session
 */
export async function verifyMagicSession(didToken: string) {
  try {
    // ✅ Gọi Magic API để lấy thông tin user theo token
    const metadata = await magic.users.getMetadataByToken(didToken);

    // Nếu token không hợp lệ hoặc chưa có email
    if (!metadata || !metadata.email) {
      console.warn("⚠️ Invalid Magic session token");
      return null;
    }

    // ✅ Trả về object user (để FE hiển thị trong Header)
    return {
      email: metadata.email,
      name: metadata.email.split("@")[0],
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${metadata.email}`,
      role: metadata.email.endsWith("@school.edu") ? "ADMIN" : "LEARNER",
    };
  } catch (error) {
    console.error("❌ verifyMagicSession error:", error);
    return null;
  }
}

/**
 * Tuỳ chọn: Huỷ session (dùng cho API /logout)
 */
export async function revokeMagicSession(didToken: string) {
  try {
    await magic.users.logoutByToken(didToken);
    return true;
  } catch (error) {
    console.error("❌ revokeMagicSession error:", error);
    return false;
  }
}
