from app.services.transaction_service import get_transaction
from app.services.closed_case_service import search_by_customer
from app.services.investigation_state_service import get_case_state
from fastapi import APIRouter, HTTPException
import csv
from pathlib import Path


router = APIRouter(
    prefix="/api/v1/cases",
    tags=["Cases"],
)


# Real HHGOA dataset location
DATASET_PATH = (
    Path.home()
    / "Desktop"
    / "HHGOA_IEEE"
    / "case_pack.csv"
)


def load_cases():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"case_pack.csv not found at: {DATASET_PATH}"
        )

    cases = []

    with open(
        DATASET_PATH,
        "r",
        newline="",
        encoding="utf-8",
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:

            transaction = get_transaction(
                row["flagged_txn_id"]
            )

            risk_score = (
                float(row["risk_score"])
                if row["risk_score"]
                else None
            )

            # -------------------------------------------------
            # Persistent case state
            # -------------------------------------------------

            case_state = get_case_state(
                row["case_id"]
            )

            if case_state:
                status = case_state["status"]
                updated_at = case_state["updatedAt"]
            else:
                status = "ACTIVE"
                updated_at = row["opened_at"]

            # -------------------------------------------------
            # Historical fraud pattern
            # -------------------------------------------------

            historical_cases = search_by_customer(
                row["customer_id"]
            )

            fraud_pattern = None

            for historical_case in historical_cases:
                pattern = historical_case.get("pattern")

                if pattern and pattern != "none":
                    fraud_pattern = pattern
                    break

            if not fraud_pattern:
                fraud_pattern = "Undetermined"

            # -------------------------------------------------
            # Build case
            # -------------------------------------------------

            cases.append(
                {
                    "id": row["case_id"],
                    "investigationId": (
                        f"INV-{row['case_id']}"
                    ),
                    "customerId": row["customer_id"],
                    "customerNameMasked": "Unknown",

                    "transactionId": (
                        row["flagged_txn_id"]
                    ),

                    "amount": (
                        float(transaction["transaction_amt"])
                        if transaction
                        else None
                    ),

                    "currency": "USD",

                    "riskLevel": (
                        get_risk_level(risk_score)
                        if risk_score is not None
                        else "UNKNOWN"
                    ),

                    "riskScore": (
                        round(risk_score * 100)
                        if risk_score is not None
                        else None
                    ),

                    "fraudPattern": fraud_pattern,

                    "status": status,

                    "confidence": (
                        round(risk_score * 100)
                        if risk_score is not None
                        else None
                    ),

                    "assignedAnalyst": "Unassigned",

                    "createdAt": row["opened_at"],
                    "updatedAt": updated_at,

                    "triggerType": row["trigger_type"],
                    "triggerText": row["trigger_text"],
                    "cardId": row["card_id"],
                }
            )

    return cases


def get_risk_level(score: float):

    if score >= 0.85:
        return "CRITICAL"

    elif score >= 0.70:
        return "HIGH"

    elif score >= 0.40:
        return "MEDIUM"

    else:
        return "LOW"


@router.get("")
def get_cases():
    return load_cases()


@router.get("/{case_id}")
def get_case(case_id: str):

    cases = load_cases()

    for case in cases:

        if case["id"] == case_id:
            return case

    raise HTTPException(
        status_code=404,
        detail="Case not found",
    )


@router.get("/{case_id}/similar")
def get_similar_cases(case_id: str):
    cases = load_cases()

    target_case = next(
        (case for case in cases if case["id"] == case_id),
        None,
    )

    if not target_case:
        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    matches = search_by_customer(
        target_case["customerId"],
        limit=10,
    )

    results = []

    for item in matches:
        results.append(
            {
                "caseId": item.get("case_id"),
                "customerId": item.get("customer_id"),
                "pattern": item.get("pattern"),
                "riskScore": (
                    round(float(item["risk_score"]) * 100)
                    if item.get("risk_score") is not None
                    else None
                ),
                "closedAt": item.get("closed_at"),
                "resolution": item.get("resolution"),
            }
        )

    return results
