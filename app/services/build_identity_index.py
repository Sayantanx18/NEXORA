import csv
import sqlite3
from pathlib import Path


CSV_PATH = Path.home() / "Desktop" / "HHGOA_IEEE" / "identity.csv"
DB_PATH = Path.home() / "Desktop" / "HHGOA_IEEE" / "identity.db"


def build_index():
    print("Building identity index...")
    print(f"Source: {CSV_PATH}")
    print(f"Database: {DB_PATH}")

    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute("DROP TABLE IF EXISTS identity")

    cursor.execute("""
        CREATE TABLE identity (
            transaction_id TEXT PRIMARY KEY,
            id_15 TEXT,
            id_23 TEXT,
            id_30 TEXT,
            id_31 TEXT,
            id_33 TEXT,
            id_34 TEXT,
            device_type TEXT,
            device_info TEXT
        )
    """)

    with open(CSV_PATH, "r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        batch = []

        for row in reader:
            batch.append((
                row.get("TransactionID"),
                row.get("id_15"),
                row.get("id_23"),
                row.get("id_30"),
                row.get("id_31"),
                row.get("id_33"),
                row.get("id_34"),
                row.get("DeviceType"),
                row.get("DeviceInfo"),
            ))

            if len(batch) >= 5000:
                cursor.executemany(
                    """
                    INSERT OR REPLACE INTO identity VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )
                    """,
                    batch,
                )
                connection.commit()
                batch.clear()

        if batch:
            cursor.executemany(
                """
                INSERT OR REPLACE INTO identity VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
                """,
                batch,
            )
            connection.commit()

    connection.commit()
    connection.close()

    print("Identity index built successfully.")


if __name__ == "__main__":
    build_index()