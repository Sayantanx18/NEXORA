import { motion } from "framer-motion";

export default function FeatureCard({
    number,
    icon,
    title,
    description,
}) {
    return (
        <motion.div
            className="feature-card"
            initial={{
                opacity: 0,
                y: 45,
            }}
            whileInView={{
                opacity: 1,
                y: 0,
            }}
            viewport={{
                once: true,
                amount: 0.2,
            }}
            whileHover={{
                y: -8,
            }}
            transition={{
                duration: 0.55,
            }}
        >
            <div className="feature-top">
                <span>{number}</span>
                <div className="feature-icon">
                    {icon}
                </div>
            </div>

            <h3>{title}</h3>

            <p>{description}</p>
        </motion.div>
    );
}