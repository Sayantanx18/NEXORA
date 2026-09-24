import { motion } from "framer-motion";

export default function Section({
    eyebrow,
    title,
    description,
    children,
}) {
    return (
        <section className="nx-section">
            <motion.div
                className="section-heading"
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.7 }}
            >
                {eyebrow && (
                    <div className="eyebrow">{eyebrow}</div>
                )}

                <h2>{title}</h2>

                {description && (
                    <p>{description}</p>
                )}
            </motion.div>

            {children}
        </section>
    );
}