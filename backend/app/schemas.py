from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.models import UserRole


class LoginRequest(BaseModel):
    email: str
    password: str


class VerifyOtpRequest(BaseModel):
    email: str
    otp: str


class ResendOtpRequest(BaseModel):
    email: str


class OtpSentResponse(BaseModel):
    status: str
    email: str
    message: str
    role: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    student_id: Optional[str] = None
    faculty_id: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    section: Optional[str] = None
    semester: Optional[int] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    is_active: bool
    lang_pref: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: UserRole
    student_id: Optional[str] = None
    faculty_id: Optional[str] = None
    department_id: Optional[int] = None
    section: Optional[str] = None
    semester: Optional[int] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    section: Optional[str] = None
    semester: Optional[int] = None
    department_id: Optional[int] = None
    student_id: Optional[str] = None
    faculty_id: Optional[str] = None
    profile_image: Optional[str] = None
    lang_pref: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentCreate(BaseModel):
    code: str
    name: str


class DepartmentOut(BaseModel):
    id: int
    code: str
    name: str

    class Config:
        from_attributes = True


class CourseOut(BaseModel):
    id: int
    course_code: str
    course_name: str
    department_id: int
    department_name: Optional[str] = None
    semester: int
    section: str
    professor_id: Optional[int] = None
    professor_name: Optional[str] = None
    credits: int
    is_active: bool

    class Config:
        from_attributes = True


class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    department_id: int
    semester: int
    section: str
    professor_id: Optional[int] = None
    credits: int = 3


class EnrollmentOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    course_id: int
    status: str

    class Config:
        from_attributes = True


class AttendanceSessionCreate(BaseModel):
    course_id: int
    session_date: str  # ISO date string
    session_number: int = 1
    topic: Optional[str] = None


class AttendanceSessionOut(BaseModel):
    id: int
    course_id: int
    session_date: str
    session_number: int
    topic: Optional[str] = None
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class AttendanceRecordIn(BaseModel):
    student_id: int
    status: str  # present / absent / excused


class AttendanceRecordOut(BaseModel):
    id: int
    session_id: int
    student_id: int
    student_name: Optional[str] = None
    status: str
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    course_id: int
    course_code: str
    course_name: str
    total_sessions: int
    attended: int
    missed: int
    attendance_percentage: float
    threshold: float
    status: str  # "On Track" / "Near Threshold" / "Below Threshold"
    max_safe_to_miss: int
    classes_to_recover: Optional[int] = None


class BunkImpactRequest(BaseModel):
    course_id: int
    proposed_misses: int


class BunkImpactResponse(BaseModel):
    current_attended: int
    current_total: int
    current_percentage: float
    proposed_misses: int
    projected_total: int
    projected_percentage: float
    threshold: float
    is_safe: bool
    warning_message: Optional[str] = None


class RecoveryRequest(BaseModel):
    course_id: int
    target_percentage: Optional[float] = None


class RecoveryResponse(BaseModel):
    current_attended: int
    current_total: int
    current_percentage: float
    target_percentage: float
    classes_needed: Optional[int] = None
    is_already_at_target: bool
    is_impossible: bool
    message: str


class AssessmentCreate(BaseModel):
    course_id: int
    assessment_name: str
    assessment_type: str
    max_marks: float
    assessment_date: Optional[str] = None


class AssessmentOut(BaseModel):
    id: int
    course_id: int
    assessment_name: str
    assessment_type: str
    max_marks: float
    assessment_date: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MarkCreate(BaseModel):
    student_id: int
    marks_obtained: float

    @field_validator("marks_obtained")
    @classmethod
    def non_negative(cls, v):
        if v < 0:
            raise ValueError("Marks cannot be negative")
        return v


class MarkOut(BaseModel):
    id: int
    assessment_id: int
    assessment_name: Optional[str] = None
    course_name: Optional[str] = None
    student_id: int
    student_name: Optional[str] = None
    marks_obtained: float
    max_marks: Optional[float] = None
    percentage: Optional[float] = None
    remarks: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class RiskAssessment(BaseModel):
    student_id: int
    student_name: str
    overall_risk: str
    reasons: list[str]
    attendance_concerns: list[dict]
    marks_concerns: list[dict]


class NotificationOut(BaseModel):
    id: int
    recipient_user_id: Optional[int] = None
    recipient_email: str
    notification_type: str
    subject: str
    message: Optional[str] = None
    status: str
    provider_message_id: Optional[str] = None
    error_summary: Optional[str] = None
    created_at: datetime
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContactMessageCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str



class TestRecipientCreate(BaseModel):
    name: str
    email: str
    student_id: Optional[str] = None
    consent_confirmed: bool = False


class TestRecipientOut(BaseModel):
    id: int
    name: str
    email: str
    student_id: Optional[str] = None
    consent_confirmed: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationSettingsOut(BaseModel):
    id: int
    attendance_threshold: float
    warning_margin: float
    marks_warning_threshold: float
    email_enabled: bool
    test_mode_enabled: bool
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_use_tls: Optional[bool] = True
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationSettingsUpdate(BaseModel):
    attendance_threshold: Optional[float] = None
    warning_margin: Optional[float] = None
    marks_warning_threshold: Optional[float] = None
    email_enabled: Optional[bool] = None
    test_mode_enabled: Optional[bool] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_use_tls: Optional[bool] = None


class SendStudentAlertRequest(BaseModel):
    subject: Optional[str] = None
    message: Optional[str] = None
    alert_type: Optional[str] = "attendance_or_marks"


class AuditLogOut(BaseModel):
    id: int
    actor_user_id: Optional[int] = None
    actor_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    metadata_json: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class SendTestEmailRequest(BaseModel):
    recipient_email: str
    notification_type: str = "test"


class DashboardStats(BaseModel):
    total_students: int
    total_professors: int
    total_courses: int
    students_at_risk: int
    students_below_threshold: int
    pending_marks: int


TokenResponse.model_rebuild()
