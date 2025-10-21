// lib/admin-guard.ts
import { getAuthUser } from "@/lib/auth";

export async function assertAdminSession(req: Request) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "ADMIN") {
    const err = new Error("Forbidden");
    // @ts-ignore
    err.statusCode = 403;
    throw err;
  }
  return user;
}
