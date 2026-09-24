from fastapi import APIRouter, HTTPException

from app.services.transaction_service import (
    get_transaction,
    get_customer_transactions,
)

router = APIRouter(
    prefix="/api/v1/transactions",
    tags=["Transactions"],
)


@router.get("")
def get_transactions():
    """
    Return transactions associated with the investigation dataset.
    """
    from app.api.cases import load_cases

    cases = load_cases()

    transactions = []

    seen = set()

    for case in cases:
        transaction_id = case.get("transactionId")

        if not transaction_id or transaction_id in seen:
            continue

        transaction = get_transaction(transaction_id)

        if transaction:
            transactions.append(transaction)
            seen.add(transaction_id)

    return transactions


@router.get("/{transaction_id}")
def get_transaction_by_id(transaction_id: str):
    transaction = get_transaction(transaction_id)

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    return transaction
