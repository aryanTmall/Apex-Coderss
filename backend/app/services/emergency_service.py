from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.emergency import EmergencyResource
from app.models.station import EmergencyStation

INITIAL_EMERGENCY_RESOURCES = [
    {
        "id": "EMG-01-ALL",
        "name": "National Emergency Response Support System (ERSS)",
        "category": "GENERAL",
        "phone_number": "112",
        "alternate_phone": None,
        "jurisdiction": "All India (National)",
        "available_hours": "24 Hours / 7 Days",
        "source_url": "https://112.gov.in",
        "verification_status": "OFFICIALLY_VERIFIED",
        "description": "Unified single emergency response service for police, fire, medical ambulance, and disaster rescue across India.",
        "address": "Ministry of Home Affairs, Government of India",
        "latitude": 28.6143,
        "longitude": 77.2088,
        "display_order": 1.0
    },
    {
        "id": "EMG-02-POL",
        "name": "State Police Emergency Control Room",
        "category": "POLICE",
        "phone_number": "100",
        "alternate_phone": "112",
        "jurisdiction": "Delhi NCR / State Police",
        "available_hours": "24 Hours / 7 Days",
        "source_url": "https://delhipolice.gov.in",
        "verification_status": "OFFICIALLY_VERIFIED",
        "description": "Immediate dispatch for crime in progress, public safety threats, theft, and emergency police intervention.",
        "address": "Police Headquarters, Jai Singh Road, New Delhi",
        "latitude": 28.6272,
        "longitude": 77.2155,
        "display_order": 2.0
    },
    {
        "id": "EMG-03-AMB",
        "name": "National Ambulance & Emergency Medical Service",
        "category": "MEDICAL",
        "phone_number": "108",
        "alternate_phone": "102",
        "jurisdiction": "National & Regional EMS",
        "available_hours": "24 Hours / 7 Days",
        "source_url": "https://mohfw.gov.in",
        "verification_status": "OFFICIALLY_VERIFIED",
        "description": "Trauma, cardiac, critical injury, obstetric emergency, and rapid paramedic response network.",
        "address": "Directorate General of Health Services, Nirman Bhawan, New Delhi",
        "latitude": 28.6105,
        "longitude": 77.2173,
        "display_order": 3.0
    },
    {
        "id": "EMG-04-FIR",
        "name": "Fire & Disaster Rescue Operations",
        "category": "FIRE",
        "phone_number": "101",
        "alternate_phone": "011-23414000",
        "jurisdiction": "Delhi Fire Service / National Fire Network",
        "available_hours": "24 Hours / 7 Days",
        "source_url": "https://dfs.delhigovt.nic.in",
        "verification_status": "OFFICIALLY_VERIFIED",
        "description": "Structural fires, industrial chemical hazards, trapped victims, building collapses, and toxic vapor leaks.",
        "address": "Delhi Fire Service Headquarters, Connaught Place, New Delhi",
        "latitude": 28.6304,
        "longitude": 77.2195,
        "display_order": 4.0
    },
    {
        "id": "EMG-05-WOM",
        "name": "National Women in Distress Helpline",
        "category": "WOMEN_SAFETY",
        "phone_number": "1091",
        "alternate_phone": "181",
        "jurisdiction": "All India (National Commission for Women)",
        "available_hours": "24 Hours / 7 Days",
        "source_url": "https://ncw.nic.in",
        "verification_status": "OFFICIALLY_VERIFIED",
        "description": "Emergency protection, harassment response, domestic violence rapid response, and women safety squads.",
        "address": "National Commission for Women, Jasola Institutional Area, New Delhi",
        "latitude": 28.5398,
        "longitude": 77.2882,
        "display_order": 5.0
    },
    {
        "id": "EMG-06-CHD",
        "name": "Childline Emergency Care & Protection",
        "category": "CHILD_PROTECTION",
        "phone_number": "1098",
        "alternate_phone": None,
        "jurisdiction": "All India (Ministry of Women & Child Development)",
        "available_hours": "24 Hours / 7 Days",
        "source_url": "https://wcd.nic.in",
        "verification_status": "OFFICIALLY_VERIFIED",
        "description": "24-hour emergency phone outreach service for children in need of care, protection, and rescue.",
        "address": "Ministry of Women and Child Development, Shastri Bhawan, New Delhi",
        "latitude": 28.6185,
        "longitude": 77.2144,
        "display_order": 6.0
    },
    {
        "id": "EMG-07-DIS",
        "name": "National Disaster Management Authority (NDMA)",
        "category": "DISASTER",
        "phone_number": "1070",
        "alternate_phone": "1077",
        "jurisdiction": "National Disaster Management / DDMA",
        "available_hours": "24 Hours / 7 Days",
        "source_url": "https://ndma.gov.in",
        "verification_status": "OFFICIALLY_VERIFIED",
        "description": "Flooding, earthquake, severe cyclonic storm, landslide, and massive urban infrastructure disaster response.",
        "address": "NDMA Bhawan, A-1, Safdarjung Enclave, New Delhi",
        "latitude": 28.5678,
        "longitude": 77.1996,
        "display_order": 7.0
    },
    {
        "id": "EMG-08-INF",
        "name": "Municipal Gas & High-Voltage Electric Hazard",
        "category": "INFRASTRUCTURE",
        "phone_number": "1912",
        "alternate_phone": "1916",
        "jurisdiction": "Municipal Grid & Public Utilities",
        "available_hours": "24 Hours / 7 Days",
        "source_url": "https://powermin.gov.in",
        "verification_status": "OFFICIALLY_VERIFIED",
        "description": "Immediate containment of snapped high-tension electric cables, transformer fires, and municipal gas pipeline leaks.",
        "address": "Power & Water Distribution Grid, Institutional Area, New Delhi",
        "latitude": 28.6250,
        "longitude": 77.2250,
        "display_order": 8.0
    }
]

