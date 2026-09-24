import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Network,
  AlertTriangle,
  Brain,
  Clock3,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { investigationAPI } from "../api/endpoints";

export default function Risk() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    investigationAPI
      .investigate("HHG-001")
      .then(setData)
      .catch((err) =>
        setError(err.message || "Unable to load risk intelligence.")
      );
  }, []);

  const assessment = data?.currentAssessment || {};
  const graph = data?.graph || { nodes: [], edges: [] };
  const ai = data?.aiAnalysis || {};
  const nextAction = data?.nextBestAction || {};

  return (
    <div className="insight-page">
      <Navbar />

      <main className="insight-main" style={{ paddingBottom: 100 }}>
        <motion.section
          className="insight-hero"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="eyebrow">LIVE RISK INTELLIGENCE</div>

          <h1>
            See beyond the <span>score.</span>
          </h1>

          <p>
            Risk intelligence combines the backend assessment with connected
            transaction and customer relationships.
          </p>

          <button
            className="insight-action"
            onClick={() => navigate("/test")}
          >
            Test another case <ArrowRight size={17} />
          </button>
        </motion.section>

        {error && <div style={errorStyle}>{error}</div>}

        {data && (
          <section style={wrap}>
            {/* EXISTING RISK SUMMARY */}
            <div style={riskGrid}>
              <div style={riskCard}>
                <span style={riskCardLabel}>RISK LEVEL</span>
                <strong style={riskCardValue}>
                  {assessment.riskLevel || "—"}
                </strong>
                <small style={riskCardDescription}>
                  Backend assessment
                </small>
              </div>

              <div style={riskCard}>
                <span style={riskCardLabel}>RISK SCORE</span>
                <strong style={riskCardValue}>
                  {assessment.riskScore ?? "—"}/100
                </strong>
                <small style={riskCardDescription}>
                  Confidence: {assessment.confidence ?? "—"}%
                </small>
              </div>

              <div style={riskCard}>
                <span style={riskCardLabel}>UNCERTAINTY</span>
                <strong style={riskCardValue}>
                  {assessment.remainingUncertainty || "—"}
                </strong>
                <small style={riskCardDescription}>
                  {assessment.whyUncertaintyRemains}
                </small>
              </div>

              <div style={riskCard}>
                <span style={riskCardLabel}>FRAUD PATTERN</span>
                <strong style={{ ...riskCardValue, fontSize: 20 }}>
                  {data.fraudPatternMatched?.replaceAll("_", " ") || "None"}
                </strong>
                <small style={riskCardDescription}>
                  Documented historical pattern
                </small>
              </div>
            </div>

            {/* EXISTING GRAPH */}
            <div style={sectionTitle}>
              <Network size={18} />
              LIVE INVESTIGATION GRAPH
            </div>

            <div style={graphCard}>
              <div style={graphArea}>
                <GraphNodes nodes={graph.nodes} edges={graph.edges} />
              </div>

              <div style={graphLegend}>
                <span>
                  <i style={{ background: "#111827" }} />
                  Case
                </span>
                <span>
                  <i style={{ background: "#2563eb" }} />
                  Transaction
                </span>
                <span>
                  <i style={{ background: "#16a34a" }} />
                  Customer
                </span>
              </div>
            </div>

            {/* NEW: AI EXPLAINABILITY */}
            <div style={sectionTitle}>
              <Brain size={18} />
              AI EXPLAINABILITY
            </div>

            <div style={featureCard}>
              <div style={featureMain}>
                <div style={featureHeadingRow}>
                  <div>
                    <span style={miniLabel}>AI ASSESSMENT</span>
                    <strong style={aiRiskValue}>
                      {ai.risk_assessment || "—"}
                    </strong>
                  </div>

                  <div style={confidenceBadge}>
                    {ai.confidence != null
                      ? `${Math.round(ai.confidence * 100)}% confidence`
                      : "Confidence unavailable"}
                  </div>
                </div>

                {ai.summary && <p style={featureText}>{ai.summary}</p>}

                {ai.historical_pattern_analysis && (
                  <div style={analysisBox}>
                    <span style={miniLabel}>HISTORICAL PATTERN ANALYSIS</span>
                    <p>{ai.historical_pattern_analysis}</p>
                  </div>
                )}
              </div>

              <div style={signalList}>
                <span style={miniLabel}>SUSPICIOUS INDICATORS</span>

                {(ai.suspicious_indicators || []).length > 0 ? (
                  ai.suspicious_indicators.map((indicator) => (
                    <div key={indicator} style={signalItem}>
                      <CheckCircle2 size={17} />
                      <span>{indicator}</span>
                    </div>
                  ))
                ) : (
                  <div style={emptyFeature}>No suspicious indicators returned.</div>
                )}
              </div>
            </div>

            {/* NEW: INVESTIGATION TIMELINE */}
            <div style={sectionTitle}>
              <Clock3 size={18} />
              INVESTIGATION TIMELINE
            </div>

            <div style={timelineCard}>
              <TimelineItem
                title="Transaction detected"
                description="Flagged transaction entered the investigation workflow."
                status="completed"
              />

              <TimelineItem
                title="Risk engine evaluated transaction"
                description={`${assessment.riskLevel || "Risk"} risk · ${
                  assessment.riskScore ?? "—"
                }/100`}
                status="completed"
              />

              <TimelineItem
                title="Evidence collected"
                description="Transaction, customer, historical and graph evidence were analyzed."
                status="completed"
              />

              <TimelineItem
                title="Gemini AI investigation"
                description={
                  ai.risk_assessment
                    ? `${ai.risk_assessment} assessment · ${
                        ai.confidence != null
                          ? `${Math.round(ai.confidence * 100)}% confidence`
                          : "confidence unavailable"
                      }`
                    : "AI analysis completed."
                }
                status="completed"
              />

              <TimelineItem
                title="Next-best-action generated"
                description={
                  nextAction.reason ||
                  "Decision engine generated the recommended investigation action."
                }
                status="completed"
              />

              <TimelineItem
                title="Approval status"
                description={
                  data.approvalRequest?.status
                    ? `Approval request: ${data.approvalRequest.status}`
                    : "Approval information unavailable."
                }
                status={
                  data.approvalRequest?.status === "APPROVED"
                    ? "completed"
                    : "current"
                }
                last
              />
            </div>

            {/* NEW: NEXT BEST ACTION */}
            <div style={sectionTitle}>
              <Target size={18} />
              NEXT BEST ACTION
            </div>

            <div style={actionCard}>
              <div style={actionContent}>
                <span style={miniLabel}>RECOMMENDED INVESTIGATION STEP</span>

                <h3>
                  {formatActions(nextAction.next_best_actions)}
                </h3>

                <p>
                  {nextAction.reason ||
                    ai.recommended_next_action ||
                    "Review the available evidence before taking further action."}
                </p>

                {nextAction.evidence_requests?.length > 0 && (
                  <div style={analysisBox}>
                    <span style={miniLabel}>EVIDENCE REQUEST</span>

                    {nextAction.evidence_requests.map((request) => (
                      <p key={request} style={{ marginBottom: 0 }}>
                        {request}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div style={actionMeta}>
                <span style={miniLabel}>APPROVAL ROUTE</span>
                <strong>
                  {nextAction.approval_route || "—"}
                </strong>

                {nextAction.policy_rules?.length > 0 && (
                  <>
                    <span style={{ ...miniLabel, marginTop: 18 }}>
                      POLICY RULES
                    </span>
                    <strong>
                      {nextAction.policy_rules.join(", ")}
                    </strong>
                  </>
                )}
              </div>
            </div>

            {/* EXISTING RISK INTERPRETATION */}
            <div style={sectionTitle}>
              <AlertTriangle size={18} />
              RISK INTERPRETATION
            </div>

            <div style={interpretationCard}>
              <div>
                <strong>{ai.summary}</strong>
                <p>{nextAction.reason}</p>
              </div>

              <div style={signalList}>
                {(ai.reasoning || []).map((reason) => (
                  <div key={reason}>
                    <CheckCircle2 size={17} />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function formatActions(actions) {
  if (!actions || actions.length === 0) {
    return "Review available evidence";
  }

  return actions
    .map((action) => String(action).replaceAll("_", " "))
    .map((action) => action.replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .join(" · ");
}

function TimelineItem({ title, description, status, last = false }) {
  return (
    <div style={timelineItem}>
      <div style={timelineRail}>
        <div
          style={{
            ...timelineDot,
            background:
              status === "completed"
                ? "#16a34a"
                : status === "current"
                ? "#2563eb"
                : "#cbd5e1",
          }}
        >
          {status === "completed" && (
            <CheckCircle2 size={13} color="#fff" />
          )}
        </div>

        {!last && <div style={timelineLine} />}
      </div>

      <div style={timelineContent}>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

function GraphNodes({ nodes, edges }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);

  if (!nodes.length) {
    return (
      <div style={{ color: "#64748b", padding: 30 }}>
        No graph relationships returned.
      </div>
    );
  }

  const positions = nodes.map((node, index) => {
    const type = String(node.type || "").toLowerCase();

    if (type === "case") {
      return { x: 500, y: 95 };
    }

    if (type === "transaction") {
      return { x: 500, y: 270 };
    }

    if (type === "customer") {
      return { x: 500, y: 445 };
    }

    const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2;

    return {
      x: 500 + Math.cos(angle) * 300,
      y: 270 + Math.sin(angle) * 180,
    };
  });

  const nodeColors = {
    case: "#111827",
    transaction: "#2563eb",
    customer: "#16a34a",
  };

  const getPosition = (id) => {
    const index = nodes.findIndex((node) => node.id === id);
    return positions[index] || { x: 500, y: 270 };
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={graphControls}>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
          style={zoomButton}
        >
          +
        </button>

        <span style={zoomValue}>{Math.round(zoom * 100)}%</span>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.65))}
          style={zoomButton}
        >
          −
        </button>

        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setSelectedNode(null);
          }}
          style={resetButton}
        >
          Reset
        </button>
      </div>

      <svg
        viewBox="0 0 1000 520"
        preserveAspectRatio="xMidYMid meet"
        style={svgStyle}
      >
        <defs>
          <marker
            id="fraudgraph-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
          </marker>
        </defs>

        <g
          style={{
            transform: `translate(500px 260px) scale(${zoom}) translate(-500px -260px)`,
            transformOrigin: "500px 260px",
            transition: "transform .2s ease",
          }}
        >
          {edges.map((edge, index) => {
            const source = getPosition(edge.source);
            const target = getPosition(edge.target);

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;

            const startOffset = 48;
            const endOffset = 62;

            const sx = source.x + (dx / distance) * startOffset;
            const sy = source.y + (dy / distance) * startOffset;
            const tx = target.x - (dx / distance) * endOffset;
            const ty = target.y - (dy / distance) * endOffset;

            const midX = (sx + tx) / 2;
            const midY = (sy + ty) / 2;

            return (
              <g key={`${edge.source}-${edge.target}-${index}`}>
                <line
                  x1={sx}
                  y1={sy}
                  x2={tx}
                  y2={ty}
                  stroke="#94a3b8"
                  strokeWidth="3"
                  markerEnd="url(#fraudgraph-arrow)"
                />

                <rect
                  x={midX - 75}
                  y={midY - 13}
                  width="150"
                  height="26"
                  rx="13"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                />

                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="11"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="700"
                >
                  {String(edge.relationship || "RELATED").replaceAll(
                    "_",
                    " "
                  )}
                </text>
              </g>
            );
          })}

          {nodes.map((node, index) => {
            const position = positions[index];
            const type = String(node.type || "").toLowerCase();
            const color = nodeColors[type] || "#64748b";
            const selected = selectedNode?.id === node.id;

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: "pointer" }}
              >
                {selected && (
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r="72"
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeDasharray="8 7"
                  />
                )}

                <circle
                  cx={position.x}
                  cy={position.y}
                  r="52"
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="5"
                  style={{
                    filter:
                      "drop-shadow(0 12px 16px rgba(15,23,42,.18))",
                  }}
                />

                <text
                  x={position.x}
                  y={position.y - 5}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="800"
                >
                  {type.toUpperCase()}
                </text>

                <text
                  x={position.x}
                  y={position.y + 14}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {String(node.label || node.id).slice(0, 20)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {selectedNode && (
        <div style={nodeDetails}>
          <div style={detailsHeader}>
            <div>
              <span style={detailsType}>
                {String(selectedNode.type || "node").toUpperCase()}
              </span>

              <strong>{selectedNode.label || selectedNode.id}</strong>
            </div>

            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              style={closeButton}
              aria-label="Close node details"
            >
              ×
            </button>
          </div>

          <div style={detailsRow}>
            <span>Node ID</span>
            <strong>{selectedNode.id}</strong>
          </div>

          <div style={detailsRow}>
            <span>Connected relationships</span>
            <strong>
              {
                edges.filter(
                  (edge) =>
                    edge.source === selectedNode.id ||
                    edge.target === selectedNode.id
                ).length
              }
            </strong>
          </div>

          <small style={{ color: "#64748b" }}>
            Data returned from the investigation graph.
          </small>
        </div>
      )}

      <div style={graphHint}>
        Click any node to inspect it • Use + / − to zoom
      </div>
    </div>
  );
}

const graphControls = {
  position: "absolute",
  top: 18,
  right: 18,
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: 8,
  borderRadius: 14,
  background: "rgba(255,255,255,.94)",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 25px rgba(15,23,42,.08)",
};

const zoomButton = {
  width: 34,
  height: 34,
  border: "1px solid #e2e8f0",
  borderRadius: 9,
  background: "#fff",
  color: "#0f172a",
  fontSize: 20,
  fontWeight: 700,
  cursor: "pointer",
};

const resetButton = {
  height: 34,
  padding: "0 10px",
  border: "1px solid #e2e8f0",
  borderRadius: 9,
  background: "#fff",
  color: "#475569",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const zoomValue = {
  minWidth: 45,
  textAlign: "center",
  color: "#64748b",
  fontSize: 12,
  fontWeight: 700,
};

const nodeDetails = {
  position: "absolute",
  left: 20,
  bottom: 20,
  width: "min(330px, calc(100% - 40px))",
  padding: 18,
  borderRadius: 16,
  background: "rgba(255,255,255,.97)",
  border: "1px solid #e2e8f0",
  boxShadow: "0 18px 40px rgba(15,23,42,.12)",
  zIndex: 10,
};

const detailsHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 15,
};

const detailsType = {
  display: "block",
  color: "#64748b",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: ".12em",
  marginBottom: 5,
};

const closeButton = {
  border: 0,
  background: "#f1f5f9",
  width: 30,
  height: 30,
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 20,
  color: "#475569",
};

const detailsRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 15,
  padding: "9px 0",
  borderTop: "1px solid #f1f5f9",
  fontSize: 12,
};

const graphHint = {
  position: "absolute",
  right: 20,
  bottom: 20,
  color: "#94a3b8",
  fontSize: 11,
  zIndex: 5,
};

const wrap = {
  width: "min(1180px, 90vw)",
  margin: "0 auto",
};

const riskGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 14,
  marginBottom: 55,
};

const riskCard = {
  minHeight: 118,
  padding: "20px 22px",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#fff",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 7,
  boxSizing: "border-box",
};

const riskCardLabel = {
  display: "block",
  fontFamily: '"Inter", system-ui, sans-serif',
  color: "#64748b",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: ".12em",
  lineHeight: 1.3,
};

const riskCardValue = {
  display: "block",
  fontFamily: '"Space Grotesk", sans-serif',
  color: "#0f172a",
  fontSize: 24,
  fontWeight: 700,
  lineHeight: 1.15,
};

const riskCardDescription = {
  display: "block",
  fontFamily: '"Inter", system-ui, sans-serif',
  color: "#64748b",
  fontSize: 11,
  lineHeight: 1.45,
};

const sectionTitle = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: ".14em",
  marginBottom: 18,
  marginTop: 26,
};

const graphCard = {
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  background: "#fff",
  overflow: "hidden",
};

const graphArea = {
  position: "relative",
  height: 500,
  background:
    "radial-gradient(circle at center, #ffffff 0%, #f8fafc 72%)",
};

const svgStyle = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

const graphLegend = {
  display: "flex",
  gap: 20,
  padding: 16,
  borderTop: "1px solid #e2e8f0",
  fontSize: 12,
  color: "#64748b",
};

const interpretationCard = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 25,
  padding: 25,
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#fff",
};

/* NEW FEATURE STYLES */

const featureCard = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 25,
  padding: 25,
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#fff",
};

const featureMain = {
  minWidth: 0,
};

const featureHeadingRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 15,
  marginBottom: 18,
};

const miniLabel = {
  display: "block",
  color: "#64748b",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: ".12em",
  marginBottom: 7,
};

const aiRiskValue = {
  display: "block",
  color: "#0f172a",
  fontFamily: '"Space Grotesk", sans-serif',
  fontSize: 28,
  fontWeight: 700,
  textTransform: "uppercase",
};

const confidenceBadge = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "#eff6ff",
  color: "#2563eb",
  fontSize: 11,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const featureText = {
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.7,
  margin: "0 0 18px",
};

const analysisBox = {
  padding: 14,
  borderRadius: 13,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const analysisBoxText = {
  color: "#475569",
  fontSize: 12,
  lineHeight: 1.6,
};

const signalItem = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  color: "#475569",
  fontSize: 12,
  lineHeight: 1.55,
};

const emptyFeature = {
  color: "#94a3b8",
  fontSize: 12,
};

const timelineCard = {
  padding: "24px 28px",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#fff",
};

const timelineItem = {
  display: "flex",
  gap: 16,
  minHeight: 68,
};

const timelineRail = {
  position: "relative",
  width: 18,
  display: "flex",
  justifyContent: "center",
  flexShrink: 0,
};

const timelineDot = {
  width: 18,
  height: 18,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  zIndex: 2,
};

const timelineLine = {
  position: "absolute",
  top: 18,
  bottom: -2,
  width: 2,
  background: "#e2e8f0",
};

const timelineContent = {
  paddingBottom: 20,
};

const actionCard = {
  display: "grid",
  gridTemplateColumns: "1fr 250px",
  gap: 30,
  padding: 25,
  border: "1px solid #bfdbfe",
  borderRadius: 20,
  background: "#f8fbff",
};

const actionContent = {
  minWidth: 0,
};

const actionMeta = {
  borderLeft: "1px solid #dbeafe",
  paddingLeft: 25,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const signalList = {
  display: "grid",
  gap: 12,
};

const errorStyle = {
  width: "min(1180px, 90vw)",
  margin: "0 auto 30px",
  padding: 16,
  borderRadius: 14,
  background: "#fff1f2",
  color: "#be123c",
};
