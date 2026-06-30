import { useMemo } from "react";
import { useConfig } from "../context/ConfigContext.jsx";
import { MODELS } from "../data/criticalityModels.js";
import {
  T, CRIT_CLASSES, CRIT_META, PROCESSES, summarizeProcess,
} from "../data/demoData.js";

const VULNS = ["basso", "medio", "alto"];
const LKS   = ["bassa", "media", "alta"];
const TIME_METRICS = [
  { v:"rto",  l:"RTO finale" },
  { v:"mtpd", l:"MTPD" },
  { v:"min",  l:"min(RTO, MTPD)" },
];

// ─── Input numerico controllato ────────────────────────────────────────────────
function Num({ value, onChange, step = 1, min, style }) {
  return (
    <input type="number" value={value} step={step} min={min}
      onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      style={{ width:62, padding:"4px 6px", border:`0.5px solid ${T.gray200}`, borderRadius:5,
        fontSize:12, textAlign:"center", fontFamily:"inherit", outline:"none", ...style }} />
  );
}

function SectionTitle({ children, hint }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:11, fontWeight:600, color:T.gray800, textTransform:"uppercase", letterSpacing:".04em" }}>{children}</div>
      {hint && <div style={{ fontSize:10, color:T.gray400, marginTop:2 }}>{hint}</div>}
    </div>
  );
}

