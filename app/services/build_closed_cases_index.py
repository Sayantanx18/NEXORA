import csv
import sqlite3
from pathlib import Path

CSV_PATH = Path.home() / "Desktop" / "HHGOA_IEEE" / "closed_cases_history.csv"
DB_PATH = Path.home() / "Desktop" / "HHGOA_IEEE" / "closed_cases.db"


def build_index():
    print("Building closed cases index...")
    print(f"Source: {CSV_PATH}")
    print(f"Database: {DB_PATH}")

    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute("DROP TABLE IF EXISTS closed_cases")

    cursor.execute("""
        CREATE TABLE closed_cases (
            case_id TEXT PRIMARY KEY,
            customer_id TEXT,
            card_id TEXT,
            opened_at TEXT,
            closed_at TEXT,
            outcome TEXT,
            pattern TEXT,
            first_fraud_txn_id TEXT,
            txn_ids TEXT,
            n_txns INTEGER,
            exposure_usd REAL,
            connected_card_ids TEXT,
            actions_taken TEXT,
            report_filed TEXT,
            analyst_notes TEXT
        )
    """)

    with open(CSV_PATH, "r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        batch = []

        for row in reader:
            batch.append((
                row.get("case_id"),
                row.get("customer_id"),
                row.get("card_id"),
                row.get("opened_at"),
                row.get("closed_at"),
                row.get("outcome"),
                row.get("pattern"),
                row.get("first_fraud_txn_id"),
                row.get("txn_ids"),
                int(row["n_txns"]) if row.get("n_txns") else None,
                float(row["exposure_usd"]) if row.get("exposure_usd") else None,
                row.get("connected_card_ids"),
                row.get("actions_taken"),
                row.get("report_filed"),
                row.get("analyst_notes"),
            ))

            if len(batch) >= 1000:
                cursor.executemany(
                    """
                    INSERT OR REPLACE INTO closed_cases
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    batch,
                )
                connection.commit()
                batch.clear()

        if batch:
            cursor.executemany(
                """
                INSERT OR REPLACE INTO closed_cases
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                batch,
            )

    connection.commit()
    connection.close()

    print("Closed cases index built successfully.")


if __name__ == "__main__":
    build_index()