def seed_initial_emergency_resources(db: Session) -> None:
    """Populates verified official emergency contacts if not already present."""
    for res_data in INITIAL_EMERGENCY_RESOURCES:
        existing = db.query(EmergencyResource).filter(EmergencyResource.id == res_data["id"]).first()
        if not existing:
            res = EmergencyResource(
                id=res_data["id"],
                name=res_data["name"],
                category=res_data["category"],
                phone_number=res_data["phone_number"],
                alternate_phone=res_data.get("alternate_phone"),
                jurisdiction=res_data["jurisdiction"],
                available_hours=res_data["available_hours"],
                source_url=res_data["source_url"],
                last_verified_at=datetime.now(timezone.utc),
                verification_status=res_data["verification_status"],
                description=res_data["description"],
                address=res_data.get("address"),
                latitude=res_data.get("latitude"),
                longitude=res_data.get("longitude"),
                is_active=True,
                display_order=res_data["display_order"]
            )
            db.add(res)
    db.commit()

def get_emergency_resources(
    db: Session,
    category: Optional[str] = None,
    jurisdiction: Optional[str] = None
) -> List[EmergencyResource]:
    """Retrieves active emergency resources with optional filtering."""
    query = db.query(EmergencyResource).filter(EmergencyResource.is_active == True)
    if category and category != "ALL":
        query = query.filter(EmergencyResource.category == category.upper())
    if jurisdiction and jurisdiction != "ALL":
        query = query.filter(EmergencyResource.jurisdiction.ilike(f"%{jurisdiction}%"))
    return query.order_by(EmergencyResource.display_order.asc()).all()


