import pytest
from fastapi.testclient import TestClient

def test_funds_summary_and_ward_breakdown(client: TestClient):
    # 1. Summary endpoint
    res = client.get("/api/funds/summary?financial_year=FY%202025-26")
    assert res.status_code == 200
    data = res.json()
    assert data["financial_year"] == "FY 2025-26"
    assert data["total_approved_budget"] > 0
    assert data["total_expenditure_recorded"] > 0
    assert "overall_utilization_pct" in data
    assert data["total_projects"] >= 5

    # 2. Ward breakdown endpoint
    res_wards = client.get("/api/funds/wards?financial_year=FY%202025-26")
    assert res_wards.status_code == 200
    wards = res_wards.json()
    assert len(wards) >= 5
    first_ward = wards[0]
    assert "ward_number" in first_ward
    assert "utilization_pct" in first_ward
    assert first_ward["allocated_amount"] >= first_ward["expenditure_recorded"]

    # 3. Projects list
    res_proj = client.get("/api/funds/projects")
    assert res_proj.status_code == 200
    projects = res_proj.json()
    assert len(projects) >= 5
    assert "contractor_name" in projects[0]
    assert "milestones" in projects[0]


def test_contractor_scorecards_and_penalty_transition(client: TestClient):
    # 1. List contractors
    res = client.get("/api/contractors")
    assert res.status_code == 200
    contractors = res.json()
    assert len(contractors) >= 4
    c = contractors[0]
    assert "trust_score" in c
    assert "confirmed_penalties" in c

    # 2. Contractor details
    res_detail = client.get(f"/api/contractors/{c['id']}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["name"] == c["name"]
    assert len(detail["contracts"]) >= 1

    # 3. List assessments
    res_asm = client.get("/api/contractors/assessments")
    assert res_asm.status_code == 200
    assessments = res_asm.json()
    assert len(assessments) >= 4

    # 4. Transition assessment lifecycle
    target_asm = assessments[0]
    res_trans = client.post(
        f"/api/contractors/assessments/{target_asm['id']}/transition",
        json={
            "status": "OFFICIAL_APPROVAL",
            "official_decision_notes": "Penalty approved following joint technical survey."
        }
    )
    assert res_trans.status_code == 200
    assert res_trans.json()["success"] is True
    assert res_trans.json()["data"]["status"] == "OFFICIAL_APPROVAL"


def test_participatory_budgeting_voting_and_duplicate_prevention(client: TestClient):
    # 1. List proposals
    res = client.get("/api/participation/proposals")
    assert res.status_code == 200
    proposals = res.json()
    assert len(proposals) >= 4
    prop = next(p for p in proposals if p["status"] == "VOTING")
    assert len(prop["options"]) >= 2
    option_id = prop["options"][0]["id"]
    initial_votes = prop["total_votes_count"]

    # 2. Cast valid ballot
    participant = "test-citizen-voter-token-99"
    res_vote = client.post(
        f"/api/participation/proposals/{prop['id']}/vote",
        json={
            "poll_option_id": option_id,
            "participant_identity": participant
        }
    )
    assert res_vote.status_code == 200
    vote_data = res_vote.json()
    assert vote_data["success"] is True
    assert vote_data["total_votes_count"] == initial_votes + 1

    # 3. Prevent duplicate vote by same participant on same proposal
    res_dup = client.post(
        f"/api/participation/proposals/{prop['id']}/vote",
        json={
            "poll_option_id": option_id,
            "participant_identity": participant
        }
    )
    assert res_dup.status_code == 409  # Conflict / Duplicate prevented

    # 4. Record official decision
    res_dec = client.post(
        f"/api/participation/proposals/{prop['id']}/decision",
        json={
            "status": "APPROVED",
            "rationale": "Strong community endorsement and high ward turnout."
        }
    )
    assert res_dec.status_code == 200
    assert res_dec.json()["data"]["status"] == "APPROVED"


def test_rewards_earn_and_redemption_flow(client: TestClient):
    # 1. Catalog items
    res_cat = client.get("/api/rewards/catalog")
    assert res_cat.status_code == 200
    items = res_cat.json()
    assert len(items) >= 4
    item = items[0]
    assert "credits_cost" in item

    # 2. Account details
    citizen_id = "CIT-TEST-FLOW-01"
    res_acc = client.get(f"/api/rewards/account?citizen_id={citizen_id}")
    assert res_acc.status_code == 200
    acc = res_acc.json()
    assert acc["current_balance"] == 0

    # 3. Earn credits
    res_earn = client.post(
        "/api/rewards/earn",
        json={
            "citizen_identifier": citizen_id,
            "activity_type": "VALID_REPORT_RESOLVED",
            "description": "Pothole report verified and resolved"
        }
    )
    assert res_earn.status_code == 200
    assert res_earn.json()["credits_earned"] == 50
    assert res_earn.json()["new_balance"] == 50

    # Earn more so we can redeem
    client.post(
        "/api/rewards/earn",
        json={
            "citizen_identifier": citizen_id,
            "activity_type": "VALID_REPORT_RESOLVED",
            "description": "Streetlight report verified"
        }
    )
    client.post(
        "/api/rewards/earn",
        json={
            "citizen_identifier": citizen_id,
            "activity_type": "RESOLUTION_CONFIRMED",
            "description": "Citizen verified resolution on site"
        }
    )

    # 4. Redeem voucher
    res_redeem = client.post(
        "/api/rewards/redeem",
        json={
            "citizen_identifier": citizen_id,
            "catalog_item_id": item["id"]
        }
    )
    assert res_redeem.status_code == 200
    red_data = res_redeem.json()
    assert red_data["success"] is True
    assert "voucher_code" in red_data
    assert "expires_at" in red_data

    # 5. Leaderboard
    res_lead = client.get("/api/rewards/leaderboard")
    assert res_lead.status_code == 200
    leaders = res_lead.json()
    assert len(leaders) >= 5
    assert leaders[0]["rank"] == 1
    assert "badge_tier" in leaders[0]


def test_voice_assistant_transcript_parsing(client: TestClient):
    # 1. Pothole in Hinglish
    res_hinglish = client.post(
        "/api/voice/parse",
        json={
            "transcript": "Yahan Saket Metro station ke paas sadak par bahut bada gaddha hai turant theek karo",
            "language": "hi-IN"
        }
    )
    assert res_hinglish.status_code == 200
    data = res_hinglish.json()
    assert data["category"] == "POTHOLE"
    assert "gaddha" in data["description"]
    assert "Saket" in data["location_hint"] or len(data["location_hint"]) > 0

    # 2. Streetlight outage in English
    res_en = client.post(
        "/api/voice/parse",
        json={
            "transcript": "Broken streetlight near Central Park gate 4, complete darkness dangerous at night",
            "language": "en-IN"
        }
    )
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert data_en["category"] == "STREETLIGHT"
    assert data_en["urgency"] in ["NORMAL", "HIGH"]


def test_messaging_simulator_and_status_tracking(client: TestClient):
    phone = "+91 98991 12233"

    # 1. Simulate new report intake via WhatsApp
    res_report = client.post(
        "/api/messaging/sandbox/simulate",
        json={
            "sender_phone": phone,
            "body": "Pothole near Green Park market road dangerous for two wheelers",
            "provider": "WHATSAPP"
        }
    )
    assert res_report.status_code == 200
    reply = res_report.json()["reply"]
    assert "Tracking ID:" in reply
    assert "REP-" in reply

    # Extract tracking ID
    import re
    match = re.search(r"REP-[A-F0-9]+", reply)
    assert match is not None
    tracking_id = match.group(0)

    # 2. Query status via messaging
    res_status = client.post(
        "/api/messaging/sandbox/simulate",
        json={
            "sender_phone": phone,
            "body": f"STATUS {tracking_id}",
            "provider": "WHATSAPP"
        }
    )
    assert res_status.status_code == 200
    status_reply = res_status.json()["reply"]
    assert tracking_id in status_reply
    assert "Status:" in status_reply

    # 3. Test STOP / Opt-out
    res_stop = client.post(
        "/api/messaging/sandbox/simulate",
        json={
            "sender_phone": phone,
            "body": "STOP",
            "provider": "SMS"
        }
    )
    assert res_stop.status_code == 200
    assert "unsubscribed" in res_stop.json()["reply"].lower()


def test_confidential_whistleblower_intake_and_token_inquiry(client: TestClient):
    # 1. Anonymous submission
    res_sub = client.post(
        "/api/whistleblower/submit",
        json={
            "title": "Substandard concrete mix in stormwater culvert",
            "allegation_category": "SUBSTANDARD_WORKS",
            "narrative": "Contractor used dry lean concrete instead of reinforced M-25 grade. Evidence of immediate micro-cracking along base slab.",
            "ward_id": "WARD-DEL-044",
            "suspect_organization": "Apex Road Infrastructure Ltd",
            "is_anonymous": True
        }
    )
    assert res_sub.status_code == 200
    data = res_sub.json()
    assert data["success"] is True
    case_info = data["data"]
    assert "case_token" in case_info
    assert len(case_info["case_token"]) >= 32
    assert "case_id" in case_info

    token = case_info["case_token"]

    # 2. Anonymous inquiry by secret token
    res_track = client.get(f"/api/whistleblower/track?token={token}")
    assert res_track.status_code == 200
    track_info = res_track.json()["data"]
    assert track_info["case_id"] == case_info["case_id"]
    assert track_info["status"] == "SUBMITTED"
    assert track_info["verification_label"] == "UNVERIFIED_ALLEGATION"

    # 3. Unauthorized access to auditor dossier rejected
    res_unauth = client.get("/api/whistleblower/cases")
    assert res_unauth.status_code in [401, 403]  # Protected auditor role required
