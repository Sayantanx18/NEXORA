import sqlite3
from pathlib import Path
from datetime import datetime


DB_PATH = (
    Path.home()
    / "Desktop"
    / "HHGOA_IEEE"
    / "investigation_state.db"
)


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    return conn


def initialize_state_db():
    conn = get_connection()

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS evidence_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            evidence_ref_id TEXT UNIQUE NOT NULL,
            case_id TEXT NOT NULL,
            evidence_type TEXT NOT NULL,
            reason TEXT NOT NULL,
            policy TEXT NOT NULL,
            required_approval INTEGER NOT NULL,
            expected_evidence TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS approval_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            approval_ref_id TEXT UNIQUE NOT NULL,
            case_id TEXT NOT NULL,
            action TEXT NOT NULL,
            reason TEXT NOT NULL,
            policy TEXT NOT NULL,
            status TEXT NOT NULL,
            reviewer TEXT,
            reviewer_comment TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS case_state (
            case_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )

    conn.commit()
    conn.close()


def update_case_status(case_id: str, status: str):
    initialize_state_db()

    now = datetime.now().isoformat(timespec="seconds")

    conn = get_connection()

    conn.execute(
        """
        INSERT INTO case_state (
            case_id,
            status,
            updated_at
        )
        VALUES (?, ?, ?)
        ON CONFLICT(case_id)
        DO UPDATE SET
            status = excluded.status,
            updated_at = excluded.updated_at
        """,
        (
            case_id,
            status,
            now,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "caseId": case_id,
        "status": status,
        "updatedAt": now,
    }


def get_case_state(case_id: str):
    initialize_state_db()

    conn = get_connection()

    row = conn.execute(
        """
        SELECT
            case_id,
            status,
            updated_at
        FROM case_state
        WHERE case_id = ?
        """,
        (case_id,),
    ).fetchone()

    conn.close()

    if not row:
        return None

    return {
        "caseId": row["case_id"],
        "status": row["status"],
        "updatedAt": row["updated_at"],
    }


def save_evidence_request(
    case_id: str,
    evidence_ref_id: str,
    evidence_type: str,
    reason: str,
    policy: str,
    required_approval: bool,
    expected_evidence: str,
):
    initialize_state_db()

    now = datetime.now().isoformat(timespec="seconds")

    conn = get_connection()

    existing = conn.execute(
        """
        SELECT
            evidence_ref_id,
            case_id,
            status,
            created_at
        FROM evidence_requests
        WHERE evidence_ref_id = ?
        """,
        (evidence_ref_id,),
    ).fetchone()

    if existing:
        conn.close()

        return {
            "evidenceRefId": existing["evidence_ref_id"],
            "caseId": existing["case_id"],
            "status": existing["status"],
            "caseStatus": "AWAITING_EVIDENCE",
            "createdAt": existing["created_at"],
        }

    conn.execute(
        """
        INSERT INTO evidence_requests (
            evidence_ref_id,
            case_id,
            evidence_type,
            reason,
            policy,
            required_approval,
            expected_evidence,
            status,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            evidence_ref_id,
            case_id,
            evidence_type,
            reason,
            policy,
            int(required_approval),
            expected_evidence,
            "REQUESTED",
            now,
        ),
    )

    conn.execute(
        """
        INSERT INTO case_state (
            case_id,
            status,
            updated_at
        )
        VALUES (?, ?, ?)
        ON CONFLICT(case_id)
        DO UPDATE SET
            status = excluded.status,
            updated_at = excluded.updated_at
        """,
        (
            case_id,
            "AWAITING_EVIDENCE",
            now,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "evidenceRefId": evidence_ref_id,
        "caseId": case_id,
        "status": "REQUESTED",
        "caseStatus": "AWAITING_EVIDENCE",
        "createdAt": now,
    }


def get_evidence_requests(case_id: str):
    initialize_state_db()

    conn = get_connection()

    rows = conn.execute(
        """
        SELECT
            evidence_ref_id,
            case_id,
            evidence_type,
            reason,
            policy,
            required_approval,
            expected_evidence,
            status,
            created_at
        FROM evidence_requests
        WHERE case_id = ?
        ORDER BY id ASC
        """,
        (case_id,),
    ).fetchall()

    conn.close()

    return [
        {
            "evidenceRefId": row["evidence_ref_id"],
            "caseId": row["case_id"],
            "type": row["evidence_type"],
            "reason": row["reason"],
            "policy": row["policy"],
            "requiredApproval": bool(row["required_approval"]),
            "expectedEvidence": row["expected_evidence"],
            "status": row["status"],
            "createdAt": row["created_at"],
        }
        for row in rows
    ]


def update_evidence_status(
    evidence_ref_id: str,
    status: str,
):
    initialize_state_db()

    allowed_statuses = {
        "REQUESTED",
        "RECEIVED",
        "VERIFIED",
    }

    if status not in allowed_statuses:
        raise ValueError(
            f"Invalid evidence status: {status}"
        )

    now = datetime.now().isoformat(timespec="seconds")

    conn = get_connection()

    row = conn.execute(
        """
        SELECT
            evidence_ref_id,
            case_id,
            status,
            created_at
        FROM evidence_requests
        WHERE evidence_ref_id = ?
        """,
        (evidence_ref_id,),
    ).fetchone()

    if not row:
        conn.close()
        return None

    conn.execute(
        """
        UPDATE evidence_requests
        SET status = ?
        WHERE evidence_ref_id = ?
        """,
        (
            status,
            evidence_ref_id,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "evidenceRefId": row["evidence_ref_id"],
        "caseId": row["case_id"],
        "status": status,
        "createdAt": row["created_at"],
        "updatedAt": now,
    }


def create_approval_request(
    case_id: str,
    approval_ref_id: str,
    action: str,
    reason: str,
    policy: str,
):
    initialize_state_db()

    now = datetime.now().isoformat(timespec="seconds")

    conn = get_connection()

    existing = conn.execute(
        """
        SELECT
            approval_ref_id,
            case_id,
            action,
            status,
            reviewer,
            reviewer_comment,
            created_at,
            updated_at
        FROM approval_requests
        WHERE approval_ref_id = ?
        """,
        (approval_ref_id,),
    ).fetchone()

    if existing:
        conn.close()

        return {
            "approvalRefId": existing["approval_ref_id"],
            "caseId": existing["case_id"],
            "action": existing["action"],
            "status": existing["status"],
            "reviewer": existing["reviewer"],
            "reviewerComment": existing["reviewer_comment"],
            "caseStatus": (
                "AWAITING_APPROVAL"
                if existing["status"] == "PENDING"
                else existing["status"]
            ),
            "createdAt": existing["created_at"],
            "updatedAt": existing["updated_at"],
        }

    conn.execute(
        """
        INSERT INTO approval_requests (
            approval_ref_id,
            case_id,
            action,
            reason,
            policy,
            status,
            reviewer,
            reviewer_comment,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            approval_ref_id,
            case_id,
            action,
            reason,
            policy,
            "PENDING",
            None,
            None,
            now,
            now,
        ),
    )

    conn.execute(
        """
        INSERT INTO case_state (
            case_id,
            status,
            updated_at
        )
        VALUES (?, ?, ?)
        ON CONFLICT(case_id)
        DO UPDATE SET
            status = excluded.status,
            updated_at = excluded.updated_at
        """,
        (
            case_id,
            "AWAITING_APPROVAL",
            now,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "approvalRefId": approval_ref_id,
        "caseId": case_id,
        "action": action,
        "status": "PENDING",
        "reviewer": None,
        "reviewerComment": None,
        "caseStatus": "AWAITING_APPROVAL",
        "createdAt": now,
        "updatedAt": now,
    }


def get_approval_request(case_id: str):
    initialize_state_db()

    conn = get_connection()

    row = conn.execute(
        """
        SELECT
            approval_ref_id,
            case_id,
            action,
            reason,
            policy,
            status,
            reviewer,
            reviewer_comment,
            created_at,
            updated_at
        FROM approval_requests
        WHERE case_id = ?
        ORDER BY id DESC
        LIMIT 1
        """,
        (case_id,),
    ).fetchone()

    conn.close()

    if not row:
        return None

    return {
        "approvalRefId": row["approval_ref_id"],
        "caseId": row["case_id"],
        "action": row["action"],
        "reason": row["reason"],
        "policy": row["policy"],
        "status": row["status"],
        "reviewer": row["reviewer"],
        "reviewerComment": row["reviewer_comment"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def approve_request(
    approval_ref_id: str,
    reviewer: str,
    reviewer_comment: str = "",
):
    initialize_state_db()

    now = datetime.now().isoformat(timespec="seconds")

    conn = get_connection()

    row = conn.execute(
        """
        SELECT
            approval_ref_id,
            case_id,
            action,
            status,
            created_at
        FROM approval_requests
        WHERE approval_ref_id = ?
        """,
        (approval_ref_id,),
    ).fetchone()

    if not row:
        conn.close()
        return None

    conn.execute(
        """
        UPDATE approval_requests
        SET
            status = ?,
            reviewer = ?,
            reviewer_comment = ?,
            updated_at = ?
        WHERE approval_ref_id = ?
        """,
        (
            "APPROVED",
            reviewer,
            reviewer_comment,
            now,
            approval_ref_id,
        ),
    )

    conn.execute(
        """
        INSERT INTO case_state (
            case_id,
            status,
            updated_at
        )
        VALUES (?, ?, ?)
        ON CONFLICT(case_id)
        DO UPDATE SET
            status = excluded.status,
            updated_at = excluded.updated_at
        """,
        (
            row["case_id"],
            "APPROVED",
            now,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "approvalRefId": row["approval_ref_id"],
        "caseId": row["case_id"],
        "action": row["action"],
        "status": "APPROVED",
        "reviewer": reviewer,
        "reviewerComment": reviewer_comment,
        "updatedAt": now,
    }


def reject_request(
    approval_ref_id: str,
    reviewer: str,
    reviewer_comment: str = "",
):
    initialize_state_db()

    now = datetime.now().isoformat(timespec="seconds")

    conn = get_connection()

    row = conn.execute(
        """
        SELECT
            approval_ref_id,
            case_id,
            action,
            status,
            created_at
        FROM approval_requests
        WHERE approval_ref_id = ?
        """,
        (approval_ref_id,),
    ).fetchone()

    if not row:
        conn.close()
        return None

    conn.execute(
        """
        UPDATE approval_requests
        SET
            status = ?,
            reviewer = ?,
            reviewer_comment = ?,
            updated_at = ?
        WHERE approval_ref_id = ?
        """,
        (
            "REJECTED",
            reviewer,
            reviewer_comment,
            now,
            approval_ref_id,
        ),
    )

    conn.execute(
        """
        INSERT INTO case_state (
            case_id,
            status,
            updated_at
        )
        VALUES (?, ?, ?)
        ON CONFLICT(case_id)
        DO UPDATE SET
            status = excluded.status,
            updated_at = excluded.updated_at
        """,
        (
            row["case_id"],
            "REJECTED",
            now,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "approvalRefId": row["approval_ref_id"],
        "caseId": row["case_id"],
        "action": row["action"],
        "status": "REJECTED",
        "reviewer": reviewer,
        "reviewerComment": reviewer_comment,
        "updatedAt": now,
    }