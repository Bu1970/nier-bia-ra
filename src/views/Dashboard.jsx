import { useMemo } from "react";
import {
  T, BIA_WINDOWS, CRIT_CLASSES, CRIT_META, PROCESSES,
  summarizeProcess, rtoLabel,
} from "../data/demoData.js";
import { useConfig } from "../context/ConfigContext.jsx";

// ─── Componenti di supporto ───────────────────────────────────────────────────
function CritBadge({ level }) {
  if (!level) return <span style={{ fontSize:11, color:T.gray200 }}>—</span>;
  const m = CRIT_META[level] || CRIT_META["media"];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", padding:"2px 8px",
      borderRadius:10, fontSize:10, fontWeight:600,
      background:m.bg, color:m.color, border:`0.5px solid ${m.border}`, whiteSpace:"nowrap",
    }}>{level}</span>
  );
}

function Pill({ label, bg, color }) {
  return <span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:8, background:bg, color, whiteSpace:"nowrap" }}>{label}</span>;
}

// Card KPI direzionale
function KpiCard({ label, value, sub, color, bg, border, accent }) {
  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:10, padding:"13px 15px" }}>
      <div style={{ fontSize:10, color, textTransform:"uppercase", letterSpacing:".05em", marginBottom:5, opacity:.85 }}>{label}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
        <span style={{ fontSize:26, fontWeight:700, color:accent || color, lineHeight:1 }}>{value}</span>
        {sub && <span style={{ fontSize:11, color, opacity:.8 }}>{sub}</span>}
      </div>
    </div>
  );
}