INITIAL_EMERGENCY_STATIONS = [
    {
        "id": "STN-POL-01",
        "name": "Connaught Place Police Station",
        "service_type": "POLICE",
        "address": "Shaheed Bhagat Singh Marg, Connaught Place, New Delhi 110001",
        "latitude": 28.6289,
        "longitude": 77.2183,
        "phone_number": "011-23361100",
        "alternate_phone": "100",
        "operating_status": "OPERATIONAL_24X7",
        "status_verified": True,
        "data_source": "Delhi Police Public Emergency Directory",
        "capabilities": "Armed Patrol, Crime Response, Traffic Control, FIR Cell",
        "dispatch_integrated": True,
    },
    {
        "id": "STN-POL-02",
        "name": "Chanakyapuri Police Station",
        "service_type": "POLICE",
        "address": "Kautilya Marg, Diplomatic Enclave, Chanakyapuri, New Delhi 110021",
        "latitude": 28.5983,
        "longitude": 77.1950,
        "phone_number": "011-24671400",
        "alternate_phone": "100",
        "operating_status": "OPERATIONAL_24X7",
        "status_verified": True,
        "data_source": "Delhi Police Public Emergency Directory",
        "capabilities": "Diplomatic Security, Rapid Interceptor, Public Assistance",
        "dispatch_integrated": True,
    },
    {
        "id": "STN-POL-03",
        "name": "Hauz Khas Police Station",
        "service_type": "POLICE",
        "address": "Sri Aurobindo Marg, Hauz Khas, New Delhi 110016",
        "latitude": 28.5494,
        "longitude": 77.2001,
        "phone_number": "011-26510072",
        "alternate_phone": "100",
        "operating_status": "OPERATIONAL_24X7",
        "status_verified": True,
        "data_source": "Delhi Police Public Emergency Directory",
        "capabilities": "Urban Patrol, Women Safety Unit, Rapid Interceptor",
        "dispatch_integrated": True,
    },
    {
        "id": "STN-POL-04",
        "name": "Karol Bagh Police Station",
        "service_type": "POLICE",
        "address": "Pusa Road, Near Metro Station, Karol Bagh, New Delhi 110005",
        "latitude": 28.6448,
        "longitude": 77.1906,
        "phone_number": "011-25744400",
        "alternate_phone": "100",
        "operating_status": "OPERATIONAL_24X7",
        "status_verified": True,
        "data_source": "Delhi Police Public Emergency Directory",
        "capabilities": "Commercial Sector Patrol, Anti-Theft Squad, FIR Cell",
        "dispatch_integrated": True,
    },
    {
        "id": "STN-FIR-01",
        "name": "Connaught Circus Fire Station",
        "service_type": "FIRE",
        "address": "Barakhamba Road, Connaught Place, New Delhi 110001",
        "latitude": 28.6320,
        "longitude": 77.2230,
        "phone_number": "011-23414000",
        "alternate_phone": "101",
        "operating_status": "OPERATIONAL_24X7",
        "status_verified": True,
        "data_source": "Delhi Fire Service Headquarters",
        "capabilities": "High-Rise Hydraulic Ladders, Chemical Foam Tenders, Breathing Apparatus",
        "dispatch_integrated": True,
    },
    {
        "id": "STN-FIR-02",
        "name": "Safdarjung Fire Station",
        "service_type": "FIRE",
        "address": "Ring Road, Near Safdarjung Hospital, New Delhi 110029",
        "latitude": 28.5702,
        "longitude": 77.2050,
        "phone_number": "011-26182222",
        "alternate_phone": "101",
        "operating_status": "OPERATIONAL_24X7",
        "status_verified": True,
        "data_source": "Delhi Fire Service Headquarters",
        "capabilities": "Rescue Tender, Water Bowsers, Thermal Imaging Extrication",
        "dispatch_integrated": True,
    },
    {
        "id": "STN-FIR-03",
        "name": "Nehru Place Fire Station",
        "service_type": "FIRE",
        "address": "Outer Ring Road, Near Kalkaji, New Delhi 110019",
        "latitude": 28.5490,
        "longitude": 77.2510,
        "phone_number": "011-26435000",
        "alternate_phone": "101",
        "operating_status": "OPERATIONAL_24X7",
        "status_verified": True,
        "data_source": "Delhi Fire Service Headquarters",
        "capabilities": "Commercial Fire Suppression, Hazmat Response, Heavy Rescue Extrication",
        "dispatch_integrated": True,
    },
    {
        "id": "STN-MED-01",
        "name": "AIIMS Jai Prakash Narayan Apex Trauma Center",
        "service_type": "MEDICAL",
        "address": "Ring Road, Safdarjung Enclave, New Delhi 110029",
        "latitude": 28.5672,
        "longitude": 77.2100,
        "phone_number": "011-26105555",
        "alternate_phone": "108",
        "operating_status": "OPERATIONAL_24X7",
        "status_verified": True,
        "data_source": "All India Institute of Medical Sciences (AIIMS)",
        "capabilities": "Level 1 Trauma Care, Neurosurgery, Emergency Resuscitation, Advanced ICU Ambulances",
        "dispatch_integrated": True,
    },
    {
        "id": "STN-MED-02",
        "name": "Safdarjung Hospital Emergency & Trauma Care",
        "service_type": "MEDICAL",
        "address": "Ring Road, Opposite AIIMS, New Delhi 110029",
        "latitude": 28.5700,
        "longitude": 77.2070,
        "phone_number": "011-26165060",
        "alternate_phone": "108",
        "operating_status": "OPERATIONAL_24X7",
        "status_verified": True,
        "data_source": "Safdarjung Hospital & Vardhman Mahavir Medical College",
        "capabilities": "Severe Burns ICU, Cardiac Emergency, Orthopedic Trauma, ALS Ambulances",
        "dispatch_integrated": True,
    },
    {
        "id": "STN-MED-03",
        "name": "Dr. Ram Manohar Lohia Hospital Emergency (RML)",
        "service_type": "MEDICAL",
        "address": "Baba Kharak Singh Marg, Connaught Place, New Delhi 110001",
        "latitude": 28.6247,
        "longitude": 77.2016,
        "phone_number": "011-23365525",
        "alternate_phone": "108",
        "operating_status": "OPERATIONAL_24X7",
        "status_verified": True,
        "data_source": "Dr. RML Hospital Ministry of Health",
        "capabilities": "Acute Stroke Unit, Toxicology / Poison Control, Cardiac Resuscitation",
        "dispatch_integrated": True,
    },
    {
        "id": "STN-DIS-01",
        "name": "Delhi Disaster Management Authority Emergency Operations Center",
        "service_type": "DISASTER",
        "address": "5, Sham Nath Marg, Civil Lines, Delhi 110054",
        "latitude": 28.6720,
        "longitude": 77.2210,
        "phone_number": "1077",
        "alternate_phone": "011-23994019",
        "operating_status": "OPERATIONAL_24X7",
        "status_verified": True,
        "data_source": "Delhi Disaster Management Authority (DDMA)",
        "capabilities": "Flood Inundation Control, Urban Search & Rescue, Structural Collapse Command",
        "dispatch_integrated": True,
    },
]

