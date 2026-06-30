import { useState, useMemo } from "react";
import {
  T, CRIT_CLASSES, CRIT_META, summarizeProcess, rtoLabel, catMeta,
} from "../data/demoData.js";
import { useConfig } from "../context/ConfigContext.jsx";

function CritBadge({ level }) {
  if (!level) return <span style={{ fontSize:11, color:T.gray200 }}>—</span>;
  const m = CRIT_META[level] || CRIT_META["media"];
  return <span style={{ display:"inline-flex", padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:600, background:m.bg, color:m.color, border:`0.5px solid ${m.border}` }}>{level}</span>;
}
function Pill({ label, bg, color }) {
  return <span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:8, background:bg, color, whiteSpace:"nowrap" }}>{label}</span>;
}
function Kpi({ label, value, sub, color, bg, border }) {
  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:10, padding:"12px 14px" }}>
      <div style={{ fontSize:10, color, textTransform:"uppercase", letterSpacing:".05em", marginBottom:5, opacity:.85 }}>{label}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
        <span style={{ fontSize:23, fontWeight:700, color, lineHeight:1 }}>{value}</span>
        {sub && <span style={{ fontSize:11, color, opacity:.8 }}>{sub}</span>}
      </div>
    </div>
  );
}

export default function OwnerDashboard({ processes, ownerName, onOpenScheda }) {
  const { computeCrit, activeModel } = useConfig();
  const [selId, setSelId] = useState(processes[0]?.id ?? null);

  const proc = processes.find(p => p.id === selId) || processes[0] || null;
  const s = useMemo(() => proc ? summarizeProcess(proc, computeCrit) : null, [proc, computeCrit]);

  if (!proc || !s) {
    return (
      <div style={{ padding:"40px 20px", maxWidth:600, margin:"0 auto", textAlign:"center", color:T.gray400 }}>
        <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
        <div style={{ fontSize:14, fontWeight:500, color:T.gray600 }}>Nessun processo assegnato a {ownerName}</div>
        <div style={{ fontSize:12, marginTop:4 }}>Contatta il BC Manager per l'assegnazione.</div>
      </div>
    );
  }

  const critCounts = Object.fromEntries(CRIT_CLASSES.map(c => [c, s.crit.filter(i => i.classFinal === c).length]));
  const critTotal = s.crit.length;
  const issuesList = s.inputs.filter(i => i.issues);

  return (
    <div style={{ padding:"18px 20px", maxWidth:1000, margin:"0 auto", color:T.gray800 }}>
      {/* Intestazione */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:11, color:T.gray400, textTransform:"uppercase", letterSpacing:".05em" }}>La mia scheda</div>
          <div style={{ fontSize:18, fontWeight:600 }}>{proc.name}</div>
          <div style={{ fontSize:12, color:T.gray400, marginTop:2 }}>{proc.macro} · {proc.sito} · {proc.owner}</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {processes.length > 1 && (
            <select value={selId} onChange={e => setSelId(e.target.value)}
              style={{ padding:"7px 9px", border:`0.5px solid ${T.gray200}`, borderRadius:7, fontSize:12, background:"#fff", cursor:"pointer", fontFamily:"inherit" }}>
              {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <button onClick={() => onOpenScheda(proc.id)} style={{ padding:"8px 14px", borderRadius:7, border:"none", background:T.blue600, color:"#fff", fontWeight:500, fontSize:12, cursor:"pointer" }}>
            Apri scheda completa →
          </button>
        </div>
      </div>

      {/* Alert incoerenza */}
      {s.filled && !s.coherent && (
        <div style={{ background:T.amber50, border:`0.5px solid ${T.amber400}`, borderRadius:7, padding:"8px 12px", marginBottom:14, fontSize:11, color:T.amber600, display:"flex", gap:7 }}>
          <span>⚠</span><span><strong>Incoerenza RTO/MTPD</strong> — l'RTO finale ({rtoLabel(s.rto)}) supera l'MTPD ({s.mtpd.label}). Rivedi gli impatti BIA o l'RTO dichiarato.</span>
        </div>
      )}
      {!s.filled && (
        <div style={{ background:T.blue50, border:`0.5px solid ${T.blue100}`, borderRadius:7, padding:"8px 12px", marginBottom:14, fontSize:11, color:T.blue800, display:"flex", gap:7 }}>
          <span>ℹ</span><span>La matrice BIA non è ancora compilata. Apri la scheda per inserire gli impatti e calcolare l'MTPD.</span>
        </div>
      )}

      {/* KPI */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10, marginBottom:16 }}>
        <Kpi label="MTPD" value={s.filled ? s.mtpd.label : "—"} sub={s.filled ? "tempo max" : "da compilare"} color={T.red600} bg={T.red50} border={T.red400} />
        <Kpi label="RTO finale" value={rtoLabel(s.rto)} sub={s.coherent ? "≤ MTPD" : "⚠"} color={s.coherent ? T.blue800 : T.amber600} bg={s.coherent ? T.blue50 : T.amber50} border={s.coherent ? T.blue400 : T.amber400} />
        <Kpi label="Input" value={s.inputs.length} sub={`${s.catFilled}/7 cat.`} color={T.gray800} bg={T.gray50} border={T.gray200} />
        <Kpi label="Criticità alta+" value={s.highCrit} sub={`su ${critTotal}`} color={T.red600} bg={T.red50} border={T.red400} />
        <Kpi label="Issue aperte" value={s.issues} sub="da gestire" color={s.issues ? T.amber600 : T.teal600} bg={s.issues ? T.amber50 : T.teal50} border={s.issues ? T.amber400 : T.teal400} />
      </div>

      {/* Distribuzione criticità */}
      <div style={{ background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:10, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:600, marginBottom:3 }}>Criticità dei miei input</div>
        <div style={{ fontSize:10, color:T.gray400, marginBottom:10 }}>Modello: {activeModel.label}</div>
        {critTotal === 0 ? <div style={{ fontSize:11, color:T.gray400 }}>Nessun input con vulnerabilità e likelihood valorizzate.</div> : (
          <>
            <div style={{ display:"flex", height:24, borderRadius:7, overflow:"hidden", border:`0.5px solid ${T.gray100}` }}>
              {CRIT_CLASSES.map(c => {
                const n = critCounts[c]; if (!n) return null;
                const m = CRIT_META[c];
                return <div key={c} title={`${c}: ${n}`} style={{ width:`${(n/critTotal)*100}%`, background:m.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:600 }}>{n}</div>;
              })}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:9 }}>
              {CRIT_CLASSES.map(c => <div key={c} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:T.gray600 }}><span style={{ width:9, height:9, borderRadius:2, background:CRIT_META[c].color }} />{c} <strong style={{ color:CRIT_META[c].color }}>{critCounts[c]}</strong></div>)}
            </div>
          </>
        )}
      </div>

      {/* Tabella input */}
      <div style={{ background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:10, overflow:"hidden", marginBottom:16 }}>
        <div style={{ padding:"11px 14px", borderBottom:`0.5px solid ${T.gray100}` }}>
          <div style={{ fontSize:12, fontWeight:600 }}>I miei input ({s.inputs.length})</div>
        </div>
        {s.inputs.length === 0 ? (
          <div style={{ padding:24, textAlign:"center", color:T.gray400, fontSize:12 }}>Nessun input inserito. Apri la scheda per aggiungerli.</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, minWidth:560 }}>
              <thead><tr style={{ background:T.gray50 }}>{["","Input","Vuln.","Likelihood","Criticità","Issue"].map((h,i) => <th key={i} style={{ padding:"7px 10px", textAlign:"left", fontSize:10, fontWeight:500, color:T.gray400, textTransform:"uppercase", letterSpacing:".04em", borderBottom:`0.5px solid ${T.gray100}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {s.inputs.map(inp => {
                  const c = s.crit.find(x => x.id === inp.id);
                  return (
                    <tr key={inp.id} style={{ borderBottom:`0.5px solid ${T.gray100}` }}>
                      <td style={{ padding:"7px 10px", fontSize:14 }}>{catMeta(inp.cat).icon}</td>
                      <td style={{ padding:"7px 10px", fontWeight:500 }}>{inp.name}</td>
                      <td style={{ padding:"7px 10px", color:T.gray600 }}>{inp.vuln || "—"}</td>
                      <td style={{ padding:"7px 10px", color:T.gray600 }}>{inp.likelihood || "—"}</td>
                      <td style={{ padding:"7px 10px" }}>{c ? <CritBadge level={c.classFinal} /> : <span style={{ fontSize:10, color:T.gray400 }}>n.d.</span>}</td>
                      <td style={{ padding:"7px 10px" }}>{inp.issues ? <Pill label="⚠ issue" bg={T.amber50} color={T.amber600} /> : <Pill label="OK" bg={T.teal50} color={T.teal600} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue da gestire */}
      {issuesList.length > 0 && (
        <div style={{ background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:10, padding:16 }}>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>Issue aperte da gestire ({issuesList.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {issuesList.map(inp => (
              <div key={inp.id} style={{ display:"flex", gap:9, alignItems:"flex-start", fontSize:12 }}>
                <span style={{ fontSize:14 }}>{catMeta(inp.cat).icon}</span>
                <div><div style={{ fontWeight:500 }}>{inp.name}</div><div style={{ fontSize:11, color:T.amber600, marginTop:1 }}>⚠ {inp.issues}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
