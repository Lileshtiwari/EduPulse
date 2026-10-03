"""
Students router — student-specific dashboard data and profile
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole, Enrollment, NotificationSetting
from app.schemas import UserOut, UserUpdate
from app.dependencies import get_current_user, require_admin
from app.calculations import assess_risk

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("/me/profile", response_model=UserOut)
def my_profile(current_user: User = Depends(get_current_user)):
    dept_name = current_user.department_rel.name if current_user.department_rel else None
    return UserOut(
        id=current_user.id, full_name=current_user.full_name,
        email=current_user.email, role=current_user.role,
        student_id=current_user.student_id, faculty_id=current_user.faculty_id,
        department_id=current_user.department_id, department_name=dept_name,
        section=current_user.section, semester=current_user.semester,
        phone=current_user.phone, profile_image=current_user.profile_image, is_active=current_user.is_active,
        lang_pref=current_user.lang_pref, created_at=current_user.created_at,
    )


@router.patch("/me/profile", response_model=UserOut)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.full_name:
        current_user.full_name = payload.full_name
    if payload.phone:
        current_user.phone = payload.phone
    if payload.section:
        current_user.section = payload.section
    if payload.lang_pref:
        current_user.lang_pref = payload.lang_pref
    if payload.profile_image is not None:
        from app.security import save_profile_image_if_base64
        current_user.profile_image = save_profile_image_if_base64(payload.profile_image)
    db.commit()
    db.refresh(current_user)
    dept_name = current_user.department_rel.name if current_user.department_rel else None
    return UserOut(
        id=current_user.id, full_name=current_user.full_name,
        email=current_user.email, role=current_user.role,
        student_id=current_user.student_id, faculty_id=current_user.faculty_id,
        department_id=current_user.department_id, department_name=dept_name,
        section=current_user.section, semester=current_user.semester,
        phone=current_user.phone, profile_image=current_user.profile_image, is_active=current_user.is_active,
        lang_pref=current_user.lang_pref, created_at=current_user.created_at,
    )


@router.get("/me/risk")
def my_risk(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Student only endpoint")

    from app.routers.attendance import _get_settings, _get_course_attendance
    from app.models import Mark, Assessment

    settings = _get_settings(db)
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.status == "active",
    ).all()

    attendance_summaries = []
    for e in enrollments:
        att = _get_course_attendance(current_user.id, e.course_id, db, settings)
        attendance_summaries.append(att)

    marks_summaries = []
    for e in enrollments:
        marks = db.query(Mark).filter(
            Mark.student_id == current_user.id,
        ).all()
        for m in marks:
            if m.assessment.course_id == e.course_id and m.assessment.max_marks > 0:
                pct = (m.marks_obtained / m.assessment.max_marks) * 100
                marks_summaries.append({
                    "course_name": m.assessment.course.course_name if m.assessment.course else "",
                    "assessment_name": m.assessment.assessment_name,
                    "percentage": pct,
                })

    risk = assess_risk(
        attendance_summaries, marks_summaries,
        settings.attendance_threshold, settings.warning_margin,
        settings.marks_warning_threshold,
    )
    risk["student_id"] = current_user.id
    risk["student_name"] = current_user.full_name
    return risk


# ─── Admin — list all students ────────────────────────────────────────────────

@router.get("", response_model=List[UserOut])
def list_students(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(User).filter(User.role == UserRole.student, User.is_active == True).all()
    return [
        UserOut(
            id=u.id, full_name=u.full_name, email=u.email, role=u.role,
            student_id=u.student_id, department_id=u.department_id,
            department_name=u.department_rel.name if u.department_rel else None,
            section=u.section, semester=u.semester, is_active=u.is_active,
            lang_pref=u.lang_pref, created_at=u.created_at,
        )
        for u in users
    ]


@router.get("/{student_id}/risk")
def student_risk(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.student and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")

    from app.routers.attendance import _get_settings, _get_course_attendance
    from app.models import Mark

    settings = _get_settings(db)
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == student_id, Enrollment.status == "active",
    ).all()

    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    attendance_summaries = [
        _get_course_attendance(student_id, e.course_id, db, settings)
        for e in enrollments
    ]

    marks_list = db.query(Mark).filter(Mark.student_id == student_id).all()
    marks_summaries = []
    for m in marks_list:
        if m.assessment.max_marks > 0:
            marks_summaries.append({
                "course_name": m.assessment.course.course_name if m.assessment.course else "",
                "assessment_name": m.assessment.assessment_name,
                "percentage": (m.marks_obtained / m.assessment.max_marks) * 100,
            })

    risk = assess_risk(
        attendance_summaries, marks_summaries,
        settings.attendance_threshold, settings.warning_margin,
        settings.marks_warning_threshold,
    )
    risk["student_id"] = student_id
    risk["student_name"] = student.full_name
    return risk
