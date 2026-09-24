import sqlite3
from pathlib import Path

DB_PATH = Path.home() / "Desktop" / "HHGOA_IEEE" / "closed_cases.db"


def _connect():
    if not DB_PATH.exists():
        raise FileNotFoundError(
            f"closed_cases.db not found at: {DB_PATH}"
        )

    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def get_case(case_id: str):
    connection = _connect()

    try:
        row = connection.execute(
            """
            SELECT *
            FROM closed_cases
            WHERE case_id = ?
            """,
            (str(case_id),),
        ).fetchone()

        return dict(row) if row else None

    finally:
        connection.close()


def search_by_customer(customer_id: str, limit: int = 20):
    connection = _connect()

    try:
        rows = connection.execute(
            """
            SELECT *
            FROM closed_cases
            WHERE customer_id = ?
            ORDER BY closed_at DESC
            LIMIT ?
            """,
            (str(customer_id), limit),
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


def search_by_card(card_id: str, limit: int = 20):
    connection = _connect()

    try:
        rows = connection.execute(
            """
            SELECT *
            FROM closed_cases
            WHERE card_id = ?
            ORDER BY closed_at DESC
            LIMIT ?
            """,
            (str(card_id), limit),
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


def search_by_pattern(pattern: str, limit: int = 20):
    connection = _connect()

    try:
        rows = connection.execute(
            """
            SELECT *
            FROM closed_cases
            WHERE pattern = ?
            ORDER BY closed_at DESC
            LIMIT ?
            """,
            (str(pattern), limit),
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()
