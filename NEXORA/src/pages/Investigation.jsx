import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    ShieldAlert,
    Send,
    FileCheck,
    RefreshCw,
    XCircle,
} from "lucide-react";

import LoadingScreen from "../components/LoadingScreen";
import { investigationAPI } from "../api/endpoints";

const steps = [
    "Loading investigation",
    "Gathering transaction evidence",
    "Checking customer history",
    "Checking identity and device signals",
    "Searching related cases",
    "Analyzing graph relationships",
    "Reasoning over evidence",
    "Determining next best action",
];

export default function Investigation() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const caseId = params.get("case") || "HHG-001";

    const [currentStep, setCurrentStep] = useState(0);
    const [finished, setFinished] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    async function loadInvestigation() {
        try {
            setError("");
            const result = await investigationAPI.investigate(caseId);
            setData(result);
        } catch (err) {
            setError(
                err?.message ||
                "Unable to load investigation from backend."
            );
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function initialLoad() {
            try {
                const result = await investigationAPI.investigate(caseId);

                if (!cancelled) {
                    setData(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err?.message ||
                        "Unable to load investigation from backend."
                    );
                }
            }
        }

        initialLoad();

        const timer = setInterval(() => {
            setCurrentStep((current) => {
                if (current >= steps.length - 1) {
                    clearInterval(timer);

                    setTimeout(() => {
                        if (!cancelled) {
                            setFinished(true);
                        }
                    }, 600);

                    return current;
                }

                return current + 1;
            });
        }, 650);

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [caseId]);

    async function runAction(action) {
        setActionLoading(true);
        setActionMessage("");
        setActionError("");

        try {
            let result;

            if (action === "evidence") {
                result = await investigationAPI.requestEvidence(caseId, {
                    type: "Request step-up authentication",
                    reason: "Verify customer identity before further action.",
                    policy: "POL-ATO-SESSION-HIJACK",
                    requiredApproval: false,
                    expectedEvidence: "Successful step-up authentication.",
                });
                setActionMessage(
                    "Evidence request submitted successfully."
                );
            }

            if (action === "approval") {
                result = await investigationAPI.requestApproval(caseId, {
                    action: "FILE_REPORT",
                    reason: "High-risk transaction requires analyst approval before filing.",
                    policy: "POL-HIGH-RISK-REPORT",
                });
                setActionMessage(
                    "Approval request submitted successfully."
                );
            }

            if (action === "approve") {
                const approvalRefId =
                    data?.approvalRequest?.approvalRefId;

                if (!approvalRefId) {
                    throw new Error(
                        "No approval request reference was returned."
                    );
                }

                result = await investigationAPI.approve(
                    approvalRefId
                );

                setActionMessage(
                    "Approval completed successfully."
                );
            }

            if (action === "reject") {
                const approvalRefId =
                    data?.approvalRequest?.approvalRefId;

                if (!approvalRefId) {
                    throw new Error(
                        "No approval request reference was returned."
                    );
                }

                result = await investigationAPI.reject(
                    approvalRefId
                );

                setActionMessage(
                    "Approval rejected successfully."
                );
            }

            await loadInvestigation();

            return result;
        } catch (err) {
            setActionError(
                err?.message ||
                "The backend action could not be completed."
            );
        } finally {
            setActionLoading(false);
        }
    }

    if (!finished) {
        return (
            <div className="investigation-page">
                <button
                    className="back-button"
                    onClick={() => navigate("/test")}
                >
                    <ArrowLeft size={17} />
                    Cancel
                </button>

                <LoadingScreen
                    steps={steps}
                    currentStep={currentStep}
                />

                {error && (
                    <p
                        style={{
                            color: "#ff6b6b",
                            textAlign: "center",
                        }}
                    >
                        {error}
                    </p>
                )}
            </div>
        );
    }

    const assessment = data?.initialAssessment || {};
    const decision = data?.decision || {};
    const approval = data?.approvalRequest || {};

    const riskLevel =
        assessment.riskLevel ||
        data?.riskLevel ||
        "UNKNOWN";

    const riskScore =
        assessment.riskScore ??
        data?.riskScore ??
        "—";

    const nextAction =
        decision.next_best_actions?.[0] ||
        decision.nextBestAction ||
        data?.nextBestAction?.next_best_actions?.[0] ||
        "REVIEW";

    const investigationState =
        data?.status ||
        assessment.evidenceSufficiency ||
        "REVIEW";

    const approvalStatus =
        approval.status || "NOT REQUESTED";

    const canReviewApproval =
        approval.approvalRefId &&
        !["APPROVED", "REJECTED"].includes(
            String(approvalStatus).toUpperCase()
        );

    return (
        <div className="result-page">
            <header className="result-header">
                <button
                    className="back-button"
                    onClick={() => navigate("/test")}
                >
                    <ArrowLeft size={17} />
                    New investigation
                </button>

                <div className="result-brand">
                    NEXORA
                </div>
            </header>

            <main className="result-content">
                <motion.div
                    initial={{
                        opacity: 0,
                        y: 30,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                >
                    <div className="eyebrow">
                        INVESTIGATION COMPLETE
                    </div>

                    <div className="result-title-row">
                        <div>
                            <h1>{caseId}</h1>
                            <p>
                                Live result from FraudGraph AI backend
                            </p>
                        </div>

                        <div className="status-badge">
                            <CheckCircle2 size={17} />
                            Backend connected
                        </div>
                    </div>
                </motion.div>

                <div className="result-grid">
                    <ResultCard
                        title="Risk assessment"
                        icon={<ShieldAlert size={20} />}
                    >
                        <div className="risk-value">
                            {riskLevel}
                        </div>

                        <p>
                            Risk score:{" "}
                            <strong>{riskScore}</strong>
                        </p>
                    </ResultCard>

                    <ResultCard title="Investigation state">
                        <div className="state-value">
                            {investigationState}
                        </div>

                        <p>
                            Evidence and investigation state
                            returned by the backend.
                        </p>
                    </ResultCard>

                    <ResultCard title="Next best action">
                        <div className="action-value">
                            {nextAction}
                        </div>

                        <p>
                            Recommended action generated from
                            the investigation decision engine.
                        </p>
                    </ResultCard>
                </div>

                <motion.div
                    className="timeline-card"
                    initial={{
                        opacity: 0,
                        y: 20,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        delay: 0.15,
                    }}
                >
                    <div className="card-label">
                        INVESTIGATION TRACE
                    </div>

                    {steps.map((step, index) => (
                        <div
                            className="trace-row"
                            key={step}
                        >
                            {index <= currentStep ? (
                                <CheckCircle2 size={18} />
                            ) : (
                                <Circle size={18} />
                            )}

                            <span>{step}</span>
                        </div>
                    ))}
                </motion.div>

                <motion.div
                    className="timeline-card"
                    initial={{
                        opacity: 0,
                        y: 20,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        delay: 0.25,
                    }}
                    style={{
                        marginTop: "24px",
                    }}
                >
                    <div className="card-label">
                        ANALYST ACTIONS
                    </div>

                    <p
                        style={{
                            color: "#9ca3af",
                            marginBottom: "18px",
                        }}
                    >
                        Execute investigation workflow actions
                        directly against the live backend.
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(210px, 1fr))",
                            gap: "12px",
                        }}
                    >
                        <ActionButton
                            icon={<Send size={17} />}
                            label="Request Evidence"
                            onClick={() =>
                                runAction("evidence")
                            }
                            disabled={actionLoading}
                        />

                        <ActionButton
                            icon={<FileCheck size={17} />}
                            label="Request Approval"
                            onClick={() =>
                                runAction("approval")
                            }
                            disabled={actionLoading}
                        />

                        {canReviewApproval && (
                            <>
                                <ActionButton
                                    icon={
                                        <CheckCircle2 size={17} />
                                    }
                                    label="Approve"
                                    onClick={() =>
                                        runAction("approve")
                                    }
                                    disabled={actionLoading}
                                />

                                <ActionButton
                                    icon={
                                        <XCircle size={17} />
                                    }
                                    label="Reject"
                                    onClick={() =>
                                        runAction("reject")
                                    }
                                    disabled={actionLoading}
                                />
                            </>
                        )}

                        <ActionButton
                            icon={<RefreshCw size={17} />}
                            label={
                                actionLoading
                                    ? "Working..."
                                    : "Refresh Investigation"
                            }
                            onClick={loadInvestigation}
                            disabled={actionLoading}
                        />
                    </div>

                    {approval.approvalRefId && (
                        <div
                            style={{
                                marginTop: "18px",
                                padding: "14px",
                                borderRadius: "12px",
                                background:
                                    "rgba(255,255,255,0.04)",
                                border:
                                    "1px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            <strong>
                                Approval status:
                            </strong>{" "}
                            {approvalStatus}

                            <br />

                            <span
                                style={{
                                    color: "#9ca3af",
                                    fontSize: "13px",
                                }}
                            >
                                Reference:{" "}
                                {approval.approvalRefId}
                            </span>
                        </div>
                    )}

                    {actionMessage && (
                        <div
                            style={{
                                marginTop: "14px",
                                color: "#6ee7b7",
                            }}
                        >
                            ✓ {actionMessage}
                        </div>
                    )}

                    {actionError && (
                        <div
                            style={{
                                marginTop: "14px",
                                color: "#ff6b6b",
                            }}
                        >
                            ✕ {actionError}
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

function ResultCard({
    title,
    icon,
    children,
}) {
    return (
        <motion.div
            className="result-card"
            whileHover={{ y: -4 }}
        >
            <div className="result-card-title">
                {icon}
                {title}
            </div>

            {children}
        </motion.div>
    );
}

function ActionButton({
    icon,
    label,
    onClick,
    disabled,
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "9px",
                padding: "13px 16px",
                borderRadius: "12px",
                border:
                    "1px solid rgba(255,255,255,0.12)",
                background:
                    "rgba(255,255,255,0.05)",
                color: "#fff",
                cursor: disabled
                    ? "not-allowed"
                    : "pointer",
                opacity: disabled ? 0.55 : 1,
                fontWeight: 600,
                transition: "0.2s ease",
            }}
        >
            {icon}
            {label}
        </button>
    );
}
