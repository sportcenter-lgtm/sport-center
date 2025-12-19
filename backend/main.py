from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import shutil
import os
from analysis import analyze_video
from user_manager import UserManager
from history_manager import HistoryManager
from schedule_manager import ScheduleManager


app = FastAPI()
user_manager = UserManager()
history_manager = HistoryManager()
schedule_manager = ScheduleManager()

class UserRegister(BaseModel):
    username: str
    password: str
    email: str
    name: str
    sport: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    name: str = None
    email: str = None
    sport: str = None
    role: str = None
    password: str = None

class ForgotPassword(BaseModel):
    email: str

class ResetPassword(BaseModel):
    token: str
    new_password: str

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize default admin
user_manager.create_default_admin()

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/users")
def get_users():
    # In a real app, check for admin token/session here!
    return user_manager.get_all_users()

@app.put("/users/{username}")
def update_user(username: str, user: UserUpdate):
    # In a real app, check for admin token/session here!
    data = user.dict(exclude_unset=True)
    success, message = user_manager.update_user(username, data)
    if not success:
        raise HTTPException(status_code=404, detail=message)
    return {"message": message}

@app.delete("/users/{username}")
def delete_user(username: str):
    # In a real app, check for admin token/session here!
    success, message = user_manager.delete_user(username)
    if not success:
        raise HTTPException(status_code=404, detail=message)
    return {"message": message}

class VerifyRequest(BaseModel):
    username: str
    code: str

@app.post("/verify-email")
async def verify_email(data: VerifyRequest):
    success, message = user_manager.verify_user(data.username, data.code)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}

@app.post("/register")
async def register(user: UserRegister):
    success, message = user_manager.create_user(
        user.username, user.password, user.email, user.name, user.sport
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}

@app.post("/login")
def login(user: UserLogin):
    success, data = user_manager.authenticate(user.username, user.password)
    if not success:
        raise HTTPException(status_code=401, detail=data)
    
    # Return role in response
    role = data.get("role", "user")
    return {
        "message": "Login successful", 
        "user": {
            "username": user.username, 
            "name": data["name"],
            "role": role
        }
    }

@app.post("/forgot-password")
def forgot_password(data: ForgotPassword):
    success, token = user_manager.generate_reset_token(data.email)
    if not success:
        # Don't reveal if email exists or not for security, but for this demo we will return 404
        raise HTTPException(status_code=404, detail=token)
    
    # SIMULATE EMAIL SENDING
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    print(f"\n[EMAIL SIMULATION] To: {data.email}")
    print(f"[EMAIL SIMULATION] Subject: Password Reset Request")
    print(f"[EMAIL SIMULATION] Link: {reset_link}\n")
    
    return {"message": "Reset link sent to email (Check server console)"}

@app.post("/reset-password")
def reset_password(data: ResetPassword):
    success, message = user_manager.reset_password(data.token, data.new_password)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}

@app.get("/history/{username}")
def get_history(username: str):
    return history_manager.get_user_history(username)

# --- Student Endpoints ---
class StudentCreate(BaseModel):
    name: str
    email: str = None
    sport: str = "beach tennis"

@app.post("/students/{username}")
def create_student(username: str, student: StudentCreate):
    success, data = user_manager.add_student(username, student.name, student.email, student.sport)
    if not success:
        raise HTTPException(status_code=400, detail=data)
    return data

@app.get("/students/{username}")
def get_students(username: str):
    return user_manager.get_students(username)

class StudentUpdate(BaseModel):
    name: str = None
    email: str = None
    sport: str = None
    weaknesses: str = None

@app.put("/students/{username}/{student_id}")
def update_student(username: str, student_id: str, student: StudentUpdate):
    data = student.dict(exclude_unset=True)
    success, message = user_manager.update_student(username, student_id, data)
    if not success:
        raise HTTPException(status_code=404, detail=message)
    return {"message": message}

@app.delete("/students/{username}/{student_id}")
def delete_student(username: str, student_id: str):
    success, message = user_manager.delete_student(username, student_id)
    if not success:
        raise HTTPException(status_code=404, detail=message)
    return {"message": message}

