from typing import List, Optional
from pydantic import BaseModel

class Course(BaseModel):
    """Thông tin khóa học"""
    id: int
    title: str  # FIXED: Thêm field title
    structure_lessons_per_week: int
    structure_lesson_duration: int
    requirement_qualification: Optional[str] = None

class Teacher(BaseModel):
    """Thông tin giáo viên"""
    id: str
    availability: List[str]
    qualifications: List[str]

class Room(BaseModel):
    """Thông tin phòng học"""
    id: str
    capacity: int
    availability: List[str]

class Enrollment(BaseModel):
    """Thông tin đăng ký học"""
    id: int
    userId: int
    availableSlots: List[str]

class InputPayload(BaseModel):
    """Request payload cho API"""
    course: Course
    teachers: List[Teacher]
    rooms: List[Room]
    enrollments: List[Enrollment]

class ScheduledClass(BaseModel):
    """Lớp học đã được xếp lịch"""
    courseId: int
    teacherId: str
    roomId: str
    dayOfWeek: str
    timeSlot: str
    startDate: str
    endDate: str

class ScheduledEnrollment(BaseModel):
    """Học viên được phân vào lớp"""
    scheduledClassId: int
    enrollmentId: int

class ScheduleResult(BaseModel):
    """Kết quả xếp lịch"""
    scheduledClasses: List[ScheduledClass]
    scheduledEnrollments: List[ScheduledEnrollment]
