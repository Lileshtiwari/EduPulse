"""
Courses router — CRUD for courses, enrollments, departments
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Course, Enrollment, Department, User, UserRole
from app.schemas import CourseOut, CourseCreate, EnrollmentOut, DepartmentOut
from app.dependencies import get_current_user, require_admin, require_professor_or_admin

router = APIRouter(prefix="/api", tags=["Courses"])


@router.get("/departments", response_model=List[DepartmentOut])
def list_departments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Department).all()


@router.get("/courses", response_model=List[CourseOut])
def list_courses(
    department_id: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Course).filter(Course.is_active == True)
    if department_id:
        query = query.filter(Course.department_id == department_id)
    if semester:
        query = query.filter(Course.semester == semester)

    # Professors see only courses assigned to them by admin
    if current_user.role == UserRole.professor:
        query = query.filter(Course.professor_id == current_user.id)
        if current_user.section and current_user.section != "ALL":
            from sqlalchemy import or_
            query = query.filter(or_(Course.section == current_user.section, Course.section == None))

    courses = query.all()
    result = []
    for c in courses:
        result.append(CourseOut(
            id=c.id,
            course_code=c.course_code,
            course_name=c.course_name,
            department_id=c.department_id,
            department_name=c.department_rel.name if c.department_rel else None,
            semester=c.semester,
            section=c.section,
            professor_id=c.professor_id,
            professor_name=c.professor.full_name if c.professor else None,
            credits=c.credits,
            is_active=c.is_active,
        ))
    return result


@router.get("/courses/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
    # Check access
    if current_user.role == UserRole.professor and c.professor_id != current_user.id:
        if c.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Not assigned to this course")
    if current_user.role == UserRole.student:
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id,
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this course")
    return CourseOut(
        id=c.id,
        course_code=c.course_code,
        course_name=c.course_name,
        department_id=c.department_id,
        department_name=c.department_rel.name if c.department_rel else None,
        semester=c.semester,
        section=c.section,
        professor_id=c.professor_id,
        professor_name=c.professor.full_name if c.professor else None,
        credits=c.credits,
        is_active=c.is_active,
    )


@router.post("/courses", response_model=CourseOut, status_code=201)
def create_course(payload: CourseCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(Course).filter(
        Course.course_code == payload.course_code,
        Course.section == payload.section,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Course with same code and section already exists")
    c = Course(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return CourseOut(
        id=c.id, course_code=c.course_code, course_name=c.course_name,
        department_id=c.department_id, semester=c.semester, section=c.section,
        professor_id=c.professor_id, credits=c.credits, is_active=c.is_active,
    )


@router.put("/courses/{course_id}", response_model=CourseOut)
def update_course(course_id: int, payload: CourseCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
    for k, v in payload.model_dump().items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return CourseOut(id=c.id, course_code=c.course_code, course_name=c.course_name,
                     department_id=c.department_id, semester=c.semester, section=c.section,
                     professor_id=c.professor_id, credits=c.credits, is_active=c.is_active)


@router.get("/courses/{course_id}/students", response_model=List[dict])
def get_enrolled_students(
    course_id: int,
    section: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.role == UserRole.professor and course.professor_id != current_user.id:
        if course.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Not assigned to this course")

    enrollments = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.status == "active",
    ).all()

    result = []
    for e in enrollments:
        s = e.student
        if section and section != "ALL" and s.section != section:
            continue
        result.append({
            "id": s.id,
            "full_name": s.full_name,
            "email": s.email,
            "student_id": s.student_id,
            "section": s.section or "A",
            "enrollment_id": e.id,
        })
    return result


@router.post("/enrollments", status_code=201)
def enroll_student(
    student_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.course_id == course_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Student already enrolled")
    enroll = Enrollment(student_id=student_id, course_id=course_id)
    db.add(enroll)
    db.commit()
    return {"message": "Enrolled successfully"}


@router.delete("/enrollments/{enrollment_id}")
def remove_enrollment(enrollment_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    e = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(e)
    db.commit()
    return {"message": "Enrollment removed"}
