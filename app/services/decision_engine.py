def decide_next_action(evidence, assessment):
    case = evidence.get("case") or {}
    transaction = evidence.get("transaction") or {}

    trigger_type = case.get("trigger_type")
    trigger_text = case.get("trigger_text", "")
    amount = float(transaction.get("transaction_amt") or 0)
    risk_score = assessment.get("risk_score")

    historical_patterns = assessment.get("historical_patterns") or []
    customer_history = evidence.get("customer_history") or []
    card_history = evidence.get("card_history") or []

    customer_transactions = evidence.get("customer_transactions") or []

    transaction_count = assessment.get("transaction_count", 0)
    online_transaction_count = assessment.get("online_transaction_count", 0)
    small_online_transaction_count = assessment.get("small_online_transaction_count", 0)
    unique_cards = assessment.get("unique_cards", [])
    unique_emails = assessment.get("unique_emails", [])
    amount_ratio_to_average = assessment.get("amount_ratio_to_average", 0)

    actions = []
    evidence_requests = []
    policy_rules = []

    # Customer explicitly reports an unrecognized transaction.
    if trigger_type == "customer_report":
        actions.append("VERIFY_WITH_CUSTOMER")
        actions.append("CREATE_CASE")
        evidence_requests.append("Confirm whether the customer recognizes the transaction.")

        policy_rules.extend(["R2", "R3"])

        if amount > 1000:
            actions.append("FILE_REPORT")
            policy_rules.append("R2")

        approval_route = "L2" if "FILE_REPORT" in actions else "auto"

        return {
            "next_best_actions": actions,
            "approval_route": approval_route,
            "evidence_requests": evidence_requests,
            "policy_rules": policy_rules,
            "reason": "Customer dispute requires verification before a blocking decision."
        }

    # Very high risk score can support stopping when sufficient evidence exists.
    if risk_score is not None and risk_score >= 0.85:
        actions.append("CREATE_CASE")

        if amount > 1000:
            actions.append("FILE_REPORT")
            approval_route = "L2"
        else:
            actions.append("MONITOR_CARD")
            approval_route = "auto"

        policy_rules.append("Stop threshold >= 0.85")

        return {
            "next_best_actions": actions,
            "approval_route": approval_route,
            "evidence_requests": [],
            "policy_rules": policy_rules,
            "reason": "Assessment reached the documented high-confidence investigation threshold."
        }

    # Shared-origin / coordinated activity.
    shared_origin = (
        len(unique_cards) >= 2
       
    )

    if shared_origin:
        actions.extend([
            "CREATE_CASE",
            "MONITOR_CONNECTED_CARDS"
        ])

        if amount > 1000:
            actions.append("FILE_REPORT")
            approval_route = "L2"
        else:
            approval_route = "auto"

        policy_rules.append("R6")

        return {
            "next_best_actions": actions,
            "approval_route": approval_route,
            "evidence_requests": [],
            "policy_rules": policy_rules,
            "reason": "Historical evidence indicates connected or repeated activity requiring investigation."
        }

    # Medium / uncertain evidence.
    if risk_score is not None and risk_score >= 0.30:
        actions.extend([
            "CREATE_CASE",
            "VERIFY_WITH_CUSTOMER"
        ])

        evidence_requests.append(
            "Request customer validation before taking a blocking action."
        )

        policy_rules.extend(["R1", "R8"])

        return {
            "next_best_actions": actions,
            "approval_route": "auto",
            "evidence_requests": evidence_requests,
            "policy_rules": policy_rules,
            "reason": "Evidence is insufficient for a definitive blocking decision."
        }

    # Low-confidence / insufficient evidence.
    actions.append("MONITOR_CARD")

    return {
        "next_best_actions": actions,
        "approval_route": "auto",
        "evidence_requests": [],
        "policy_rules": [],
        "reason": "Current evidence does not support stronger intervention."
    }
