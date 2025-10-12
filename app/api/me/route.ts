import { NextRequest, NextResponse } from 'next/server'; 

 import { cookies } from 'next/headers'; 

 import { verifySession } from '@/lib/auth'; // 1. ✅ Import đúng hàm xác thực JWT 

 import { prisma } from '@/lib/prisma'; // 2. ✅ Import Prisma để truy vấn DB 



 export async function GET(req: NextRequest) { 

   try { 

     // 3. ✅ Đọc đúng cookie 'auth_token' 

     const cookieStore = await cookies(); // Đợi để lấy đối tượng cookie 

     const token = cookieStore.get('auth_token')?.value; // Bây giờ mới gọi .get() 



     if (!token) { 

       return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }); 

     } 



     // 4. ✅ Dùng đúng hàm verifySession để giải mã JWT 

     const session = await verifySession(token); 

     if (!session?.uid) { 

       return NextResponse.json({ error: 'Invalid session' }, { status: 401 }); 

     } 



     // 5. ✅ Dùng ID từ session để lấy thông tin user đầy đủ từ Database 

     // Điều này đảm bảo dữ liệu luôn mới nhất 

     const user = await prisma.user.findUnique({ 

       where: { 

         id: session.uid, 

       }, 

       select: { 

         // Chỉ chọn những trường cần thiết cho client, không gửi password hay các thông tin nhạy cảm khác 

         id: true, 

         email: true, 

         name: true, 

         role: true, 

         avatarUrl: true, // Thêm avatar nếu bạn muốn hiển thị 

       }, 

     }); 



     if (!user) { 

       return NextResponse.json({ error: 'User not found' }, { status: 404 }); 

     } 



     // 6. ✅ Trả về thông tin user lấy từ DB 

     return NextResponse.json(user); 



   } catch (error) { 

     console.error('API /me error:', error); 

     return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }); 

   } 

 }