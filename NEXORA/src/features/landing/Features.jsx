import {
    Search,
    Network,
    Brain,
    ShieldCheck,
    Zap,
} from "lucide-react";

import Section from "../../components/Section";
import FeatureCard from "./FeatureCard";

const features = [
    {
        number: "01",
        icon: <Search size={22} />,
        title: "Investigate",
        description:
            "Start from a signal, report or analyst request and turn it into a structured investigation.",
    },
    {
        number: "02",
        icon: <Network size={22} />,
        title: "Connect evidence",
        description:
            "Bring together transactions, identities, devices, history and relationships.",
    },
    {
        number: "03",
        icon: <Brain size={22} />,
        title: "Understand",
        description:
            "Combine deterministic signals, graph intelligence, retrieval and grounded AI reasoning.",
    },
    {
        number: "04",
        icon: <ShieldCheck size={22} />,
        title: "Explain",
        description:
            "Make the evidence, uncertainty and reasoning understandable instead of hiding them.",
    },
    {
        number: "05",
        icon: <Zap size={22} />,
        title: "Act",
        description:
            "Translate investigation findings into a policy-aware next best action.",
    },
];

export default function Features() {
    return (
        <div id="intelligence">
            <Section
                eyebrow="THE INTELLIGENCE LAYER"
                title="From raw signals to meaningful intelligence."
                description="NEXORA separates evidence from assumptions and turns complex investigation workflows into understandable decisions."
            >
                <div className="feature-grid">
                    {features.map((feature) => (
                        <FeatureCard
                            key={feature.number}
                            {...feature}
                        />
                    ))}
                </div>
            </Section>
        </div>
    );
}