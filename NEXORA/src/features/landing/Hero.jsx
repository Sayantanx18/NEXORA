import { motion } from "framer-motion";
import {
    ArrowDown,
    Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import VisualField from "../../components/VisualField";

export default function Hero() {
    const navigate = useNavigate();

    return (
        <section className="hero">
            <div className="hero-grid" />
            <VisualField variant="hero" />

            <motion.div
                className="hero-content"
                initial={{ opacity: 0, y: 45 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9 }}
            >
                <div className="hero-pill">
                    <Sparkles size={15} />
                    Intelligence, connected.
                </div>

                <h1>
                    Turn complex evidence
                    <br />
                    into <span>clear decisions.</span>
                </h1>

                <p>
                    NEXORA is a reusable AI intelligence
                    interface designed to investigate,
                    understand and explain complex problems.
                </p>

                <div className="hero-actions">
                    <Button onClick={() => navigate("/test")}>
                        TEST NEXORA
                    </Button>

                    <button
                        className="scroll-button"
                        onClick={() =>
                            document
                                .getElementById("intelligence")
                                ?.scrollIntoView()
                        }
                    >
                        Explore
                        <ArrowDown size={17} />
                    </button>
                </div>
            </motion.div>

            <motion.div
                className="hero-status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    delay: 1,
                    duration: 0.7,
                }}
            >
                <span className="status-dot" />
                Intelligence engine ready
            </motion.div>
        </section>
    );
}