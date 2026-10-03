"""
Attendance calculation engine — pure functions, used by API routers
"""
from typing import Optional


def calc_attendance_percentage(attended: int, total: int) -> Optional[float]:
    """Returns attendance percentage or None if no sessions conducted."""
    if total == 0:
        return None
    return round((attended / total) * 100, 2)


def get_attendance_status(percentage: Optional[float], threshold: float, warning_margin: float) -> str:
    """Returns one of: On Track / Near Threshold / Below Threshold / Not Available"""
    if percentage is None:
        return "Not Available"
    if percentage >= threshold:
        if percentage <= threshold + warning_margin:
            return "Near Threshold"
        return "On Track"
    return "Below Threshold"


def calc_max_safe_misses(attended: int, total: int, threshold: float) -> int:
    """
    Max number of future classes that can be missed while staying >= threshold.
    A / (C + B) >= T  =>  B <= A/T - C
    """
    if threshold <= 0 or threshold > 100:
        return 0
    t = threshold / 100.0
    current_pct = (attended / total * 100) if total > 0 else 0
    if current_pct < threshold:
        return 0
    # B <= A/T - C
    import math
    max_b = (attended / t) - total
    return max(0, math.floor(max_b))


def calc_bunk_impact(attended: int, total: int, proposed_misses: int, threshold: float) -> dict:
    """Calculate impact of missing `proposed_misses` future classes."""
    projected_total = total + proposed_misses
    projected_pct = round((attended / projected_total) * 100, 2) if projected_total > 0 else 0.0
    current_pct = round((attended / total) * 100, 2) if total > 0 else 0.0
    is_safe = projected_pct >= threshold

    warning = None
    if not is_safe:
        warning = (
            f"Missing {proposed_misses} class(es) would drop your attendance to "
            f"{projected_pct}%, which is below the {threshold}% threshold."
        )
    return {
        "current_attended": attended,
        "current_total": total,
        "current_percentage": current_pct,
        "proposed_misses": proposed_misses,
        "projected_total": projected_total,
        "projected_percentage": projected_pct,
        "threshold": threshold,
        "is_safe": is_safe,
        "warning_message": warning,
    }


def calc_recovery_classes(attended: int, total: int, target: float) -> dict:
    """
    Find min X consecutive classes to attend to reach target percentage.
    (A + X) / (C + X) >= T/100  =>  X >= (T*C - A*100) / (100 - T)
    """
    import math
    t = target / 100.0
    current_pct = round((attended / total) * 100, 2) if total > 0 else 0.0

    if current_pct >= target:
        return {
            "current_attended": attended,
            "current_total": total,
            "current_percentage": current_pct,
            "target_percentage": target,
            "classes_needed": 0,
            "is_already_at_target": True,
            "is_impossible": False,
            "message": f"You are already at or above the {target}% target.",
        }

    # If target = 100% and we have any absences, it's impossible
    if target >= 100.0 and (total - attended) > 0:
        return {
            "current_attended": attended,
            "current_total": total,
            "current_percentage": current_pct,
            "target_percentage": target,
            "classes_needed": None,
            "is_already_at_target": False,
            "is_impossible": True,
            "message": "It is mathematically impossible to reach 100% if you have any recorded absences.",
        }

    # X >= (T * C - A) / (1 - T)  [in fraction form, A and C already raw counts]
    numerator = t * total - attended
    denominator = 1 - t
    if denominator <= 0:
        return {
            "current_attended": attended,
            "current_total": total,
            "current_percentage": current_pct,
            "target_percentage": target,
            "classes_needed": None,
            "is_already_at_target": False,
            "is_impossible": True,
            "message": "Target percentage is not achievable under current conditions.",
        }

    x = math.ceil(numerator / denominator)
    x = max(0, x)
    return {
        "current_attended": attended,
        "current_total": total,
        "current_percentage": current_pct,
        "target_percentage": target,
        "classes_needed": x,
        "is_already_at_target": False,
        "is_impossible": False,
        "message": f"Attend the next {x} consecutive class(es) to reach {target}% attendance.",
    }


def assess_risk(
    attendance_summaries: list,
    marks_summaries: list,
    threshold: float,
    warning_margin: float,
    marks_warning_threshold: float,
) -> dict:
    """
    Rule-based academic risk engine.
    Returns risk level + list of human-readable reasons.
    """
    reasons = []
    attendance_concerns = []
    marks_concerns = []
    risk_score = 0

    for att in attendance_summaries:
        pct = att.get("attendance_percentage", 100)
        course = att.get("course_name", "Unknown")
        if pct < threshold:
            gap = round(threshold - pct, 1)
            reasons.append(f"Attendance is {gap}% below the {threshold}% threshold in {course}.")
            attendance_concerns.append({"course": course, "percentage": pct, "severity": "high"})
            risk_score += 2
        elif pct < threshold + warning_margin:
            reasons.append(f"Attendance is close to the threshold in {course} ({pct}%).")
            attendance_concerns.append({"course": course, "percentage": pct, "severity": "medium"})
            risk_score += 1

    for m in marks_summaries:
        pct = m.get("percentage", 100)
        course = m.get("course_name", "Unknown")
        assessment = m.get("assessment_name", "")
        if pct < marks_warning_threshold:
            reasons.append(f"Marks in {assessment} ({course}) are below the warning threshold ({pct:.1f}%).")
            marks_concerns.append({"course": course, "assessment": assessment, "percentage": pct, "severity": "high"})
            risk_score += 2
        elif pct < marks_warning_threshold + 15:
            reasons.append(f"Marks in {assessment} ({course}) need improvement ({pct:.1f}%).")
            marks_concerns.append({"course": course, "assessment": assessment, "percentage": pct, "severity": "medium"})
            risk_score += 1

    if risk_score == 0:
        overall = "Low Concern"
    elif risk_score <= 2:
        overall = "Needs Attention"
    else:
        overall = "High Concern"

    return {
        "overall_risk": overall,
        "reasons": reasons,
        "attendance_concerns": attendance_concerns,
        "marks_concerns": marks_concerns,
    }