@app.post("/analyze")
async def analyze_endpoint(
    file: UploadFile = File(...), 
    shot_type: str = Form("serve"),
    username: str = Form(None),
    trim_start: float = Form(0.0),
    trim_end: float = Form(None)
):
    try:
        file_location = f"{UPLOAD_DIR}/{file.filename}"
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_path = f"{PROCESSED_DIR}/processed_{file.filename}"
        
        # Run analysis
        results = analyze_video(file_location, output_path, shot_type, trim_start=trim_start, trim_end=trim_end)
        score = results["score"]
        feedback = results["feedback"]
        processed_video_url = results["processed_video_url"]
        
        # Save to history if username is provided
        if username:
            history_manager.add_record(username, shot_type, score, feedback)
        
        return {
            "score": score, 
            "feedback": feedback,
            "processed_video_url": processed_video_url,
            "shot_type": shot_type
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

@app.get("/processed/{filename}")
async def get_processed_video(filename: str):
    file_path = os.path.join(PROCESSED_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return HTTPException(status_code=404, detail="File not found")


# --- Scheduler Endpoints ---

class SchedulePlayerCreate(BaseModel):
    name: str
    level: int
    default_days: List[str] = []
    enrollments: List[dict] = [] # List of { month, weekday, time, coach }

class BatchEnroll(BaseModel):
    enrollments: List[dict] # List of { month, weekday, time, coach }

class ClassCreate(BaseModel):
    date: str
    time: str
    student_ids: List[str] = []
    coach: Optional[str] = None
    max_students: Optional[int] = 4

class ClassSeriesCreate(BaseModel):
    month: str
    weekday: str
    time: str
    student_ids: List[str] = []
    coach: Optional[str] = None
    max_students: Optional[int] = 4

class CopySchedule(BaseModel):
    target_month: str

class BulkDelete(BaseModel):
    class_ids: List[str]

class ClassUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    coach: Optional[str] = None
    student_ids: Optional[List[str]] = None
    max_students: Optional[int] = None

class BookMakeup(BaseModel):
    class_id: str
    player_id: str
    use_credit: bool = False

class MarkAbsent(BaseModel):
    class_id: str
    player_id: str

class RosterRemove(BaseModel):
    award_credit: bool = False

class MarkAttendance(BaseModel):
    status: str

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[int] = None
    default_days: Optional[List[str]] = None
    makeup_credits: Optional[int] = None

@app.post("/scheduler/players")
def add_schedule_player(player: SchedulePlayerCreate):
    new_player = schedule_manager.add_player(player.name, player.level, player.default_days)
    
    # Handle multiple initial enrollments
    for ie in player.enrollments:
        schedule_manager.batch_enroll(
            new_player["id"], 
            ie.get("month"), 
            ie.get("weekday"), 
            ie.get("time"), 
            ie.get("coach")
        )
        
    return new_player

@app.get("/scheduler/players")
def get_schedule_players():
    return schedule_manager.get_players()

@app.delete("/scheduler/players/{player_id}")
def delete_schedule_player(player_id: str):
    success = schedule_manager.delete_player(player_id)
    if not success:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"message": "Player deleted"}

@app.post("/scheduler/players/{player_id}/enroll")
def enroll_player_in_series(player_id: str, data: BatchEnroll):
    count = 0
    for ie in data.enrollments:
        added = schedule_manager.batch_enroll(
            player_id, 
            ie.get("month"), 
            ie.get("weekday"), 
            ie.get("time"), 
            ie.get("coach")
        )
        count += added
    return {"message": f"Enrolled in {count} classes"}

@app.post("/scheduler/players/{player_id}/unenroll")
def unenroll_player_series(player_id: str, data: BatchEnroll):
    count = 0
    for ie in data.enrollments:
        removed = schedule_manager.batch_unenroll(
            player_id, 
            ie.get("month"), 
            ie.get("weekday"), 
            ie.get("time"), 
            ie.get("coach")
        )
        count += removed
    return {"message": f"Unenrolled from {count} classes"}

@app.patch("/scheduler/players/{player_id}")
def update_schedule_player(player_id: str, data: PlayerUpdate):
    success = schedule_manager.update_player(player_id, data.name, data.level, data.default_days, data.makeup_credits)
    if not success:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"message": "Player updated"}

@app.post("/scheduler/classes/{class_id}/roster/{player_id}/remove")
def remove_student_from_class_endpoint(class_id: str, player_id: str, data: RosterRemove):
    success, msg = schedule_manager.remove_student_from_class(class_id, player_id, data.award_credit)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

@app.post("/scheduler/classes")
def create_class_schedule(cls: ClassCreate):
    return schedule_manager.create_class(cls.date, cls.time, cls.student_ids, cls.coach, cls.max_students)

@app.post("/scheduler/classes/series")
def create_class_series(data: ClassSeriesCreate):
    return schedule_manager.create_monthly_series(data.month, data.weekday, data.time, data.student_ids, data.coach, data.max_students)

@app.post("/scheduler/classes/copy")
def copy_class_schedule(data: CopySchedule):
    success, msg = schedule_manager.copy_month_schedule(data.target_month)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

@app.patch("/scheduler/classes/{class_id}")
def update_class_schedule(class_id: str, data: ClassUpdate):
    success = schedule_manager.update_class(class_id, data.date, data.time, data.coach, data.student_ids, data.max_students)
    if not success:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"message": "Class updated"}

@app.post("/scheduler/classes/{class_id}/propagate")
def propagate_class_properties(class_id: str, match_time: str = None):
    # match_time is optional query param
    count = schedule_manager.propagate_class_properties(class_id, match_time)
    return {"updated_count": count}

@app.get("/scheduler/classes")
def get_classes_schedule(month: str = None):
    return schedule_manager.get_classes(month)

@app.get("/scheduler/month-stats")
def get_month_stats(month: str):
    return schedule_manager.calculate_month_stats(month)

@app.delete("/scheduler/classes/{class_id}")
def delete_class_schedule(class_id: str):
    success = schedule_manager.delete_class(class_id)
    if not success:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"message": "Class deleted"}

@app.post("/scheduler/classes/bulk-delete")
def bulk_delete_classes(data: BulkDelete):
    count = schedule_manager.delete_classes(data.class_ids)
    return {"deleted_count": count}

@app.get("/scheduler/makeup-options/{player_id}")
def get_makeup_options(player_id: str, month: str = None):
    return schedule_manager.find_makeup_options(player_id, month)

@app.post("/scheduler/book")
def book_makeup_slot(data: BookMakeup):
    success, msg = schedule_manager.book_makeup(data.class_id, data.player_id, data.use_credit)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

@app.post("/scheduler/classes/{class_id}/attendance/{player_id}")
def mark_attendance_endpoint(class_id: str, player_id: str, data: MarkAttendance):
    success, msg = schedule_manager.mark_attendance(class_id, player_id, data.status)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

@app.post("/scheduler/mark-absent")
def mark_class_absent(data: MarkAbsent):
    success, msg = schedule_manager.mark_absent(data.class_id, data.player_id)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