// ─── Editor matrice VxL (condiviso) ───────────────────────────────────────────
function VxlEditor({ vxl, onChange }) {
  const set = (v, lk, val) => onChange({ ...vxl, [v]: { ...vxl[v], [lk]: val } });
  return (
    <table style={{ borderCollapse:"collapse", fontSize:11 }}>
      <thead>
        <tr>
          <th style={cellH}>Vuln \ Lk</th>
          {LKS.map(lk => <th key={lk} style={cellH}>{lk}</th>)}
        </tr>
      </thead>
      <tbody>
        {VULNS.map(v => (
          <tr key={v}>
            <td style={{ ...cellH, textAlign:"left" }}>{v}</td>
            {LKS.map(lk => (
              <td key={lk} style={cell}>
                <Num value={vxl[v][lk]} min={1} onChange={val => set(v, lk, val || 1)} style={{ width:48 }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Editor parametri modello legacy ──────────────────────────────────────────
function LegacyParams({ params, update }) {
  const th = params.thresholds;
  const setTh = (k, val) => update({ thresholds: { ...th, [k]: val } });
  return (
    <>
      <div style={{ marginBottom:16 }}>
        <SectionTitle hint="Punteggio VxL = Vulnerabilità × Likelihood">Matrice VxL</SectionTitle>
        <VxlEditor vxl={params.vxl} onChange={vxl => update({ vxl })} />
      </div>
      <div style={{ marginBottom:16 }}>
        <SectionTitle hint="Orizzonte di normalizzazione del tempo (ore). 720 = 30 giorni.">Normalizzazione</SectionTitle>
        <label style={lbl}>Tmax (ore) <Num value={params.maxH} min={1} onChange={val => update({ maxH: val || 1 })} /></label>
      </div>
      <div>
        <SectionTitle hint="Soglie crescenti dell'indice continuo. C ≤ soglia → classe.">Soglie di classificazione</SectionTitle>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <label style={lbl}><CritDot c="molto alta" /> molto alta&nbsp;se&nbsp;C&nbsp;≤&nbsp;<Num value={th.moltoAlta} step={0.01} onChange={v => setTh("moltoAlta", v)} /></label>
          <label style={lbl}><CritDot c="alta" /> alta&nbsp;se&nbsp;C&nbsp;≤&nbsp;<Num value={th.alta} step={0.01} onChange={v => setTh("alta", v)} /></label>
          <label style={lbl}><CritDot c="media" /> media&nbsp;se&nbsp;C&nbsp;≤&nbsp;<Num value={th.media} step={0.01} onChange={v => setTh("media", v)} /></label>
          <label style={lbl}><CritDot c="bassa" /> bassa&nbsp;se&nbsp;C&nbsp;≤&nbsp;<Num value={th.bassa} step={0.01} onChange={v => setTh("bassa", v)} /></label>
          <div style={{ fontSize:10, color:T.gray400 }}><CritDot c="molto bassa" /> molto bassa&nbsp;se&nbsp;C&nbsp;&gt;&nbsp;{th.bassa}</div>
        </div>
      </div>
    </>
  );
}

// ─── Editor parametri modello a matrice ───────────────────────────────────────
function MatrixParams({ params, update }) {
  const setBandH = (i, val) => update({ urgencyBands: params.urgencyBands.map((b, idx) => idx === i ? { ...b, maxH: val } : b) });
  const setCell = (ui, vi, cls) => update({ matrix: params.matrix.map((row, r) => r === ui ? row.map((c, k) => k === vi ? cls : c) : row) });
  return (
    <>
      <div style={{ marginBottom:16 }}>
        <SectionTitle>Matrice VxL</SectionTitle>
        <VxlEditor vxl={params.vxl} onChange={vxl => update({ vxl })} />
      </div>
      <div style={{ marginBottom:16 }}>
        <SectionTitle hint="Quale tempo determina l'urgenza.">Metrica temporale</SectionTitle>
        <div style={{ display:"flex", gap:6 }}>
          {TIME_METRICS.map(m => (
            <button key={m.v} onClick={() => update({ timeMetric: m.v })}
              style={{ padding:"5px 11px", borderRadius:6, fontSize:11, cursor:"pointer",
                border: params.timeMetric === m.v ? `1.5px solid ${T.blue600}` : `0.5px solid ${T.gray200}`,
                background: params.timeMetric === m.v ? T.blue50 : "#fff",
                color: params.timeMetric === m.v ? T.blue800 : T.gray600, fontWeight: params.timeMetric === m.v ? 500 : 400 }}>
              {m.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <SectionTitle hint="Soglia massima (ore) di ciascuna banda di urgenza. L'ultima è illimitata.">Bande di urgenza</SectionTitle>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
          {params.urgencyBands.map((b, i) => (
            <label key={b.label} style={{ ...lbl, fontSize:11 }}>
              {b.label} ≤ {b.maxH == null
                ? <span style={{ color:T.gray400, marginLeft:4 }}>∞</span>
                : <Num value={b.maxH} min={1} onChange={val => setBandH(i, val || 1)} />}
              {b.maxH != null && <span style={{ color:T.gray400, fontSize:10 }}>h</span>}
            </label>
          ))}
        </div>
      </div>
      <div>
        <SectionTitle hint="Classe di criticità per ogni combinazione urgenza × banda VxL.">Matrice di criticità</SectionTitle>
        <div style={{ overflowX:"auto" }}>
          <table style={{ borderCollapse:"collapse", fontSize:11 }}>
            <thead>
              <tr>
                <th style={cellH}>Urgenza \ VxL</th>
                {params.vxlBands.map(b => <th key={b.label} style={cellH}>{b.label}<div style={{ fontSize:9, color:T.gray400, fontWeight:400 }}>≤ {b.maxScore}</div></th>)}
              </tr>
            </thead>
            <tbody>
              {params.matrix.map((row, ui) => (
                <tr key={ui}>
                  <td style={{ ...cellH, textAlign:"left", whiteSpace:"nowrap" }}>{params.urgencyBands[ui]?.label}</td>
                  {row.map((cls, vi) => {
                    const m = CRIT_META[cls] || CRIT_META["media"];
                    return (
                      <td key={vi} style={{ ...cell, background:m.bg, padding:2 }}>
                        <select value={cls} onChange={e => setCell(ui, vi, e.target.value)}
                          style={{ border:"none", background:"transparent", color:m.color, fontWeight:600, fontSize:10,
                            cursor:"pointer", outline:"none", fontFamily:"inherit", textAlign:"center", appearance:"none", padding:"3px 4px" }}>
                          {CRIT_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function CritDot({ c }) {
  const m = CRIT_META[c] || CRIT_META["media"];
  return <span style={{ display:"inline-block", width:9, height:9, borderRadius:2, background:m.color, marginRight:6 }} />;
}

// ─── Anteprima live della distribuzione ───────────────────────────────────────
function LivePreview() {
  const { computeCrit } = useConfig();
  const { counts, total, rows } = useMemo(() => {
    const summaries = PROCESSES.map(p => summarizeProcess(p, computeCrit));
    const counts = Object.fromEntries(CRIT_CLASSES.map(c => [c, 0]));
    let total = 0;
    summaries.forEach(s => s.crit.forEach(i => { counts[i.classFinal]++; total++; }));
    return { counts, total, rows: summaries };
  }, [computeCrit]);

  return (
    <div>
      <div style={{ fontSize:10, color:T.gray400, marginBottom:8 }}>
        Distribuzione su {total} input valutati del dataset corrente. Aggiornata in tempo reale.
      </div>
      {total === 0 ? <div style={{ fontSize:11, color:T.gray400 }}>Nessun input valutabile.</div> : (
        <>
          <div style={{ display:"flex", height:26, borderRadius:7, overflow:"hidden", border:`0.5px solid ${T.gray100}`, marginBottom:10 }}>
            {CRIT_CLASSES.map(c => {
              const n = counts[c] || 0;
              if (!n) return null;
              const m = CRIT_META[c];
              return <div key={c} title={`${c}: ${n}`} style={{ width:`${(n/total)*100}%`, background:m.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:600 }}>{n}</div>;
            })}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {CRIT_CLASSES.map(c => {
              const m = CRIT_META[c];
              const n = counts[c] || 0;
              return (
                <div key={c} style={{ display:"flex", alignItems:"center", gap:7, fontSize:11 }}>
                  <CritDot c={c} />
                  <span style={{ flex:1, color:T.gray600 }}>{c}</span>
                  <strong style={{ color:m.color }}>{n}</strong>
                  <span style={{ color:T.gray400, fontSize:10, minWidth:38, textAlign:"right" }}>{total ? Math.round((n/total)*100) : 0}%</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:12, borderTop:`0.5px solid ${T.gray100}`, paddingTop:10 }}>
            <div style={{ fontSize:10, color:T.gray400, marginBottom:6 }}>Per processo (input a criticità alta+)</div>
            {rows.map(r => (
              <div key={r.id} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"2px 0", color:T.gray600 }}>
                <span>{r.name}</span>
                <strong style={{ color: r.highCrit ? T.red600 : T.gray400 }}>{r.highCrit}/{r.crit.length}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Pagina Impostazioni ──────────────────────────────────────────────────────
export default function Settings() {
  const { config, activeModel, activeParams, setActiveModel, setParams, resetParams } = useConfig();
  const update = patch => setParams(config.activeModelId, patch);

  return (
    <div style={{ padding:"18px 20px", maxWidth:1180, margin:"0 auto", color:T.gray800 }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:17, fontWeight:600 }}>Impostazioni · Modello di criticità</div>
        <div style={{ fontSize:12, color:T.gray400, marginTop:2 }}>
          Seleziona e configura il modello con cui viene valutata la criticità degli input. Le modifiche si applicano subito a tutta l'app.
        </div>
      </div>

      {/* Avviso governance */}
      <div style={{ background:T.amber50, border:`0.5px solid ${T.amber400}`, borderRadius:7, padding:"8px 12px", marginBottom:16, fontSize:11, color:T.amber600, display:"flex", gap:7 }}>
        <span>⚠</span>
        <span>Il modello e i suoi parametri incidono sui risultati di conformità (ISO 22301). Validare le soglie con il referente metodologico NIER prima dell'uso in esercizio. <em>Prototipo: persistenza locale (browser).</em></span>
      </div>

      {/* Selettore modello */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
        {MODELS.map(m => {
          const active = config.activeModelId === m.id;
          return (
            <button key={m.id} onClick={() => setActiveModel(m.id)}
              style={{ textAlign:"left", padding:"13px 15px", borderRadius:10, cursor:"pointer",
                border: active ? `1.5px solid ${T.blue600}` : `0.5px solid ${T.gray100}`,
                background: active ? T.blue50 : "#fff", transition:"all .12s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ width:14, height:14, borderRadius:"50%", flexShrink:0,
                  border: active ? `4px solid ${T.blue600}` : `1.5px solid ${T.gray200}`, background:"#fff" }} />
                <span style={{ fontSize:13, fontWeight:600, color: active ? T.blue800 : T.gray800 }}>{m.label}</span>
                {active && <span style={{ marginLeft:"auto", fontSize:9, fontWeight:600, color:T.blue600, textTransform:"uppercase", letterSpacing:".05em" }}>Attivo</span>}
              </div>
              <div style={{ fontSize:11, color:T.gray600, lineHeight:1.45 }}>{m.description}</div>
            </button>
          );
        })}
      </div>

      {/* Editor + anteprima */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:14, alignItems:"start" }}>
        <div style={{ background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:10, padding:16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:600 }}>Parametri — {activeModel.label}</div>
            <button onClick={() => resetParams(config.activeModelId)}
              style={{ padding:"5px 11px", borderRadius:6, border:`0.5px solid ${T.gray200}`, background:"#fff", color:T.gray600, fontSize:11, cursor:"pointer" }}>
              ↺ Ripristina default
            </button>
          </div>
          {activeModel.id === "legacy"
            ? <LegacyParams params={activeParams} update={update} />
            : <MatrixParams params={activeParams} update={update} />}
        </div>

        <div style={{ background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:10, padding:16, position:"sticky", top:70 }}>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:4 }}>Anteprima live</div>
          <LivePreview />
        </div>
      </div>
    </div>
  );
}

// ─── Stili tabellari condivisi ─────────────────────────────────────────────────
const cellH = { padding:"5px 8px", textAlign:"center", background:T.gray50, border:`0.5px solid ${T.gray100}`, color:T.gray600, fontWeight:500, fontSize:10 };
const cell  = { padding:"3px 5px", textAlign:"center", border:`0.5px solid ${T.gray100}` };
const lbl   = { display:"inline-flex", alignItems:"center", gap:6, fontSize:11, color:T.gray600 };
