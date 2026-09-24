from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.investigation_service import investigate_case
from app.services.risk_engine import calculate_fraud_assessment
from app.services.decision_engine import decide_next_action
from app.services.openai_service import analyze_fraud_case
from app.services.investigation_state_service import (
    save_evidence_request,
    create_approval_request,
    get_case_state,
    get_evidence_requests,
    update_evidence_status,
    get_approval_request,
    approve_request,
    reject_request,
)


class EvidenceRequest(BaseModel):
    type: str
    reason: str
    policy: str
    requiredApproval: bool
    expectedEvidence: str


class ApprovalRequest(BaseModel):
    action: str
    reason: str
    policy: str


class EvidenceStatusUpdate(BaseModel):
    status: str


router = APIRouter(
    prefix="/api/v1/investigations",
    tags=["Investigations"],
)


@router.get("/{case_id}")
def get_investigation(case_id: str):

    evidence = investigate_case(case_id)

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Investigation case not found",
        )

    assessment = calculate_fraud_assessment(evidence)

    decision = decide_next_action(
        evidence,
        assessment,
    )

    # Calculate risk values BEFORE AI fallback so they are
    # available even when the external AI service is unavailable.
    risk_score = float(
        assessment.get("risk_score") or 0
    )

    risk_score_100 = round(
        risk_score * 100
    )

    if risk_score >= 0.85:
        risk_level = "CRITICAL"
    elif risk_score >= 0.70:
        risk_level = "HIGH"
    elif risk_score >= 0.40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    confidence = risk_score_100

    # Generate real Gemini investigation analysis.
    ai_analysis = analyze_fraud_case({
        "case": evidence.get("case"),
        "transaction": evidence.get("transaction"),
        "customer_history": evidence.get("customer_history"),
        "card_history": evidence.get("card_history"),
        "customer_transactions": evidence.get("customer_transactions"),
        "identity": evidence.get("identity"),
        "historical_patterns": evidence.get("historical_patterns"),
        "risk_assessment": assessment,
        "next_best_action": decision,
        "graph": evidence.get("tigergraph_graph"),
    })
        

    case = evidence["case"]
    transaction = evidence["transaction"]

    case_state = get_case_state(case_id)

    if case_state:
        current_status = case_state["status"]
        updated_at = case_state["updatedAt"]
    else:
        current_status = "ACTIVE"
        updated_at = case["opened_at"]

    evidence_requests = get_evidence_requests(case_id)
    approval_request = get_approval_request(case_id)

    identity_available = (
        evidence["identity"] is not None
    )

    current_assessment = {
        "riskLevel": risk_level,
        "riskScore": risk_score_100,
        "confidence": confidence,
        "evidenceSufficiency": (
            "SUFFICIENT"
            if identity_available
            else "PARTIAL"
        ),
        "remainingUncertainty": (
            "LOW"
            if identity_available
            else "MEDIUM"
        ),
        "whyUncertaintyRemains": (
            "Identity evidence is unavailable."
            if not identity_available
            else "No major evidence gap identified."
        ),
        "evaluatedAt": case["opened_at"],
    }

    initial_assessment = {
        **current_assessment,
    }

    ui_transaction = {
        "id": str(
            transaction.get("transaction_id")
        ),
        "customerId": transaction.get(
            "customer_id"
        ),
        "customerNameMasked": "Unknown",
        "riskLevel": risk_level,
        "riskScore": risk_score_100,
        "amount": transaction.get(
            "transaction_amt"
        ),
        "currency": "USD",
        "timestamp": transaction.get(
            "transaction_dt"
        ),
    }

    ui_evidence = []

    for item in assessment.get(
        "evidence",
        [],
    ):
        if isinstance(item, dict):
            ui_evidence.append(item)
        else:
            ui_evidence.append(
                {
                    "id": (
                        f"{case_id}-evidence-"
                        f"{len(ui_evidence) + 1}"
                    ),
                    "category": "Risk Assessment",
                    "description": str(item),
                    "status": "AVAILABLE",
                }
            )

    has_additional_evidence_requested = bool(
        evidence_requests
    )

    additional_evidence_received = any(
        request.get("status")
        in {
            "RECEIVED",
            "VERIFIED",
            "COMPLETED",
        }
        for request in evidence_requests
    )

    action_status = "COMPLETED"

    if current_status == "AWAITING_EVIDENCE":
        action_status = "AWAITING_EVIDENCE"

    elif current_status == "AWAITING_APPROVAL":
        action_status = "AWAITING_APPROVAL"

    elif current_status == "APPROVED":
        action_status = "APPROVED"

    elif current_status == "REJECTED":
        action_status = "REJECTED"

    timeline = [
        {
            "id": f"{case_id}-trigger",
            "stage": "Trigger",
            "timestamp": case["opened_at"],
            "actor": "System",
            "status": "COMPLETED",
            "explanation": case["trigger_text"],
        },
        {
            "id": f"{case_id}-case",
            "stage": "Case Created",
            "timestamp": case["opened_at"],
            "actor": "System",
            "status": "COMPLETED",
            "explanation": (
                "Investigation case created from "
                "the transaction risk trigger."
            ),
        },
        {
            "id": f"{case_id}-investigation",
            "stage": "Investigation Started",
            "timestamp": case["opened_at"],
            "actor": "FraudGraph Agent",
            "status": "COMPLETED",
            "explanation": (
                "Transaction, customer, card and "
                "historical evidence were gathered."
            ),
        },
        {
            "id": f"{case_id}-assessment",
            "stage": "Fraud Pattern Assessment",
            "timestamp": case["opened_at"],
            "actor": "FraudGraph Agent",
            "status": "COMPLETED",
            "explanation": (
                f"Risk assessment completed with "
                f"a score of {risk_score_100}/100."
            ),
        },
        {
            "id": f"{case_id}-action",
            "stage": "Action",
            "timestamp": updated_at,
            "actor": "FraudGraph Agent",
            "status": action_status,
            "explanation": decision["reason"],
        },
    ]

    tigergraph_graph = evidence.get(
        "tigergraph_graph",
        {},
    )

    graph_nodes = [
        {
            "id": f"case-{case_id}",
            "type": "case",
            "label": case_id,
        }
    ]

    graph_edges = []

    # Always connect the investigation case to its flagged transaction.
    transaction_id = str(
        transaction.get("transaction_id")
    )

    transaction_node_id = f"transaction-{transaction_id}"

    graph_nodes.append(
        {
            "id": transaction_node_id,
            "type": "transaction",
            "label": transaction_id,
        }
    )

    graph_edges.append(
        {
            "source": f"case-{case_id}",
            "target": transaction_node_id,
            "relationship": "FLAGGED_TRANSACTION",
        }
    )

    # Add live TigerGraph nodes and relationships.
    if (
        tigergraph_graph.get("status") == "ONLINE"
        and tigergraph_graph.get("nodes")
    ):
        type_map = {
            "Transaction": "transaction",
            "Account": "account",
            "Customer": "customer",
            "Device": "device",
            "IdentitySignal": "identity_signal",
        }

        for node in tigergraph_graph.get("nodes", []):
            vertex_type = node.get("v_type")
            vertex_id = node.get("v_id")

            if not vertex_type or vertex_id is None:
                continue

            graph_type = type_map.get(
                vertex_type,
                vertex_type.lower(),
            )

            graph_node_id = (
                f"{graph_type}-{vertex_id}"
            )

            # Avoid adding the transaction twice.
            if not any(
                existing["id"] == graph_node_id
                for existing in graph_nodes
            ):
                graph_nodes.append(
                    {
                        "id": graph_node_id,
                        "type": graph_type,
                        "label": str(vertex_id),
                    }
                )

        for edge in tigergraph_graph.get("edges", []):
            from_type = type_map.get(
                edge.get("from_type"),
                str(edge.get("from_type", "")).lower(),
            )
            to_type = type_map.get(
                edge.get("to_type"),
                str(edge.get("to_type", "")).lower(),
            )

            from_id = edge.get("from_id")
            to_id = edge.get("to_id")

            if from_id is None or to_id is None:
                continue

            graph_edges.append(
                {
                    "source": f"{from_type}-{from_id}",
                    "target": f"{to_type}-{to_id}",
                    "relationship": edge.get(
                        "e_type",
                        "RELATED_TO",
                    ),
                }
            )

    else:
        # Graceful fallback if TigerGraph is unavailable.
        customer_id = transaction.get("customer_id")

        if customer_id:
            customer_node_id = (
                f"customer-{customer_id}"
            )

            graph_nodes.append(
                {
                    "id": customer_node_id,
                    "type": "customer",
                    "label": str(customer_id),
                }
            )

            graph_edges.append(
                {
                    "source": transaction_node_id,
                    "target": customer_node_id,
                    "relationship": "BELONGS_TO_CUSTOMER",
                }
            )


    agent_steps = [
        {
            "step": 1,
            "name": "Collect Evidence",
            "status": "COMPLETED",
            "description": (
                "Collected transaction, customer "
                "history, card history and identity "
                "evidence."
            ),
        },
        {
            "step": 2,
            "name": "Assess Risk",
            "status": "COMPLETED",
            "description": (
                f"Calculated investigation risk "
                f"score {risk_score_100}/100."
            ),
        },
        {
            "step": 3,
            "name": "Generate Next Best Action",
            "status": "COMPLETED",
            "description": decision["reason"],
        },
    ]

    if current_status == "AWAITING_EVIDENCE":
        agent_steps.append(
            {
                "step": 4,
                "name": "Await Evidence",
                "status": "WAITING",
                "description": (
                    "Investigation is waiting for "
                    "requested external evidence."
                ),
            }
        )

    elif current_status == "AWAITING_APPROVAL":
        agent_steps.append(
            {
                "step": 4,
                "name": "Await Analyst Approval",
                "status": "WAITING",
                "description": (
                    "Investigation is waiting for "
                    "analyst approval before "
                    "continuing."
                ),
            }
        )

    elif current_status == "APPROVED":
        agent_steps.append(
            {
                "step": 4,
                "name": "Approval Received",
                "status": "COMPLETED",
                "description": (
                    "Required analyst approval "
                    "has been received."
                ),
            }
        )

    elif current_status == "REJECTED":
        agent_steps.append(
            {
                "step": 4,
                "name": "Approval Rejected",
                "status": "COMPLETED",
                "description": (
                    "The requested analyst approval "
                    "was rejected."
                ),
            }
        )
    return {
        "id": f"INV-{case_id}",
        "caseId": case_id,
        "title": (
            f"Fraud Investigation {case_id}"
        ),
        "triggerEvent": case["trigger_text"],
        "status": current_status,
        "assignedAnalyst": "Unassigned",
        "createdAt": case["opened_at"],
        "updatedAt": updated_at,

        "initialAssessment": initial_assessment,
        "currentAssessment": current_assessment,

        "hasAdditionalEvidenceRequested": (
            has_additional_evidence_requested
        ),

        "additionalEvidenceReceived": (
            additional_evidence_received
        ),

        "transaction": ui_transaction,

        "timeline": timeline,

        "evidence": ui_evidence,

        "evidenceRequests": evidence_requests,

        "graph": {
            "nodes": graph_nodes,
            "edges": graph_edges,
        },

        "agentSteps": agent_steps,

        "nextBestAction": decision,

        "aiAnalysis": ai_analysis,

        "approvalRequest": approval_request,

        "fraudPatternMatched": (
            evidence["historical_patterns"][0]
            if evidence["historical_patterns"]
            else None
        ),

        "rawEvidence": {
            "customer_transactions": (
                evidence["customer_transactions"]
            ),
            "identity": evidence["identity"],
            "customer_history": (
                evidence["customer_history"]
            ),
            "card_history": (
                evidence["card_history"]
            ),
            "historical_patterns": (
                evidence["historical_patterns"]
            ),
            "assessment": assessment,
            "decision": decision,
        },
    }


