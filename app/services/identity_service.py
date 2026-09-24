import sqlite3
from pathlib import Path

DB_PATH = Path.home() / "Desktop" / "HHGOA_IEEE" / "identity.db"


def get_identity(transaction_id: str):
    if not DB_PATH.exists():
        raise FileNotFoundError(
            f"identity.db not found at: {DB_PATH}"
        )

    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        row = connection.execute(
            """
            SELECT *
            FROM identity
            WHERE transaction_id = ?
            """,
            (str(transaction_id),),
        ).fetchone()

        if row is None:
            return None

        return dict(row)

    finally:
        connection.close()
