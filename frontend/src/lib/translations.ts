export type Language = 'en' | 'ta'

export const translations = {
  en: {
    // Brand
    brandName: 'EduPulse',
    academicMonitoring: 'Academic Monitoring & Support',
    instituteName: 'KPR Institute of Engineering and Technology',
    instituteTagline: 'Learn Beyond',
    homeTagline: 'Your Academic Progress, Made Simple.',
    homeSubtitle: 'EduPulse brings attendance, marks, and academic insights together in one place—helping students stay informed and faculty support better learning.',
    
    // Navigation
    home: 'Home',
    features: 'Features',
    portals: 'Roles & Portals',
    howItWorks: 'How it Works',
    contact: 'Contact',
    login: 'Login',
    getStarted: 'Get Started',
    goToDashboard: 'Go to Dashboard',
    logOut: 'Log Out',

    // Portals
    studentPortal: 'Student Portal',
    professorPortal: 'Professor Portal',
    adminPortal: 'Administrator Portal',
    studentLogin: 'Student Login',
    facultyLogin: 'Faculty Login',
    adminLogin: 'Admin Login',

    // Student Dashboard & Sections
    dashboard: 'Dashboard',
    myAttendance: 'My Attendance',
    bunkCalculator: 'Bunk Calculator',
    recoveryPlan: 'Recovery Plan',
    myMarks: 'My Marks',
    academicRisk: 'Academic Risk',
    notifications: 'Notifications',
    profile: 'Profile',
    welcome: 'Welcome',
    semester: 'Semester',
    section: 'Section',
    overallAttendance: 'Overall Attendance',
    attended: 'Attended',
    missed: 'Missed',
    totalSessions: 'Total',
    coursesCount: 'Courses',
    needAttention: 'need attention',
    recentMarks: 'Recent Marks',
    riskLevel: 'Academic Risk',
    recentAlerts: 'Recent alerts',
    subjectWiseAttendance: 'Subject-Wise Attendance',
    quickActions: 'Quick Actions',
    calculateBunkImpact: 'Calculate Bunk Impact',
    checkAcademicRisk: 'Check Academic Risk',
    viewAll: 'View All',
    subject: 'Subject',
    attendedTotal: 'Attended/Total',
    progress: 'Progress',
    status: 'Status',
    action: 'Action',
    view: 'View',

    // Marks Section
    marksOverview: 'Marks Overview',
    passingRequirement: 'Passing Requirement: 60%',
    pass: 'Pass',
    below60Fail: 'Below 60% (Fail)',
    noMarksAvailable: 'No marks available yet',
    assessmentName: 'Assessment',
    marksObtained: 'Marks Obtained',
    maxMarks: 'Max Marks',

    // Risk Assessment
    academicRiskAssessment: 'Academic Risk Assessment',
    riskRuleAnalysis: 'Rule-based risk analysis based on your attendance and marks',
    lowConcern: 'Low Concern',
    needsAttention: 'Needs Attention',
    highConcern: 'High Concern',
    noConcernsDetected: 'No academic concerns detected at this time.',
    whyFlagged: "Why You're Flagged",
    attendanceConcerns: 'Attendance Concerns',
    marksConcerns: 'Marks Concerns',

    // Status Badges
    onTrack: 'On Track',
    nearThreshold: 'Near Threshold',
    belowThreshold: 'Below Threshold',
    safe: 'Safe',
    notSafe: 'Not Safe',

    // Bunk Calculator
    bunkCalcTitle: 'Bunk Impact Calculator',
    bunkCalcDesc: 'See how missing future classes will affect your attendance percentage',
    selectSubject: 'Select Subject',
    configure: 'Configure',
    classesToMiss: 'Classes to Miss',
    safeToMiss: 'Safe to Miss',
    classesAttended: 'Classes Attended',
    impactAnalysis: 'Impact Analysis',
    currentPercentage: 'Current',
    afterMissing: 'After Missing',
    dropBy: 'Drop',

    // Recovery Plan
    recoveryTitle: 'Attendance Recovery Calculator',
    recoveryDesc: 'Calculate consecutive classes required to reach minimum attendance threshold',
    targetThreshold: 'Target Threshold',
    consecutiveClassesNeeded: 'Consecutive Classes Needed',
    classesNeeded: 'classes needed',
    consecutiveRequired: 'Consecutive Classes Required',

    // Daily Attendance Tracker
    dailyAttendanceTitle: 'Daily Attendance Tracker',
    dailyAttendanceDesc: 'Pick a date to track period-by-period class attendance',
    selectDate: 'Select Date',
    period: 'Period',
    faculty: 'Faculty',
    present: 'Present',
    absent: 'Absent',
    excused: 'Excused',
    noClassesOnDate: 'No attendance sessions recorded on this date.',

    // Professor Navigation & Dashboard
    myCourses: 'My Courses',
    attendanceEntry: 'Attendance Entry',
    marksEntry: 'Marks Entry',
    voiceMarksEntry: 'Voice Mark Entry',
    studentAnalytics: 'Student Analytics',
    atRiskStudents: 'At-Risk Students',
    assignedCourses: 'Assigned Courses',
    totalStudents: 'Total Students',
    sessionsRecorded: 'Sessions Recorded',
    studentsNeedingAttention: 'Students Needing Attention',
    markAttendance: 'Mark Attendance',
    enterMarks: 'Enter Marks',
    voiceEntry: 'Voice Entry',
    studentRoster: 'Student Roster',
    saveAttendance: 'Save Attendance',
    saveMarks: 'Save Marks',

    // Admin Navigation & Dashboard
    students: 'Students',
    professors: 'Professors',
    departments: 'Departments',
    coursesAndSections: 'Courses & Sections',
    academicSettings: 'Academic & Email Settings',
    notificationHistory: 'Notifications & History',
    departmentBreakdown: 'Department Analytics & Performance',
    activeCourses: 'Active Courses',
    pendingMarks: 'Pending Marks',
    addNewStudent: 'Add New Student',
    addNewProfessor: 'Add New Professor',
    addNewCourse: 'Add New Course',
    rollNumber: 'Roll Number',
    facultyId: 'Faculty ID',
    saveSettings: 'Save Settings',

    // Contact Page
    getInTouch: 'Get in Touch',
    contactSubtitle: 'EduPulse is an intelligent academic monitoring platform built for KPR Institute of Engineering and Technology — tracking attendance, marks, and academic health in real time. Have a question or feedback? Reach out below.',
    connectWithUs: 'Connect with Us',
    socialsSubtitle: 'Follow EduPulse and the team on social media.',
    sendMessage: 'Send a Message',
    weWillGetBack: "We'll get back to you as soon as possible.",
    yourName: 'Your Name',
    emailAddress: 'Email Address',
    message: 'Message',
    sendButton: 'Send Message',
    sending: 'Sending...',
    messageSent: 'Message Sent!',
    thankYouContact: "Thanks for reaching out. We'll be in touch soon.",
    sendAnotherMessage: 'Send another message',
    backToHome: 'Back to Home',
    builtBy: 'Built By',

    // Entry Pass
    entryPassTitle: 'ACADEMIC ENTRY PASS & ID',
    autonomous: 'AUTONOMOUS INSTITUTION',
    validAcademicYear: 'Academic Year 2025 - 2026',
    authorizedStudent: 'VERIFIED STUDENT PROFILE',
    authorizedFaculty: 'VERIFIED FACULTY PROFILE',
    scanToVerify: 'SCAN TO VERIFY ACADEMIC RECORD',

    // Modals & General
    registeredEmail: 'Registered Email',
    password: 'Password',
    sendOtp: 'Send Verification OTP',
    verifyOtp: 'Verify OTP',
    enterOtp: 'Enter 6-Digit OTP',
    resendOtp: 'Resend Code',
    clearAll: 'Clear All',
    noNotifications: 'No notifications logged.',
    fail: 'Fail',
    analytics: 'Analytics',
    addStudent: 'Add Student',
    addProfessor: 'Add Faculty Member',
  },
  ta: {
    // Brand
    brandName: 'EduPulse',
    academicMonitoring: 'கல்வி கண்காணிப்பு மற்றும் ஆதரவு',
    instituteName: 'கேபிஆர் பொறியியல் மற்றும் தொழில்நுட்பக் கல்லூரி',
    instituteTagline: 'எல்லைகளைக் கடந்து கற்போம்',
    homeTagline: 'உங்கள் கல்வி முன்னேற்றம், எளிய முறையில்.',
    homeSubtitle: 'EduPulse வருகைப்பதிவு, மதிப்பெண்கள் மற்றும் கல்விசார் நுண்ணறிவுகளை ஒரே தளத்தில் ஒருங்கிணைக்கிறது — மாணவர்கள் மற்றும் ஆசிரியர்களுக்கு முழு ஆதரவு.',
    
    // Navigation
    home: 'முகப்பு',
    features: 'அம்சங்கள்',
    portals: 'பொறுப்புகள் & போர்டல்கள்',
    howItWorks: 'செயல்முறை',
    contact: 'தொடர்புக்கு',
    login: 'உள்நுழைக',
    getStarted: 'தொடங்குங்கள்',
    goToDashboard: 'டாஷ்போர்டிற்கு செல்',
    logOut: 'வெளியேறு',

    // Portals
    studentPortal: 'மாணவர் போர்டல்',
    professorPortal: 'பேராசிரியர் போர்டல்',
    adminPortal: 'நிர்வாக போர்டல்',
    studentLogin: 'மாணவர் உள்நுழைவு',
    facultyLogin: 'ஆசிரியர் உள்நுழைவு',
    adminLogin: 'நிர்வாக உள்நுழைவு',

    // Student Dashboard & Sections
    dashboard: 'டாஷ்போர்டு',
    myAttendance: 'என் வருகை',
    bunkCalculator: 'வருகை கணிப்பு',
    recoveryPlan: 'மீட்பு திட்டம்',
    myMarks: 'என் மதிப்பெண்',
    academicRisk: 'கல்வி அபாயம்',
    notifications: 'அறிவிப்புகள்',
    profile: 'சுயவிவரம்',
    welcome: 'வரவேற்கிறோம்',
    semester: 'செமஸ்டர்',
    section: 'பிரிவு',
    overallAttendance: 'மொத்த வருகை',
    attended: 'பங்கேற்றவை',
    missed: 'தவறியவை',
    totalSessions: 'மொத்தம்',
    coursesCount: 'பாடங்கள்',
    needAttention: 'கவனம் தேவை',
    recentMarks: 'சமீபத்திய மதிப்பெண்',
    riskLevel: 'கல்வி அபாயம்',
    recentAlerts: 'சமீபத்திய எச்சரிக்கைகள்',
    subjectWiseAttendance: 'பாட வாரியான வருகை',
    quickActions: 'விரைவு செயல்கள்',
    calculateBunkImpact: 'வருகை இழப்பு கணிப்பு',
    checkAcademicRisk: 'கல்வி அபாயத்தை சோதிக்க',
    viewAll: 'அனைத்தும் பார்',
    subject: 'பாடம்',
    attendedTotal: 'வருகை/மொத்தம்',
    progress: 'முன்னேற்றம்',
    status: 'நிலை',
    action: 'செயல்',
    view: 'பார்',

    // Marks Section
    marksOverview: 'மதிப்பெண் கண்ணோட்டம்',
    passingRequirement: 'தேர்ச்சி வரம்பு: 60%',
    pass: 'தேர்ச்சி',
    below60Fail: '60% கீழ் (தேர்ச்சி இல்லை)',
    noMarksAvailable: 'மதிப்பெண்கள் எதுவும் பதிவு செய்யப்படவில்லை',
    assessmentName: 'தேர்வு / மதிப்பீடு',
    marksObtained: 'பெற்ற மதிப்பெண்',
    maxMarks: 'அதிகபட்ச மதிப்பெண்',

    // Risk Assessment
    academicRiskAssessment: 'கல்வி அபாய மதிப்பீடு',
    riskRuleAnalysis: 'வருகை மற்றும் மதிப்பெண் அடிப்படையிலான அபாய பகுப்பாய்வு',
    lowConcern: 'குறைந்த கவலை',
    needsAttention: 'கவனம் தேவை',
    highConcern: 'அதிக கவலை',
    noConcernsDetected: 'தற்போது கல்விசார் குறைபாடுகள் எதுவும் கண்டறியப்படவில்லை.',
    whyFlagged: 'நீங்கள் அடையாளம் காணப்பட்டதற்கான காரணங்கள்',
    attendanceConcerns: 'வருகை குறைபாடுகள்',
    marksConcerns: 'மதிப்பெண் குறைபாடுகள்',

    // Status Badges
    onTrack: 'பாதுகாப்பானது',
    nearThreshold: 'வரம்பிற்கு அருகில்',
    belowThreshold: 'வரம்பிற்குக் கீழே',
    safe: 'பாதுகாப்பானது',
    notSafe: 'பாதுகாப்பற்றது',

    // Bunk Calculator
    bunkCalcTitle: 'வருகை இழப்பு கணிப்பான்',
    bunkCalcDesc: 'எதிர்கால வகுப்புகளை தவறவிடுவது வருகை சதவீதத்தை எவ்வாறு பாதிக்கும் என்பதை கணிக்கவும்',
    selectSubject: 'பாடத்தைத் தேர்ந்தெடுக்கவும்',
    configure: 'கட்டமைப்பு',
    classesToMiss: 'தவறவிட உத்தேசித்த வகுப்புகள்',
    safeToMiss: 'பாதுகாப்பாக தவறவிடக்கூடியவை',
    classesAttended: 'பங்கேற்ற வகுப்புகள்',
    impactAnalysis: 'தாக்க பகுப்பாய்வு',
    currentPercentage: 'தற்போதைய வருகை',
    afterMissing: 'தவறவிட்ட பிறகு',
    dropBy: 'குறைவு',

    // Recovery Plan
    recoveryTitle: 'வருகை மீட்புக் கணிப்பான்',
    recoveryDesc: 'தேவையான குறைந்தபட்ச வருகை சதவீதத்தை எட்ட தொடர் வகுப்புகளை கணக்கிடவும்',
    targetThreshold: 'இலக்கு வரம்பு',
    consecutiveClassesNeeded: 'தேவையான தொடர் வகுப்புகள்',
    classesNeeded: 'வகுப்புகள் தேவை',
    consecutiveRequired: 'தேவையான தொடர் வகுப்புகள்',

    // Daily Attendance Tracker
    dailyAttendanceTitle: 'தினசரி வருகை பதிவேடு',
    dailyAttendanceDesc: 'தேதியை தேர்வு செய்து ஒவ்வொரு பாடவேளை வருகையையும் அறியவும்',
    selectDate: 'தேதியைத் தேர்ந்தெடுக்கவும்',
    period: 'பாடவேளை',
    faculty: 'ஆசிரியர்',
    present: 'வருகை',
    absent: 'இல்லை',
    excused: 'அனுமதி',
    noClassesOnDate: 'இந்த தேதியில் வருகைப் பதிவுகள் எதுவும் இல்லை.',

    // Professor Navigation & Dashboard
    myCourses: 'என் பாடங்கள்',
    attendanceEntry: 'வருகைப் பதிவு',
    marksEntry: 'மதிப்பெண் பதிவு',
    voiceMarksEntry: 'குரல் வழி மதிப்பெண்',
    studentAnalytics: 'மாணவர் பகுப்பாய்வு',
    atRiskStudents: 'கவனம் தேவைப்படும் மாணவர்கள்',
    assignedCourses: 'கற்பிக்கும் பாடங்கள்',
    totalStudents: 'மொத்த மாணவர்கள்',
    sessionsRecorded: 'பதிவான பாடவேளைகள்',
    studentsNeedingAttention: 'கவனம் தேவைப்படும் மாணவர்கள்',
    markAttendance: 'வருகை பதிவு செய்',
    enterMarks: 'மதிப்பெண் உள்ளிடு',
    voiceEntry: 'குரல் வழி பதிவு',
    studentRoster: 'மாணவர் பட்டியல்',
    saveAttendance: 'வருகைப் பதிவைச் சேமி',
    saveMarks: 'மதிப்பெண்களைச் சேமி',

    // Admin Navigation & Dashboard
    students: 'மாணவர்கள்',
    professors: 'பேராசிரியர்கள்',
    departments: 'துறைகள்',
    coursesAndSections: 'பாடங்கள் & பிரிவுகள்',
    academicSettings: 'கல்வி & மின்னஞ்சல் அமைப்புகள்',
    notificationHistory: 'அறிவிப்புகள் & வரலாறு',
    departmentBreakdown: 'துறை வாரியான கல்விப் புள்ளிவிவரங்கள்',
    activeCourses: 'நடப்பு பாடங்கள்',
    pendingMarks: 'நிலுவை மதிப்பெண்கள்',
    addNewStudent: 'புதிய மாணவரைச் சேர்',
    addNewProfessor: 'புதிய பேராசிரியரைச் சேர்',
    addNewCourse: 'புதிய பாடத்தைச் சேர்',
    rollNumber: 'பதிவு எண்',
    facultyId: 'ஆசிரியர் எண்',
    saveSettings: 'அமைப்புகளைச் சேமி',

    // Contact Page
    getInTouch: 'எங்களைத் தொடர்பு கொள்ளுங்கள்',
    contactSubtitle: 'EduPulse என்பது கேபிஆர் பொறியியல் மற்றும் தொழில்நுட்பக் கல்லூரிக்காக உருவாக்கப்பட்ட ஒரு அறிவார்ந்த கல்வி கண்காணிப்பு தளமாகும் — வருகை, மதிப்பெண்கள் மற்றும் கல்வி நிலையை நிகழ்நேரத்தில் கண்காணிக்க உதவுகிறது. சந்தேகங்கள் அல்லது கருத்துகள் உள்ளதா? கீழே தொடர்பு கொள்ளவும்.',
    connectWithUs: 'சமூக வலைதளங்களில் இணையுங்கள்',
    socialsSubtitle: 'EduPulse மற்றும் குழுவை சமூக ஊடகங்களில் பின்தொடரவும்.',
    sendMessage: 'செய்தி அனுப்பவும்',
    weWillGetBack: 'விரைவில் உங்களைத் தொடர்பு கொள்கிறோம்.',
    yourName: 'உங்கள் பெயர்',
    emailAddress: 'மின்னஞ்சல் முகவரி',
    message: 'செய்தி',
    sendButton: 'செய்தியை அனுப்புக',
    sending: 'அனுப்பப்படுகிறது...',
    messageSent: 'செய்தி அனுப்பப்பட்டது!',
    thankYouContact: 'தொடர்பு கொண்டதற்கு நன்றி. விரைவில் பதிலளிப்போம்.',
    sendAnotherMessage: 'மற்றொரு செய்தி அனுப்பவும்',
    backToHome: 'முகப்புக்குத் திரும்பு',
    builtBy: 'உருவாக்கியவர்கள்',

    // Entry Pass
    entryPassTitle: 'கல்வி நுழைவு அட்டை & அடையாள அட்டை',
    autonomous: 'தன்னாட்சி நிறுவனம்',
    validAcademicYear: 'கல்வி ஆண்டு 2025 - 2026',
    authorizedStudent: 'சரிபார்க்கப்பட்ட மாணவர் சுயவிவரம்',
    authorizedFaculty: 'சரிபார்க்கப்பட்ட ஆசிரியர் சுயவிவரம்',
    scanToVerify: 'கல்வி பதிவை சரிபார்க்க ஸ்கேன் செய்யவும்',

    // Modals & General
    registeredEmail: 'பதிவு செய்யப்பட்ட மின்னஞ்சல்',
    password: 'கடவுச்சொல்',
    sendOtp: 'சரிபார்ப்பு OTP அனுப்பு',
    verifyOtp: 'OTP சரிபார்க்கவும்',
    enterOtp: '6-இலக்க OTP உள்ளிடவும்',
    resendOtp: 'மீண்டும் அனுப்பவும்',
    clearAll: 'அனைத்தையும் அழிக்கவும்',
    noNotifications: 'அறிவிப்புகள் ஏதுமில்லை.',
    fail: 'தோல்வி',
    analytics: 'பகுப்பாய்வு',
    addStudent: 'மாணவரைச் சேர்',
    addProfessor: 'ஆசிரியரைச் சேர்',
  }
}