@router.post("/evidence/{evidence_ref_id}/status")
def update_evidence(
    evidence_ref_id: str,
    request: EvidenceStatusUpdate,
):
    try:
        result = update_evidence_status(
            evidence_ref_id=evidence_ref_id,
            status=request.status,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Evidence request not found",
        )

    return {
        "success": True,
        "message": (
            f"Evidence {evidence_ref_id} status updated "
            f"to {result['status']}."
        ),
        **result,
    }


@router.post("/{case_id}/request-evidence")
def request_additional_evidence(
    case_id: str,
    request: EvidenceRequest,
):

    evidence = investigate_case(case_id)

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Investigation case not found",
        )

    evidence_ref_id = f"EV-{case_id}-05"

    saved_request = save_evidence_request(
        case_id=case_id,
        evidence_ref_id=evidence_ref_id,
        evidence_type=request.type,
        reason=request.reason,
        policy=request.policy,
        required_approval=request.requiredApproval,
        expected_evidence=request.expectedEvidence,
    )

    return {
        "success": True,
        "message": (
            f"Dispatched evidence request for "
            f"{request.type} under Policy: "
            f"{request.policy}. "
            "System awaiting external verification."
        ),
        "evidenceRefId": (
            saved_request["evidenceRefId"]
        ),
        "status": saved_request["status"],
        "caseStatus": saved_request["caseStatus"],
    }


