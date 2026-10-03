"""
EduPulse AI — All SQLAlchemy ORM models
"""
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, Date,
    ForeignKey, Text, UniqueConstraint, Enum as SAEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


# ─── Enumerations ────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    student = "student"
    professor = "professor"
    admin = "admin"


class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    excused = "excused"


class NotificationStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"


class EnrollmentStatus(str, enum.Enum):
    active = "active"
    dropped = "dropped"
    completed = "completed"


class RiskLevel(str, enum.Enum):
    low = "Low Concern"
    needs_attention = "Needs Attention"
    high = "High Concern"


# ─── Models ──────────────────────────────────────────────────────────────────

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="department_rel")
    courses: Mapped[List["Course"]] = relationship("Course", back_populates="department_rel")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False)
    student_id: Mapped[Optional[str]] = mapped_column(String(30), unique=True, nullable=True)
    faculty_id: Mapped[Optional[str]] = mapped_column(String(30), unique=True, nullable=True)
    department_id: Mapped[Optional[int]] = mapped_column(ForeignKey("departments.id"), nullable=True)
    section: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    semester: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    profile_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    lang_pref: Mapped[str] = mapped_column(String(5), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    department_rel: Mapped[Optional["Department"]] = relationship("Department", back_populates="users")
    taught_courses: Mapped[List["Course"]] = relationship("Course", back_populates="professor")
    enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", foreign_keys="Enrollment.student_id", back_populates="student", cascade="all, delete-orphan")
    attendance_records: Mapped[List["AttendanceRecord"]] = relationship("AttendanceRecord", foreign_keys="AttendanceRecord.student_id", back_populates="student", cascade="all, delete-orphan")
    marks: Mapped[List["Mark"]] = relationship("Mark", foreign_keys="Mark.student_id", back_populates="student", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="recipient_user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_code: Mapped[str] = mapped_column(String(20), nullable=False)
    course_name: Mapped[str] = mapped_column(String(150), nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    section: Mapped[str] = mapped_column(String(10), nullable=False)
    professor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    credits: Mapped[int] = mapped_column(Integer, default=3)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    department_rel: Mapped["Department"] = relationship("Department", back_populates="courses")
    professor: Mapped[Optional["User"]] = relationship("User", back_populates="taught_courses")
    enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", back_populates="course")
    attendance_sessions: Mapped[List["AttendanceSession"]] = relationship("AttendanceSession", back_populates="course")
    assessments: Mapped[List["Assessment"]] = relationship("Assessment", back_populates="course")

    __table_args__ = (UniqueConstraint("course_code", "section", name="uq_course_section"),)


class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False)
    status: Mapped[EnrollmentStatus] = mapped_column(SAEnum(EnrollmentStatus), default=EnrollmentStatus.active)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id], back_populates="enrollments")
    course: Mapped["Course"] = relationship("Course", back_populates="enrollments")

    __table_args__ = (UniqueConstraint("student_id", "course_id", name="uq_student_course"),)


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False)
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    session_number: Mapped[int] = mapped_column(Integer, default=1)
    topic: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="attendance_sessions")
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    records: Mapped[List["AttendanceRecord"]] = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("attendance_sessions.id"), nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[AttendanceStatus] = mapped_column(SAEnum(AttendanceStatus), nullable=False)
    updated_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    session: Mapped["AttendanceSession"] = relationship("AttendanceSession", back_populates="records")
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id], back_populates="attendance_records")
    updater: Mapped["User"] = relationship("User", foreign_keys=[updated_by])

    __table_args__ = (UniqueConstraint("session_id", "student_id", name="uq_session_student"),)


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False)
    assessment_name: Mapped[str] = mapped_column(String(100), nullable=False)
    assessment_type: Mapped[str] = mapped_column(String(50), nullable=False)  # IA1, IA2, Assignment, Lab, etc.
    max_marks: Mapped[float] = mapped_column(Float, nullable=False)
    assessment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="assessments")
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    marks: Mapped[List["Mark"]] = relationship("Mark", back_populates="assessment", cascade="all, delete-orphan")


class Mark(Base):
    __tablename__ = "marks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessments.id"), nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    marks_obtained: Mapped[float] = mapped_column(Float, nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    entered_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="marks")
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id], back_populates="marks")
    enterer: Mapped["User"] = relationship("User", foreign_keys=[entered_by])

    __table_args__ = (UniqueConstraint("assessment_id", "student_id", name="uq_assessment_student"),)


class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attendance_threshold: Mapped[float] = mapped_column(Float, default=75.0)
    warning_margin: Mapped[float] = mapped_column(Float, default=5.0)
    marks_warning_threshold: Mapped[float] = mapped_column(Float, default=60.0)
    email_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    test_mode_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    smtp_host: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    smtp_port: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    smtp_user: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    smtp_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    smtp_from_email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    smtp_use_tls: Mapped[Optional[bool]] = mapped_column(Boolean, default=True)
    updated_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recipient_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    recipient_email: Mapped[str] = mapped_column(String(150), nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False)
    subject: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(SAEnum(NotificationStatus), default=NotificationStatus.pending)
    provider_message_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    error_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    recipient_user: Mapped[Optional["User"]] = relationship("User", back_populates="notifications")


class TestRecipient(Base):
    __tablename__ = "test_recipients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    student_id: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    consent_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    added_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    actor_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    actor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[actor_user_id])


class LoginOTP(Base):
    __tablename__ = "login_otps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    otp_code: Mapped[str] = mapped_column(String(10), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
