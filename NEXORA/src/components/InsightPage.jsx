import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "./Navbar";
import VisualField from "./VisualField";

export default function InsightPage({ eyebrow, title, accent, description, variant, items, metric, actionLabel, onAction }) {
  return (
    <div className="insight-page">
      <Navbar />
      <main className="insight-main">
        <VisualField variant={variant} />
        <motion.section
          className="insight-hero"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title} <span>{accent}</span></h1>
          <p>{description}</p>
          {actionLabel && (
            <button className="insight-action" onClick={onAction}>
              {actionLabel} <ArrowRight size={17} />
            </button>
          )}
        </motion.section>

        <section className="insight-content">
          <motion.div
            className="insight-metric"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </motion.div>

          <div className="insight-list">
            {items.map((item, index) => (
              <motion.div
                className="insight-row"
                key={item.title}
                initial={{ opacity: 0, x: 25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="insight-index">0{index + 1}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <CheckCircle2 size={18} />
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