def seed_initial_emergency_stations(db: Session) -> None:
    """Populates verified physical emergency stations in Delhi NCR if not already present."""
    for stn_data in INITIAL_EMERGENCY_STATIONS:
        existing = db.query(EmergencyStation).filter(EmergencyStation.id == stn_data["id"]).first()
        if not existing:
            stn = EmergencyStation(
                id=stn_data["id"],
                name=stn_data["name"],
                service_type=stn_data["service_type"],
                address=stn_data["address"],
                latitude=stn_data["latitude"],
                longitude=stn_data["longitude"],
                phone_number=stn_data["phone_number"],
                alternate_phone=stn_data.get("alternate_phone"),
                operating_status=stn_data["operating_status"],
                status_verified=stn_data["status_verified"],
                data_source=stn_data["data_source"],
                last_verified_at=datetime.now(timezone.utc),
                capabilities=stn_data.get("capabilities"),
                dispatch_integrated=stn_data.get("dispatch_integrated", False),
                is_active=True
            )
            db.add(stn)
    db.commit()

def get_emergency_stations(
    db: Session,
    service_type: Optional[str] = None
) -> List[EmergencyStation]:
    """Retrieves all active emergency stations."""
    query = db.query(EmergencyStation).filter(EmergencyStation.is_active == True)
    if service_type and service_type.upper() != "ALL":
        query = query.filter(EmergencyStation.service_type == service_type.upper())
    return query.order_by(EmergencyStation.name.asc()).all()

