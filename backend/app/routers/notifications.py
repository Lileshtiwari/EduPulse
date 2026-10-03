"""
Notifications router — real email sending (SMTP + Gmail OAuth + Mock), test recipients, history, batch shortage alerts
"""

import smtplib
import queue
import threading
import time
import os
import base64

from email.header import Header
from email.utils import formatdate, make_msgid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Notification,
    NotificationSetting,
    TestRecipient,
    User,
    UserRole,
    NotificationStatus,
    Enrollment,
    Course,
)
from app.schemas import (
    NotificationOut,
    NotificationSettingsOut,
    NotificationSettingsUpdate,
    TestRecipientCreate,
    TestRecipientOut,
    SendTestEmailRequest,
    SendStudentAlertRequest,
    ContactMessageCreate,
)
from app.dependencies import get_current_user, require_admin
from app.config import get_settings


router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
cfg = get_settings()


def _get_or_create_settings(db: Session) -> NotificationSetting:
    s = db.query(NotificationSetting).first()

    if not s:
        s = NotificationSetting(
            attendance_threshold=75.0,
            warning_margin=5.0,
            marks_warning_threshold=60.0,
            email_enabled=True,
            test_mode_enabled=False,
            smtp_host="smtp.gmail.com",
            smtp_port=587,
            smtp_use_tls=True,
        )
        db.add(s)
        db.commit()
        db.refresh(s)

    return s


def _send_brevo_delivery(
    recipient_email: str,
    subject: str,
    message_text: str,
    html_body: str = None,
) -> tuple[bool, str]:
    """Sends real email via Brevo HTTP API (port 443, never blocked by cloud firewalls)."""
    api_key = cfg.BREVO_API_KEY
    if not api_key:
        return False, "BREVO_API_KEY is not configured"

    sender_email = (
        cfg.BREVO_SENDER_EMAIL
        or cfg.GMAIL_SENDER_EMAIL
        or "karunesh128@gmail.com"
    )
    sender_name = cfg.BREVO_SENDER_NAME or "EduPulse - KPRIET"

    try:
        import httpx

        payload = {
            "sender": {
                "name": sender_name,
                "email": sender_email,
            },
            "to": [
                {
                    "email": recipient_email.lower().strip(),
                }
            ],
            "subject": subject,
            "textContent": message_text,
        }
        if html_body:
            payload["htmlContent"] = html_body

        resp = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
                "accept": "application/json",
            },
            json=payload,
            timeout=15.0,
        )

        if resp.status_code in (200, 201, 202):
            msg_id = resp.json().get("messageId", "brevo-sent")
            return True, f"Email sent via Brevo (messageId: {msg_id})"
        else:
            return False, f"Brevo API error ({resp.status_code}): {resp.text[:300]}"

    except Exception as e:
        return False, f"Brevo HTTP error: {str(e)}"


