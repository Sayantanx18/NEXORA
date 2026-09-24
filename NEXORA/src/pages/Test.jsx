import { useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Search,
    Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/app.config";

const demoCases = [
    "HHG-001",
    "HHG-002",
    "HHG-003",
    "HHG-004",
    "HHG-005",
    "HHG-006",
    "HHG-007",
    "HHG-008",
    "HHG-009",
    "HHG-010",
];

export default function Test() {
    const navigate = useNavigate();
    const [caseId, setCaseId] = useState("");

    function startInvestigation() {
        if (!caseId.trim()) return;

        navigate(
            `/investigation?case=${encodeURIComponent(
                caseId.trim()
            )}`
        );
    }

    return (
        <div className="test-page">
            <button
                className="back-button"
                onClick={() => navigate("/")}
            >
                <ArrowLeft size={17} />
                Back
            </button>

            <motion.div
                className="test-card"
                initial={{
                    opacity: 0,
                    y: 35,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{ duration: 0.6 }}
            >
                <div className="test-icon">
                    <Sparkles size={25} />
                </div>

                <div className="eyebrow">
                    NEXORA TEST ENVIRONMENT
                </div>

                <h1>
                    What should we
                    <br />
                    investigate?
                </h1>

                <p>
                    Enter an investigation case ID.
                    NEXORA will gather evidence, reason over
                    the case and produce a next best action.
                </p>

                <div className="input-wrapper">
                    <Search size={19} />

                    <input
                        value={caseId}
                        onChange={(event) =>
                            setCaseId(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                startInvestigation();
                            }
                        }}
                        placeholder="Enter case ID, e.g. HHG-001"
                        autoFocus
                    />
                </div>

                <button
                    className="primary-action"
                    onClick={startInvestigation}
                    disabled={!caseId.trim()}
                >
                    Start investigation
                </button>

                {APP_CONFIG.demoMode && (
                    <div className="demo-area">
                        <span>Try a benchmark case</span>

                        <div className="case-pills">
                            {demoCases.map((id) => (
                                <button
                                    key={id}
                                    onClick={() => setCaseId(id)}
                                >
                                    {id}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}