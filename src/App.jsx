import { useState } from "react";
import {
  T, PROCESSES, summarizeProcess, rtoLabel,
} from "./data/demoData.js";
import { useConfig } from "./context/ConfigContext.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Settings from "./views/Settings.jsx";
import ProcessView from "./views/ProcessView.jsx";

// ─── Logo / brand ──────────────────────────────────────────────────────────────
function Brand() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:28, height:28, background:T.blue600, borderRadius:6, display:"flex",
        alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:600 }}>N</div>
      <div style={{ width:1, height:24, background:T.gray100 }} />
      <span style={{ fontSize:13, fontWeight:500 }}>NIER BIA-RA</span>
    </div>
  );
}

// ─── Griglia processi (vista "Processi") ─────────────────────────────────────────
function ProcessGrid({ onOpenProcess }) {
  const { computeCrit } = useConfig();
  const rows = PROCESSES.map(p => summarizeProcess(p, computeCrit));
  return (
    <div style={{ padding:"18px 20px", maxWidth:1180, margin:"0 auto" }}>
      <div style={{ fontSize:17, fontWeight:600, marginBottom:2 }}>Processi</div>
      <div style={{ fontSize:12, color:T.gray400, marginBottom:16 }}>Seleziona un processo per aprire la scheda consolidata (Input · BIA · Criticità)</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
        {rows.map(p => (
          <button key={p.id} onClick={() => onOpenProcess(p.id)}
            style={{ textAlign:"left", background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:10, padding:16, cursor:"pointer", transition:"all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue400; e.currentTarget.style.boxShadow = "0 2px 8px rgba(55,138,221,.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.gray100; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, gap:8 }}>
              <div style={{ fontSize:13, fontWeight:500 }}>{p.name}</div>
              <span style={{ fontSize:10, padding:"1px 6px", borderRadius:5, background:T.gray50, color:T.gray600, whiteSpace:"nowrap" }}>{p.macro}</span>
            </div>
            <div style={{ fontSize:11, color:T.gray400, marginBottom:10 }}>{p.sito} · {p.owner}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {p.filled && <span style={pill(T.red50, T.red600)}>MTPD {p.mtpd.label}</span>}
              <span style={pill(T.blue50, T.blue800)}>RTO {rtoLabel(p.rto)}</span>
              <span style={pill(p.catFilled >= 5 ? T.teal50 : T.amber50, p.catFilled >= 5 ? T.teal600 : T.amber600)}>{p.catFilled}/7 cat.</span>
              {p.highCrit > 0 && <span style={pill(T.red50, T.red600)}>{p.highCrit} crit. alta+</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
function pill(bg, color) {
  return { fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:8, background:bg, color, whiteSpace:"nowrap" };
}

// ─── App shell ───────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard", label:"Dashboard" },
  { id:"processes", label:"Processi" },
  { id:"settings",  label:"Impostazioni" },
];

export default function App() {
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);

  const selected = selectedId != null ? PROCESSES.find(p => p.id === selectedId) : null;

  function openProcess(id) { setSelectedId(id); }
  function closeProcess() { setSelectedId(null); }

  // Scheda di dettaglio: ProcessView gestisce il proprio header/back
  if (selected) {
    return <ProcessView process={selected} onBack={closeProcess} />;
  }

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", background:T.gray50, minHeight:"100vh", color:T.gray800 }}>
      {/* Top bar con navigazione */}
      <div className="no-print" style={{ background:"#fff", borderBottom:`0.5px solid ${T.gray100}`, padding:"10px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <Brand />
        <div style={{ display:"flex", gap:4 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              style={{ padding:"6px 14px", borderRadius:7, border:"none", cursor:"pointer", fontSize:12,
                fontWeight: view === n.id ? 600 : 400,
                background: view === n.id ? T.blue50 : "transparent",
                color: view === n.id ? T.blue800 : T.gray600, transition:"all .12s" }}>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {view === "dashboard" && <Dashboard processes={PROCESSES} onOpenProcess={openProcess} />}
      {view === "processes" && <ProcessGrid onOpenProcess={openProcess} />}
      {view === "settings"  && <Settings />}
    </div>
  );
}
