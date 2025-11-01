from fastapi import FastAPI, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from models import InputPayload, ScheduleResult
from genetic_algorithm import genetic_algorithm  # FIXED: Import đúng path

app = FastAPI(
    title="AI Scheduler – Genetic Algorithm",
    description="Hệ thống xếp lịch học tự động bằng thuật toán di truyền",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "AI Scheduler API is running",
        "version": "1.0.0"
    }

@app.post("/optimize/{course_id}", response_model=ScheduleResult)
def optimize_schedule(
    course_id: int = Path(..., description="ID của khóa học cần xếp lịch"),
    dry: bool = Query(False, description="Nếu True, chỉ trả kết quả không lưu DB"),
    payload: InputPayload = None
):
    """
    Tối ưu hóa lịch học cho một khóa học
    """
    result = genetic_algorithm(
        course=payload.course,
        teachers=payload.teachers,
        rooms=payload.rooms,
        enrollments=payload.enrollments
    )
    
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
