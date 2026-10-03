"""
EduPulse AI — Seed Script
Creates demo data: departments, users, courses, enrollments, attendance, marks.
Run: python seed.py (from backend/ directory with venv active)
"""
import sys
import os

# Make sure app is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import date, timedelta
from app.database import engine, Base, SessionLocal
from app.models import (
    Department, User, UserRole, Course, Enrollment, EnrollmentStatus,
    AttendanceSession, AttendanceRecord, AttendanceStatus,
    Assessment, Mark, NotificationSetting, TestRecipient
)
from app.security import get_password_hash
import app.models  # noqa register all models

print("[SEED] Seeding EduPulse AI database...")

# Create tables
Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ─── Clear existing data ──────────────────────────────────────────────────────
print("  Clearing existing data...")
for model in [Mark, Assessment, AttendanceRecord, AttendanceSession,
              Enrollment, Course, TestRecipient, User, Department, NotificationSetting]:
    db.query(model).delete()
db.commit()

# ─── Departments ──────────────────────────────────────────────────────────────
print("  Creating departments...")
depts = [
    Department(code="CSE", name="Computer Science & Engineering"),
    Department(code="ECE", name="Electronics & Communication Engineering"),
    Department(code="EEE", name="Electrical & Electronics Engineering"),
    Department(code="ME",  name="Mechanical Engineering"),
    Department(code="CIVIL", name="Civil Engineering"),
    Department(code="AIDS", name="Artificial Intelligence & Data Science"),
]
db.add_all(depts)
db.commit()
dept_map = {d.code: d for d in depts}

# ─── Notification Settings ────────────────────────────────────────────────────
print("  Creating notification settings...")
notif_settings = NotificationSetting(
    attendance_threshold=75.0,
    warning_margin=5.0,
    marks_warning_threshold=40.0,
    email_enabled=False,
    test_mode_enabled=True,
)
db.add(notif_settings)
db.commit()

# ─── Admin ────────────────────────────────────────────────────────────────────
print("  Creating admin user...")
admin_user = User(
    full_name="Academic Administrator",
    email="karunesh128@gmail.com",
    password_hash=get_password_hash("Admin@123"),
    role=UserRole.admin,
    faculty_id="ADMIN001",
    department_id=dept_map["CSE"].id,
    is_active=True,
)
db.add(admin_user)
db.commit()

# ─── Professors ───────────────────────────────────────────────────────────────
print("  Creating professors...")
professors_data = [
    dict(full_name="Dr. Priya Sharma", email="karunesh789tiwari@gmail.com",
         password="Prof@1234", faculty_id="FAC001", dept="CSE"),
    dict(full_name="Dr. Arjun Nair", email="arjun.nair@kpriet.ac.in",
         password="Prof@123", faculty_id="FAC002", dept="CSE"),
    dict(full_name="Dr. Karan Mehta", email="karan.mehta@kpriet.ac.in",
         password="Prof@123", faculty_id="FAC003", dept="CSE"),
    dict(full_name="Dr. Meena Rajan", email="meena.rajan@kpriet.ac.in",
         password="Prof@123", faculty_id="FAC004", dept="ECE"),
    dict(full_name="Dr. Suresh Kumar", email="suresh.kumar@kpriet.ac.in",
         password="Prof@123", faculty_id="FAC005", dept="EEE"),
]
prof_objects = []
for p in professors_data:
    user = User(
        full_name=p["full_name"],
        email=p["email"],
        password_hash=get_password_hash(p["password"]),
        role=UserRole.professor,
        faculty_id=p["faculty_id"],
        department_id=dept_map[p["dept"]].id,
        is_active=True,
    )
    db.add(user)
    prof_objects.append(user)
db.commit()

