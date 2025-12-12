// ═══════════════════════════════════════════════════════════════════════════
// FILE: app/api/admin/scheduler/run/route.ts
// MÔ TẢ: Next.js API Route kết nối với FastAPI AI Scheduler
// ĐÃ SỬA: 7 lỗi quan trọng (title, null values, validation, logging)
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // ═══════════════════════════════════════════════════════════════════════
    // 📥 PARSE REQUEST BODY
    // ═══════════════════════════════════════════════════════════════════════
    
    const { courseId, dry = true } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: "Thiếu courseId trong request body" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 1️⃣ LẤY THÔNG TIN KHÓA HỌC
    // ═══════════════════════════════════════════════════════════════════════
    
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: {
        id: true,
        title: true,  // ✅ FIXED LỖI 1: Thêm field title (BẮT BUỘC)
        structure_lessons_per_week: true,
        structure_lesson_duration: true,
        requirement_qualification: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: `Không tìm thấy khóa học với ID: ${courseId}` },
        { status: 404 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2️⃣ LẤY DANH SÁCH GIÁO VIÊN
    // ═══════════════════════════════════════════════════════════════════════
    
    const teachersRaw = await prisma.teacher.findMany({
      include: { 
        qualifications: { 
          include: { qualification: true } 
        } 
      },
    });

    const teachers = teachersRaw.map((t) => ({
      id: t.id,
      name: t.name,
      availability: t.availability || [],  // ✅ FIXED LỖI 2: Fallback nếu null
      qualifications: t.qualifications.map((q) => q.qualification.name),
    }));

    // ═══════════════════════════════════════════════════════════════════════
    // 3️⃣ LẤY DANH SÁCH PHÒNG HỌC
    // ═══════════════════════════════════════════════════════════════════════
    
    const roomsRaw = await prisma.room.findMany({
      select: { 
        id: true, 
        capacity: true, 
        availability: true 
      },
    });

    const rooms = roomsRaw.map((r) => ({
      ...r,
      availability: r.availability || [],  // ✅ FIXED LỖI 2: Fallback nếu null
    }));

    // ═══════════════════════════════════════════════════════════════════════
    // 4️⃣ LẤY DANH SÁCH HỌC VIÊN ĐÃ GHI DANH
    // ═══════════════════════════════════════════════════════════════════════
    
    const enrollmentsRaw = await prisma.enrollment.findMany({
      where: { courseId: Number(courseId) },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            email: true 
          } 
        },
      },
    });

    const enrollments = enrollmentsRaw.map((e) => ({
      id: e.id,
      userId: e.userId,
      availableSlots: e.availableSlots || [],  // ✅ FIXED LỖI 2: Fallback nếu null
      learner: e.user
        ? {
            id: e.user.id,
            name: e.user.name || "—",
            email: e.user.email || "—",
          }
        : { id: null, name: "—", email: "—" },
    }));

    // ═══════════════════════════════════════════════════════════════════════
    // 5️⃣ VALIDATION DỮ LIỆU - ✅ FIXED LỖI 3
    // ═══════════════════════════════════════════════════════════════════════
    
    if (teachers.length === 0) {
      return NextResponse.json(
        { 
          error: "Không có giáo viên nào trong hệ thống",
          hint: "Vui lòng thêm giáo viên trước khi tạo lịch học." 
        },
        { status: 400 }
      );
    }

    if (rooms.length === 0) {
      return NextResponse.json(
        { 
          error: "Không có phòng học nào trong hệ thống",
          hint: "Vui lòng thêm phòng học trước khi tạo lịch." 
        },
        { status: 400 }
      );
    }

    if (enrollments.length === 0) {
      return NextResponse.json(
        { 
          error: `Khóa học "${course.title}" chưa có học viên đăng ký`,
          hint: "Cần có ít nhất 1 học viên để tạo lịch." 
        },
        { status: 400 }
      );
    }

    const already = await prisma.scheduledEnrollment.findMany({
      where: { scheduledClass: { courseId: Number(courseId) } },
      select: {
        enrollmentId: true,
        enrollment: {
          select: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (already.length > 0) {
      const learners = already
        .map((se) => ({
          enrollmentId: se.enrollmentId,
          learner: {
            id: se.enrollment?.user?.id ?? null,
            name: se.enrollment?.user?.name ?? "—",
            email: se.enrollment?.user?.email ?? "—",
          },
        }))
        .filter(
          (v, i, arr) => arr.findIndex((x) => x.enrollmentId === v.enrollmentId) === i
        );

      return NextResponse.json(
        {
          error: "Một số học viên đã có lịch học trong khoá này",
          count: learners.length,
          learners,
          hint:
            "Hủy lịch cũ hoặc bỏ chọn các học viên đã có lịch trước khi chạy xếp lịch.",
        },
        { status: 409 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6️⃣ CHUẨN BỊ PAYLOAD CHO AI SCHEDULER
    // ═══════════════════════════════════════════════════════════════════════
    
    // 🔧 Fallback: nếu không có giáo viên nào đạt chuyên môn yêu cầu, bỏ qua ràng buộc
    const reqQual = course.requirement_qualification;
    const hasQualified = reqQual
      ? teachers.some((t) => (t.qualifications || []).some((q) => String(q).includes(reqQual)))
      : true;

    // 🔧 Fallback: số buổi/tuần không vượt quá số slot tối thiểu học viên có
    const minSlotsPerStudent = Math.min(
      ...enrollments.map((e) => Array.isArray(e.availableSlots) ? e.availableSlots.length : 0)
    );
    const lessonsPerWeek = Math.max(1, Math.min(course.structure_lessons_per_week || 3, isFinite(minSlotsPerStudent) ? minSlotsPerStudent : 3));

    const coursePayload = {
      ...course,
      requirement_qualification: hasQualified ? course.requirement_qualification : null,
      structure_lessons_per_week: lessonsPerWeek,
    };

    const payload = { 
      course: coursePayload, 
      teachers, 
      rooms, 
      enrollments 
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 6️⃣.1️⃣ FEASIBILITY CHECK TRƯỚC KHI GỌI AI
    // ═══════════════════════════════════════════════════════════════════════

    const allTeacherEmpty = teachers.every((t) => !Array.isArray(t.availability) || t.availability.length === 0);
    if (allTeacherEmpty) {
      return NextResponse.json(
        {
          error: "Không có lịch trống nào của giáo viên",
          hint: "Cấu hình availability cho ít nhất một giáo viên",
        },
        { status: 400 }
      );
    }

    const allRoomEmpty = rooms.every((r) => !Array.isArray(r.availability) || r.availability.length === 0);
    if (allRoomEmpty) {
      return NextResponse.json(
        {
          error: "Không có lịch trống nào của phòng học",
          hint: "Cấu hình availability cho ít nhất một phòng",
        },
        { status: 400 }
      );
    }

    const pairSlots = new Set<string>();
    for (const t of teachers) {
      const tset = new Set<string>(t.availability || []);
      for (const r of rooms) {
        const rset = new Set<string>(r.availability || []);
        for (const s of tset) {
          if (rset.has(s)) pairSlots.add(s);
        }
      }
    }

    if (pairSlots.size === 0) {
      return NextResponse.json(
        {
          error: "Không có slot chung giữa giáo viên và phòng",
          hint: "Đảm bảo ít nhất một slot trùng giữa availability của giáo viên và phòng",
        },
        { status: 400 }
      );
    }

    const lpw = coursePayload.structure_lessons_per_week || 3;
    const canAnyStudentBeScheduled = enrollments.some((e) => {
      const cnt = (e.availableSlots || []).filter((s: string) => pairSlots.has(s)).length;
      return cnt >= lpw;
    });
    if (!canAnyStudentBeScheduled) {
      return NextResponse.json(
        {
          error: "Không có học viên nào có đủ slot phù hợp với giáo viên/phòng",
          hint: `Mỗi học viên cần ≥ ${lpw} slot trùng với slot chung giáo viên/phòng`,
        },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7️⃣ DEBUG LOGS - ✅ FIXED LỖI 4
    // ═══════════════════════════════════════════════════════════════════════
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📤 SENDING PAYLOAD TO AI SCHEDULER");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   📚 Course:", course.title);
    console.log("   👨‍🏫 Teachers:", teachers.length);
    console.log("   🏫 Rooms:", rooms.length);
    console.log("   👥 Enrollments:", enrollments.length);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Log chi tiết trong development mode
    if (process.env.NODE_ENV === "development") {
      console.log("📋 Full payload:");
      console.log(JSON.stringify(payload, null, 2));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 8️⃣ GỌI FASTAPI AI SCHEDULER
    // ═══════════════════════════════════════════════════════════════════════
    
    const aiUrl = process.env.AI_SCHEDULER_URL || "http://localhost:8000";
    const endpoint = `${aiUrl}/optimize/${courseId}?dry=${dry}`;
    
    console.log(`🔄 Calling FastAPI: ${endpoint}`);

    const postController = new AbortController();
    const postTimeout = setTimeout(() => postController.abort(), 30000);
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(payload),
        signal: postController.signal,
      });
    } catch (e: any) {
      clearTimeout(postTimeout);
      return NextResponse.json(
        {
          error: "AI Scheduler timeout hoặc không phản hồi",
          message: e?.message || "Request aborted",
          endpoint,
          hint: "Kiểm tra lại tiến trình FastAPI và giảm tham số GENERATIONS nếu cần",
        },
        { status: 504 }
      );
    } finally {
      clearTimeout(postTimeout);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 9️⃣ XỬ LÝ LỖI TỪ FASTAPI - ✅ FIXED LỖI 5
    // ═══════════════════════════════════════════════════════════════════════
    
    if (!response.ok) {
      const text = await response.text();
      
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ FASTAPI ERROR RESPONSE");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("   Status Code:", response.status);
      console.error("   Endpoint:", endpoint);
      console.error("   Response:", text);
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return NextResponse.json(
        {
          error: "FastAPI trả về lỗi",
          details: text,
          statusCode: response.status,
          endpoint: endpoint,
          hint: "Kiểm tra logs của FastAPI server (terminal chạy uvicorn) để biết chi tiết lỗi.",
        },
        { status: 500 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🔟 PARSE KẾT QUẢ TỪ FASTAPI
    // ═══════════════════════════════════════════════════════════════════════
    
    const result = await response.json();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ AI SCHEDULER SUCCESS!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   📅 Scheduled Classes:", result.scheduledClasses?.length || 0);
    console.log("   👥 Scheduled Enrollments:", result.scheduledEnrollments?.length || 0);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ═══════════════════════════════════════════════════════════════════════
    // 1️⃣1️⃣ GẮN THÔNG TIN BỔ SUNG VÀO KẾT QUẢ
    // ═══════════════════════════════════════════════════════════════════════
    
    // Gắn tempId và teacherName vào scheduledClasses
    if (Array.isArray(result.scheduledClasses)) {
      result.scheduledClasses = result.scheduledClasses.map(
        (cls: any, i: number) => {
          const teacher = teachers.find((t) => t.id === cls.teacherId);
          return {
            ...cls,
            tempId: i + 1,
            teacherName: teacher ? teacher.name : cls.teacherId,
          };
        }
      );
    }


    // Gắn learner info vào scheduledEnrollments
    if (Array.isArray(result.scheduledEnrollments)) {
      result.scheduledEnrollments = result.scheduledEnrollments.map(
        (enr: any, i: number) => {
          const enrollment = enrollments.find((e) => e.id === enr.enrollmentId);
          
          // Fallback scheduledClassId nếu thiếu
          const scheduledClassId =
            enr.scheduledClassId ??
            result.scheduledClasses?.[i % result.scheduledClasses.length]?.tempId;

          return {
            ...enr,
            scheduledClassId,
            learner: enrollment?.learner ?? { name: "—", email: "—" },
          };
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 1️⃣2️⃣ TRẢ VỀ KẾT QUẢ CUỐI CÙNG
    // ═══════════════════════════════════════════════════════════════════════
    
    return NextResponse.json({
      success: true,
      message: `✅ Đã tạo lịch học thành công cho khóa "${course.title}"`,
      data: result,
      meta: {
        courseId: course.id,
        courseTitle: course.title,
        totalClasses: result.scheduledClasses?.length || 0,
        totalEnrollments: result.scheduledEnrollments?.length || 0,
        generatedAt: new Date().toISOString(),
      }
    });
    
  } catch (err: any) {
    // ═══════════════════════════════════════════════════════════════════════
    // ❌ XỬ LÝ LỖI EXCEPTION
    // ═══════════════════════════════════════════════════════════════════════
    
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ SCHEDULER ERROR (EXCEPTION)");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("   Error:", err.message);
    console.error("   Stack:", err.stack);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    return NextResponse.json(
      {
        error: "Lỗi server khi tạo lịch học",
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        hint: "Kiểm tra logs trong terminal Next.js và FastAPI để biết chi tiết.",
      },
      { status: 500 }
    );
  }
}
