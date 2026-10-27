import statistics
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.report import CitizenReport
from app.models.closure import ClosureSubmission
from app.models.department import Department
from app.services.sim_clock import sim_clock

class MetricsService:

    @classmethod
    def get_dashboard_metrics(cls, db: Session) -> Dict[str, Any]:
        return cls.calculate_metrics(db)

    @classmethod
    def calculate_metrics(cls, db: Session) -> Dict[str, Any]:
        now = sim_clock.now()

        # 1. Total counts
        total_reports = db.query(CitizenReport).count()
        total_incidents = db.query(Incident).count()

        open_incidents = db.query(Incident).filter(Incident.status != "RESOLVED").all()
        open_cases = len(open_incidents)

        resolved_incidents = db.query(Incident).filter(Incident.status == "RESOLVED").all()
        resolved_cases = len(resolved_incidents)

        # 2. Overdue cases (open with deadline passed)
        overdue_cases = sum(
            1 for inc in open_incidents
            if inc.sla_due_at and inc.sla_due_at <= now
        )

        # 3. Escalated cases
        escalated_cases = db.query(Incident).filter(
            (Incident.status == "ESCALATED") | (Incident.escalation_count > 0)
        ).count()

        # 4. Duplicate link rate
        # Denominator: total_reports; Numerator: reports with duplicate_score >= 0.75 or linked to existing
        linked_reports_count = db.query(CitizenReport).filter(
            CitizenReport.duplicate_score != None,
            CitizenReport.duplicate_score >= 0.75
        ).count()
        duplicate_link_rate_pct = round((linked_reports_count / total_reports * 100.0), 1) if total_reports > 0 else 0.0

        # 5. Closure rejection rate
        total_closures = db.query(ClosureSubmission).count()
        rejected_closures = db.query(ClosureSubmission).filter(ClosureSubmission.verdict == "REJECTED").count()
        rejection_rate_pct = round((rejected_closures / total_closures * 100.0), 1) if total_closures > 0 else 0.0

        # 6. SLA compliance pct
        # Denominator: resolved incidents with an sla_due_at; Numerator: resolved on or before deadline
        resolved_with_sla = [inc for inc in resolved_incidents if inc.sla_due_at and inc.resolved_at]
        if resolved_with_sla:
            compliant = sum(1 for inc in resolved_with_sla if inc.resolved_at <= inc.sla_due_at)
            sla_compliance_pct = round((compliant / len(resolved_with_sla) * 100.0), 1)
        else:
            sla_compliance_pct = 100.0 if resolved_cases > 0 else 0.0

        # 7. Median resolution time in minutes
        resolution_durations = []
        for inc in resolved_incidents:
            if inc.resolved_at and inc.created_at:
                delta = (inc.resolved_at - inc.created_at).total_seconds() / 60.0
                if delta >= 0:
                    resolution_durations.append(delta)
        
        median_res_min = round(statistics.median(resolution_durations), 1) if resolution_durations else 0.0

        # 8. By department
        by_dept = {}
        all_depts = db.query(Department).all()
        for d in all_depts:
            by_dept[d.id] = db.query(Incident).filter(Incident.department_id == d.id).count()

        # 9. By category
        by_cat = {}
        for inc in db.query(Incident).all():
            cat = inc.category or "other"
            by_cat[cat] = by_cat.get(cat, 0) + 1

        # 10. By status
        by_status = {}
        for inc in db.query(Incident).all():
            st = inc.status
            by_status[st] = by_status.get(st, 0) + 1

        # 11. Closure verdict distribution
        verdict_dist = {"APPROVED": 0, "REJECTED": 0, "NEEDS_REVIEW": 0}
        for cls_rec in db.query(ClosureSubmission).all():
            if cls_rec.verdict in verdict_dist:
                verdict_dist[cls_rec.verdict] += 1

        return {
            "total_reports": total_reports,
            "canonical_incidents": total_incidents,
            "open_cases": open_cases,
            "resolved_cases": resolved_cases,
            "overdue_cases": overdue_cases,
            "escalated_cases": escalated_cases,
            "duplicate_link_rate_pct": duplicate_link_rate_pct,
            "closure_rejection_rate_pct": rejection_rate_pct,
            "sla_compliance_pct": sla_compliance_pct,
            "median_resolution_min": median_res_min,
            "by_department": by_dept,
            "by_category": by_cat,
            "by_status": by_status,
            "closure_verdict_distribution": verdict_dist
        }

    @classmethod
    def get_summary(cls, db: Session) -> Dict[str, Any]:
        return cls.calculate_metrics(db)

metrics_service = MetricsService()