# ─── Students (CSE focus, some from other depts) ─────────────────────────────
print("  Creating students...")
students_data = [
    # CSE Section A
    dict(full_name="Rahul Kumar Tiwari", email="24cs263@kpriet.ac.in", sid="24CS263", dept="CSE", section="A", sem=5),
    dict(full_name="Aditi Sharma", email="24cs101@kpriet.ac.in", sid="24CS101", dept="CSE", section="A", sem=5),
    dict(full_name="Sneha Verma", email="24cs104@kpriet.ac.in", sid="24CS104", dept="CSE", section="A", sem=5),
    dict(full_name="Karan Mehta", email="24cs103@kpriet.ac.in", sid="24CS103", dept="CSE", section="A", sem=5),
    dict(full_name="Priya Raj", email="24cs201@kpriet.ac.in", sid="24CS201", dept="CSE", section="A", sem=5),
    dict(full_name="Vijay Anand", email="24cs202@kpriet.ac.in", sid="24CS202", dept="CSE", section="A", sem=5),
    dict(full_name="Deepika Singh", email="24cs203@kpriet.ac.in", sid="24CS203", dept="CSE", section="A", sem=5),
    dict(full_name="Arjun Krishnan", email="24cs118@kpriet.ac.in", sid="24CS118", dept="CSE", section="A", sem=5),
    dict(full_name="Kavya Suresh", email="24cs121@kpriet.ac.in", sid="24CS121", dept="CSE", section="A", sem=5),
    dict(full_name="Vikram Ravi", email="24cs135@kpriet.ac.in", sid="24CS135", dept="CSE", section="A", sem=5),
    dict(full_name="Nithya Lakshmi", email="24cs301@kpriet.ac.in", sid="24CS301", dept="CSE", section="B", sem=5),
    dict(full_name="Surya Dev", email="24cs302@kpriet.ac.in", sid="24CS302", dept="CSE", section="B", sem=5),
    # ECE
    dict(full_name="Sneha Verma ECE", email="23ec045@kpriet.ac.in", sid="23EC045", dept="ECE", section="A", sem=5),
    # EEE
    dict(full_name="Arjun Nair EEE", email="23me078@kpriet.ac.in", sid="23ME078", dept="EEE", section="A", sem=5),
    # AI&DS
    dict(full_name="Kavya S AIML", email="23cs121@kpriet.ac.in", sid="23CS121", dept="AIDS", section="A", sem=5),
]
student_objects = {}
for s in students_data:
    user = User(
        full_name=s["full_name"],
        email=s["email"],
        password_hash=get_password_hash("Student@123"),
        role=UserRole.student,
        student_id=s["sid"],
        department_id=dept_map[s["dept"]].id,
        section=s["section"],
        semester=s["sem"],
        is_active=True,
    )
    db.add(user)
    student_objects[s["sid"]] = user
db.commit()

# ─── Courses (CSE Semester 5) ─────────────────────────────────────────────────
print("  Creating courses...")
courses_data = [
    dict(code="CS501", name="Data Structures & Algorithms", dept="CSE", sem=5, section="A",
         prof=prof_objects[0]),
    dict(code="CS502", name="Operating Systems", dept="CSE", sem=5, section="A",
         prof=prof_objects[1]),
    dict(code="CS503", name="Computer Networks", dept="CSE", sem=5, section="A",
         prof=prof_objects[2]),
    dict(code="CS504", name="Database Management Systems", dept="CSE", sem=5, section="A",
         prof=prof_objects[0]),
    dict(code="CS505", name="Artificial Intelligence", dept="CSE", sem=5, section="A",
         prof=prof_objects[1]),
    dict(code="CS501B", name="Data Structures & Algorithms", dept="CSE", sem=5, section="B",
         prof=prof_objects[2]),
]
course_objects = {}
for c in courses_data:
    course = Course(
        course_code=c["code"],
        course_name=c["name"],
        department_id=dept_map[c["dept"]].id,
        semester=c["sem"],
        section=c["section"],
        professor_id=c["prof"].id,
        credits=3,
        is_active=True,
    )
    db.add(course)
    course_objects[c["code"]] = course
db.commit()

# ─── Enrollments ──────────────────────────────────────────────────────────────
print("  Creating enrollments...")
cse_a_students = [
    "24CS263", "24CS101", "24CS104", "24CS103", "24CS201",
    "24CS202", "24CS203", "24CS118", "24CS121", "24CS135"
]
cse_b_students = ["24CS301", "24CS302"]
cse_a_courses = ["CS501", "CS502", "CS503", "CS504", "CS505"]
cse_b_courses = ["CS501B"]

for sid in cse_a_students:
    for code in cse_a_courses:
        e = Enrollment(
            student_id=student_objects[sid].id,
            course_id=course_objects[code].id,
            status=EnrollmentStatus.active,
        )
        db.add(e)

for sid in cse_b_students:
    for code in cse_b_courses:
        e = Enrollment(
            student_id=student_objects[sid].id,
            course_id=course_objects[code].id,
            status=EnrollmentStatus.active,
        )
        db.add(e)
db.commit()

# ─── Attendance Sessions + Records ────────────────────────────────────────────
print("  Creating attendance sessions and records...")

# Create 10 weeks of attendance (Oct 2025 - Nov 2025)
def create_sessions_for_course(course_code, start_date, num_weeks, prof_user):
    sessions = []
    for week in range(num_weeks):
        monday = start_date + timedelta(weeks=week)
        for day_offset, session_num in [(0, 1), (2, 1), (4, 1)]:  # Mon, Wed, Fri
            sdate = monday + timedelta(days=day_offset)
            if sdate > date.today():
                continue
            sess = AttendanceSession(
                course_id=course_objects[course_code].id,
                session_date=sdate,
                session_number=session_num,
                topic=f"Week {week+1} - Session {day_offset//2 + 1}",
                created_by=prof_user.id,
            )
            db.add(sess)
            sessions.append(sess)
    db.commit()
    return sessions

