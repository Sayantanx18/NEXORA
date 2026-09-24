import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Brain,
    CheckCircle2,
    ArrowLeft,
    ShieldCheck,
    ListChecks,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { investigationAPI } from "../api/endpoints";

export default function Reasoning() {
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const result = await investigationAPI.investigate("HHG-001");
                setData(result);
            } catch (err) {
                setError(err?.message || "Unable to load reasoning.");
            }
        }

        load();
    }, []);

    const ai = data?.aiAnalysis || {};
    const decision = data?.nextBestAction || {};
    const approval = data?.approvalRequest || {};
    const steps = data?.agentSteps || [];

    const actions =
        ai.recommended_next_action ||
        decision.next_best_actions ||
        [];

    return (
        <div style={styles.page}>
            <Navbar />

            <main style={styles.main}>
                <button
                    onClick={() => navigate("/test")}
                    style={styles.back}
                >
                    <ArrowLeft size={17} />
                    New investigation
                </button>

                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div style={styles.eyebrow}>GROUNDED AI REASONING</div>

                    <div style={styles.titleRow}>
                        <div>
                            <h1 style={styles.title}>
                                Explain the <span style={styles.accent}>why.</span>
                            </h1>
                            <p style={styles.subtitle}>
                                NEXORA explains the investigation using evidence
                                returned by the live FraudGraph backend.
                            </p>
                        </div>

                        <div style={styles.liveBadge}>
                            <CheckCircle2 size={16} />
                            LIVE BACKEND DATA
                        </div>
                    </div>
                </motion.section>

                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}

                <section style={styles.grid}>
                    <InfoCard
                        icon={<Brain size={20} />}
                        title="AI summary"
                    >
                        <p style={styles.body}>
                            {ai.summary || "Loading investigation reasoning..."}
                        </p>
                    </InfoCard>

                    <InfoCard
                        icon={<ShieldCheck size={20} />}
                        title="Decision rationale"
                    >
                        <p style={styles.body}>
                            {decision.reason ||
                                "No decision rationale returned yet."}
                        </p>

                        {decision.evidence_requests?.length > 0 && (
                            <div style={styles.subsection}>
                                <div style={styles.label}>EVIDENCE REQUESTS</div>
                                {decision.evidence_requests.map((item, i) => (
                                    <div style={styles.listRow} key={i}>
                                        <CheckCircle2 size={16} />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </InfoCard>
                </section>

                <section style={styles.card}>
                    <div style={styles.cardHeader}>
                        <div>
                            <div style={styles.label}>REASONING TRACE</div>
                            <h2 style={styles.cardTitle}>
                                How the decision was produced
                            </h2>
                        </div>

                        <div style={styles.caseBadge}>
                            {data?.caseId || "HHG-001"}
                        </div>
                    </div>

                    <div style={styles.reasoningList}>
                        {(ai.reasoning || []).map((reason, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -15 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.08 }}
                                style={styles.reasonRow}
                            >
                                <div style={styles.number}>
                                    {String(index + 1).padStart(2, "0")}
                                </div>
                                <div>
                                    <strong>{reason}</strong>
                                    <p>
                                        Evidence-backed reasoning step returned
                                        by the investigation engine.
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section style={styles.grid}>
                    <InfoCard
                        icon={<ListChecks size={20} />}
                        title="Agent workflow"
                    >
                        <div style={styles.workflow}>
                            {steps.map((step) => (
                                <div style={styles.workflowRow} key={step.step}>
                                    <CheckCircle2 size={17} />
                                    <div>
                                        <strong>
                                            Step {step.step}: {step.name}
                                        </strong>
                                        <p>{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </InfoCard>

                    <InfoCard
                        icon={<ShieldCheck size={20} />}
                        title="Recommended action"
                    >
                        <div style={styles.actionBox}>
                            {actions.length > 0
                                ? actions.join(" → ")
                                : "REVIEW"}
                        </div>

                        <p style={styles.body}>
                            Confidence:{" "}
                            <strong>
                                {Math.round((ai.confidence || 0) * 100)}%
                            </strong>
                        </p>

                        {decision.policy_rules?.length > 0 && (
                            <div style={styles.subsection}>
                                <div style={styles.label}>POLICY RULES</div>
                                <div style={styles.rules}>
                                    {decision.policy_rules.map((rule) => (
                                        <span key={rule} style={styles.rule}>
                                            {rule}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </InfoCard>
                </section>

                {approval.approvalRefId && (
                    <section style={styles.approval}>
                        <div>
                            <div style={styles.label}>APPROVAL STATE</div>
                            <h2 style={styles.cardTitle}>
                                {approval.action}
                            </h2>
                            <p style={styles.body}>
                                {approval.reason}
                            </p>
                        </div>

                        <div style={styles.approved}>
                            <CheckCircle2 size={18} />
                            {approval.status || "PENDING"}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

function InfoCard({ icon, title, children }) {
    return (
        <motion.div
            style={styles.card}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
        >
            <div style={styles.cardHeader}>
                <div style={styles.cardHeading}>
                    {icon}
                    <h2 style={styles.cardTitle}>{title}</h2>
                </div>
            </div>

            {children}
        </motion.div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#111827",
    },
    main: {
        maxWidth: "1180px",
        margin: "0 auto",
        padding: "110px 28px 70px",
    },
    back: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        border: "1px solid #dbe3ee",
        background: "#fff",
        color: "#475569",
        borderRadius: "10px",
        padding: "10px 14px",
        cursor: "pointer",
        marginBottom: "42px",
    },
    eyebrow: {
        fontSize: "12px",
        fontWeight: 800,
        letterSpacing: "0.16em",
        color: "#64748b",
        marginBottom: "14px",
    },
    titleRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: "30px",
        alignItems: "flex-start",
    },
    title: {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "clamp(42px, 7vw, 78px)",
        lineHeight: 0.98,
        margin: 0,
        letterSpacing: "-0.05em",
    },
    accent: {
        color: "#2563eb",
    },
    subtitle: {
        maxWidth: "650px",
        color: "#64748b",
        fontSize: "17px",
        lineHeight: 1.7,
        marginTop: "22px",
    },
    liveBadge: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        whiteSpace: "nowrap",
        background: "#ecfdf5",
        color: "#047857",
        border: "1px solid #a7f3d0",
        borderRadius: "999px",
        padding: "9px 13px",
        fontSize: "11px",
        fontWeight: 800,
        letterSpacing: "0.08em",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "18px",
        marginTop: "28px",
    },
    card: {
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "26px",
        boxShadow: "0 12px 35px rgba(15, 23, 42, 0.05)",
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        marginBottom: "22px",
    },
    cardHeading: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "#2563eb",
    },
    cardTitle: {
        margin: 0,
        fontSize: "20px",
        fontFamily: "Space Grotesk, sans-serif",
        color: "#0f172a",
    },
    body: {
        color: "#64748b",
        lineHeight: 1.7,
        margin: 0,
    },
    label: {
        fontSize: "10px",
        fontWeight: 800,
        letterSpacing: "0.13em",
        color: "#94a3b8",
        marginBottom: "9px",
    },
    subsection: {
        marginTop: "22px",
        paddingTop: "18px",
        borderTop: "1px solid #eef2f7",
    },
    listRow: {
        display: "flex",
        gap: "9px",
        alignItems: "flex-start",
        color: "#475569",
        marginTop: "10px",
        lineHeight: 1.5,
    },
    reasoningList: {
        display: "grid",
        gap: "12px",
    },
    reasonRow: {
        display: "flex",
        gap: "15px",
        alignItems: "flex-start",
        padding: "16px",
        background: "#f8fafc",
        borderRadius: "14px",
    },
    number: {
        minWidth: "34px",
        height: "34px",
        borderRadius: "10px",
        display: "grid",
        placeItems: "center",
        background: "#dbeafe",
        color: "#2563eb",
        fontWeight: 800,
        fontSize: "12px",
    },
    reasonRowStrong: {
        fontWeight: 700,
    },
    reasonRowP: {
        margin: "5px 0 0",
    },
    workflow: {
        display: "grid",
        gap: "15px",
    },
    workflowRow: {
        display: "flex",
        gap: "11px",
        color: "#047857",
        alignItems: "flex-start",
    },
    actionBox: {
        background: "#eff6ff",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
        borderRadius: "14px",
        padding: "17px",
        fontWeight: 800,
        letterSpacing: "0.03em",
        marginBottom: "18px",
    },
    rules: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
    },
    rule: {
        background: "#f1f5f9",
        color: "#475569",
        borderRadius: "8px",
        padding: "6px 9px",
        fontSize: "12px",
        fontWeight: 700,
    },
    caseBadge: {
        background: "#f1f5f9",
        color: "#475569",
        padding: "7px 10px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: 800,
    },
    approval: {
        marginTop: "28px",
        background: "#fff",
        border: "1px solid #dbeafe",
        borderRadius: "20px",
        padding: "26px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
    },
    approved: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        color: "#047857",
        background: "#ecfdf5",
        border: "1px solid #a7f3d0",
        padding: "10px 14px",
        borderRadius: "999px",
        fontWeight: 800,
        fontSize: "12px",
    },
    error: {
        marginTop: "25px",
        padding: "14px",
        borderRadius: "12px",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
    },
};
