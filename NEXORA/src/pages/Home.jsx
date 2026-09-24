import Navbar from "../components/Navbar";
import Hero from "../features/landing/Hero";
import Features from "../features/landing/Features";
import Section from "../components/Section";
import Button from "../components/Button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
    const navigate = useNavigate();

    return (
        <>
            <Navbar />

            <main>
                <Hero />

                <Features />

                <Section
                    eyebrow="THE NEXORA APPROACH"
                    title="Evidence first. Intelligence second. Action with control."
                    description="The interface is designed to make AI-assisted decisions inspectable, explainable and reusable across different domains."
                >
                    <motion.div
                        className="approach-panel"
                        initial={{
                            opacity: 0,
                            scale: 0.97,
                        }}
                        whileInView={{
                            opacity: 1,
                            scale: 1,
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="approach-flow">
                            <span>INPUT</span>
                            <ArrowRight />
                            <span>EVIDENCE</span>
                            <ArrowRight />
                            <span>REASONING</span>
                            <ArrowRight />
                            <span>ACTION</span>
                        </div>

                        <p>
                            One interface. Multiple intelligence
                            applications.
                        </p>
                    </motion.div>
                </Section>

                <section className="cta-section">
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 30,
                        }}
                        whileInView={{
                            opacity: 1,
                            y: 0,
                        }}
                        viewport={{ once: true }}
                    >
                        <div className="eyebrow">
                            READY WHEN YOU ARE
                        </div>

                        <h2>
                            See what NEXORA
                            <br />
                            can investigate.
                        </h2>

                        <Button
                            onClick={() => navigate("/test")}
                        >
                            TEST NEXORA
                        </Button>
                    </motion.div>
                </section>
            </main>

            <footer className="footer">
                <strong>NEXORA</strong>
                <span>AI Intelligence Interface</span>
                <span>v1.0</span>
            </footer>
        </>
    );
}