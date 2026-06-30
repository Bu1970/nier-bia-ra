import { useState, useMemo } from "react";
import { T, summarizeProcess, rtoLabel } from "./data/demoData.js";
import { useConfig } from "./context/ConfigContext.jsx";
import { useData } from "./context/DataContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Settings from "./views/Settings.jsx";
import Anagrafiche from "./views/Anagrafiche.jsx";
import OwnerDashboard from "./views/OwnerDashboard.jsx";
import ProcessView from "./views/ProcessView.jsx";
import AddProcessDrawer from "./components/AddProcessDrawer.jsx";

function Brand() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:28, height:28, background:T.blue600, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:600 }}>N</div>
      <div style={{ width:1, height:24, background:T.gray100 }} />
      <span style={{ fontSize:13, fontWeight:500 }}>NIER BIA-RA</span>
    </div>
  );
}

// Selettore utente demo (sostituirà il login reale)
function UserSwitcher({ onChange }) {
  const { user } = useAuth();
  const { anagrafiche } = useData();
  const value = user.role === "admin" ? "__admin__" : user.ownerName;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
      <span title="Selettore demo: simula il login" style={{ fontSize:9, fontWeight:600, color:T.amber600, background:T.amber50, border:`0.5px solid ${T.amber400}`, borderRadius:5, padding:"2px 6px", textTransform:"uppercase", letterSpacing:".04em" }}>demo</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding:"6px 9px", border:`0.5px solid ${T.gray200}`, borderRadius:7, fontSize:12, background:"#fff", cursor:"pointer", fontFamily:"inherit", maxWidth:230 }}>
        <option value="__admin__">👔 BC Manager / Direzione</option>
        <optgroup label="Responsabili di processo">
          {anagrafiche.responsabili.map(r => <option key={r.id} value={r.nome}>👤 {r.nome}</option>)}
        </optgroup>
      </select>
    </div>
  );
}

function pill(bg, color) {
  return { fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:8, background:bg, color, whiteSpace:"nowrap" };
}

// Griglia processi (admin)
function ProcessGrid({ processes, onOpenProcess, onAdd }) {
  const { computeCrit } = useConfig();
  const rows = processes.map(p => summarizeProcess(p, computeCrit));
  return (
    <div style={{ padding:"18px 20px", maxWidth:1180, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:16, gap:10, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:17, fontWeight:600 }}>Processi</div>
          <div style={{ fontSize:12, color:T.gray400, marginTop:2 }}>Seleziona un processo per aprire la scheda (Input · BIA · Criticità)</div>
        </div>
        <button onClick={onAdd} style={{ padding:"8px 14px", borderRadius:7, border:"none", background:T.blue600, color:"#fff", fontWeight:500, fontSize:12, cursor:"pointer" }}>+ Nuovo processo</button>
      </div>
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

const ADMIN_NAV = [
  { id:"dashboard",   label:"Dashboard" },
  { id:"processes",   label:"Processi" },
  { id:"anagrafiche", label:"Anagrafiche" },
  { id:"settings",    label:"Impostazioni" },
];

export default function App() {
  const { user, loginAdmin, loginOwner } = useAuth();
  const { processes, updateProcess } = useData();
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const isAdmin = user.role === "admin";
  const ownerProcesses = useMemo(
    () => isAdmin ? [] : processes.filter(p => p.owner === user.ownerName),
    [isAdmin, processes, user.ownerName]
  );

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2400); }
  function switchUser(val) {
    setSelectedId(null);
    setView("dashboard");
    if (val === "__admin__") loginAdmin(); else loginOwner(val);
  }
  function openProcess(id) { setSelectedId(id); }
  function closeProcess() { setSelectedId(null); }
  function persistProcess({ inputs, biaCells }) {
    if (selectedId != null) { updateProcess(selectedId, { initialInputs: inputs, initialBIA: biaCells }); showToast("Scheda salvata"); }
  }

  // Scheda processo (admin: qualsiasi; owner: solo i propri)
  const selected = selectedId != null ? processes.find(p => p.id === selectedId) : null;
  const canOpenSelected = selected && (isAdmin || selected.owner === user.ownerName);
  if (selected && canOpenSelected) {
    return <ProcessView process={selected} onBack={closeProcess} onPersist={persistProcess} />;
  }

  const Toast = (
    <div style={{ position:"fixed", bottom:20, left:"50%", transform:`translateX(-50%) translateY(${toast?0:12}px)`, background:T.teal600, color:"#fff", padding:"8px 16px", borderRadius:7, fontSize:11, fontWeight:500, opacity:toast?1:0, transition:"opacity .2s,transform .2s", zIndex:200, pointerEvents:"none" }}>✓ {toast}</div>
  );

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", background:T.gray50, minHeight:"100vh", color:T.gray800 }}>
      {Toast}
      {/* Top bar */}
      <div className="no-print" style={{ background:"#fff", borderBottom:`0.5px solid ${T.gray100}`, padding:"10px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:18 }}>
          <Brand />
          {isAdmin ? (
            <div style={{ display:"flex", gap:4 }}>
              {ADMIN_NAV.map(n => (
                <button key={n.id} onClick={() => setView(n.id)}
                  style={{ padding:"6px 12px", borderRadius:7, border:"none", cursor:"pointer", fontSize:12,
                    fontWeight: view === n.id ? 600 : 400,
                    background: view === n.id ? T.blue50 : "transparent",
                    color: view === n.id ? T.blue800 : T.gray600 }}>{n.label}</button>
              ))}
            </div>
          ) : (
            <span style={{ fontSize:12, color:T.gray400 }}>Area Responsabile di processo</span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {isAdmin && <button onClick={() => setAddOpen(true)} style={{ padding:"6px 12px", borderRadius:7, border:`0.5px solid ${T.blue600}`, background:"#fff", color:T.blue600, fontWeight:500, fontSize:12, cursor:"pointer" }}>+ Nuovo processo</button>}
          <UserSwitcher onChange={switchUser} />
        </div>
      </div>

      {/* Contenuto per ruolo */}
      {isAdmin ? (
        <>
          {view === "dashboard"   && <Dashboard processes={processes} onOpenProcess={openProcess} />}
          {view === "processes"   && <ProcessGrid processes={processes} onOpenProcess={openProcess} onAdd={() => setAddOpen(true)} />}
          {view === "anagrafiche" && <Anagrafiche />}
          {view === "settings"    && <Settings />}
        </>
      ) : (
        <OwnerDashboard processes={ownerProcesses} ownerName={user.ownerName} onOpenScheda={openProcess} />
      )}

      <AddProcessDrawer open={addOpen} onClose={() => setAddOpen(false)} onCreated={(id, name) => showToast(`Processo “${name}” creato`)} />
    </div>
  );
}
