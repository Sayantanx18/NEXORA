def calculate_fraud_assessment(evidence):
    transaction = evidence.get("transaction") or {}
    case = evidence.get("case") or {}
    customer_history = evidence.get("customer_history") or []
    card_history = evidence.get("card_history") or []
    historical_patterns = evidence.get("historical_patterns") or []
    customer_transactions = evidence.get("customer_transactions") or []
    transaction_count = len(customer_transactions)

    online_transactions = [
        t for t in customer_transactions
        if t.get("channel") == "online"
    ]

    small_online_transactions = [
        t for t in online_transactions
        if float(t.get("transaction_amt") or 0) <= 20
    ]

    unique_cards = sorted({
        str(t.get("card1"))
        for t in customer_transactions
        if t.get("card1")
    })

    unique_emails = sorted({
        t.get("p_emaildomain")
        for t in customer_transactions
        if t.get("p_emaildomain")
    })
    amounts = [
        float(t.get("transaction_amt") or 0)
        for t in customer_transactions
    ]

    average_transaction_amount = (
        sum(amounts) / len(amounts)
        if amounts else 0
    )

    maximum_transaction_amount = (
        max(amounts)
        if amounts else 0
    )

    flagged_amount = float(transaction.get("transaction_amt") or 0)

    amount_ratio_to_average = (
        flagged_amount / average_transaction_amount
        if average_transaction_amount > 0
        else 0
    )

    risk_score = transaction.get("risk_score")
    trigger_type = case.get("trigger_type")

    fraud_probability = None

    evidence_items = []


    if customer_transactions:
        if amount_ratio_to_average >= 2:
            amount_interpretation = (
                "Flagged transaction is substantially higher than the customer's recent average."
            )
        elif amount_ratio_to_average <= 0.5:
            amount_interpretation = (
                "Flagged transaction is substantially lower than the customer's recent average."
            )
        else:
            amount_interpretation = (
                "Flagged transaction amount is within the customer's recent transaction range."
            )

        evidence_items.append({
            "type": "transaction_amount_behavior",
            "value": {
                "flagged_amount": flagged_amount,
                "average_amount": round(average_transaction_amount, 2),
                "maximum_amount": round(maximum_transaction_amount, 2),
                "ratio_to_average": round(amount_ratio_to_average, 2),
            },
            "interpretation": amount_interpretation,
        })

    if risk_score is not None:
        evidence_items.append({
            "type": "risk_score",
            "value": risk_score,
            "interpretation": "Reason to investigate; not a fraud determination."
        })

    if trigger_type == "customer_report":
        evidence_items.append({
            "type": "customer_report",
            "value": case.get("trigger_text"),
            "interpretation": "Customer disputes the flagged transaction."
        })

    if customer_history:
        evidence_items.append({
            "type": "customer_history",
            "value": len(customer_history),
            "interpretation": "Prior investigations exist for this customer."
        })

    if card_history:
        evidence_items.append({
            "type": "card_history",
            "value": len(card_history),
            "interpretation": "Prior investigations exist for this card."
        })
    if customer_transactions:
        evidence_items.append({
            "type": "customer_transaction_history",
            "value": len(customer_transactions),
            "interpretation": (
                "Recent transaction history is available for behavioral comparison."
            )
        })

    if historical_patterns:
        evidence_items.append({
            "type": "historical_patterns",
            "value": historical_patterns,
            "interpretation": "Historical cases contain these documented patterns."
        })

    identity_available = evidence.get("identity") is not None

    if not identity_available:
        evidence_items.append({
            "type": "identity_data",
            "value": "unavailable",
            "interpretation": "No identity/device record was found for the flagged transaction."
        })

    return {
        "fraud_probability": fraud_probability,
        "risk_score": risk_score,
        "evidence": evidence_items,
        "identity_available": identity_available,
        "historical_patterns": historical_patterns,
        "customer_history_count": len(customer_history),
        "card_history_count": len(card_history),
        "transaction_count": transaction_count,
        "online_transaction_count": len(online_transactions),
        "small_online_transaction_count": len(small_online_transactions),
        "unique_cards": unique_cards,
        "unique_emails": unique_emails,
        "average_transaction_amount": average_transaction_amount,
        "maximum_transaction_amount": maximum_transaction_amount,
        "flagged_amount": flagged_amount,
        "amount_ratio_to_average": amount_ratio_to_average,
    }
