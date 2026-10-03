"""
Marks router — assessments CRUD and marks entry
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Assessment, Mark, Course, Enrollment, User, UserRole
from app.schemas import AssessmentCreate, AssessmentOut, MarkCreate, MarkOut
from app.dependencies import get_current_user, require_professor_or_admin

router = APIRouter(prefix="/api/marks", tags=["Marks"])


# ─── Assessments ──────────────────────────────────────────────────────────────

@router.get("/courses/{course_id}/assessments", response_model=List[AssessmentOut])
def list_assessments(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assessments = db.query(Assessment).filter(Assessment.course_id == course_id).all()
    return [
        AssessmentOut(
            id=a.id, course_id=a.course_id, assessment_name=a.assessment_name,
            assessment_type=a.assessment_type, max_marks=a.max_marks,
            assessment_date=str(a.assessment_date) if a.assessment_date else None,
            created_at=a.created_at,
        )
        for a in assessments
    ]


@router.post("/courses/{course_id}/assessments", response_model=AssessmentOut, status_code=201)
def create_assessment(
    course_id: int,
    payload: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_professor_or_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.role == UserRole.professor and course.professor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to this course")

    from datetime import date
    a = Assessment(
        course_id=course_id,
        assessment_name=payload.assessment_name,
        assessment_type=payload.assessment_type,
        max_marks=payload.max_marks,
        assessment_date=date.fromisoformat(payload.assessment_date) if payload.assessment_date else None,
        created_by=current_user.id,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return AssessmentOut(
        id=a.id, course_id=a.course_id, assessment_name=a.assessment_name,
        assessment_type=a.assessment_type, max_marks=a.max_marks,
        assessment_date=str(a.assessment_date) if a.assessment_date else None,
        created_at=a.created_at,
    )


# ─── Marks ────────────────────────────────────────────────────────────────────

@router.post("/assessments/{assessment_id}/marks", status_code=201)
def save_marks(
    assessment_id: int,
    records: List[MarkCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_professor_or_admin),
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    course = db.query(Course).filter(Course.id == assessment.course_id).first()
    if current_user.role == UserRole.professor and course.professor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this course")

    saved = 0
    for r in records:
        if r.marks_obtained > assessment.max_marks:
            raise HTTPException(
                status_code=422,
                detail=f"Marks {r.marks_obtained} exceed maximum {assessment.max_marks} for assessment {assessment_id}",
            )
        existing = db.query(Mark).filter(
            Mark.assessment_id == assessment_id,
            Mark.student_id == r.student_id,
        ).first()
        if existing:
            existing.marks_obtained = r.marks_obtained
            existing.entered_by = current_user.id
        else:
            mark = Mark(
                assessment_id=assessment_id,
                student_id=r.student_id,
                marks_obtained=r.marks_obtained,
                entered_by=current_user.id,
            )
            db.add(mark)
        saved += 1

    db.commit()
    return {"message": f"Marks saved for {saved} student(s)"}


@router.post("/assessments/{assessment_id}/marks/bulk", status_code=201)
def save_marks_bulk(
    assessment_id: int,
    records: List[MarkCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_professor_or_admin),
):
    return save_marks(assessment_id, records, db, current_user)


@router.get("/assessments/{assessment_id}/marks")
def get_assessment_marks(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    marks = db.query(Mark).filter(Mark.assessment_id == assessment_id).all()
    return [
        {
            "id": m.id,
            "student_id": m.student_id,
            "marks_obtained": m.marks_obtained,
            "max_marks": assessment.max_marks,
            "remarks": m.remarks,
        }
        for m in marks
    ]


@router.get("/student/{student_id}", response_model=List[MarkOut])
def get_student_marks(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.student and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")

    marks = db.query(Mark).filter(Mark.student_id == student_id).all()
    result = []
    for m in marks:
        pct = round((m.marks_obtained / m.assessment.max_marks) * 100, 1) if m.assessment.max_marks > 0 else None
        result.append(MarkOut(
            id=m.id,
            assessment_id=m.assessment_id,
            assessment_name=m.assessment.assessment_name,
            course_name=m.assessment.course.course_name if m.assessment.course else None,
            student_id=m.student_id,
            student_name=m.student.full_name if m.student else None,
            marks_obtained=m.marks_obtained,
            max_marks=m.assessment.max_marks,
            percentage=pct,
            remarks=m.remarks,
            updated_at=m.updated_at,
        ))
    return result


@router.patch("/marks/{mark_id}", response_model=MarkOut)
def update_mark(
    mark_id: int,
    marks_obtained: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_professor_or_admin),
):
    m = db.query(Mark).filter(Mark.id == mark_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mark not found")
    if marks_obtained < 0:
        raise HTTPException(status_code=422, detail="Marks cannot be negative")
    if marks_obtained > m.assessment.max_marks:
        raise HTTPException(status_code=422, detail=f"Marks exceed maximum {m.assessment.max_marks}")
    m.marks_obtained = marks_obtained
    m.entered_by = current_user.id
    db.commit()
    db.refresh(m)
    pct = round((m.marks_obtained / m.assessment.max_marks) * 100, 1) if m.assessment.max_marks > 0 else None
    return MarkOut(
        id=m.id, assessment_id=m.assessment_id,
        assessment_name=m.assessment.assessment_name,
        student_id=m.student_id, marks_obtained=m.marks_obtained,
        max_marks=m.assessment.max_marks, percentage=pct,
        updated_at=m.updated_at,
    )


@router.get("/course/{course_id}/summary", response_model=List[dict])
def course_marks_summary(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns per-student per-assessment marks for a course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.role == UserRole.professor and course.professor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    assessments = db.query(Assessment).filter(Assessment.course_id == course_id).all()
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id, Enrollment.status == "active").all()

    result = []
    for e in enrollments:
        student = e.student
        student_marks = []
        total_obtained = 0
        total_max = 0
        for a in assessments:
            m = db.query(Mark).filter(Mark.assessment_id == a.id, Mark.student_id == student.id).first()
            obtained = m.marks_obtained if m else None
            total_max += a.max_marks
            if obtained is not None:
                total_obtained += obtained
            student_marks.append({
                "assessment_id": a.id,
                "assessment_name": a.assessment_name,
                "assessment_type": a.assessment_type,
                "max_marks": a.max_marks,
                "obtained": obtained,
                "percentage": round((obtained / a.max_marks) * 100, 1) if obtained is not None and a.max_marks > 0 else None,
            })
        result.append({
            "student_id": student.id,
            "student_name": student.full_name,
            "student_email": student.email,
            "student_id_no": student.student_id,
            "assessments": student_marks,
            "total_obtained": total_obtained,
            "total_max": total_max,
            "overall_percentage": round((total_obtained / total_max) * 100, 1) if total_max > 0 else None,
        })
    return result