def _send_smtp_delivery(
    recipient_email: str,
    subject: str,
    message_text: str,
    s: NotificationSetting,
    html_body: str = None,
    card_filename: str = "student_card.png",
) -> tuple[bool, str]:
    """Sends real email via SMTP using stored settings or env fallback. Supports optional HTML body and inline CID images."""

    host = s.smtp_host or cfg.SMTP_HOST or "smtp.gmail.com"
    port = s.smtp_port or cfg.SMTP_PORT or 465

    # Use GMAIL_SENDER_EMAIL first, then stored settings, then SMTP_USER fallback.
    user = cfg.GMAIL_SENDER_EMAIL or s.smtp_user or cfg.SMTP_USER

    # Use GMAIL_APP_PASSWORD first, then stored settings, then SMTP_PASSWORD fallback.
    password = cfg.GMAIL_APP_PASSWORD or s.smtp_password or cfg.SMTP_PASSWORD

    sender = cfg.GMAIL_SENDER_EMAIL or s.smtp_from_email or user

    if not user or not password:
        return (
            False,
            "Gmail SMTP credentials not configured. "
            "Please set GMAIL_SENDER_EMAIL and GMAIL_APP_PASSWORD in environment variables or Notification Settings.",
        )

    try:
        clean_recipient = recipient_email.lower().strip()

        msg_root = MIMEMultipart("related")

        msg_root["Subject"] = Header(subject, "utf-8")
        msg_root["From"] = f"EduPulse - KPRIET <{sender}>"
        msg_root["To"] = recipient_email
        msg_root["Date"] = formatdate(localtime=True)
        msg_root["Message-ID"] = make_msgid(domain="gmail.com")
        msg_root["Reply-To"] = sender

        msg_alt = MIMEMultipart("alternative")

        msg_alt.attach(
            MIMEText(
                message_text,
                "plain",
                "utf-8",
            )
        )

        if html_body:
            msg_alt.attach(
                MIMEText(
                    html_body,
                    "html",
                    "utf-8",
                )
            )

        msg_root.attach(msg_alt)

        # Attach inline images if present on disk.
        public_dir = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "..",
                "..",
                "..",
                "frontend",
                "public",
            )
        )

        images_to_attach = [
            ("logo_img", "logo.png"),
            ("instuite_img", "instuite.png"),
            ("card_img", card_filename or "student_card.png"),
        ]

        for cid, fn in images_to_attach:
            fpath = os.path.join(public_dir, fn)

            if os.path.exists(fpath):
                try:
                    with open(fpath, "rb") as f:
                        img = MIMEImage(f.read())

                    img.add_header(
                        "Content-ID",
                        f"<{cid}>",
                    )

                    img.add_header(
                        "Content-Disposition",
                        "inline",
                        filename=fn,
                    )

                    msg_root.attach(img)

                except Exception as img_err:
                    print(
                        f"[ATTACH INLINE IMAGE ERROR] {fn}: {img_err}"
                    )

        last_exc = None

        for attempt in range(2):
            try:
                if port == 465:
                    server = smtplib.SMTP_SSL(
                        host,
                        port,
                        timeout=30,
                    )
                else:
                    server = smtplib.SMTP(
                        host,
                        port,
                        timeout=30,
                    )
                    if s.smtp_use_tls is not False:
                        server.starttls()

                server.login(
                    user,
                    password,
                )

                server.sendmail(
                    sender,
                    [clean_recipient],
                    msg_root.as_string(),
                )

                try:
                    server.quit()
                except Exception:
                    pass

                return (
                    True,
                    f"Email successfully sent via SMTP to {clean_recipient}",
                )

            except Exception as attempt_exc:
                last_exc = attempt_exc
                time.sleep(1.0)

        return False, f"SMTP Error: {str(last_exc)}"

    except Exception as exc:
        return False, f"SMTP Error: {str(exc)}"


# ---------------------------------------------------------------------------
# Background email worker
# ---------------------------------------------------------------------------

_email_queue: queue.Queue = queue.Queue()
_worker_lock = threading.Lock()
_worker_initialized = False


def _email_worker_loop():
    from app.database import SessionLocal

    while True:
        try:
            item = _email_queue.get()

            if item is None:
                break

            notif_id, html_body, card_filename = item

            worker_db = SessionLocal()

            try:
                notif = (
                    worker_db.query(Notification)
                    .filter(Notification.id == notif_id)
                    .first()
                )

                if notif:
                    notif._html_body = html_body
                    notif._card_filename = card_filename

                    _dispatch_notification(
                        notif,
                        worker_db,
                        async_mode=False,
                    )

            except Exception as w_err:
                print(
                    f"[WORKER DISPATCH ERROR] #{notif_id}: {w_err}"
                )

                try:
                    if notif:
                        notif.status = NotificationStatus.failed
                        notif.error_summary = (
                            f"Worker email error: {str(w_err)[:450]}"
                        )
                        worker_db.commit()

                except Exception:
                    worker_db.rollback()

            finally:
                worker_db.close()

            time.sleep(0.8)
            _email_queue.task_done()

        except Exception as e:
            print(
                f"[EMAIL WORKER EXCEPTION] {e}"
            )


def _ensure_worker_started():
    global _worker_initialized

    with _worker_lock:
        if not _worker_initialized:
            t = threading.Thread(
                target=_email_worker_loop,
                daemon=True,
            )
            t.start()
            _worker_initialized = True


# ---------------------------------------------------------------------------
# Central notification dispatcher
# ---------------------------------------------------------------------------