@router.post("/{case_id}/request-approval")
def request_approval(
    case_id: str,
    request: ApprovalRequest,
):

    evidence = investigate_case(case_id)

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Investigation case not found",
        )

    approval_ref_id = f"APR-{case_id}-01"

    saved_request = create_approval_request(
        case_id=case_id,
        approval_ref_id=approval_ref_id,
        action=request.action,
        reason=request.reason,
        policy=request.policy,
    )

    return {
        "success": True,
        "message": (
            f"Approval requested for "
            f"{request.action} under Policy: "
            f"{request.policy}. "
            "System awaiting analyst approval."
        ),
        "approvalRefId": (
            saved_request["approvalRefId"]
        ),
        "status": saved_request["status"],
        "caseStatus": saved_request["caseStatus"],
    }


@router.post(
    "/approvals/{approval_ref_id}/approve"
)
def approve_investigation(
    approval_ref_id: str,
):

    result = approve_request(
        approval_ref_id=approval_ref_id,
        reviewer="Analyst",
        reviewer_comment="Approved by analyst.",
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Approval request not found",
        )

    return {
        "success": True,
        "message": "Approval request approved.",
        **result,
    }


@router.post(
    "/approvals/{approval_ref_id}/reject"
)
def reject_investigation(
    approval_ref_id: str,
):

    result = reject_request(
        approval_ref_id=approval_ref_id,
        reviewer="Analyst",
        reviewer_comment="Rejected by analyst.",
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Approval request not found",
        )

    return {
        "success": True,
        "message": "Approval request rejected.",
        **result,
    }