// Barra segmentata distribuzione criticità
function CritDistribution({ counts, total }) {
  if (!total) return <div style={{ fontSize:11, color:T.gray400, padding:"6px 0" }}>Nessun input con criticità calcolabile.</div>;
  return (
    <div>
      <div style={{ display:"flex", height:26, borderRadius:7, overflow:"hidden", border:`0.5px solid ${T.gray100}` }}>
        {CRIT_CLASSES.map(c => {
          const n = counts[c] || 0;
          if (!n) return null;
          const m = CRIT_META[c];
          return (
            <div key={c} title={`${c}: ${n}`} style={{
              width:`${(n / total) * 100}%`, background:m.color,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"#fff", fontSize:11, fontWeight:600,
            }}>{n}</div>
          );
        })}
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:9 }}>
        {CRIT_CLASSES.map(c => {
          const m = CRIT_META[c];
          return (
            <div key={c} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:T.gray600 }}>
              <span style={{ width:9, height:9, borderRadius:2, background:m.color }} />
              {c} <strong style={{ color:m.color }}>{counts[c] || 0}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Istogramma processi per finestra MTPD
function MtpdHistogram({ buckets, maxN }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:120, paddingTop:6 }}>
      {BIA_WINDOWS.map(w => {
        const n = buckets[w.id] || 0;
        const critical = w.hours <= 8;
        const h = maxN ? (n / maxN) * 92 : 0;
        return (
          <div key={w.id} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:11, fontWeight:600, color:n ? (critical ? T.red600 : T.blue800) : T.gray200 }}>{n || ""}</span>
            <div style={{
              width:"100%", height:Math.max(h, n ? 4 : 0), borderRadius:"4px 4px 0 0",
              background:critical ? T.red400 : T.blue400, transition:"height .3s",
            }} />
            <span style={{ fontSize:10, color:critical ? T.red600 : T.gray400, fontWeight:critical ? 600 : 400 }}>{w.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Card({ title, hint, children, style }) {
  return (
    <div style={{ background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:10, padding:16, ...style }}>
      {title && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.gray800 }}>{title}</div>
          {hint && <div style={{ fontSize:10, color:T.gray400, marginTop:2 }}>{hint}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
function exportCSV(rows) {
  const header = ["Processo","Macro","Sito","Owner","Stato BIA","MTPD","RTO finale","Coerenza RTO/MTPD","N. input","Input crit. alta+","Issue aperte","Criticità peggiore"];
  const esc = v => {
    const s = String(v ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map(r => [
    r.name, r.macro, r.sito, r.owner,
    r.filled ? "Completata" : "Da compilare",
    r.filled ? r.mtpd.label : "—",
    rtoLabel(r.rto),
    r.coherent ? "OK" : "INCOERENTE",
    r.inputs.length, r.highCrit, r.issues,
    r.worstClass || "—",
  ].map(esc).join(";"));
  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n"); // BOM per Excel
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nier-bia-ra_dashboard.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard({ processes = PROCESSES, onOpenProcess }) {
  const { computeCrit, activeModel } = useConfig();
  const rows = useMemo(() => processes.map(p => summarizeProcess(p, computeCrit)), [processes, computeCrit]);

  const agg = useMemo(() => {
    const totalProc = rows.length;
    const biaDone   = rows.filter(r => r.filled).length;
    const incoherent = rows.filter(r => r.filled && !r.coherent).length;
    const mtpdCritical = rows.filter(r => r.filled && r.mtpd.hours <= 8).length;
    const issues = rows.reduce((s, r) => s + r.issues, 0);

    // Distribuzione criticità su tutti gli input
    const critCounts = Object.fromEntries(CRIT_CLASSES.map(c => [c, 0]));
    let critTotal = 0;
    rows.forEach(r => r.crit.forEach(i => { critCounts[i.classFinal]++; critTotal++; }));
    const highCrit = critCounts["molto alta"] + critCounts["alta"];

    // Istogramma MTPD
    const buckets = {};
    rows.filter(r => r.filled).forEach(r => { buckets[r.mtpd.id] = (buckets[r.mtpd.id] || 0) + 1; });
    const maxN = Math.max(1, ...Object.values(buckets));

    // Breakdown per sito
    const bySite = {};
    rows.forEach(r => {
      const s = bySite[r.sito] || (bySite[r.sito] = { sito:r.sito, proc:0, inputs:0, highCrit:0, issues:0, minHours:Infinity, worst:null });
      s.proc++; s.inputs += r.inputs.length; s.highCrit += r.highCrit; s.issues += r.issues;
      if (r.filled && r.mtpd.hours < s.minHours) { s.minHours = r.mtpd.hours; s.worst = r.mtpd.label; }
    });

    return { totalProc, biaDone, incoherent, mtpdCritical, issues, critCounts, critTotal, highCrit, buckets, maxN, sites:Object.values(bySite) };
  }, [rows]);

  return (
    <div style={{ padding:"18px 20px", maxWidth:1180, margin:"0 auto", color:T.gray800 }}>

      {/* Intestazione sezione + export */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:17, fontWeight:600 }}>Quadro generale</div>
          <div style={{ fontSize:12, color:T.gray400, marginTop:2 }}>
            Sintesi BIA, criticità e coerenza RTO/MTPD su {agg.totalProc} processi · Procedura NIER · ISO 22301
          </div>
          <div style={{ fontSize:11, color:T.gray600, marginTop:5 }}>
            Modello criticità: <span style={{ fontWeight:600, color:T.blue800 }}>{activeModel.label}</span>
          </div>
        </div>
        <div className="no-print" style={{ display:"flex", gap:8 }}>
          <button onClick={() => exportCSV(rows)} style={btn(T.blue600)}>⬇ Esporta CSV</button>
          <button onClick={() => window.print()} style={btnOutline()}>🖨 Stampa / PDF</button>
        </div>
      </div>

      {/* KPI direzionali */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:16 }}>
        <KpiCard label="Processi" value={agg.totalProc} sub={`${agg.biaDone} BIA completate`}
          color={T.blue600} bg={T.blue50} border={T.blue100} accent={T.blue800} />
        <KpiCard label="Incoerenze RTO/MTPD" value={agg.incoherent} sub={agg.incoherent ? "da rivedere" : "tutto ok"}
          color={agg.incoherent ? T.amber600 : T.teal600} bg={agg.incoherent ? T.amber50 : T.teal50} border={agg.incoherent ? T.amber400 : T.teal400} />
        <KpiCard label="MTPD critico ≤ 8h" value={agg.mtpdCritical} sub="processi"
          color={T.red600} bg={T.red50} border={T.red400} accent={T.red800} />
        <KpiCard label="Input criticità alta+" value={agg.highCrit} sub={`su ${agg.critTotal}`}
          color={T.red600} bg={T.red50} border={T.red400} accent={T.red800} />
        <KpiCard label="Issue aperte" value={agg.issues} sub="totali"
          color={agg.issues ? T.amber600 : T.teal600} bg={agg.issues ? T.amber50 : T.teal50} border={agg.issues ? T.amber400 : T.teal400} />
      </div>

      {/* Grafici */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <Card title="Distribuzione criticità input" hint="Criticità finale (min C_MTPD, C_RTO) su tutti gli input valutati">
          <CritDistribution counts={agg.critCounts} total={agg.critTotal} />
        </Card>
        <Card title="Processi per MTPD" hint="Quanti processi ricadono in ciascuna finestra temporale (rosso = ≤ 8h)">
          <MtpdHistogram buckets={agg.buckets} maxN={agg.maxN} />
        </Card>
      </div>

      {/* Tabella processi */}
      <Card title="Riepilogo processi" hint="Clicca una riga per aprire la scheda consolidata" style={{ padding:0, marginBottom:16 }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, minWidth:760 }}>
            <thead>
              <tr style={{ background:T.gray50 }}>
                {["Processo","Sito","Owner","BIA","MTPD","RTO finale","Coerenza","Input","Crit. alta+","Issue","Criticità peggiore"].map(h => (
                  <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, fontWeight:500, color:T.gray400,
                    borderBottom:`0.5px solid ${T.gray100}`, textTransform:"uppercase", letterSpacing:".04em", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}
                  onClick={() => onOpenProcess?.(r.id)}
                  style={{ cursor:onOpenProcess ? "pointer" : "default", borderBottom:`0.5px solid ${T.gray100}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.blue50; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <td style={{ padding:"9px 10px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", flexShrink:0,
                        background: !r.filled ? T.gray200 : !r.coherent ? T.amber400 : T.teal400 }} />
                      <div>
                        <div style={{ fontWeight:500, fontSize:12 }}>{r.name}</div>
                        <div style={{ fontSize:10, color:T.gray400 }}>{r.macro}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"9px 10px", color:T.gray600 }}>{r.sito}</td>
                  <td style={{ padding:"9px 10px", color:T.gray600 }}>{r.owner}</td>
                  <td style={{ padding:"9px 10px" }}>
                    {r.filled
                      ? <Pill label="Completata" bg={T.teal50} color={T.teal600} />
                      : <Pill label="Da compilare" bg={T.gray50} color={T.gray400} />}
                  </td>
                  <td style={{ padding:"9px 10px" }}>
                    {r.filled
                      ? <Pill label={r.mtpd.label} bg={r.mtpd.hours <= 8 ? T.red50 : r.mtpd.hours <= 72 ? T.amber50 : T.gray50}
                          color={r.mtpd.hours <= 8 ? T.red600 : r.mtpd.hours <= 72 ? T.amber600 : T.gray600} />
                      : <span style={{ color:T.gray200 }}>—</span>}
                  </td>
                  <td style={{ padding:"9px 10px" }}>
                    <Pill label={rtoLabel(r.rto)} bg={r.coherent ? T.blue50 : T.amber50} color={r.coherent ? T.blue800 : T.amber600} />
                  </td>
                  <td style={{ padding:"9px 10px" }}>
                    {!r.filled ? <span style={{ color:T.gray200 }}>—</span>
                      : r.coherent ? <span style={{ color:T.teal600, fontWeight:600 }}>✓</span>
                      : <span title="RTO finale > MTPD" style={{ color:T.amber600, fontWeight:600 }}>⚠</span>}
                  </td>
                  <td style={{ padding:"9px 10px", textAlign:"center", color:T.gray600 }}>{r.inputs.length}</td>
                  <td style={{ padding:"9px 10px", textAlign:"center", fontWeight:r.highCrit ? 700 : 400, color:r.highCrit ? T.red600 : T.gray400 }}>{r.highCrit || "—"}</td>
                  <td style={{ padding:"9px 10px", textAlign:"center", fontWeight:r.issues ? 600 : 400, color:r.issues ? T.amber600 : T.gray400 }}>{r.issues || "—"}</td>
                  <td style={{ padding:"9px 10px" }}><CritBadge level={r.worstClass} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Breakdown per sito */}
      <Card title="Sintesi per sito" hint="Aggregazione di processi, input critici e issue per stabilimento">
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min(agg.sites.length, 3)},1fr)`, gap:10 }}>
          {agg.sites.map(s => (
            <div key={s.sito} style={{ border:`0.5px solid ${T.gray100}`, borderRadius:8, padding:"11px 13px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                <span style={{ fontSize:14 }}>📍</span>
                <span style={{ fontSize:12, fontWeight:600 }}>{s.sito}</span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                <Pill label={`${s.proc} processi`} bg={T.blue50} color={T.blue800} />
                <Pill label={`${s.inputs} input`} bg={T.gray50} color={T.gray600} />
                {s.highCrit > 0 && <Pill label={`${s.highCrit} crit. alta+`} bg={T.red50} color={T.red600} />}
                {s.issues > 0 && <Pill label={`${s.issues} issue`} bg={T.amber50} color={T.amber600} />}
                {s.worst && <Pill label={`MTPD min ${s.worst}`} bg={T.red50} color={T.red600} />}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Stili bottoni ─────────────────────────────────────────────────────────────
function btn(bg) {
  return { padding:"7px 14px", borderRadius:7, border:"none", background:bg, color:"#fff", fontWeight:500, fontSize:12, cursor:"pointer" };
}
function btnOutline() {
  return { padding:"7px 14px", borderRadius:7, border:`0.5px solid ${T.gray200}`, background:"#fff", color:T.gray600, fontWeight:500, fontSize:12, cursor:"pointer" };
}
