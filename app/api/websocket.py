from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.investigation_service import investigate_case
from app.services.risk_engine import calculate_fraud_assessment
from app.services.decision_engine import decide_next_action
from app.services.openai_service import analyze_fraud_case


router = APIRouter(tags=["WebSocket"])


def now():
    return datetime.now(timezone.utc).isoformat()


def make_event(event: str, investigation_id: str, data: dict):
    return {
        "event": event,
        "investigationId": investigation_id,
        "timestamp": now(),
        "data": data,
    }


@router.websocket("/ws")
async def investigation_websocket(websocket: WebSocket):
    await websocket.accept()

    investigation_id = websocket.query_params.get("investigation_id")

    try:
        # 1. Connection established
        await websocket.send_json(
            make_event(
                "investigation.created",
                investigation_id or "",
                {
                    "status": "connected",
                    "message": "FraudGraph investigation stream connected",
                },
            )
        )

        if investigation_id:
            case_id = investigation_id.removeprefix("INV-")

            # 2. Start agent
            await websocket.send_json(
                make_event(
                    "agent.started",
                    investigation_id,
                    {
                        "caseId": case_id,
                        "message": "FraudGraph investigation agent started.",
                    },
                )
            )

            # 3. Gather evidence
            evidence = investigate_case(case_id)

            if not evidence:
                await websocket.send_json(
                    make_event(
                        "agent.waiting",
                        investigation_id,
                        {
                            "status": "waiting",
                            "message": f"No investigation evidence found for case {case_id}.",
                        },
                    )
                )
            else:
                await websocket.send_json(
                    make_event(
                        "agent.step",
                        investigation_id,
                        {
                            "step": "collect_evidence",
                            "status": "completed",
                            "message": (
                                "Collected transaction, customer history, "
                                "card history and identity evidence."
                            ),
                        },
                    )
                )

                # 4. Calculate the SAME real risk assessment
                assessment = calculate_fraud_assessment(evidence)

                risk_score = float(
                    assessment.get("risk_score") or 0
                )

                risk_score_100 = round(
                    risk_score * 100
                )

                await websocket.send_json(
                    make_event(
                        "risk.updated",
                        investigation_id,
                        {
                            "riskScore": risk_score_100,
                            "confidence": risk_score_100,
                            "riskLevel": (
                                "CRITICAL"
                                if risk_score >= 0.85
                                else "HIGH"
                                if risk_score >= 0.70
                                else "MEDIUM"
                                if risk_score >= 0.40
                                else "LOW"
                            ),
                            "source": "FraudGraph risk engine",
                        },
                    )
                )

                await websocket.send_json(
                    make_event(
                        "agent.step",
                        investigation_id,
                        {
                            "step": "assess_risk",
                            "status": "completed",
                            "message": (
                                f"Risk assessment completed with "
                                f"score {risk_score_100}/100."
                            ),
                        },
                    )
                )

                # 5. Existing decision engine
                decision = decide_next_action(
                    evidence,
                    assessment,
                )

                await websocket.send_json(
                    make_event(
                        "agent.step",
                        investigation_id,
                        {
                            "step": "decision_engine",
                            "status": "completed",
                            "message": decision.get("reason"),
                            "policyRules": decision.get(
                                "policy_rules",
                                [],
                            ),
                        },
                    )
                )

                actions = decision.get(
                    "next_best_actions",
                    [],
                )

                if actions:
                    await websocket.send_json(
                        make_event(
                            "action.recommended",
                            investigation_id,
                            {
                                "action": actions[0],
                                "actions": actions,
                                "approvalRoute": decision.get(
                                    "approval_route"
                                ),
                                "reason": decision.get(
                                    "reason"
                                ),
                            },
                        )
                    )

                # 6. Gemini investigation analysis
                await websocket.send_json(
                    make_event(
                        "agent.step",
                        investigation_id,
                        {
                            "step": "ai_analysis",
                            "status": "started",
                            "message": "AI investigation analysis started.",
                        },
                    )
                )

                try:
                    ai_analysis = analyze_fraud_case(
                        evidence
                    )

                    await websocket.send_json(
                        make_event(
                            "agent.step",
                            investigation_id,
                            {
                                "step": "ai_analysis",
                                "status": "completed",
                                "summary": ai_analysis.get(
                                    "summary"
                                ),
                                "recommendedNextAction": (
                                    ai_analysis.get(
                                        "recommended_next_action"
                                    )
                                ),
                                "confidence": ai_analysis.get(
                                    "confidence"
                                ),
                            },
                        )
                    )

                except Exception as ai_error:
                    # AI failure should not destroy the deterministic
                    # investigation pipeline.
                    await websocket.send_json(
                        make_event(
                            "agent.step",
                            investigation_id,
                            {
                                "step": "ai_analysis",
                                "status": "failed",
                                "message": str(ai_error),
                            },
                        )
                    )

                # 7. Investigation completed
                await websocket.send_json(
                    make_event(
                        "agent.completed",
                        investigation_id,
                        {
                            "caseId": case_id,
                            "status": "completed",
                            "riskScore": risk_score_100,
                            "nextBestActions": actions,
                        },
                    )
                )

        # 8. Keep the WebSocket alive and handle frontend heartbeat.
        while True:
            message = await websocket.receive_json()

            if message.get("event") == "ping":
                await websocket.send_json(
                    make_event(
                        "pong",
                        investigation_id or "",
                        {
                            "status": "alive",
                        },
                    )
                )

    except WebSocketDisconnect:
        pass

    except Exception as exc:
        try:
            await websocket.send_json(
                make_event(
                    "agent.waiting",
                    investigation_id or "",
                    {
                        "status": "error",
                        "message": str(exc),
                    },
                )
            )
        except Exception:
            pass