def _dispatch_notification(
    notification: Notification,
    db: Session,
    async_mode: bool = False,
):
    """Dispatches a notification using SMTP, Gmail API, or mock."""

    html_body = getattr(
        notification,
        "_html_body",
        None,
    )

    card_filename = getattr(
        notification,
        "_card_filename",
        "student_card.png",
    )

    # Async mode queues the notification without falsely marking it as sent.
    if async_mode:
        _ensure_worker_started()

        notification.status = NotificationStatus.pending

        notification.provider_message_id = (
            f"queued-{notification.id}"
        )

        notification.error_summary = None

        db.commit()

        _email_queue.put(
            (
                notification.id,
                html_body,
                card_filename,
            )
        )

        return

    s = _get_or_create_settings(db)

    # -----------------------------------------------------------------------
    # 1. Brevo HTTP API (Highest Priority Real Delivery — Port 443, Render Free Safe)
    # -----------------------------------------------------------------------
    if cfg.BREVO_API_KEY:
        success, message = _send_brevo_delivery(
            notification.recipient_email,
            notification.subject,
            notification.message,
            html_body=html_body,
        )
        if success:
            notification.status = NotificationStatus.sent
            notification.sent_at = datetime.utcnow()
            notification.provider_message_id = (
                f"brevo-{notification.id}-"
                f"{int(datetime.utcnow().timestamp())}"
            )
            notification.error_summary = None
            db.commit()
            return
        else:
            print(f"[BREVO EMAIL ERROR] {message}")
            notification.status = NotificationStatus.failed
            notification.error_summary = message[:500]
            db.commit()
            return

    # -----------------------------------------------------------------------
    # 2. Mock mode — used only when MOCK_EMAIL=true and no real API is set.
    # -----------------------------------------------------------------------

    if cfg.MOCK_EMAIL:
        otp_hint = ""
        import re
        text_to_search = f"{notification.subject or ''} {notification.message or ''}"
        m = re.search(r'\b(\d{6})\b', text_to_search)
        if m:
            otp_hint = f" | OTP: {m.group(1)}"

        print(
            f"[MOCK EMAIL] To: {notification.recipient_email}"
            f" | Subject: {notification.subject}"
            f"{otp_hint}"
        )

        notification.status = NotificationStatus.sent
        notification.sent_at = datetime.utcnow()
        notification.provider_message_id = (
            f"mock-{notification.id}-"
            f"{int(datetime.utcnow().timestamp())}"
        )
        notification.error_summary = (
            "Dispatched in Mock Mode. No real email was sent."
        )
        db.commit()
        return

    # -----------------------------------------------------------------------
    # 2. Try SMTP if credentials are provided.
    # -----------------------------------------------------------------------

    smtp_user = (
        cfg.GMAIL_SENDER_EMAIL
        or s.smtp_user
        or cfg.SMTP_USER
    )

    smtp_pass = (
        cfg.GMAIL_APP_PASSWORD
        or s.smtp_password
        or cfg.SMTP_PASSWORD
    )

    if smtp_user and smtp_pass:
        success, message = _send_smtp_delivery(
            notification.recipient_email,
            notification.subject,
            notification.message,
            s,
            html_body=html_body,
            card_filename=card_filename,
        )

        if success:
            notification.status = NotificationStatus.sent
            notification.sent_at = datetime.utcnow()

            notification.provider_message_id = (
                f"smtp-{notification.id}-"
                f"{int(datetime.utcnow().timestamp())}"
            )

            notification.error_summary = None

        else:
            notification.status = NotificationStatus.failed
            notification.error_summary = message[:500]

        db.commit()
        return

    # -----------------------------------------------------------------------
    # 3. Try Gmail OAuth if configured.
    # -----------------------------------------------------------------------

    if cfg.GMAIL_REFRESH_TOKEN and cfg.GMAIL_CLIENT_ID:
        try:
            import httpx

            token_resp = httpx.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": cfg.GMAIL_CLIENT_ID,
                    "client_secret": cfg.GMAIL_CLIENT_SECRET,
                    "refresh_token": cfg.GMAIL_REFRESH_TOKEN,
                    "grant_type": "refresh_token",
                },
                timeout=10,
            )

            token_resp.raise_for_status()

            access_token = token_resp.json()["access_token"]

            msg = MIMEText(
                notification.message,
                "plain",
            )

            msg["to"] = notification.recipient_email

            msg["from"] = (
                cfg.GMAIL_SENDER_EMAIL
                or s.smtp_from_email
                or "noreply@edupulse.kpriet.ac.in"
            )

            msg["subject"] = notification.subject

            raw = base64.urlsafe_b64encode(
                msg.as_bytes()
            ).decode()

            send_resp = httpx.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                json={
                    "raw": raw,
                },
                headers={
                    "Authorization": f"Bearer {access_token}",
                },
                timeout=15,
            )

            send_resp.raise_for_status()

            data = send_resp.json()

            notification.status = NotificationStatus.sent
            notification.sent_at = datetime.utcnow()

            notification.provider_message_id = data.get(
                "id",
                "",
            )

            notification.error_summary = None

            db.commit()
            return

        except Exception as e:
            notification.status = NotificationStatus.failed

            notification.error_summary = (
                f"Gmail API Error: {str(e)[:450]}"
            )

            db.commit()
            return

    # -----------------------------------------------------------------------
    # 4. No delivery method configured.
    # -----------------------------------------------------------------------

    notification.status = NotificationStatus.failed

    notification.error_summary = (
        "Real email delivery is not configured. "
        "Set GMAIL_SENDER_EMAIL and GMAIL_APP_PASSWORD "
        "(or SMTP_USER and SMTP_PASSWORD) "
        "when MOCK_EMAIL=false."
    )


    db.commit()