export function getLang(): Language {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('edupulse_lang')
    if (saved === 'ta' || saved === 'en') return saved
    const userStr = localStorage.getItem('edupulse_user')
    if (userStr) {
      try {
        const u = JSON.parse(userStr)
        if (u.lang_pref === 'ta' || u.lang_pref === 'en') return u.lang_pref
      } catch {}
    }
  }
  return 'en'
}

export function setLang(lang: string) {
  const valid: Language = lang === 'ta' ? 'ta' : 'en'
  if (typeof window !== 'undefined') {
    localStorage.setItem('edupulse_lang', valid)
    const userStr = localStorage.getItem('edupulse_user')
    if (userStr) {
      try {
        const u = JSON.parse(userStr)
        u.lang_pref = valid
        localStorage.setItem('edupulse_user', JSON.stringify(u))
      } catch {}
    }
  }
}

export function tStr(en: string, ta: string, currentLang?: string): string {
  const lang = (currentLang === 'ta' || currentLang === 'en') ? currentLang : getLang()
  return lang === 'ta' ? ta : en
}

export function useT(currentLang?: string) {
  const resolved = (currentLang === 'ta' || currentLang === 'en') ? currentLang : getLang()
  const lang: Language = resolved === 'ta' ? 'ta' : 'en'
  return {
    t: translations[lang] || translations.en,
    lang,
    isTa: lang === 'ta',
    tStr: (en: string, ta: string) => lang === 'ta' ? ta : en,
  }
}
