import sqlite3
from pathlib import Path


DB_PATH = (
    Path.home()
    / "Desktop"
    / "HHGOA_IEEE"
    / "transactions.db"
)


def get_transaction(transaction_id: str):
    """
    Retrieve a transaction from the indexed HHGOA SQLite database.
    """

    if not DB_PATH.exists():
        raise FileNotFoundError(
            f"transactions.db not found at: {DB_PATH}"
        )

    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        row = connection.execute(
            """
            SELECT *
            FROM transactions
            WHERE transaction_id = ?
            """,
            (str(transaction_id),),
        ).fetchone()

        if row is None:
            return None

        return dict(row)

    finally:
        connection.close()
def get_customer_transactions(customer_id: str, limit: int = 100):
    if not DB_PATH.exists():
        raise FileNotFoundError(
            f"transactions.db not found at: {DB_PATH}"
        )

    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        rows = connection.execute(
            """
            SELECT *
            FROM transactions
            WHERE customer_id = ?
            ORDER BY ts DESC
            LIMIT ?
            """,
            (str(customer_id), limit),
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()
