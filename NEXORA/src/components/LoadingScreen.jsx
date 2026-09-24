import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function LoadingScreen({
    steps = [],
    currentStep = 0,
}) {
    return (
        <div className="loading-screen">
            <motion.div
                className="loading-orb"
                animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.7, 1, 0.7],
                }}
                transition={{
                    duration: 1.8,
                    repeat: Infinity,
                }}
            >
                <Activity size={28} />
            </motion.div>

            <h2>Investigation in progress</h2>

            <p>
                NEXORA is gathering evidence and reasoning
                through the investigation.
            </p>

            <div className="loading-steps">
                {steps.map((step, index) => (
                    <div
                        key={step}
                        className={`loading-step ${index <= currentStep
                                ? "active"
                                : ""
                            }`}
                    >
                        <span>{index + 1}</span>
                        {step}
                    </div>
                ))}
            </div>
        </div>
    );
}