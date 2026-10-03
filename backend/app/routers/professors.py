"""
Professors router — faculty dashboard data
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole, Course, Enrollment, AttendanceSession, AttendanceRecord, Mark, AttendanceStatus
from app.schemas import UserOut
from app.dependencies import get_current_user, require_admin, require_professor_or_admin

router = APIRouter(prefix="/api/professors", tags=["Professors"])


@router.get("", response_model=List[UserOut])
def list_professors(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(User).filter(User.role == UserRole.professor, User.is_active == True).all()
    return [
        UserOut(
            id=u.id, full_name=u.full_name, email=u.email, role=u.role,
            faculty_id=u.faculty_id, department_id=u.department_id,
            department_name=u.department_rel.name if u.department_rel else None,
            section=u.section, is_active=u.is_active,
            profile_image=u.profile_image,
            lang_pref=u.lang_pref, created_at=u.created_at,
        )
        for u in users
    ]


@router.get("/me/dashboard")
def professor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.professor, UserRole.admin):
        raise HTTPException(status_code=403, detail="Not authorized")

    if current_user.role == UserRole.professor:
        courses = db.query(Course).filter(
            Course.professor_id == current_user.id,
            Course.is_active == True,
        ).all()
    else:
        courses = db.query(Course).filter(Course.is_active == True).all()

    if not courses:
        return {
            "assigned_courses": 0,
            "total_students": 0,
            "sessions_recorded": 0,
            "students_needing_attention": 0,
            "courses": [],
        }

    from app.routers.attendance import _get_settings
    settings = _get_settings(db)
    course_ids = [c.id for c in courses]

    # Bulk query 1: Session counts per course
    sess_rows = (
        db.query(AttendanceSession.course_id, func.count(AttendanceSession.id))
        .filter(AttendanceSession.course_id.in_(course_ids))
        .group_by(AttendanceSession.course_id)
        .all()
    )
    sess_counts = {cid: cnt for cid, cnt in sess_rows}

    # Bulk query 2: Enrollment counts per course
    enroll_rows = (
        db.query(Enrollment.course_id, func.count(Enrollment.id))
        .filter(Enrollment.course_id.in_(course_ids), Enrollment.status == "active")
        .group_by(Enrollment.course_id)
        .all()
    )
    enroll_counts = {cid: cnt for cid, cnt in enroll_rows}

    # Bulk query 3: Attended count per (course_id, student_id)
    attended_rows = (
        db.query(
            AttendanceSession.course_id,
            AttendanceRecord.student_id,
            func.count(AttendanceRecord.id),
        )
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(
            AttendanceSession.course_id.in_(course_ids),
            AttendanceRecord.status == AttendanceStatus.present,
        )
        .group_by(AttendanceSession.course_id, AttendanceRecord.student_id)
        .all()
    )
    attended_map = {(cid, sid): cnt for cid, sid, cnt in attended_rows}

    # Active enrollments
    active_enrolls = (
        db.query(Enrollment.course_id, Enrollment.student_id)
        .filter(Enrollment.course_id.in_(course_ids), Enrollment.status == "active")
        .all()
    )

    students_at_risk = 0
    threshold_limit = settings.attendance_threshold + settings.warning_margin
    for cid, sid in active_enrolls:
        total_s = sess_counts.get(cid, 0)
        att_cnt = attended_map.get((cid, sid), 0)
        pct = (att_cnt / total_s * 100) if total_s > 0 else 100.0
        if total_s > 0 and pct < threshold_limit:
            students_at_risk += 1

    return {
        "assigned_courses": len(courses),
        "total_students": sum(enroll_counts.values()),
        "sessions_recorded": sum(sess_counts.values()),
        "students_needing_attention": students_at_risk,
        "courses": [
            {
                "id": c.id,
                "course_code": c.course_code,
                "course_name": c.course_name,
                "section": c.section,
                "semester": c.semester,
                "department": c.department_rel.name if c.department_rel else "",
                "enrolled_students": enroll_counts.get(c.id, 0),
            }
            for c in courses
        ],
    }


@router.get("/me/attention-list")
def attention_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_professor_or_admin),
):
    """Students requiring attention across assigned courses."""
    if current_user.role == UserRole.professor:
        courses = db.query(Course).filter(Course.professor_id == current_user.id, Course.is_active == True).all()
    else:
        courses = db.query(Course).filter(Course.is_active == True).all()

    if not courses:
        return []

    from app.routers.attendance import _get_settings
    from app.calculations import get_attendance_status
    from sqlalchemy import func
    settings = _get_settings(db)
    course_ids = [c.id for c in courses]
    course_map = {c.id: c for c in courses}

    sess_rows = (
        db.query(AttendanceSession.course_id, func.count(AttendanceSession.id))
        .filter(AttendanceSession.course_id.in_(course_ids))
        .group_by(AttendanceSession.course_id)
        .all()
    )
    sess_counts = {cid: cnt for cid, cnt in sess_rows}

    attended_rows = (
        db.query(
            AttendanceSession.course_id,
            AttendanceRecord.student_id,
            func.count(AttendanceRecord.id),
        )
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(
            AttendanceSession.course_id.in_(course_ids),
            AttendanceRecord.status == AttendanceStatus.present,
        )
        .group_by(AttendanceSession.course_id, AttendanceRecord.student_id)
        .all()
    )
    attended_map = {(cid, sid): cnt for cid, sid, cnt in attended_rows}

    active_enrolls = (
        db.query(Enrollment)
        .filter(Enrollment.course_id.in_(course_ids), Enrollment.status == "active")
        .all()
    )

    flagged = []
    for e in active_enrolls:
        cid = e.course_id
        sid = e.student_id
        tot = sess_counts.get(cid, 0)
        att = attended_map.get((cid, sid), 0)
        pct = round((att / tot * 100), 1) if tot > 0 else 100.0
        status_str = get_attendance_status(pct, settings.attendance_threshold, settings.warning_margin)
        if status_str in ("Below Threshold", "Near Threshold") and tot > 0:
            s = e.student
            c = course_map.get(cid)
            flagged.append({
                "student_id": s.id,
                "student_name": s.full_name,
                "student_id_no": s.student_id or f"24CS{s.id:03d}",
                "course": c.course_name if c else "",
                "course_code": c.course_code if c else "",
                "attendance_percentage": pct,
                "status": status_str,
                "total_sessions": tot,
                "attended": att,
            })

    return flagged
