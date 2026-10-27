import argparse
import sys
from app.database import SessionLocal, init_db
from app.services.demo_seeder import seed_synthetic_demo_records

def main():
    parser = argparse.ArgumentParser(description="CivicHelp Deterministic Demo Data Seeder")
    parser.add_argument(
        "--count",
        type=int,
        default=450,
        help="Number of synthetic incidents to generate (default: 450, recommended 400-500)"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for deterministic reproducibility (default: 42)"
    )
    args = parser.parse_args()

    print(f"========================================================")
    print(f"CIVICHELP DEMO DATA GENERATOR")
    print(f"Target Incidents: {args.count} | Seed: {args.seed}")
    print(f"========================================================")

    init_db()
    db = SessionLocal()
    try:
        result = seed_synthetic_demo_records(db, count=args.count, seed=args.seed)
        print(f"[SUCCESS] Seeded {result['incidents_seeded']} incidents across {result['categories_covered']} categories.")
        print(f"[SUCCESS] Ingested {result['reports_seeded']} reports ({result['linked_duplicates']} linked duplicates).")
        print(f"[SUCCESS] Geography: {result['geography']}")
        print(f"[SUCCESS] Dataset tag: {result['dataset_marker']} (Live citizen records untouched)")
    except Exception as e:
        print(f"[ERROR] Failed to seed demo data: {e}", file=sys.stderr)
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
