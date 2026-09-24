import { motion } from "framer-motion";

const digits = [
  { value: "07", x: "8%", y: "18%", tone: "violet" },
  { value: "31", x: "86%", y: "16%", tone: "cyan" },
  { value: "92", x: "76%", y: "58%", tone: "orange" },
  { value: "04", x: "14%", y: "70%", tone: "pink" },
  { value: "61", x: "91%", y: "76%", tone: "blue" },
];

export default function VisualField({ variant = "network" }) {
  return (
    <div className={`visual-field visual-${variant}`} aria-hidden="true">
      <div className="visual-glow visual-glow-a" />
      <div className="visual-glow visual-glow-b" />
      <div className="visual-network-lines" />

      {digits.map((digit, index) => (
        <motion.div
          key={`${digit.value}-${index}`}
          className={`visual-digit ${digit.tone}`}
          style={{ left: digit.x, top: digit.y }}
          animate={{ y: [0, -10, 0], opacity: [0.18, 0.38, 0.18] }}
          transition={{ duration: 4 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
        >
          {digit.value}
        </motion.div>
      ))}

      <div className="visual-panel visual-panel-main">
        <span>INTELLIGENCE SIGNAL</span>
        <strong>98.4%</strong>
        <small>confidence surface</small>
      </div>
      <div className="visual-panel visual-panel-mini">
        <span>CONNECTED</span>
        <strong>24</strong>
        <small>evidence nodes</small>
      </div>
    </div>
  );
}
