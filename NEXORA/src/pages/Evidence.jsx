import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, AlertCircle, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { investigationAPI } from "../api/endpoints";

export default function Evidence() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    investigationAPI
      .investigate("HHG-001")
      .then(setData)
      .catch((err) => setError(err.message || "Unable to load evidence."));
  }, []);

  const evidence = data?.evidence || [];

  return (
    <div className="insight-page">
      <Navbar />

      <main
        className="insight-main"
        style={{ paddingBottom: 100 }}
      >
        <motion.section
          className="insight-hero"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="eyebrow">LIVE EVIDENCE INTELLIGENCE</div>

          <h1>
            Connect every <span>signal.</span>
          </h1>

          <p>
            Evidence below is loaded directly from the FraudGraph AI backend
            for investigation HHG-001.
          </p>

          <button
            className="insight-action"
            onClick={() => navigate("/test")}
          >
            Run another investigation <ArrowRight size={17} />
          </button>
        </motion.section>

        {error && (
          <div style={errorStyle}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {data && (
          <section style={pageWrap}>
            <div style={summaryGrid}>
              <Summary
                label="RISK SCORE"
                value={`${data.initialAssessment?.riskScore ?? "—"}/100`}
              />
              <Summary
                label="EVIDENCE"
                value={evidence.length}
              />
              <Summary
                label="SUFFICIENCY"
                value={data.initialAssessment?.evidenceSufficiency || "—"}
              />
              <Summary
                label="UNCERTAINTY"
                value={data.initialAssessment?.remainingUncertainty || "—"}
              />
            </div>

            <div style={sectionHeader}>
              <Database size={18} />
              <span>BACKEND EVIDENCE SIGNALS</span>
            </div>

            <div style={evidenceGrid}>
              {evidence.map((item, index) => (
                <motion.div
                  key={`${item.type}-${index}`}
                  style={evidenceCard}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div style={cardTop}>
                    <span style={numberBadge}>
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span style={typeLabel}>
                      {item.type.replaceAll("_", " ")}
                    </span>

                    <CheckCircle2 size={17} style={{ marginLeft: "auto" }} />
                  </div>

                  <div style={valueBox}>
                    {typeof item.value === "object"
                      ? Object.entries(item.value).map(([key, value]) => (
                          <div key={key} style={valueRow}>
                            <span>{key.replaceAll("_", " ")}</span>
                            <strong>
                              {Array.isArray(value)
                                ? value.join(", ")
                                : String(value)}
                            </strong>
                          </div>
                        ))
                      : String(item.value)}
                  </div>

                  <p style={interpretation}>
                    {item.interpretation}
                  </p>
                </motion.div>
              ))}
            </div>

            <div style={sectionHeader}>
              <span>INVESTIGATION TIMELINE</span>
            </div>

            <div style={timeline}>
              {(data.timeline || []).map((item) => (
                <div key={item.id} style={timelineRow}>
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>{item.stage}</strong>
                    <p>{item.explanation}</p>
                  </div>
                  <small>{item.status}</small>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div style={summaryCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const pageWrap = {
  width: "min(1180px, 90vw)",
  margin: "0 auto",
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  marginBottom: 55,
};

const summaryCard = {
  padding: "22px",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "rgba(255,255,255,.78)",
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  marginBottom: 18,
  marginTop: 25,
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: ".14em",
};

const evidenceGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 16,
};

const evidenceCard = {
  padding: 22,
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#fff",
  boxShadow: "0 12px 30px rgba(15,23,42,.05)",
};

const cardTop = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 18,
};

const numberBadge = {
  width: 32,
  height: 32,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: "#111827",
  color: "#fff",
  fontSize: 11,
  fontWeight: 800,
};

const typeLabel = {
  textTransform: "uppercase",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: ".08em",
  color: "#475569",
};

const valueBox = {
  padding: 14,
  borderRadius: 12,
  background: "#f8fafc",
  marginBottom: 14,
  fontSize: 14,
};

const valueRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "5px 0",
  borderBottom: "1px solid #e2e8f0",
};

const interpretation = {
  color: "#64748b",
  lineHeight: 1.6,
  fontSize: 13,
};

const timeline = {
  display: "grid",
  gap: 12,
  marginBottom: 40,
};

const timelineRow = {
  display: "grid",
  gridTemplateColumns: "24px 1fr auto",
  gap: 12,
  alignItems: "start",
  padding: 18,
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#fff",
};

const errorStyle = {
  width: "min(1180px, 90vw)",
  margin: "0 auto 30px",
  padding: 16,
  borderRadius: 14,
  background: "#fff1f2",
  color: "#be123c",
  display: "flex",
  gap: 10,
  alignItems: "center",
};
