import { motion } from "framer-motion";
import { Activity, ArrowUpRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { APP_CONFIG } from "../config/app.config";

const links = [
  ["Home", "/"],
  ["Investigation", "/investigation"],
  ["Evidence", "/evidence"],
  ["Risk", "/risk"],
  ["Reasoning", "/reasoning"],
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.header className="navbar" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
      <div className="brand" onClick={() => navigate("/")}> 
        <div className="brand-mark"><Activity size={18} /></div>
        <div>
          <div className="brand-name">{APP_CONFIG.name}</div>
          <div className="brand-subtitle">{APP_CONFIG.tagline}</div>
        </div>
      </div>

      <nav className="nav-links" aria-label="Primary navigation">
        {links.map(([label, path]) => (
          <button key={path} className={location.pathname === path ? "nav-link active" : "nav-link"} onClick={() => navigate(path)}>
            {label}
          </button>
        ))}
      </nav>

      <button className="nav-test" onClick={() => navigate("/test")}>TEST <ArrowUpRight size={16} /></button>
    </motion.header>
  );
}