# Attendance patterns per student (percentage approximation)
attendance_patterns = {
    "24CS263": 0.68,   # Below threshold (Data Structures concern)
    "24CS101": 0.90,   # Good
    "24CS104": 0.72,   # Near threshold
    "24CS103": 0.85,   # Good
    "24CS201": 0.78,   # OK
    "24CS202": 0.65,   # Below threshold
    "24CS203": 0.92,   # Excellent
    "24CS118": 0.70,   # Near threshold
    "24CS121": 0.75,   # At threshold
    "24CS135": 0.82,   # Good
}

start = date(2025, 10, 6)  # First Monday of Oct 2025
import random
random.seed(42)

for code, prof in [
    ("CS501", prof_objects[0]),
    ("CS502", prof_objects[1]),
    ("CS503", prof_objects[2]),
    ("CS504", prof_objects[0]),
    ("CS505", prof_objects[1]),
]:
    sessions = create_sessions_for_course(code, start, 10, prof)
    # Assign records per student
    for sid in cse_a_students:
        base_rate = attendance_patterns.get(sid, 0.80)
        # Vary slightly per course
        course_rate = base_rate + random.uniform(-0.05, 0.05)
        course_rate = max(0.4, min(1.0, course_rate))
        student = student_objects[sid]
        for sess in sessions:
            present = random.random() < course_rate
            rec = AttendanceRecord(
                session_id=sess.id,
                student_id=student.id,
                status=AttendanceStatus.present if present else AttendanceStatus.absent,
                updated_by=prof.id,
            )
            db.add(rec)
    db.commit()
    print(f"    ✓ Attendance for {code}")

# ─── Assessments ──────────────────────────────────────────────────────────────
print("  Creating assessments...")
assessments_data = []
for code, prof in [
    ("CS501", prof_objects[0]),
    ("CS502", prof_objects[1]),
    ("CS503", prof_objects[2]),
    ("CS504", prof_objects[0]),
    ("CS505", prof_objects[1]),
]:
    for atype, aname, max_m, adate in [
        ("IA1", "Internal Assessment 1", 30, date(2025, 10, 28)),
        ("IA2", "Internal Assessment 2", 30, date(2025, 11, 25)),
        ("Assignment", "Assignment 1", 10, date(2025, 10, 20)),
    ]:
        a = Assessment(
            course_id=course_objects[code].id,
            assessment_name=aname,
            assessment_type=atype,
            max_marks=max_m,
            assessment_date=adate,
            created_by=prof.id,
        )
        db.add(a)
        assessments_data.append((a, course_objects[code], prof))
db.commit()

# ─── Marks ────────────────────────────────────────────────────────────────────
print("  Creating marks...")
marks_patterns = {
    "24CS263": {"IA1": 0.60, "IA2": 0.80, "Assignment": 0.90},
    "24CS101": {"IA1": 0.90, "IA2": 0.87, "Assignment": 0.95},
    "24CS104": {"IA1": 0.62, "IA2": 0.68, "Assignment": 0.70},
    "24CS103": {"IA1": 0.85, "IA2": 0.82, "Assignment": 0.92},
    "24CS201": {"IA1": 0.75, "IA2": 0.78, "Assignment": 0.80},
    "24CS202": {"IA1": 0.55, "IA2": 0.50, "Assignment": 0.65},
    "24CS203": {"IA1": 0.92, "IA2": 0.95, "Assignment": 1.00},
    "24CS118": {"IA1": 0.48, "IA2": 0.55, "Assignment": 0.70},
    "24CS121": {"IA1": 0.72, "IA2": 0.75, "Assignment": 0.80},
    "24CS135": {"IA1": 0.82, "IA2": 0.78, "Assignment": 0.88},
}

assessments_in_db = db.query(Assessment).all()
for a in assessments_in_db:
    for sid in cse_a_students:
        student = student_objects[sid]
        base_rate = marks_patterns.get(sid, {}).get(a.assessment_type, 0.70)
        rate = base_rate + random.uniform(-0.05, 0.05)
        rate = max(0.20, min(1.0, rate))
        obtained = round(rate * a.max_marks, 1)
        m = Mark(
            assessment_id=a.id,
            student_id=student.id,
            marks_obtained=obtained,
            entered_by=a.created_by,
        )
        db.add(m)
db.commit()
print("    ✓ Marks seeded")

# ─── Test Recipients (placeholder — admin will add real ones) ─────────────────
print("  Creating placeholder test recipients...")
placeholders = [
    TestRecipient(name="Test Student 1", email="24cs263@kpriet.ac.in",
                  student_id="24CS263", consent_confirmed=True, is_active=True, added_by=admin_user.id),
    TestRecipient(name="Test Student 2", email="24cs101@kpriet.ac.in",
                  student_id="24CS101", consent_confirmed=True, is_active=True, added_by=admin_user.id),
]
db.add_all(placeholders)
db.commit()

db.close()

print("""
✅ Seeding complete!

Demo Accounts:
  Admin:     admin@edupulse.kpriet.ac.in  / Admin@123
  Professor: karunesh789tiwari@gmail.com  / Prof@1234
  Student:   24cs263@kpriet.ac.in         / Student@123

Run backend: uvicorn app.main:app --reload
""")
