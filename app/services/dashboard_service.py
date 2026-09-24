import csv
import sqlite3
from pathlib import Path


BASE_PATH = Path.home() / "Desktop" / "HHGOA_IEEE"

CASE_PACK_PATH = BASE_PATH / "case_pack.csv"
TRANSACTIONS_DB_PATH = BASE_PATH / "transactions.db"
INVESTIGATION_STATE_DB_PATH = BASE_PATH / "investigation_state.db"


def get_dashboard_stats():
    # -----------------------------
    # Investigation cases
    # -----------------------------
    active_investigations = 0

    if CASE_PACK_PATH.exists():
        with open(
            CASE_PACK_PATH,
            "r",
            newline="",
            encoding="utf-8",
        ) as file:
            reader = csv.DictReader(file)
            active_investigations = sum(1 for _ in reader)

    # -----------------------------
    # Transaction risk statistics
    # -----------------------------
    high_risk_transactions = 0
    total_transactions = 0

    if TRANSACTIONS_DB_PATH.exists():
        conn = sqlite3.connect(TRANSACTIONS_DB_PATH)

        total_transactions = conn.execute(
            "SELECT COUNT(*) FROM transactions"
        ).fetchone()[0]

        high_risk_transactions = conn.execute(
            """
            SELECT COUNT(*)
            FROM transactions
            WHERE risk_score >= 0.85
            """
        ).fetchone()[0]

        conn.close()

    # -----------------------------
    # Investigation lifecycle
    # -----------------------------
    cases_awaiting_evidence = 0
    cases_awaiting_approval = 0
    resolved_cases = 0

    if INVESTIGATION_STATE_DB_PATH.exists():
        conn = sqlite3.connect(
            INVESTIGATION_STATE_DB_PATH
        )

        cases_awaiting_evidence = conn.execute(
            """
            SELECT COUNT(*)
            FROM case_state
            WHERE status = 'AWAITING_EVIDENCE'
            """
        ).fetchone()[0]

        cases_awaiting_approval = conn.execute(
            """
            SELECT COUNT(*)
            FROM case_state
            WHERE status = 'AWAITING_APPROVAL'
            """
        ).fetchone()[0]

        resolved_cases = conn.execute(
            """
            SELECT COUNT(*)
            FROM case_state
            WHERE status IN ('APPROVED', 'REJECTED')
            """
        ).fetchone()[0]

        conn.close()

    # -----------------------------
    # Current alert count
    # -----------------------------
    open_alerts = 0

    return {
        "active_investigations": active_investigations,
        "high_risk_transactions": high_risk_transactions,
        "cases_awaiting_evidence": cases_awaiting_evidence,
        "cases_awaiting_approval": cases_awaiting_approval,
        "open_alerts": open_alerts,
        "resolved_cases": resolved_cases,
        "total_transactions": total_transactions,
        "status": "backend_connected",
    }
