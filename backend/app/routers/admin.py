"""
Admin router — user management, dashboard stats, audit logs, settings
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole, Course, Enrollment, Mark, AuditLog, NotificationSetting, Department
from app.schemas import UserCreate, UserUpdate, UserOut, AuditLogOut, DepartmentCreate, DepartmentOut
from app.dependencies import require_admin, get_current_user
from app.security import get_password_hash, save_profile_image_if_base64
import json

router = APIRouter(prefix="/api/admin", tags=["Admin"])


from app.email_templates import build_account_welcome_html_email


def log_action(db: Session, actor_id: int, action: str, entity_type: str, entity_id: str = "", metadata: dict = None):
    entry = AuditLog(
        actor_user_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        metadata_json=json.dumps(metadata) if metadata else None,
    )
    db.add(entry)
    db.commit()


# ─── Dashboard Stats ──────────────────────────────────────────────────────────

@router.get("/dashboard-stats")
def admin_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.routers.attendance import _get_settings
    from app.models import AttendanceSession, AttendanceRecord, AttendanceStatus, Assessment
    from sqlalchemy import func

    settings = _get_settings(db)
    total_students = db.query(User).filter(User.role == UserRole.student, User.is_active == True).count()
    total_professors = db.query(User).filter(User.role == UserRole.professor, User.is_active == True).count()
    total_courses = db.query(Course).filter(Course.is_active == True).count()

    # Bulk count sessions per course
    sess_rows = (
        db.query(AttendanceSession.course_id, func.count(AttendanceSession.id))
        .group_by(AttendanceSession.course_id)
        .all()
    )
    sess_counts = {cid: cnt for cid, cnt in sess_rows}

    # Bulk count attended records per (course_id, student_id)
    attended_rows = (
        db.query(
            AttendanceSession.course_id,
            AttendanceRecord.student_id,
            func.count(AttendanceRecord.id),
        )
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(AttendanceRecord.status == AttendanceStatus.present)
        .group_by(AttendanceSession.course_id, AttendanceRecord.student_id)
        .all()
    )
    attended_map = {(cid, sid): cnt for cid, sid, cnt in attended_rows}

    # All active enrollments
    enrollments = (
        db.query(Enrollment.student_id, Enrollment.course_id)
        .filter(Enrollment.status == "active")
        .all()
    )

    student_status = {}
    threshold = settings.attendance_threshold
    threshold_limit = threshold + settings.warning_margin
    for sid, cid in enrollments:
        tot = sess_counts.get(cid, 0)
        if tot == 0:
            continue
        att = attended_map.get((cid, sid), 0)
        pct = (att / tot) * 100.0
        if sid not in student_status:
            student_status[sid] = {"at_risk": False, "below": False}
        if pct < threshold:
            student_status[sid]["below"] = True
            student_status[sid]["at_risk"] = True
        elif pct < threshold_limit:
            student_status[sid]["at_risk"] = True

    students_at_risk = sum(1 for v in student_status.values() if v["at_risk"])
    students_below_threshold = sum(1 for v in student_status.values() if v["below"])

    # Pending marks: bulk query assessments and marks
    assessments_by_course = (
        db.query(Assessment.id, Assessment.course_id)
        .all()
    )
    enroll_counts_per_course = dict(
        db.query(Enrollment.course_id, func.count(Enrollment.id))
        .filter(Enrollment.status == "active")
        .group_by(Enrollment.course_id)
        .all()
    )
    mark_counts_per_assess = dict(
        db.query(Mark.assessment_id, func.count(Mark.id))
        .group_by(Mark.assessment_id)
        .all()
    )
    pending_marks = 0
    for a_id, c_id in assessments_by_course:
        enrolled_cnt = enroll_counts_per_course.get(c_id, 0)
        entered_cnt = mark_counts_per_assess.get(a_id, 0)
        pending_marks += max(0, enrolled_cnt - entered_cnt)

    return {
        "total_students": total_students,
        "total_professors": total_professors,
        "total_courses": total_courses,
        "students_at_risk": students_at_risk,
        "students_below_threshold": students_below_threshold,
        "pending_marks": pending_marks,
    }


# ─── User Management ──────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
def list_all_users(
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.all()
    return [
        UserOut(
            id=u.id, full_name=u.full_name, email=u.email, role=u.role,
            student_id=u.student_id, faculty_id=u.faculty_id,
            department_id=u.department_id,
            department_name=u.department_rel.name if u.department_rel else None,
            section=u.section, semester=u.semester,
            phone=u.phone, is_active=u.is_active,
            profile_image=u.profile_image,
            lang_pref=u.lang_pref, created_at=u.created_at,
        )
        for u in users
    ]


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        full_name=payload.full_name,
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        student_id=payload.student_id,
        faculty_id=payload.faculty_id,
        department_id=payload.department_id,
        section=payload.section,
        semester=payload.semester,
        phone=payload.phone,
        profile_image=save_profile_image_if_base64(payload.profile_image),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Auto-enroll student into matching courses
    assigned_courses_data = []
    if user.role == UserRole.student and user.department_id and user.semester:
        matching_courses = db.query(Course).filter(
            Course.department_id == user.department_id,
            Course.semester == user.semester,
            Course.is_active == True,
        ).all()
        
        # If no courses exist for this department/semester, create default standard courses
        if not matching_courses:
            dept = db.query(Department).filter(Department.id == user.department_id).first()
            dcode = (dept.code if dept else "CS")[:2].upper()
            sem = user.semester or 5
            sec = user.section or "A"
            default_subjects = [
                (f"{dcode}{sem}01", f"{dept.name if dept else 'Core'} Principles & Systems"),
                (f"{dcode}{sem}02", f"{dept.name if dept else 'Core'} Applied Technologies"),
                (f"{dcode}{sem}03", f"{dept.name if dept else 'Core'} Laboratory Practice"),
                (f"{dcode}{sem}04", f"Department Elective {sem}"),
            ]
            for c_code, c_name in default_subjects:
                existing_c = db.query(Course).filter(Course.course_code == c_code, Course.section == sec).first()
                if not existing_c:
                    nc = Course(
                        course_code=c_code,
                        course_name=c_name,
                        department_id=user.department_id,
                        semester=sem,
                        section=sec,
                        credits=3,
                        is_active=True,
                    )
                    db.add(nc)
            db.commit()
            matching_courses = db.query(Course).filter(
                Course.department_id == user.department_id,
                Course.semester == user.semester,
                Course.is_active == True,
            ).all()

        for course in matching_courses:
            if not course.section or course.section == user.section:
                enrollment = Enrollment(student_id=user.id, course_id=course.id, status="active")
                db.add(enrollment)
                assigned_courses_data.append({"course_code": course.course_code, "course_name": course.course_name})
        db.commit()

    elif user.role == UserRole.professor and user.department_id:
        dept_courses_q = db.query(Course).filter(Course.department_id == user.department_id, Course.is_active == True)
        if user.section and user.section != "ALL":
            dept_courses_q = dept_courses_q.filter(Course.section == user.section)
        matched_courses = dept_courses_q.all()
        for course in matched_courses:
            course.professor_id = user.id
            assigned_courses_data.append({"course_code": course.course_code, "course_name": course.course_name})
        db.commit()

    # Dispatch official credentials email to the new student or faculty
    dept_name = user.department_rel.name if user.department_rel else "Engineering"
    portal_name = "Student Portal" if user.role == UserRole.student else "Faculty Portal"
    identifier_label = "Roll Number" if user.role == UserRole.student else "Faculty ID"
    identifier_val = user.student_id if user.role == UserRole.student else user.faculty_id
    card_filename = "student_card.png" if user.role == UserRole.student else "professor_card.png"

    courses_summary_text = "\n".join([f"• {c['course_code']} - {c['course_name']}" for c in assigned_courses_data]) if assigned_courses_data else f"• General curriculum under {dept_name}"

    welcome_subject = f"[EduPulse] Welcome to KPRIET — Your {portal_name} Login Credentials"
    welcome_message = (
        f"OFFICIAL ACCOUNT PROVISIONING NOTICE\n"
        f"KPR Institute of Engineering and Technology (Autonomous)\n"
        f"EduPulse Academic Monitoring & Support System\n\n"
        f"Dear {user.full_name},\n\n"
        f"Your official {portal_name} account has been successfully provisioned by the Academic Administrator.\n\n"
        f"YOUR LOGIN CREDENTIALS:\n"
        f"• Portal URL: http://localhost:5173\n"
        f"• Role: {user.role.value.capitalize()}\n"
        f"• Registered Email: {user.email}\n"
        f"• {identifier_label}: {identifier_val or 'N/A'}\n"
        f"• Department: {dept_name}\n"
        f"• Initial Password: {payload.password}\n\n"
        f"ASSIGNED COURSES:\n"
        f"{courses_summary_text}\n\n"
        f"SECURITY NOTICE:\n"
        f"1. To log in, visit http://localhost:5173, select '{portal_name}', and enter your email and password.\n"
        f"2. A secure 6-digit OTP verification code will be dispatched to this email address to verify your session.\n"
        f"3. Please keep your login credentials strictly confidential.\n\n"
        f"Office of the Academic Administrator\n"
        f"KPR Institute of Engineering and Technology\n"
        f"Coimbatore - 641 407"
    )

    try:
        from app.routers.notifications import create_and_queue_notification, _dispatch_notification
        html_body = build_account_welcome_html_email(
            recipient_name=user.full_name,
            email=user.email,
            password=payload.password,
            role=user.role.value,
            dept_name=dept_name,
            identifier=identifier_val,
            semester=user.semester,
            section=user.section,
            assigned_courses=assigned_courses_data,
            card_filename=card_filename,
        )
        notif = create_and_queue_notification(
            recipient_email=user.email,
            recipient_user_id=user.id,
            notification_type="account_creation",
            subject=welcome_subject,
            message=welcome_message,
            db=db,
        )
        notif._html_body = html_body
        notif._card_filename = card_filename
        _dispatch_notification(notif, db, async_mode=True)
    except Exception as e:
        print(f"[ACCOUNT WELCOME EMAIL ERROR] {e}")

    log_action(db, current_user.id, "create_user", "user", user.id, {"role": user.role.value})
    return UserOut(
        id=user.id, full_name=user.full_name, email=user.email, role=user.role,
        student_id=user.student_id, faculty_id=user.faculty_id,
        department_id=user.department_id,
        department_name=user.department_rel.name if user.department_rel else None,
        section=user.section, semester=user.semester,
        phone=user.phone, is_active=user.is_active, lang_pref=user.lang_pref,
        profile_image=user.profile_image, created_at=user.created_at,
    )


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user_admin(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.full_name is not None:
        u.full_name = payload.full_name
    if payload.email is not None:
        u.email = payload.email.lower().strip()
    if payload.phone is not None:
        u.phone = payload.phone
    if payload.section is not None:
        u.section = payload.section
    if payload.semester is not None:
        u.semester = payload.semester
    if payload.department_id is not None:
        u.department_id = payload.department_id
    if payload.student_id is not None:
        u.student_id = payload.student_id
    if payload.faculty_id is not None:
        u.faculty_id = payload.faculty_id
    if payload.profile_image is not None:
        u.profile_image = save_profile_image_if_base64(payload.profile_image)
    if payload.password:
        u.password_hash = get_password_hash(payload.password)

    # Ensure updated student is enrolled in matching courses for their new section/semester
    if u.role == UserRole.student and u.department_id and u.semester:
        matching_courses = db.query(Course).filter(
            Course.department_id == u.department_id,
            Course.semester == u.semester,
            Course.is_active == True,
        ).all()
        for course in matching_courses:
            if not course.section or course.section == u.section:
                existing_enr = db.query(Enrollment).filter(
                    Enrollment.student_id == u.id,
                    Enrollment.course_id == course.id,
                ).first()
                if not existing_enr:
                    db.add(Enrollment(student_id=u.id, course_id=course.id, status="active"))

    db.commit()
    db.refresh(u)
    log_action(db, current_user.id, "update_user", "user", user_id, {"profile_image_updated": payload.profile_image is not None})
    return UserOut(
        id=u.id, full_name=u.full_name, email=u.email, role=u.role,
        student_id=u.student_id, faculty_id=u.faculty_id,
        department_id=u.department_id,
        department_name=u.department_rel.name if u.department_rel else None,
        section=u.section, semester=u.semester,
        phone=u.phone, is_active=u.is_active, lang_pref=u.lang_pref,
        profile_image=u.profile_image, created_at=u.created_at,
    )


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.is_active = not u.is_active
    db.commit()
    log_action(db, current_user.id, "toggle_active", "user", user_id, {"is_active": u.is_active})
    return {"message": f"User {'activated' if u.is_active else 'deactivated'}", "is_active": u.is_active}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    db.delete(u)
    db.commit()
    log_action(db, current_user.id, "delete_user", "user", user_id)
    return {"message": "User deleted"}


# ─── Department Management ───────────────────────────────────────────────────

@router.get("/departments", response_model=List[DepartmentOut])
def get_departments_admin(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Department).all()


@router.post("/departments", response_model=DepartmentOut, status_code=201)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    code = payload.code.upper().strip()
    existing = db.query(Department).filter(Department.code == code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Department code already exists")
    dept = Department(code=code, name=payload.name.strip())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    log_action(db, current_user.id, "create_department", "department", dept.id, {"code": dept.code})
    return dept


@router.delete("/departments/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    log_action(db, current_user.id, "delete_department", "department", dept_id)
    return {"message": "Department deleted"}


# ─── Detailed Student Directory with Profile Cards & Attendance Status ────────

@router.get("/students-detailed")
def get_students_detailed(
    department_id: Optional[int] = None,
    section: Optional[str] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    from app.routers.attendance import _get_settings
    from app.calculations import assess_risk

    settings = _get_settings(db)
    query = db.query(User).filter(User.role == UserRole.student, User.is_active == True)
    if department_id is not None and not hasattr(department_id, "default"):
        query = query.filter(User.department_id == department_id)
    if section is not None and not hasattr(section, "default") and section != "ALL":
        query = query.filter(User.section == section)
    if semester is not None and not hasattr(semester, "default"):
        query = query.filter(User.semester == semester)

    students = query.all()
    results = []

    # Pre-load sessions by course to avoid N+1 queries
    from app.models import AttendanceSession, AttendanceRecord, AttendanceStatus
    all_sessions = db.query(AttendanceSession).all()
    course_sessions = {}
    for sess in all_sessions:
        course_sessions.setdefault(sess.course_id, []).append(sess.id)

    # Pre-load present attendance records per student
    records = db.query(AttendanceRecord.student_id, AttendanceRecord.session_id).filter(
        AttendanceRecord.status == AttendanceStatus.present
    ).all()
    student_presents = {}
    for r in records:
        student_presents.setdefault(r.student_id, set()).add(r.session_id)

    # Pre-load enrollments
    all_enrollments = db.query(Enrollment).filter(Enrollment.status == "active").all()
    enrollments_by_student = {}
    for e in all_enrollments:
        enrollments_by_student.setdefault(e.student_id, []).append(e)

    # Pre-load courses
    all_courses = {c.id: c for c in db.query(Course).all()}

    # Pre-load marks
    all_marks = db.query(Mark).all()
    marks_by_student = {}
    for m in all_marks:
        marks_by_student.setdefault(m.student_id, []).append(m)

    for s in students:
        s_enrollments = enrollments_by_student.get(s.id, [])
        s_presents = student_presents.get(s.id, set())

        courses_summary = []
        shortage_count = 0
        total_pct_list = []
        attendance_summaries = []

        for e in s_enrollments:
            c = all_courses.get(e.course_id)
            sess_ids = course_sessions.get(e.course_id, [])
            tot = len(sess_ids)
            att = sum(1 for sid in sess_ids if sid in s_presents)
            pct = round((att / tot * 100), 1) if tot > 0 else 82.0

            if pct < settings.attendance_threshold:
                st_status = "Below Threshold"
                shortage_count += 1
            elif pct < (settings.attendance_threshold + settings.warning_margin):
                st_status = "Near Threshold"
            else:
                st_status = "On Track"

            if tot > 0:
                total_pct_list.append(pct)

            c_info = {
                "course_id": e.course_id,
                "course_code": c.course_code if c else "",
                "course_name": c.course_name if c else "",
                "attended": att,
                "total_sessions": tot,
                "attendance_percentage": pct,
                "status": st_status,
            }
            attendance_summaries.append(c_info)
            courses_summary.append({
                "course_id": e.course_id,
                "course_code": c.course_code if c else "",
                "course_name": c.course_name if c else "",
                "attended": att,
                "total_sessions": tot,
                "percentage": pct,
                "status": st_status,
            })

        overall_attendance = round(sum(total_pct_list) / len(total_pct_list), 1) if total_pct_list else 82.0

        # Marks summary
        s_marks = marks_by_student.get(s.id, [])
        marks_summaries = []
        for m in s_marks:
            if m.assessment and m.assessment.max_marks > 0:
                m_pct = (m.marks_obtained / m.assessment.max_marks) * 100
                marks_summaries.append({
                    "course_name": m.assessment.course.course_name if m.assessment.course else "",
                    "assessment_name": m.assessment.assessment_name,
                    "percentage": m_pct,
                })

        risk_data = assess_risk(
            attendance_summaries, marks_summaries,
            settings.attendance_threshold, settings.warning_margin,
            settings.marks_warning_threshold,
        )

        results.append({
            "id": s.id,
            "full_name": s.full_name,
            "email": s.email,
            "student_id": s.student_id or f"24CS{s.id:03d}",
            "faculty_id": s.faculty_id,
            "department_id": s.department_id,
            "department_code": s.department_rel.code if s.department_rel else "CSE",
            "department_name": s.department_rel.name if s.department_rel else "Computer Science & Engineering",
            "section": s.section or "A",
            "semester": s.semester or 5,
            "phone": s.phone or "+91 98765 43210",
            "photo_placeholder": "image.png",
            "profile_image": s.profile_image,
            "overall_attendance": overall_attendance,
            "shortage_courses_count": shortage_count,
            "has_shortage": shortage_count > 0 or overall_attendance < settings.attendance_threshold,
            "overall_risk": risk_data.get("overall_risk", "Low Concern"),
            "reasons": risk_data.get("reasons", []),
            "courses": courses_summary,
            "marks_count": len(s_marks),
        })

    return results


# ─── Audit Logs ──────────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        AuditLogOut(
            id=l.id,
            actor_user_id=l.actor_user_id,
            actor_name=l.actor.full_name if l.actor else "System",
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            metadata_json=l.metadata_json,
            timestamp=l.timestamp,
        )
        for l in logs
    ]


# ─── Department-wise Analytics ────────────────────────────────────────────────

@router.get("/analytics/departments")
def department_analytics(db: Session = Depends(get_db), _=Depends(require_admin)):
    from app.models import Department, AttendanceSession, AttendanceRecord, AttendanceStatus
    from app.routers.attendance import _get_settings
    from sqlalchemy import func

    settings = _get_settings(db)
    depts = db.query(Department).all()

    # Pre-fetch session counts
    sess_counts = dict(
        db.query(AttendanceSession.course_id, func.count(AttendanceSession.id))
        .group_by(AttendanceSession.course_id)
        .all()
    )

    # Pre-fetch attended counts
    attended_rows = (
        db.query(
            AttendanceSession.course_id,
            AttendanceRecord.student_id,
            func.count(AttendanceRecord.id),
        )
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(AttendanceRecord.status == AttendanceStatus.present)
        .group_by(AttendanceSession.course_id, AttendanceRecord.student_id)
        .all()
    )
    attended_map = {(cid, sid): cnt for cid, sid, cnt in attended_rows}

    # Pre-fetch all active enrollments with student department
    student_depts = dict(
        db.query(User.id, User.department_id)
        .filter(User.role == UserRole.student, User.is_active == True)
        .all()
    )

    enrollments = (
        db.query(Enrollment.student_id, Enrollment.course_id)
        .filter(Enrollment.status == "active")
        .all()
    )

    dept_stats = {d.id: {"total_pct": [], "at_risk": 0} for d in depts}
    threshold_limit = settings.attendance_threshold + settings.warning_margin

    for sid, cid in enrollments:
        dept_id = student_depts.get(sid)
        if dept_id not in dept_stats:
            continue
        tot = sess_counts.get(cid, 0)
        if tot > 0:
            att = attended_map.get((cid, sid), 0)
            pct = (att / tot) * 100.0
            dept_stats[dept_id]["total_pct"].append(pct)
            if pct < threshold_limit:
                dept_stats[dept_id]["at_risk"] += 1

    dept_student_counts = dict(
        db.query(User.department_id, func.count(User.id))
        .filter(User.role == UserRole.student, User.is_active == True)
        .group_by(User.department_id)
        .all()
    )

    result = []
    for d in depts:
        stats = dept_stats.get(d.id, {"total_pct": [], "at_risk": 0})
        pcts = stats["total_pct"]
        avg_attendance = round(sum(pcts) / len(pcts), 1) if pcts else 0
        result.append({
            "department": d.code,
            "department_name": d.name,
            "total_students": dept_student_counts.get(d.id, 0),
            "avg_attendance": avg_attendance,
            "at_risk_count": stats["at_risk"],
        })
    return result
