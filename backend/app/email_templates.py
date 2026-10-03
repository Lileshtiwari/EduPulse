import os
from typing import List, Dict, Any, Optional

PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public"))
ASSET_BASE_URL = "https://edu-pulse-rho.vercel.app"


def _resolve_card_url(card_filename: Optional[str], default_filename: str = "student_card.png") -> str:
    fn = (card_filename or default_filename).strip()
    if fn.startswith("http://") or fn.startswith("https://") or fn.startswith("data:"):
        return fn
    clean = fn.lstrip('/')
    return f"{ASSET_BASE_URL}/{clean}"


def build_official_alert_html_email(
    student_name: str,
    student_id: str,
    section: str,
    overall_pct: float,
    att_thresh: float,
    courses: List[Dict[str, Any]],
    card_filename: str = "student_card.png",
) -> str:
    """
    Renders an official academic alert notification email strictly matching the KPRIET EduPulse design.
    Features:
    - EduPulse logo at top (cid:logo_img)
    - Action Required notice banner
    - 4-card metric grid + role card image (cid:card_img)
    - Course shortage table with recovery calculations
    - 4-step action required protocol
    - Official regulatory warning
    - KPR Institute logo at bottom (cid:instuite_img)
    """
    course_rows_html = ""
    card_url = _resolve_card_url(card_filename, "student_card.png")
    for c in courses:
        pct = float(c.get("percentage", 0.0))
        color = "#dc2626" if pct < att_thresh else "#16a34a"
        attended = c.get("attended", 0)
        total = c.get("total", 0)
        needed = c.get("needed", 0)

        action_text = f"Attend next <strong>{needed}</strong> consecutive classes" if needed > 0 else "Maintain regular attendance"
        course_rows_html += f"""
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#1e293b;font-weight:600;">
            <span style="color:#ef4444;font-size:14px;margin-right:6px;">&#9888;</span>
            <strong>{c.get('course_code', '')}</strong> &ndash; {c.get('course_name', '')}
          </td>
          <td align="center" style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:800;color:{color};">
            {pct:.1f}%
          </td>
          <td align="center" style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;font-weight:600;">
            {attended} / {total}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:11px;">
            <span style="background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:6px;font-weight:600;display:inline-block;border:1px solid #fde68a;">
              {action_text}
            </span>
          </td>
        </tr>
        """

    if not course_rows_html:
        course_rows_html = f"""
        <tr>
          <td colspan="4" style="padding:14px;text-align:center;font-size:12px;color:#64748b;">
            Overall attendance is currently below the required {att_thresh}% minimum threshold.
          </td>
        </tr>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduPulse - Official Academic Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="680" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;max-width:680px;width:100%;">
          
          <!-- Top Branding Header -->
          <tr>
            <td style="padding:24px 32px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <img src="{ASSET_BASE_URL}/logo.png" alt="EduPulse" style="height:44px;max-width:180px;object-fit:contain;display:block;" />
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div style="font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.3px;">Academic Alert</div>
                    <div style="font-size:11px;color:#64748b;margin-top:2px;">Stay Informed &bull; Stay on Track &bull; A Brighter Future</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner Bar: Official Academic Notification -->
          <tr>
            <td style="padding:20px 32px 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px 16px;">
                <tr>
                  <td width="36" style="vertical-align:middle;padding-right:12px;">
                    <div style="width:32px;height:32px;border-radius:50%;background:#ef4444;color:#ffffff;text-align:center;line-height:32px;font-size:18px;font-weight:900;">!</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="color:#991b1b;font-weight:800;font-size:13px;letter-spacing:0.3px;">OFFICIAL ACADEMIC NOTIFICATION</div>
                    <div style="color:#7f1d1d;font-size:11px;margin-top:2px;">KPR Institute of Engineering and Technology &mdash; EduPulse System</div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="background:#fee2e2;color:#b91c1c;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid #f87171;display:inline-block;">Action Required</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting & Notice Body -->
          <tr>
            <td style="padding:0 32px 20px 32px;">
              <div style="font-size:16px;color:#0f172a;margin-bottom:8px;">Dear <strong>{student_name}</strong>,</div>
              <div style="font-size:13px;color:#475569;line-height:1.6;margin-bottom:6px;">
                This is an urgent academic notification regarding your attendance status.
              </div>
              <div style="font-size:13px;color:#475569;line-height:1.6;">
                As per college regulations, a minimum of <strong>{att_thresh:.1f}%</strong> attendance is mandatory to be eligible for university examinations. <span style="color:#dc2626;font-weight:700;">You are currently below the required threshold.</span>
              </div>
            </td>
          </tr>

          <!-- Details Grid (Left) + Student Card Image (Right) -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Left side: 4 metric pills -->
                  <td style="vertical-align:top;padding-right:16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Student Name -->
                        <td width="50%" style="padding-bottom:10px;padding-right:5px;">
                          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
                            <div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:600;">Student Name</div>
                            <div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">{student_name}</div>
                          </div>
                        </td>
                        <!-- Roll Number -->
                        <td width="50%" style="padding-bottom:10px;padding-left:5px;">
                          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
                            <div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:600;">Roll Number</div>
                            <div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;font-family:monospace;">{student_id or '24CS263'}</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <!-- Section -->
                        <td width="50%" style="padding-right:5px;">
                          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
                            <div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:600;">Section</div>
                            <div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">{section or 'A'}</div>
                          </div>
                        </td>
                        <!-- Overall Attendance -->
                        <td width="50%" style="padding-left:5px;">
                          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px 14px;">
                            <div style="font-size:10px;color:#dc2626;text-transform:uppercase;font-weight:600;">Overall Attendance</div>
                            <div style="font-size:15px;font-weight:800;color:#dc2626;margin-top:2px;">
                              {overall_pct:.1f}% <span style="font-size:10px;color:#64748b;font-weight:normal;">Req: {att_thresh:.1f}%</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Right side: Student Card Avatar Image -->
                  <td width="150" align="center" style="vertical-align:middle;">
                    <div style="width:135px;height:165px;border-radius:16px;overflow:hidden;border:2px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.06);background:#f1f5f9;">
                      <img src="{card_url}" alt="Student Profile" style="width:100%;height:100%;object-fit:cover;display:block;" />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Subjects Below Required Attendance -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:10px;">
                &#128214; Subject(s) Below Required Attendance
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:separate;border-spacing:0;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th align="left" style="padding:10px 14px;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;">Course Code &amp; Name</th>
                    <th align="center" style="padding:10px 12px;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;">Attendance</th>
                    <th align="center" style="padding:10px 12px;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;">Sessions Attended</th>
                    <th align="left" style="padding:10px 14px;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;">Action Required</th>
                  </tr>
                </thead>
                <tbody>
                  {course_rows_html}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Action Required Steps -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;">
                <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:12px;">
                  <span style="display:inline-block;width:18px;height:18px;background:#2563eb;color:#ffffff;border-radius:4px;text-align:center;line-height:18px;font-size:11px;margin-right:8px;">&#10003;</span>
                  Action Required
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="26" style="vertical-align:top;padding-bottom:10px;">
                      <div style="width:20px;height:20px;border-radius:50%;background:#2563eb;color:#ffffff;font-size:11px;font-weight:700;text-align:center;line-height:20px;">1</div>
                    </td>
                    <td style="vertical-align:top;padding-bottom:10px;font-size:12px;color:#334155;line-height:1.5;">
                      Meet your Faculty Advisor and respective Course Professors immediately.
                    </td>
                  </tr>
                  <tr>
                    <td width="26" style="vertical-align:top;padding-bottom:10px;">
                      <div style="width:20px;height:20px;border-radius:50%;background:#2563eb;color:#ffffff;font-size:11px;font-weight:700;text-align:center;line-height:20px;">2</div>
                    </td>
                    <td style="vertical-align:top;padding-bottom:10px;font-size:12px;color:#334155;line-height:1.5;">
                      Attend all upcoming scheduled theory and lab sessions without fail.
                    </td>
                  </tr>
                  <tr>
                    <td width="26" style="vertical-align:top;padding-bottom:10px;">
                      <div style="width:20px;height:20px;border-radius:50%;background:#2563eb;color:#ffffff;font-size:11px;font-weight:700;text-align:center;line-height:20px;">3</div>
                    </td>
                    <td style="vertical-align:top;padding-bottom:10px;font-size:12px;color:#334155;line-height:1.5;">
                      Submit official leave/medical certificates to the department office if applicable.
                    </td>
                  </tr>
                  <tr>
                    <td width="26" style="vertical-align:top;">
                      <div style="width:20px;height:20px;border-radius:50%;background:#2563eb;color:#ffffff;font-size:11px;font-weight:700;text-align:center;line-height:20px;">4</div>
                    </td>
                    <td style="vertical-align:top;font-size:12px;color:#334155;line-height:1.5;">
                      Regularly monitor your attendance through the <strong>EduPulse</strong> Student Portal.
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Legal / Disqualification Warning Banner -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:12px 16px;">
                <tr>
                  <td width="28" style="vertical-align:middle;font-size:18px;">&#9878;</td>
                  <td style="vertical-align:middle;font-size:12px;color:#9f1239;line-height:1.5;">
                    <strong>Failure to meet the minimum attendance requirement will lead to course condonation fines or examination disqualification.</strong><br/>
                    Please take the necessary action at the earliest to avoid academic consequences.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Regards & KPRIET Logo Footer -->
          <tr>
            <td style="padding:24px 32px;background:#ffffff;border-top:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <div style="font-size:12px;color:#64748b;">Regards,</div>
                    <div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">Office of the Academic Administrator</div>
                    <div style="font-size:12px;color:#475569;margin-top:1px;">KPR Institute of Engineering and Technology (Autonomous)</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:1px;">Coimbatore &ndash; 641 407</div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <img src="{ASSET_BASE_URL}/instuite.png" alt="KPR Institute of Engineering and Technology" style="height:48px;max-width:180px;object-fit:contain;display:block;margin-left:auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def build_otp_html_email(
    recipient_name: str,
    otp_code: str,
    role: str,
    email: str,
    identifier: Optional[str] = None,
    card_filename: str = "student_card.png",
) -> str:
    """
    Renders the Two-Factor OTP Passcode email matching the EduPulse official branding.
    """
    id_label = "Roll Number" if role.lower() == "student" else "Faculty / Staff ID"
    id_val = identifier or "N/A"
    default_card = "admin_card.png" if role.lower() == "admin" else ("professor_card.png" if role.lower() == "professor" else "student_card.png")
    card_url = _resolve_card_url(card_filename, default_card)

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduPulse - Verification Passcode</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="640" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;max-width:640px;width:100%;">
          
          <!-- Top Branding Header -->
          <tr>
            <td style="padding:24px 32px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <img src="{ASSET_BASE_URL}/logo.png" alt="EduPulse" style="height:44px;max-width:180px;object-fit:contain;display:block;" />
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div style="font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.3px;">Secure Verification</div>
                    <div style="font-size:11px;color:#64748b;margin-top:2px;">KPRIET Academic Portal &bull; Two-Factor Authentication</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner Bar: Official Passcode -->
          <tr>
            <td style="padding:20px 32px 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:12px 16px;">
                <tr>
                  <td width="36" style="vertical-align:middle;padding-right:12px;">
                    <div style="width:32px;height:32px;border-radius:50%;background:#2563eb;color:#ffffff;text-align:center;line-height:32px;font-size:16px;">&#128274;</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="color:#1e40af;font-weight:800;font-size:13px;letter-spacing:0.3px;">ONE-TIME LOGIN PASSCODE</div>
                    <div style="color:#3b82f6;font-size:11px;margin-top:2px;">KPR Institute of Engineering and Technology &mdash; EduPulse System</div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="background:#dbeafe;color:#1e40af;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid #93c5fd;display:inline-block;">Confidential</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting & Instructions -->
          <tr>
            <td style="padding:0 32px 20px 32px;">
              <div style="font-size:16px;color:#0f172a;margin-bottom:8px;">Dear <strong>{recipient_name}</strong>,</div>
              <div style="font-size:13px;color:#475569;line-height:1.6;">
                A sign-in request has been initiated for your <strong>{role.upper()}</strong> portal account. Use the 6-digit one-time passcode below to authenticate your session.
              </div>
            </td>
          </tr>

          <!-- Details + Character Card -->
          <tr>
            <td style="padding:0 32px 20px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Left side: Account Details -->
                  <td style="vertical-align:top;padding-right:16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:separate;border-spacing:0;">
                      <tr style="background:#f8fafc;">
                        <td style="padding:9px 12px;font-size:11px;color:#64748b;font-weight:700;border-bottom:1px solid #e2e8f0;">Account Name</td>
                        <td style="padding:9px 12px;font-size:12px;font-weight:700;color:#0f172a;border-bottom:1px solid #e2e8f0;">{recipient_name}</td>
                      </tr>
                      <tr>
                        <td style="padding:9px 12px;font-size:11px;color:#64748b;font-weight:700;border-bottom:1px solid #e2e8f0;">Portal Role</td>
                        <td style="padding:9px 12px;font-size:12px;font-weight:700;color:#2563eb;border-bottom:1px solid #e2e8f0;">{role.capitalize()}</td>
                      </tr>
                      <tr style="background:#f8fafc;">
                        <td style="padding:9px 12px;font-size:11px;color:#64748b;font-weight:700;border-bottom:1px solid #e2e8f0;">{id_label}</td>
                        <td style="padding:9px 12px;font-size:12px;font-weight:700;color:#0f172a;border-bottom:1px solid #e2e8f0;font-family:monospace;">{id_val}</td>
                      </tr>
                      <tr>
                        <td style="padding:9px 12px;font-size:11px;color:#64748b;font-weight:700;">Code Validity</td>
                        <td style="padding:9px 12px;font-size:12px;font-weight:700;color:#16a34a;">10 Minutes (Single-Use)</td>
                      </tr>
                    </table>
                  </td>

                  <!-- Right side: Profile / Role Image -->
                  <td width="130" align="center" style="vertical-align:middle;">
                    <div style="width:120px;height:140px;border-radius:14px;overflow:hidden;border:2px solid #e2e8f0;box-shadow:0 4px 10px rgba(0,0,0,0.06);background:#f1f5f9;">
                      <img src="{card_url}" alt="{role}" style="width:100%;height:100%;object-fit:cover;display:block;" />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- High-Contrast 6-Digit OTP Box -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <div style="background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border:2px dashed #93c5fd;border-radius:14px;padding:22px;text-align:center;">
                <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Your 6-Digit Verification Code</div>
                <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#0d2557;font-family:'Consolas','Courier New',monospace;padding:6px 0;">{otp_code}</div>
                <div style="font-size:11px;color:#64748b;margin-top:6px;">Valid for <strong>10 minutes</strong>. Do not disclose this OTP to anyone.</div>
              </div>
            </td>
          </tr>

          <!-- Advisory Box -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;">
                <tr>
                  <td width="28" style="vertical-align:middle;font-size:16px;">&#9888;</td>
                  <td style="vertical-align:middle;font-size:12px;color:#92400e;line-height:1.5;">
                    <strong>Security Advisory:</strong> EduPulse faculty or administrators will never ask for your one-time code. If you did not initiate this login request, please alert the Academic Administrator immediately.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Regards & KPRIET Logo Footer -->
          <tr>
            <td style="padding:24px 32px;background:#ffffff;border-top:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <div style="font-size:12px;color:#64748b;">Regards,</div>
                    <div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">Office of the Academic Administrator</div>
                    <div style="font-size:12px;color:#475569;margin-top:1px;">KPR Institute of Engineering and Technology (Autonomous)</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:1px;">Coimbatore &ndash; 641 407</div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <img src="{ASSET_BASE_URL}/instuite.png" alt="KPR Institute of Engineering and Technology" style="height:48px;max-width:180px;object-fit:contain;display:block;margin-left:auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def build_account_welcome_html_email(
    recipient_name: str,
    email: str,
    password: str,
    role: str,
    dept_name: str,
    identifier: Optional[str] = None,
    semester: Optional[int] = None,
    section: Optional[str] = None,
    assigned_courses: Optional[List[Dict[str, Any]]] = None,
    card_filename: str = "student_card.png",
) -> str:
    """
    Renders the official Account Provisioning Welcome email sent as soon as the Admin
    creates a student or faculty profile, complete with assigned semester courses and login steps.
    """
    portal_name = "Student Portal" if role.lower() == "student" else "Faculty Portal"
    id_label = "Roll Number" if role.lower() == "student" else "Faculty ID"
    id_val = identifier or "N/A"
    default_card = "admin_card.png" if role.lower() == "admin" else ("professor_card.png" if role.lower() == "professor" else "student_card.png")
    card_url = _resolve_card_url(card_filename, default_card)

    course_rows = ""
    if assigned_courses:
        for c in assigned_courses:
            code = c.get("course_code") or c.get("code") or ""
            name = c.get("course_name") or c.get("name") or ""
            course_rows += f"""
            <tr>
              <td style="padding:9px 12px;font-size:12px;font-weight:700;color:#174A8B;border-bottom:1px solid #e2e8f0;font-family:monospace;">{code}</td>
              <td style="padding:9px 12px;font-size:12px;color:#1e293b;border-bottom:1px solid #e2e8f0;font-weight:600;">{name}</td>
              <td align="center" style="padding:9px 12px;font-size:11px;color:#16a34a;font-weight:700;border-bottom:1px solid #e2e8f0;">Active / Enrolled</td>
            </tr>
            """
    else:
        course_rows = f"""
        <tr>
          <td colspan="3" style="padding:12px;text-align:center;font-size:12px;color:#64748b;">
            Courses assigned under {dept_name} (Semester {semester or 5})
          </td>
        </tr>
        """

    sem_info = f"Semester {semester} &bull; Section {section}" if semester and section else f"{dept_name}"

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduPulse - Account Provisioned</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="660" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;max-width:660px;width:100%;">
          
          <!-- Top Branding Header -->
          <tr>
            <td style="padding:24px 32px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <img src="{ASSET_BASE_URL}/logo.png" alt="EduPulse" style="height:44px;max-width:180px;object-fit:contain;display:block;" />
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div style="font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.3px;">Account Provisioned</div>
                    <div style="font-size:11px;color:#64748b;margin-top:2px;">Welcome to KPRIET &bull; EduPulse Academic Portal</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner Bar: Welcome -->
          <tr>
            <td style="padding:20px 32px 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:12px 16px;">
                <tr>
                  <td width="36" style="vertical-align:middle;padding-right:12px;">
                    <div style="width:32px;height:32px;border-radius:50%;background:#16a34a;color:#ffffff;text-align:center;line-height:32px;font-size:16px;">&#127891;</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="color:#166534;font-weight:800;font-size:13px;letter-spacing:0.3px;">OFFICIAL ACCOUNT CREDENTIALS</div>
                    <div style="color:#15803d;font-size:11px;margin-top:2px;">KPR Institute of Engineering and Technology &mdash; EduPulse System</div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="background:#dcfce7;color:#166534;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid #86efac;display:inline-block;">Active Account</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting & Details -->
          <tr>
            <td style="padding:0 32px 20px 32px;">
              <div style="font-size:16px;color:#0f172a;margin-bottom:8px;">Dear <strong>{recipient_name}</strong>,</div>
              <div style="font-size:13px;color:#475569;line-height:1.6;">
                Your official <strong>{portal_name}</strong> account has been provisioned by the Academic Administrator. Your login credentials and assigned curriculum details are below.
              </div>
            </td>
          </tr>

          <!-- Credentials Table + Role Card -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;padding-right:16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:separate;border-spacing:0;">
                      <tr style="background:#f8fafc;">
                        <td style="padding:9px 12px;font-size:11px;color:#64748b;font-weight:700;border-bottom:1px solid #e2e8f0;">Portal Address</td>
                        <td style="padding:9px 12px;font-size:12px;font-weight:700;color:#2563eb;border-bottom:1px solid #e2e8f0;">{ASSET_BASE_URL}</td>
                      </tr>
                      <tr>
                        <td style="padding:9px 12px;font-size:11px;color:#64748b;font-weight:700;border-bottom:1px solid #e2e8f0;">{id_label}</td>
                        <td style="padding:9px 12px;font-size:12px;font-weight:700;color:#0f172a;border-bottom:1px solid #e2e8f0;font-family:monospace;">{id_val}</td>
                      </tr>
                      <tr style="background:#f8fafc;">
                        <td style="padding:9px 12px;font-size:11px;color:#64748b;font-weight:700;border-bottom:1px solid #e2e8f0;">Department</td>
                        <td style="padding:9px 12px;font-size:12px;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;">{sem_info}</td>
                      </tr>
                      <tr>
                        <td style="padding:9px 12px;font-size:11px;color:#64748b;font-weight:700;border-bottom:1px solid #e2e8f0;">Login Email</td>
                        <td style="padding:9px 12px;font-size:12px;font-weight:800;color:#174A8B;border-bottom:1px solid #e2e8f0;font-family:monospace;">{email}</td>
                      </tr>
                      <tr style="background:#fef3c7;">
                        <td style="padding:9px 12px;font-size:11px;color:#92400e;font-weight:700;">Initial Password</td>
                        <td style="padding:9px 12px;font-size:13px;font-weight:800;color:#92400e;font-family:monospace;">{password}</td>
                      </tr>
                    </table>
                  </td>

                  <!-- Right side: Profile Card Photo -->
                  <td width="135" align="center" style="vertical-align:middle;">
                    <div style="width:125px;height:150px;border-radius:14px;overflow:hidden;border:2px solid #e2e8f0;box-shadow:0 4px 10px rgba(0,0,0,0.06);background:#f1f5f9;">
                      <img src="{card_url}" alt="{role}" style="width:100%;height:100%;object-fit:cover;display:block;" />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Assigned Courses Section -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:10px;">
                &#128218; Assigned Courses for Semester {semester or 5}
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:separate;border-spacing:0;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th align="left" style="padding:9px 12px;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;">Course Code</th>
                    <th align="left" style="padding:9px 12px;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;">Course Title</th>
                    <th align="center" style="padding:9px 12px;font-size:11px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {course_rows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Steps to Sign In -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;">
                <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px;">
                  &#128073; Steps to Sign In:
                </div>
                <ol style="margin:0;padding-left:18px;font-size:12px;color:#475569;line-height:1.7;">
                  <li>Visit EduPulse homepage at <a href="{ASSET_BASE_URL}" style="color:#2563eb;font-weight:700;text-decoration:none;">{ASSET_BASE_URL}</a>.</li>
                  <li>Click on the <strong>{portal_name}</strong> card.</li>
                  <li>Enter your login email (<code>{email}</code>) and your initial password (<code>{password}</code>).</li>
                  <li>Enter the secure 6-digit OTP code dispatched to this email to verify your session.</li>
                </ol>
              </div>
            </td>
          </tr>

          <!-- Regards & KPRIET Logo Footer -->
          <tr>
            <td style="padding:24px 32px;background:#ffffff;border-top:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <div style="font-size:12px;color:#64748b;">Regards,</div>
                    <div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">Office of the Academic Administrator</div>
                    <div style="font-size:12px;color:#475569;margin-top:1px;">KPR Institute of Engineering and Technology (Autonomous)</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:1px;">Coimbatore &ndash; 641 407</div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <img src="{ASSET_BASE_URL}/instuite.png" alt="KPR Institute of Engineering and Technology" style="height:48px;max-width:180px;object-fit:contain;display:block;margin-left:auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def build_contact_message_html_email(
    sender_name: str,
    sender_email: str,
    subject_category: str,
    message_content: str,
    timestamp_str: str,
) -> str:
    """
    Renders an official contact message notification email dispatched to the Academic Administrator.
    """
    formatted_message = message_content.replace("\n", "<br/>")

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduPulse - New Contact Inquiry</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="640" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;max-width:640px;width:100%;">
          
          <!-- Top Branding Header -->
          <tr>
            <td style="padding:24px 32px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <img src="{ASSET_BASE_URL}/logo.png" alt="EduPulse" style="height:44px;max-width:180px;object-fit:contain;display:block;" />
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div style="font-size:16px;font-weight:800;color:#0f172a;letter-spacing:-0.3px;">Portal Notification</div>
                    <div style="font-size:11px;color:#64748b;margin-top:2px;">Contact &amp; Support Dispatch</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner Bar: New Contact Inquiry -->
          <tr>
            <td style="padding:20px 32px 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:12px 16px;">
                <tr>
                  <td width="36" style="vertical-align:middle;padding-right:12px;">
                    <div style="width:36px;height:36px;background:#2563eb;border-radius:8px;text-align:center;line-height:36px;font-size:18px;color:#ffffff;">
                      &#9993;
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:13px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px;">
                      New Contact Inquiry Received
                    </div>
                    <div style="font-size:12px;color:#3b82f6;margin-top:2px;">
                      A user submitted a message through the EduPulse Portal contact form.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sender Details Card -->
          <tr>
            <td style="padding:0 32px 20px 32px;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px 22px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;line-height:1.8;">
                  <tr>
                    <td width="130" style="color:#64748b;font-weight:600;">Sender Name:</td>
                    <td style="color:#0f172a;font-weight:700;">{sender_name}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-weight:600;">Sender Email:</td>
                    <td style="color:#2563eb;font-weight:700;">
                      <a href="mailto:{sender_email}" style="color:#2563eb;text-decoration:none;">{sender_email}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-weight:600;">Inquiry Category:</td>
                    <td style="color:#0f172a;font-weight:700;">
                      <span style="background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:4px;font-size:11px;">
                        {subject_category}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-weight:600;">Submitted At:</td>
                    <td style="color:#475569;">{timestamp_str}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <div style="font-size:12px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
                Message Content:
              </div>
              <div style="background:#ffffff;border:1px solid #cbd5e1;border-left:4px solid #2563eb;border-radius:8px;padding:16px 20px;font-size:13px;line-height:1.6;color:#334155;">
                {formatted_message}
              </div>
            </td>
          </tr>

          <!-- Direct Reply Notice -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <div style="background:#f1f5f9;border-radius:10px;padding:12px 18px;font-size:11px;color:#64748b;text-align:center;">
                &#128161; <strong>Action:</strong> You can respond directly to this user by sending an email to <a href="mailto:{sender_email}" style="color:#2563eb;font-weight:700;text-decoration:underline;">{sender_email}</a>.
              </div>
            </td>
          </tr>

          <!-- Regards & KPRIET Logo Footer -->
          <tr>
            <td style="padding:24px 32px;background:#ffffff;border-top:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <div style="font-size:12px;color:#64748b;">Regards,</div>
                    <div style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">EduPulse Portal Automated Dispatch</div>
                    <div style="font-size:12px;color:#475569;margin-top:1px;">KPR Institute of Engineering and Technology (Autonomous)</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:1px;">Coimbatore &ndash; 641 407</div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <img src="{ASSET_BASE_URL}/instuite.png" alt="KPR Institute of Engineering and Technology" style="height:48px;max-width:180px;object-fit:contain;display:block;margin-left:auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

