export type UserRole = 'student' | 'professor' | 'admin'

export interface User {
  id: number
  full_name: string
  email: string
  role: UserRole
  student_id?: string
  faculty_id?: string
  department_id?: number
  department_name?: string
  section?: string
  semester?: number
  phone?: string
  profile_image?: string
  is_active: boolean
  lang_pref: string
  created_at: string
}

export interface AttendanceSummary {
  course_id: number
  course_code: string
  course_name: string
  total_sessions: number
  attended: number
  missed: number
  attendance_percentage: number
  threshold: number
  status: 'On Track' | 'Near Threshold' | 'Below Threshold' | 'Not Available'
  max_safe_to_miss: number
  classes_to_recover?: number
}

export interface Mark {
  id: number
  assessment_id: number
  assessment_name: string
  course_name?: string
  student_id: number
  student_name?: string
  marks_obtained: number
  max_marks?: number
  percentage?: number
  remarks?: string
  updated_at: string
}

export interface Assessment {
  id: number
  course_id: number
  assessment_name: string
  assessment_type: string
  max_marks: number
  assessment_date?: string
  created_at: string
}

export interface Course {
  id: number
  course_code: string
  course_name: string
  department_id: number
  department_name?: string
  semester: number
  section: string
  professor_id?: number
  professor_name?: string
  credits: number
  is_active: boolean
}

export interface Notification {
  id: number
  recipient_user_id?: number
  recipient_email: string
  notification_type: string
  subject: string
  message?: string
  status: 'pending' | 'sent' | 'failed'
  provider_message_id?: string
  error_summary?: string
  created_at: string
  sent_at?: string
}

export interface RiskAssessment {
  student_id: number
  student_name: string
  overall_risk: 'Low Concern' | 'Needs Attention' | 'High Concern'
  reasons: string[]
  attendance_concerns: Array<{ course: string; percentage: number; severity: string }>
  marks_concerns: Array<{ course: string; assessment: string; percentage: number; severity: string }>
}

export interface NotificationSettings {
  id: number
  attendance_threshold: number
  warning_margin: number
  marks_warning_threshold: number
  email_enabled: boolean
  test_mode_enabled: boolean
  updated_at: string
}

export interface TestRecipient {
  id: number
  name: string
  email: string
  student_id?: string
  consent_confirmed: boolean
  is_active: boolean
  created_at: string
}

export interface AuditLog {
  id: number
  actor_user_id?: number
  actor_name?: string
  action: string
  entity_type: string
  entity_id?: string
  metadata_json?: string
  timestamp: string
}

export interface AttendanceSession {
  id: number
  course_id: number
  session_date: string
  session_number: number
  topic?: string
  created_by: number
  created_at: string
}

export interface AttendanceRecord {
  id: number
  session_id: number
  student_id: number
  student_name?: string
  status: 'present' | 'absent' | 'excused'
  updated_at: string
}

export interface BunkImpactResult {
  current_attended: number
  current_total: number
  current_percentage: number
  proposed_misses: number
  projected_total: number
  projected_percentage: number
  threshold: number
  is_safe: boolean
  warning_message?: string
}

export interface RecoveryResult {
  current_attended: number
  current_total: number
  current_percentage: number
  target_percentage: number
  classes_needed?: number
  is_already_at_target: boolean
  is_impossible: boolean
  message: string
}
