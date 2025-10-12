import type { NextRequest } from "next/server"; 

 import { NextResponse } from "next/server"; 

 import { verifySession } from "@/lib/auth"; 



 export async function middleware(req: NextRequest) { 

   const { pathname } = req.nextUrl; 



   // 🔒 Bỏ qua các file tĩnh & API công khai 

   if ( 

     pathname.startsWith("/_next") || 

     pathname.startsWith("/favicon.ico") || 

     pathname.startsWith("/public") || 

     pathname.startsWith("/api/login") // cho phép login API không bị block 

   ) { 

     return NextResponse.next(); 

   } 



   // 🧩 Lấy token JWT trong cookie 

   const token = req.cookies.get("auth_token")?.value; 



   // ⛔ Nếu chưa đăng nhập → redirect sang /login 

   if (!token) { 

     // Nếu là API /me thì trả 401 JSON, không redirect (frontend dùng fetch) 

     if (pathname.startsWith("/api/")) { 

       return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 

     } 



     return NextResponse.redirect(new URL("/login", req.url)); 

   } 



   try { 

     const session = await verifySession(token); 



     // 🔐 Nếu truy cập /admin mà không phải ADMIN → redirect về /me 

     if (pathname.startsWith("/admin") && session.role !== "ADMIN") { 

       return NextResponse.redirect(new URL("/me", req.url)); 

     } 



     // ✅ Token hợp lệ → cho qua 

     return NextResponse.next(); 

   } catch (err) { 

     console.warn("Invalid or expired token:", err); 



     // Nếu token hỏng hoặc hết hạn 

     if (pathname.startsWith("/api/")) { 

       return NextResponse.json({ error: "Session expired" }, { status: 401 }); 

     } 



     return NextResponse.redirect(new URL("/login", req.url)); 

   } 

 } 



 // Chỉ áp dụng cho các route có prefix /me và /admin 

 export const config = { 

   matcher: ["/me/:path*", "/admin/:path*", "/api/me/:path*"], 

 };