from pathlib import Path

from app.services.transaction_service import (
    get_transaction,
    get_customer_transactions,
)
from app.services.identity_service import get_identity
from app.services.closed_case_service import (
    search_by_customer,
    search_by_card,
)


CASE_PACK_PATH = Path.home() / "Desktop" / "HHGOA_IEEE" / "case_pack.csv"


def get_case_pack_case(case_id: str):
    import csv

    with open(CASE_PACK_PATH, "r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            if row["case_id"] == case_id:
                return row

    return None


def investigate_case(case_id: str):
    case = get_case_pack_case(case_id)

    if not case:
        return None

    transaction_id = case["flagged_txn_id"]
    customer_id = case["customer_id"]
    card_id = case["card_id"]

    transaction = get_transaction(transaction_id)
    customer_transactions = get_customer_transactions(customer_id)
    identity = get_identity(transaction_id)

    customer_history = search_by_customer(customer_id)
    card_history = search_by_card(card_id)

    pattern_history = []

    for historical_case in customer_history + card_history:
        pattern = historical_case.get("pattern")

        if pattern and pattern != "none":
            if pattern not in pattern_history:
                pattern_history.append(pattern)

    return {
        "case": case,
        "transaction": transaction,
        "customer_transactions": customer_transactions,
        "identity": identity,
        "customer_history": customer_history,
        "card_history": card_history,
        "historical_patterns": pattern_history,
    }