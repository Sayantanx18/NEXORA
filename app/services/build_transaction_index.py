import csv
import sqlite3
from pathlib import Path


CSV_PATH = Path.home() / "Desktop" / "HHGOA_IEEE" / "transactions.csv"
DB_PATH = Path.home() / "Desktop" / "HHGOA_IEEE" / "transactions.db"


def build_index():
    print("Building transaction index...")
    print(f"Source: {CSV_PATH}")
    print(f"Database: {DB_PATH}")

    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute("DROP TABLE IF EXISTS transactions")

    cursor.execute("""
        CREATE TABLE transactions (
            transaction_id TEXT PRIMARY KEY,
            transaction_dt TEXT,
            transaction_amt REAL,
            product_cd TEXT,
            card1 TEXT,
            card2 TEXT,
            card3 TEXT,
            card4 TEXT,
            card5 TEXT,
            card6 TEXT,
            addr1 TEXT,
            addr2 TEXT,
            p_emaildomain TEXT,
            r_emaildomain TEXT,
            customer_id TEXT,
            ts TEXT,
            channel TEXT,
            risk_score REAL
        )
    """)

    with open(CSV_PATH, "r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        batch = []

        for row in reader:
            risk_score = (
                float(row["risk_score"])
                if row.get("risk_score")
                else None
            )

            batch.append((
                row["TransactionID"],
                row.get("TransactionDT"),
                float(row["TransactionAmt"])
                if row.get("TransactionAmt")
                else None,
                row.get("ProductCD"),
                row.get("card1"),
                row.get("card2"),
                row.get("card3"),
                row.get("card4"),
                row.get("card5"),
                row.get("card6"),
                row.get("addr1"),
                row.get("addr2"),
                row.get("P_emaildomain"),
                row.get("R_emaildomain"),
                row.get("customer_id"),
                row.get("ts"),
                row.get("channel"),
                risk_score,
            ))

            if len(batch) >= 5000:
                cursor.executemany("""
                    INSERT INTO transactions VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )
                """, batch)

                connection.commit()
                batch.clear()

        if batch:
            cursor.executemany("""
                INSERT INTO transactions VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            """, batch)

            connection.commit()

    cursor.execute(
        "CREATE INDEX idx_customer_id ON transactions(customer_id)"
    )

    cursor.execute(
        "CREATE INDEX idx_card1 ON transactions(card1)"
    )

    connection.commit()
    connection.close()

    print("Transaction index built successfully.")


if __name__ == "__main__":
    build_index()