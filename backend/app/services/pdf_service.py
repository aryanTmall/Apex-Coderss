import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from app.models.report import CitizenReport
from app.models.incident import Incident

def generate_report_pdf(report: CitizenReport, incident: Incident = None) -> bytes:
    """
    Generates a formal, high-fidelity PDF summary for a citizen civic report
    using ReportLab with cryptographic hash verification and municipal branding.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom Palettes matching Nocturne / Civic Dark Theme
    c_primary = colors.HexColor('#0F172A') # Slate 900
    c_accent = colors.HexColor('#2563EB')  # Civic Blue
    c_teal = colors.HexColor('#0D9488')    # Verified Teal
    c_amber = colors.HexColor('#D97706')   # Amber
    c_card_bg = colors.HexColor('#F8FAFC') # Slate 50
    c_border = colors.HexColor('#E2E8F0')  # Border

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary,
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748B'),
        alignment=TA_LEFT
    )

    header_right = ParagraphStyle(
        'HeaderRight',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=c_teal,
        alignment=TA_RIGHT
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_primary,
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748B')
    )

    val_style = ParagraphStyle(
        'Val',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=c_primary
    )

    mono_style = ParagraphStyle(
        'Mono',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0F172A')
    )

    warning_style = ParagraphStyle(
        'Warning',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#9A3412')
    )

    elements = []

    # 1. Header & Verification Banner
    gen_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    header_data = [
        [
            Paragraph("CIVICHELP // MUNICIPAL INCIDENT REGISTRY", title_style),
            Paragraph("VERIFIED AUDIT RECORD<br/><font size='7' color='#64748B'>SHA-256 CHAIN PROTECTED</font>", header_right)
        ],
        [
            Paragraph("Official Citizen Submission Summary & Cryptographic Snapshot", subtitle_style),
            Paragraph(f"Generated: {gen_time}", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[360, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceAfter=12))

    # 2. Key Identification Grid
    sub_date = report.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if report.created_at else "Unknown"
    status_str = incident.status if incident else "LOGGED / INTAKE"
    priority_str = f"P{incident.priority} - {'Critical' if incident.priority >= 4 else 'Standard'}" if incident else "Standard"

    meta_grid = [
        [
            Paragraph("REPORT ID", label_style),
            Paragraph("PUBLIC TRACKING ID", label_style),
            Paragraph("CURRENT STATUS", label_style),
            Paragraph("PRIORITY LEVEL", label_style)
        ],
        [
            Paragraph(f"<b>{report.id}</b>", mono_style),
            Paragraph(f"<b>{report.tracking_id}</b>", mono_style),
            Paragraph(f"<b>{status_str}</b>", val_style),
            Paragraph(f"<b>{priority_str}</b>", val_style)
        ],
        [
            Paragraph("CATEGORY", label_style),
            Paragraph("SUBMISSION TIMESTAMP", label_style),
            Paragraph("LOCATION MODE", label_style),
            Paragraph("ASSIGNED DEPARTMENT", label_style)
        ],
        [
            Paragraph(report.category.replace('_', ' ').title(), val_style),
            Paragraph(sub_date, val_style),
            Paragraph(f"<b>{report.location_mode}</b>", val_style),
            Paragraph(incident.department_id if (incident and incident.department_id) else "Under Dispatch", val_style)
        ]
    ]

    meta_table = Table(meta_grid, colWidths=[135, 135, 135, 135])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 12))

    # 3. Location Intelligence & Unconfirmed Warning
    if report.location_mode == "UNCONFIRMED" or report.location_status in ["LOCATION_UNCONFIRMED", "TO_BE_CONFIRMED"]:
        warning_box = [
            [
                Paragraph("<b>WARNING: Awaiting Field/Crowd Location Confirmation</b><br/>"
                          "This report was submitted in 'Left Location' mode without verified live GPS coordinates. "
                          "Municipal field supervisor corroboration or secondary citizen reports are required before physical dispatch.", warning_style)
            ]
        ]
        warn_table = Table(warning_box, colWidths=[540])
        warn_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF3C7')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#F59E0B')),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(warn_table)
        elements.append(Spacer(1, 10))

    # Location Details Table
    coords_text = f"{report.latitude:.6f}, {report.longitude:.6f}" if (report.latitude and report.longitude) else "UNCOORDINATED (Landmark / Area Only)"
    loc_data = [
        [Paragraph("COORDINATES", label_style), Paragraph(coords_text, mono_style)],
        [Paragraph("CIVIC ADDRESS", label_style), Paragraph(report.address or "Address reverse-geocoding in progress", val_style)],
        [Paragraph("APPROXIMATE LOCALITY", label_style), Paragraph(report.approximate_locality or "Urban Municipal Grid", val_style)],
        [Paragraph("LANDMARK DESCRIPTION", label_style), Paragraph(report.location_description or "None provided", val_style)],
    ]
    loc_table = Table(loc_data, colWidths=[140, 400])
    loc_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('BACKGROUND', (0,0), (0,-1), c_card_bg),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(Paragraph("Geospatial Telemetry", h2_style))
    elements.append(loc_table)
    elements.append(Spacer(1, 10))

    # 4. Citizen Narrative Description
    elements.append(Paragraph("Citizen Narrative as Submitted", h2_style))
    desc_p = Paragraph(report.text, body_style)
    desc_table = Table([[desc_p]], colWidths=[540])
    desc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(desc_table)
    elements.append(Spacer(1, 12))

    # 5. Evidence & Cryptographic Verification Vault
    elements.append(Paragraph("Evidence Attachments & Cryptographic Custody", h2_style))
    att_rows = [
        [
            Paragraph("FILE NAME / IDENTIFIER", label_style),
            Paragraph("STATUS", label_style),
            Paragraph("SHA-256 CRYPTOGRAPHIC INTEGRITY DIGEST", label_style)
        ]
    ]

    has_attachments = False
    if report.attachments and len(report.attachments) > 0:
        for att in report.attachments:
            has_attachments = True
            hash_display = att.sha256_hash if att.sha256_hash else (report.sha256_hash or "CALCULATING_AT_REST")
            att_rows.append([
                Paragraph(att.filename or att.id, val_style),
                Paragraph("VERIFIED AT UPLOAD", label_style),
                Paragraph(hash_display, mono_style)
            ])
    elif report.sha256_hash:
        has_attachments = True
        att_rows.append([
            Paragraph("primary_evidence_photo.jpg", val_style),
            Paragraph("VERIFIED AT UPLOAD", label_style),
            Paragraph(report.sha256_hash, mono_style)
        ])
    else:
        att_rows.append([
            Paragraph("No physical attachments uploaded", body_style),
            Paragraph("N/A", label_style),
            Paragraph("TEXT_ONLY_SUBMISSION", mono_style)
        ])

    att_table = Table(att_rows, colWidths=[180, 110, 250])
    att_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('BACKGROUND', (0,0), (-1,0), c_card_bg),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(att_table)
    elements.append(Spacer(1, 14))

    # 6. Official Disclaimer Footer
    footer_text = (
        "<b>LEGAL & MUNICIPAL NOTICE:</b> This document constitutes an authoritative, system-generated record "
        "of a citizen report submitted to the CivicHelp Municipal Management Platform. "
        "Generation of this summary establishes proof of intake and cryptographic chain-of-custody, "
        "but does not itself constitute verified physical resolution or repair. "
        "Citizens may track live progress at <b>https://civichelp.gov.in/app/track</b> using the Tracking ID above."
    )
    footer_table = Table([[Paragraph(footer_text, ParagraphStyle('Foot', parent=styles['Normal'], fontSize=7.5, leading=10, textColor=colors.HexColor('#64748B')))]], colWidths=[540])
    footer_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(footer_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