# ---------------------------------------------------------------------------
# Notification creation
# ---------------------------------------------------------------------------

def create_and_queue_notification(
    recipient_email: str,
    notification_type: str,
    subject: str,
    message: str,
    db: Session,
    recipient_user_id: Optional[int] = None,
) -> Notification:

    notif = Notification(
        recipient_user_id=recipient_user_id,
        recipient_email=recipient_email,
        notification_type=notification_type,
        subject=subject,
        message=message,
        status=NotificationStatus.pending,
    )

    db.add(notif)
    db.commit()
    db.refresh(notif)

    return notif


# ─── Settings ────────────────────────────────────────────────────────────────

@router.get(
    "/settings",
    response_model=NotificationSettingsOut,
)
def get_settings_endpoint(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return _get_or_create_settings(db)


@router.patch(
    "/settings",
    response_model=NotificationSettingsOut,
)
def update_settings(
    payload: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    s = _get_or_create_settings(db)

    if payload.attendance_threshold is not None:
        if not (
            0 < payload.attendance_threshold <= 100
        ):
            raise HTTPException(
                status_code=422,
                detail="Threshold must be between 0 and 100",
            )

        s.attendance_threshold = (
            payload.attendance_threshold
        )

    if payload.warning_margin is not None:
        s.warning_margin = payload.warning_margin

    if payload.marks_warning_threshold is not None:
        s.marks_warning_threshold = (
            payload.marks_warning_threshold
        )

    if payload.email_enabled is not None:
        s.email_enabled = payload.email_enabled

    if payload.test_mode_enabled is not None:
        s.test_mode_enabled = (
            payload.test_mode_enabled
        )

    if payload.smtp_host is not None:
        s.smtp_host = payload.smtp_host

    if payload.smtp_port is not None:
        s.smtp_port = payload.smtp_port

    if payload.smtp_user is not None:
        s.smtp_user = payload.smtp_user

    if (
        payload.smtp_password is not None
        and payload.smtp_password.strip()
    ):
        s.smtp_password = payload.smtp_password.strip()

    if payload.smtp_from_email is not None:
        s.smtp_from_email = (
            payload.smtp_from_email
        )

    if payload.smtp_use_tls is not None:
        s.smtp_use_tls = payload.smtp_use_tls

    s.updated_by = current_user.id

    db.commit()
    db.refresh(s)

    return s


# ─── Test SMTP Connection ────────────────────────────────────────────────────

@router.post("/test-smtp")
def test_smtp_connection(
    payload: SendTestEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    s = _get_or_create_settings(db)

    subject = "[EduPulse] SMTP Email Delivery Test"

    message = (
        f"Hello,\n\n"
        f"This is a verified test email from EduPulse "
        f"at KPR Institute of Engineering and Technology.\n\n"
        f"Your SMTP configuration is functioning properly "
        f"and real emails will be delivered directly to inboxes!\n\n"
        f"Sent at: "
        f"{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
        f"— EduPulse Academic Monitoring System"
    )

    notif = create_and_queue_notification(
        recipient_email=payload.recipient_email,
        notification_type="smtp_test",
        subject=subject,
        message=message,
        db=db,
    )

    _dispatch_notification(
        notif,
        db,
    )

    db.refresh(notif)

    if notif.status == NotificationStatus.failed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Email delivery failed: "
                f"{notif.error_summary}"
            ),
        )

    return {
        "message": (
            f"Test email successfully delivered "
            f"to {payload.recipient_email}"
        ),
        "notification_id": notif.id,
        "status": notif.status.value,
        "provider_message_id": notif.provider_message_id,
        "error_summary": notif.error_summary,
    }


# ─── Send Attendance Shortage Alerts ─────────────────────────────────────────

@router.post(
    "/send-attendance-shortage-alerts"
)
def send_attendance_shortage_alerts(
    threshold: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Scans all active students, detects those with attendance below threshold,
    and dispatches a personalized official warning email to each student in one click.
    """

    from app.routers.attendance import (
        _get_course_attendance,
        calc_recovery_classes,
    )

    s = _get_or_create_settings(db)

    try:
        att_thresh = (
            float(threshold)
            if (
                threshold is not None
                and not hasattr(threshold, "default")
            )
            else float(s.attendance_threshold)
        )
    except (ValueError, TypeError):
        att_thresh = float(
            s.attendance_threshold
        )

    students = (
        db.query(User)
        .filter(
            User.role == UserRole.student,
            User.is_active == True,
        )
        .all()
    )

    results = []

    sent_count = 0
    failed_count = 0

    for student in students:

        enrollments = (
            db.query(Enrollment)
            .filter(
                Enrollment.student_id == student.id,
                Enrollment.status == "active",
            )
            .all()
        )

        shortage_courses = []

        overall_attended = 0
        overall_total = 0

        for e in enrollments:

            att = _get_course_attendance(
                student.id,
                e.course_id,
                db,
                s,
            )

            overall_attended += att["attended"]
            overall_total += att["total_sessions"]

            if (
                att["attendance_percentage"]
                < att_thresh
                or att["status"] == "Below Threshold"
            ):
                recovery = calc_recovery_classes(
                    att["attended"],
                    att["total_sessions"],
                    att_thresh,
                )

                shortage_courses.append(
                    {
                        "course_code": att["course_code"],
                        "course_name": att["course_name"],
                        "percentage": att[
                            "attendance_percentage"
                        ],
                        "attended": att["attended"],
                        "total": att["total_sessions"],
                        "needed": recovery.get(
                            "classes_needed",
                            0,
                        ),
                    }
                )

        overall_pct = (
            round(
                (
                    overall_attended
                    / overall_total
                    * 100
                ),
                1,
            )
            if overall_total > 0
            else 100.0
        )

        # If student has any course with shortage or overall shortage
        if (
            shortage_courses
            or overall_pct < att_thresh
        ):

            course_rows_html = ""
            course_lines = []

            for sc in shortage_courses:

                color = (
                    "#dc2626"
                    if sc["percentage"] < att_thresh
                    else "#16a34a"
                )

                course_rows_html += (
                    f"<tr>"
                    f"<td style='padding:10px 14px;"
                    f"border-bottom:1px solid #e5e7eb;"
                    f"font-size:13px;'>"
                    f"{sc['course_code']} "
                    f"&ndash; "
                    f"{sc['course_name']}"
                    f"</td>"
                    f"<td style='padding:10px 14px;"
                    f"border-bottom:1px solid #e5e7eb;"
                    f"font-size:13px;"
                    f"text-align:center;"
                    f"color:{color};"
                    f"font-weight:700;'>"
                    f"{sc['percentage']}%"
                    f"</td>"
                    f"<td style='padding:10px 14px;"
                    f"border-bottom:1px solid #e5e7eb;"
                    f"font-size:13px;"
                    f"text-align:center;'>"
                    f"{sc['attended']}/{sc['total']}"
                    f"</td>"
                    f"<td style='padding:10px 14px;"
                    f"border-bottom:1px solid #e5e7eb;"
                    f"font-size:13px;'>"
                    f"Attend next "
                    f"<b>{sc['needed']}</b> "
                    f"consecutive classes"
                    f"</td>"
                    f"</tr>"
                )

                course_lines.append(
                    f"  • "
                    f"{sc['course_code']} - "
                    f"{sc['course_name']}: "
                    f"{sc['percentage']}% "
                    f"({sc['attended']}/"
                    f"{sc['total']} sessions). "
                    f"Attend next "
                    f"{sc['needed']} "
                    f"consecutive classes."
                )

            if not course_rows_html:
                course_rows_html = (
                    "<tr>"
                    "<td colspan='4' "
                    "style='padding:12px 14px;"
                    "font-size:13px;"
                    "color:#6b7280;'>"
                    "Overall attendance is below "
                    "minimum required."
                    "</td>"
                    "</tr>"
                )

            courses_text = (
                "\n".join(course_lines)
                if course_lines
                else
                "  • Overall attendance is below "
                "minimum required."
            )

            subject = (
                f"[URGENT ATTENDANCE SHORTAGE] "
                f"{student.student_id or student.full_name} "
                f"— Below {att_thresh}% | "
                f"KPRIET EduPulse"
            )

            plain_message = (
                f"OFFICIAL ACADEMIC NOTIFICATION\n"
                f"KPR Institute of Engineering and "
                f"Technology — EduPulse System\n\n"
                f"Dear {student.full_name} "
                f"(Roll No: "
                f"{student.student_id or 'N/A'}, "
                f"Section: "
                f"{student.section or 'A'}),\n\n"
                f"This is an urgent academic notification "
                f"regarding your attendance shortage.\n"
                f"Minimum required: {att_thresh}%  |  "
                f"Your overall: {overall_pct}%\n\n"
                f"Courses below threshold:\n"
                f"{courses_text}\n\n"
                f"ACTION REQUIRED:\n"
                f"1. Meet your Faculty Advisor immediately.\n"
                f"2. Attend all upcoming sessions without fail.\n"
                f"3. Submit leave/medical certificates "
                f"to the department office.\n\n"
                f"— Academic Administrator, KPRIET, "
                f"Coimbatore — 641 407"
            )

            from app.email_templates import (
                build_official_alert_html_email
            )

            html_message = (
                build_official_alert_html_email(
                    student_name=student.full_name,
                    student_id=(
                        student.student_id
                        or "24CS263"
                    ),
                    section=(
                        student.section
                        or "A"
                    ),
                    overall_pct=overall_pct,
                    att_thresh=att_thresh,
                    courses=shortage_courses,
                    card_filename="student_card.png",
                )
            )

            notif = create_and_queue_notification(
                recipient_email=student.email,
                recipient_user_id=student.id,
                notification_type="attendance_shortage",
                subject=subject,
                message=plain_message,
                db=db,
            )

            notif._html_body = html_message
            notif._card_filename = "student_card.png"

            _dispatch_notification(
                notif,
                db,
                async_mode=False,
            )

            if notif.status == NotificationStatus.sent:
                sent_count += 1
                status = "sent"
                error = None
            else:
                failed_count += 1
                status = "failed"
                error = notif.error_summary

            results.append(
                {
                    "student_id": student.id,
                    "roll_number": student.student_id,
                    "name": student.full_name,
                    "email": student.email,
                    "overall_attendance": overall_pct,
                    "shortage_courses_count": len(
                        shortage_courses
                    ),
                    "status": status,
                    "error": error,
                }
            )

    return {
        "message": (
            f"Processed {len(results)} students "
            f"with attendance shortage."
        ),
        "threshold": att_thresh,
        "total_shortage_students": len(results),
        "sent_count": sent_count,
        "failed_count": failed_count,
        "students": results,
    }


# ─── Send Single Student Alert Email ─────────────────────────────────────────

@router.post(
    "/send-student-alert/{student_id}"
)
def send_single_student_alert(
    student_id: int,
    payload: Optional[
        SendStudentAlertRequest
    ] = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):

    student = (
        db.query(User)
        .filter(
            User.id == student_id,
            User.role == UserRole.student,
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    from app.routers.attendance import (
        _get_course_attendance,
        calc_recovery_classes,
    )

    from app.email_templates import (
        build_official_alert_html_email
    )

    s = _get_or_create_settings(db)

    att_thresh = (
        s.attendance_threshold
        or 75.0
    )

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == student.id,
            Enrollment.status == "active",
        )
        .all()
    )

    courses_details = []
    shortage_courses = []

    overall_att = 0
    overall_tot = 0

    for e in enrollments:

        att = _get_course_attendance(
            student.id,
            e.course_id,
            db,
            s,
        )

        overall_att += att["attended"]
        overall_tot += att["total_sessions"]

        courses_details.append(
            f"• {att['course_code']} - "
            f"{att['course_name']}: "
            f"{att['attendance_percentage']}%"
        )

        rec = calc_recovery_classes(
            att["attended"],
            att["total_sessions"],
            att_thresh,
        )

        shortage_courses.append(
            {
                "course_code": att["course_code"],
                "course_name": att["course_name"],
                "percentage": att[
                    "attendance_percentage"
                ],
                "attended": att["attended"],
                "total": att["total_sessions"],
                "needed": rec.get(
                    "classes_needed",
                    0,
                ),
            }
        )

    overall_pct = (
        round(
            (
                overall_att
                / overall_tot
                * 100
            ),
            1,
        )
        if overall_tot > 0
        else 80.0
    )

    subject = (
        payload.subject
        if payload
        and payload.subject
        else
        f"[ACADEMIC ALERT] "
        f"Important Notice regarding your "
        f"Attendance — "
        f"{student.student_id or student.full_name}"
    )

    if payload and payload.message:
        message = payload.message

    else:
        message = (
            f"Dear {student.full_name} "
            f"({student.student_id}),\n\n"
            f"This is an official notice regarding "
            f"your academic and attendance performance "
            f"at KPRIET.\n\n"
            f"Current Overall Attendance: "
            f"{overall_pct}%\n\n"
            f"Registered Courses:\n"
            + "\n".join(courses_details)
            + "\n\n"
            f"Please ensure all upcoming lectures "
            f"and assessments are attended promptly.\n\n"
            f"— Academic Monitoring Office, "
            f"KPR Institute of Engineering and Technology"
        )

    html_message = (
        build_official_alert_html_email(
            student_name=student.full_name,
            student_id=(
                student.student_id
                or "24CS263"
            ),
            section=(
                student.section
                or "A"
            ),
            overall_pct=overall_pct,
            att_thresh=att_thresh,
            courses=shortage_courses,
            card_filename="student_card.png",
        )
    )

    notif = create_and_queue_notification(
        recipient_email=student.email,
        recipient_user_id=student.id,
        notification_type="single_student_alert",
        subject=subject,
        message=message,
        db=db,
    )

    notif._html_body = html_message
    notif._card_filename = "student_card.png"

    _dispatch_notification(
        notif,
        db,
        async_mode=False,
    )

    db.refresh(notif)

    if notif.status == NotificationStatus.failed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Email delivery failed: "
                f"{notif.error_summary}"
            ),
        )

    return {
        "message": (
            f"Official Alert email dispatched "
            f"for {student.full_name} "
            f"({student.email})"
        ),
        "status": notif.status.value,
        "notification_id": notif.id,
        "error": notif.error_summary,
    }


# ─── Contact Form Inquiry Dispatch ───────────────────────────────────────────

@router.post("/contact")
def submit_contact_message(
    payload: ContactMessageCreate,
    db: Session = Depends(get_db),
):
    """
    Submits a contact inquiry from the landing/contact page.

    1. Creates in-app notifications for administrator(s).
    2. Sends an email to administrator(s) with full inquiry details using the official template.
    """

    from app.email_templates import (
        build_contact_message_html_email
    )

    admin_users = (
        db.query(User)
        .filter(
            User.role == UserRole.admin,
            User.is_active == True,
        )
        .all()
    )

    if not admin_users:
        admin_emails = [
            "karunesh128@gmail.com"
        ]
        primary_admin_id = None

    else:
        admin_emails = [
            a.email
            for a in admin_users
            if a.email
        ]

        primary_admin_id = admin_users[0].id

    now_str = datetime.now().strftime(
        "%d %b %Y, %I:%M %p"
    )

    plain_msg = (
        f"NEW CONTACT INQUIRY RECEIVED — "
        f"EDUPULSE PORTAL\n"
        f"KPR Institute of Engineering and "
        f"Technology\n\n"
        f"• From: {payload.name}\n"
        f"• Email: {payload.email}\n"
        f"• Subject Category: "
        f"{payload.subject}\n"
        f"• Received At: {now_str}\n\n"
        f"Message:\n"
        f"{payload.message}\n\n"
        f"You can reply directly to "
        f"{payload.name} at {payload.email}."
    )

    html_msg = (
        build_contact_message_html_email(
            sender_name=payload.name,
            sender_email=payload.email,
            subject_category=payload.subject,
            message_content=payload.message,
            timestamp_str=now_str,
        )
    )

    created_notifs = []

    for admin_email in admin_emails:

        notif = create_and_queue_notification(
            recipient_email=admin_email,
            recipient_user_id=primary_admin_id,
            notification_type="contact_message",
            subject=(
                f"[Contact Message] "
                f"{payload.subject} "
                f"— from {payload.name}"
            ),
            message=plain_msg,
            db=db,
        )

        notif._html_body = html_msg
        notif._card_filename = "student_card.png"

        _dispatch_notification(
            notif,
            db,
            async_mode=False,
        )

        created_notifs.append(notif.id)

    return {
        "status": "success",
        "message": (
            "Your message has been delivered to "
            "the EduPulse administration. "
            "We will get back to you shortly."
        ),
        "notifications": created_notifs,
    }


# ─── Notification History ────────────────────────────────────────────────────

@router.get(
    "/history",
    response_model=List[NotificationOut],
)
def notification_history(
    limit: int = Query(
        100,
        le=500,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    from sqlalchemy import or_

    if current_user.role == UserRole.student:

        notifs = (
            db.query(Notification)
            .filter(
                or_(
                    Notification.recipient_user_id
                    == current_user.id,

                    Notification.recipient_email
                    == current_user.email,
                )
            )
            .order_by(
                Notification.created_at.desc()
            )
            .limit(50)
            .all()
        )

    elif current_user.role == UserRole.professor:

        notifs = (
            db.query(Notification)
            .filter(
                or_(
                    Notification.recipient_user_id
                    == current_user.id,

                    Notification.recipient_email
                    == current_user.email,

                    Notification.notification_type.in_(
                        [
                            "professor_alert",
                            "system_announcement",
                            "faculty_notice",
                        ]
                    ),
                )
            )
            .order_by(
                Notification.created_at.desc()
            )
            .limit(limit)
            .all()
        )

    else:
        # Admin sees all notifications.
        notifs = (
            db.query(Notification)
            .order_by(
                Notification.created_at.desc()
            )
            .limit(limit)
            .all()
        )

    return notifs


@router.get(
    "/{notification_id}",
    response_model=NotificationOut,
)
def get_single_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id
        )
        .first()
    )

    if not notif:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    if (
        current_user.role != UserRole.admin
        and notif.recipient_user_id
        != current_user.id
        and notif.recipient_email
        != current_user.email
    ):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this notification",
        )

    return notif


@router.delete("/clear/all")
def clear_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clears all notifications for current student or all notifications if admin/professor."""

    if current_user.role == UserRole.student:

        db.query(Notification).filter(
            Notification.recipient_user_id
            == current_user.id
        ).delete()

    else:
        db.query(Notification).delete()

    db.commit()

    return {
        "message": "All notifications cleared successfully"
    }


@router.delete("/{notification_id}")
def delete_single_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes an individual notification."""

    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id
        )
        .first()
    )

    if not notif:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    if (
        current_user.role != UserRole.admin
        and notif.recipient_user_id
        != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this notification",
        )

    db.delete(notif)
    db.commit()

    return {
        "message": "Notification deleted successfully"
    }


@router.post("/{notification_id}/retry")
def retry_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):

    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id
        )
        .first()
    )

    if not notif:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notif.status = NotificationStatus.pending

    db.commit()

    _dispatch_notification(
        notif,
        db,
    )

    db.refresh(notif)

    return {
        "message": "Retry processed",
        "status": notif.status.value,
        "error": notif.error_summary,
    }