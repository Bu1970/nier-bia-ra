import { useState, useCallback } from "react";

// ─── Palette (allineata al design system NIER) ────────────────────────────────
const T = {
  blue50:"#E6F1FB", blue100:"#B5D4F4", blue400:"#378ADD", blue600:"#185FA5", blue800:"#0C447C",
  teal50:"#E1F5EE", teal400:"#1D9E75", teal600:"#0F6E56",
  amber50:"#FAEEDA",amber400:"#BA7517",amber600:"#854F0B",
  red50:"#FCEBEB",  red400:"#E24B4A",  red600:"#A32D2D",
  green50:"#EAF3DE",green400:"#639922",green600:"#3B6D11",
  gray50:"#F1EFE8", gray100:"#D3D1C7", gray200:"#B4B2A9",
  gray400:"#888780",gray600:"#5F5E5A", gray800:"#444441",
};

// ─── Finestre temporali BIA (dalla procedura NIER) ────────────────────────────
// Le finestre rappresentano la durata dell'interruzione valutata.
export const BIA_WINDOWS = [
  { id:"1h",  label:"1h",   hours:1    },
  { id:"4h",  label:"4h",   hours:4    },
  { id:"8h",  label:"8h",   hours:8    },
  { id:"1g",  label:"1g",   hours:24   },
  { id:"3g",  label:"3g",   hours:72   },
  { id:"7g",  label:"7g",   hours:168  },
  { id:"14g", label:"14g",  hours:336  },
  { id:"30g", label:"30g",  hours:720  },
];

// ─── Dimensioni di impatto (dalla procedura NIER §6.3) ────────────────────────
export const IMPACT_DIMS = [
  { id:"reputation", label:"Reputazione / Fiducia clienti" },
  { id:"legal",      label:"Legale / Normativo"            },
  { id:"financial",  label:"Finanziario"                   },
];

// ─── Scala impatti (dalla tabella §6.3) ──────────────────────────────────────
// 0 = nessuno, 1 = basso, 2 = medio, 3 = alto, 4 = critico
export const IMPACT_LEVELS = [
  { v:0, label:"—",       short:"—",       color:"#888780", bg:"#F1EFE8" },
  { v:1, label:"Basso",   short:"Basso",   color:"#3B6D11", bg:"#EAF3DE" },
  { v:2, label:"Medio",   short:"Medio",   color:"#854F0B", bg:"#FAEEDA" },
  { v:3, label:"Alto",    short:"Alto",    color:"#A32D2D", bg:"#FCEBEB" },
  { v:4, label:"Critico", short:"Critico", color:"#7C1D1D", bg:"#F7C1C1" },
];

// ─── MTPD engine (dalla procedura §6.3.2) ────────────────────────────────────
// "MTPD = finestra temporale in cui si determina impatto critico (livello 4).
//  Se nessuna finestra raggiunge il critico entro 30gg → MTPD = 30g."
export function computeMTPD(biaCells) {
  // biaCells: { [dimId]: [v_w0, v_w1, ..., v_w7] }
  // Cerca la prima finestra in cui almeno una dimensione raggiunge il critico (4).
  for (let wi = 0; wi < BIA_WINDOWS.length; wi++) {
    const hasCritical = IMPACT_DIMS.some(d => (biaCells[d.id]?.[wi] ?? 0) === 4);
    if (hasCritical) return BIA_WINDOWS[wi];
  }
  // Nessun critico trovato → MTPD = 30g (ultima finestra)
  return BIA_WINDOWS[BIA_WINDOWS.length - 1];
}

// ─── RTO finale (dalla procedura §6.3.2) ─────────────────────────────────────
// RTO finale = max(RTO_owner, RTO_IT)
// "L'RTO del processo non può essere inferiore all'RTO IT."
export function computeFinalRTO(rtoOwnerHours, rtoITHours) {
  return Math.max(rtoOwnerHours ?? 0, rtoITHours ?? 0);
}

// ─── Verifica coerenza RTO ≤ MTPD ────────────────────────────────────────────
export function checkRTOvsMTPD(finalRTOHours, mtpdWindow) {
  return finalRTOHours <= mtpdWindow.hours;
}

// ─── Componente: selettore livello impatto per singola cella ──────────────────
function ImpactSelector({ value, onChange, disabled }) {
  return (
    <div style={{ display:"flex", gap:2 }}>
      {IMPACT_LEVELS.map(lv => (
        <button
          key={lv.v}
          disabled={disabled}
          onClick={() => onChange(value === lv.v ? 0 : lv.v)}
          title={lv.label}
          style={{
            width: 36, height: 28, border:"none", borderRadius:4,
            background: value === lv.v ? lv.bg : T.gray50,
            color: value === lv.v ? lv.color : T.gray400,
            fontWeight: value === lv.v ? 700 : 400,
            fontSize: 10, cursor: disabled ? "default" : "pointer",
            outline: value === lv.v ? `1.5px solid ${lv.color}` : "none",
            transition:"all .12s",
          }}
        >
          {lv.short === "—" ? "—" : lv.v}
        </button>
      ))}
    </div>
  );
}

// ─── Componente: riga di una dimensione nella matrice ────────────────────────
function BIADimRow({ dim, values, onChange, readOnly }) {
  return (
    <tr>
      <td style={{
        padding:"7px 10px", fontSize:11, fontWeight:500, color:T.gray800,
        background:T.gray50, borderRight:`0.5px solid ${T.gray100}`,
        whiteSpace:"nowrap", minWidth:160,
      }}>
        {dim.label}
      </td>
      {BIA_WINDOWS.map((w, wi) => {
        const v = values[wi] ?? 0;
        const lv = IMPACT_LEVELS[v] || IMPACT_LEVELS[0];
        return (
          <td key={w.id} style={{
            padding:"5px 4px", textAlign:"center",
            background: v > 0 ? lv.bg : "transparent",
            borderRight:`0.5px solid ${T.gray100}`,
            transition:"background .15s",
          }}>
            {readOnly ? (
              <span style={{
                display:"inline-block", padding:"2px 6px", borderRadius:4,
                fontSize:10, fontWeight: v > 0 ? 600 : 400,
                color: v > 0 ? lv.color : T.gray200,
              }}>
                {lv.short}
              </span>
            ) : (
              <ImpactSelector value={v} onChange={val => onChange(wi, val)} />
            )}
          </td>
        );
      })}
    </tr>
  );
}

// ─── Componente: riga RTO nell'intestazione della matrice ────────────────────
function RTOMarkerRow({ mtpd, rtoOwner, rtoIT, finalRTO }) {
  const rtoCoherent = checkRTOvsMTPD(finalRTO, mtpd);
  return (
    <tr style={{ borderTop:`1.5px solid ${T.blue100}` }}>
      <td style={{
        padding:"6px 10px", fontSize:10, fontWeight:500, color:T.blue800,
        background:T.blue50, borderRight:`0.5px solid ${T.gray100}`,
      }}>
        Indicatori RTO / MTPD
      </td>
      {BIA_WINDOWS.map((w, wi) => {
        const isMTPD     = mtpd?.id === w.id;
        const isRTOOwner = rtoOwner && Math.abs(rtoOwner - w.hours) < 0.5;
        const isRTOIT    = rtoIT    && Math.abs(rtoIT    - w.hours) < 0.5;
        const isFinal    = finalRTO && Math.abs(finalRTO - w.hours) < 0.5;
        return (
          <td key={w.id} style={{
            padding:"4px 3px", textAlign:"center",
            background: isMTPD ? "#F7C1C1" : isFinal ? T.blue50 : "transparent",
            borderRight:`0.5px solid ${T.gray100}`,
          }}>
            <div style={{ display:"flex", flexDirection:"column", gap:2, alignItems:"center" }}>
              {isMTPD     && <span style={{ fontSize:9, padding:"1px 4px", borderRadius:3, background:T.red400,  color:"#fff", fontWeight:600 }}>MTPD</span>}
              {isRTOOwner && <span style={{ fontSize:9, padding:"1px 4px", borderRadius:3, background:T.gray400, color:"#fff" }}>RTO owner</span>}
              {isRTOIT    && <span style={{ fontSize:9, padding:"1px 4px", borderRadius:3, background:T.teal400, color:"#fff" }}>RTO IT</span>}
              {isFinal && !isRTOOwner && !isRTOIT && <span style={{ fontSize:9, padding:"1px 4px", borderRadius:3, background:T.blue600, color:"#fff", fontWeight:600 }}>RTO finale</span>}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

// ─── Pannello riepilogo MTPD / RTO ───────────────────────────────────────────
function BIASummary({ mtpd, rtoOwnerHours, rtoITHours, finalRTOHours, procName }) {
  const coherent = checkRTOvsMTPD(finalRTOHours, mtpd);
  const rtoLabel = h => {
    if (!h) return "—";
    if (h < 24) return `${h}h`;
    return `${Math.round(h / 24)}g`;
  };
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16,
    }}>
      {/* MTPD */}
      <div style={{
        background:T.red50, border:`1px solid ${T.red400}`, borderRadius:8,
        padding:"10px 13px",
      }}>
        <div style={{ fontSize:10, color:T.red600, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>MTPD (calcolato)</div>
        <div style={{ fontSize:22, fontWeight:600, color:T.red600 }}>{mtpd?.label ?? "—"}</div>
        <div style={{ fontSize:10, color:T.red400, marginTop:3 }}>Prima finestra con impatto critico</div>
      </div>
      {/* RTO owner */}
      <div style={{ background:T.gray50, border:`0.5px solid ${T.gray200}`, borderRadius:8, padding:"10px 13px" }}>
        <div style={{ fontSize:10, color:T.gray600, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>RTO dichiarato (owner)</div>
        <div style={{ fontSize:22, fontWeight:500, color:T.gray800 }}>{rtoLabel(rtoOwnerHours)}</div>
        <div style={{ fontSize:10, color:T.gray400, marginTop:3 }}>Dichiarato dal process owner</div>
      </div>
      {/* RTO IT */}
      <div style={{ background:T.teal50, border:`0.5px solid ${T.teal400}`, borderRadius:8, padding:"10px 13px" }}>
        <div style={{ fontSize:10, color:T.teal600, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>RTO IT</div>
        <div style={{ fontSize:22, fontWeight:500, color:T.teal600 }}>{rtoLabel(rtoITHours)}</div>
        <div style={{ fontSize:10, color:T.teal400, marginTop:3 }}>Da BIA IT (limite minimo)</div>
      </div>
      {/* RTO finale */}
      <div style={{
        background: coherent ? T.blue50 : T.amber50,
        border:`1px solid ${coherent ? T.blue400 : T.amber400}`,
        borderRadius:8, padding:"10px 13px",
      }}>
        <div style={{ fontSize:10, color: coherent ? T.blue600 : T.amber600, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>RTO finale</div>
        <div style={{ fontSize:22, fontWeight:600, color: coherent ? T.blue800 : T.amber600 }}>{rtoLabel(finalRTOHours)}</div>
        <div style={{ fontSize:10, color: coherent ? T.blue400 : T.amber600, marginTop:3 }}>
          {coherent ? "max(RTO owner, RTO IT) ✓ ≤ MTPD" : "⚠ RTO finale > MTPD — verificare"}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principale: BIAMatrix ────────────────────────────────────────
// Props:
//   processId      string
//   processName    string
//   rtoOwnerHours  number   — RTO dichiarato dall'owner (in ore)
//   rtoITHours     number   — RTO da BIA IT (in ore)
//   initialCells   object   — { reputation:[], legal:[], financial:[] } (valori 0-4)
//   initialNotes   string
//   peakPeriod     string   — es. "Nov–Dic (+40%)"
//   readOnly       bool
//   onChange       fn({cells, notes, mtpd, finalRTOHours})
export function BIAMatrix({
  processName  = "Processo",
  rtoOwnerHours = null,
  rtoITHours    = null,
  initialCells  = {},
  initialNotes  = "",
  peakPeriod    = "",
  readOnly      = false,
  onChange,
}) {
  // Stato interno: cells[dimId][winIdx] = 0..4
  const [cells, setCells] = useState(() => {
    const base = {};
    IMPACT_DIMS.forEach(d => {
      base[d.id] = initialCells[d.id]
        ? [...initialCells[d.id]]
        : new Array(BIA_WINDOWS.length).fill(0);
    });
    return base;
  });
  const [notes, setNotes]   = useState(initialNotes);
  const [editNotes, setEditNotes] = useState(false);

  // Calcoli derivati
  const mtpd        = computeMTPD(cells);
  const finalRTO    = computeFinalRTO(rtoOwnerHours, rtoITHours);
  const rtoCoherent = checkRTOvsMTPD(finalRTO, mtpd);

  const handleCellChange = useCallback((dimId, winIdx, val) => {
    setCells(prev => {
      const next = { ...prev, [dimId]: [...prev[dimId]] };
      next[dimId][winIdx] = val;
      const newMTPD    = computeMTPD(next);
      const newFinalRTO = computeFinalRTO(rtoOwnerHours, rtoITHours);
      onChange?.({ cells: next, notes, mtpd: newMTPD, finalRTOHours: newFinalRTO });
      return next;
    });
  }, [notes, rtoOwnerHours, rtoITHours, onChange]);

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", fontSize:13, color:T.gray800 }}>

      {/* Avviso incoerenza RTO > MTPD */}
      {!rtoCoherent && (
        <div style={{
          background:T.amber50, border:`0.5px solid ${T.amber400}`, borderRadius:7,
          padding:"9px 12px", marginBottom:12, fontSize:11, color:T.amber600,
          display:"flex", alignItems:"flex-start", gap:8,
        }}>
          <span style={{ fontSize:15, flexShrink:0 }}>⚠</span>
          <span>
            <strong>Incoerenza RTO / MTPD</strong> — L'RTO finale (
            {finalRTO < 24 ? `${finalRTO}h` : `${Math.round(finalRTO/24)}g`}) risulta
            superiore all'MTPD calcolato ({mtpd?.label}).
            L'RTO non può superare l'MTPD: verificare i valori di impatto o l'RTO dichiarato.
          </span>
        </div>
      )}

      {/* Riepilogo KPI */}
      <BIASummary
        mtpd={mtpd}
        rtoOwnerHours={rtoOwnerHours}
        rtoITHours={rtoITHours}
        finalRTOHours={finalRTO}
        procName={processName}
      />

      {/* Picco operativo */}
      {peakPeriod && peakPeriod !== "—" && (
        <div style={{
          background:T.red50, border:`0.5px solid ${T.red400}`, borderRadius:7,
          padding:"7px 12px", marginBottom:12, fontSize:11, color:T.red600,
          display:"flex", alignItems:"center", gap:6,
        }}>
          <span style={{ fontSize:13 }}>📅</span>
          <span>
            <strong>Picco operativo:</strong> {peakPeriod} — In questo periodo un'interruzione
            può avere impatto amplificato. Considerare un MTPD ridotto.
          </span>
        </div>
      )}

      {/* Legenda livelli */}
      <div style={{
        display:"flex", gap:6, alignItems:"center", marginBottom:10,
        flexWrap:"wrap", fontSize:10,
      }}>
        <span style={{ color:T.gray400, marginRight:2 }}>Livelli di impatto:</span>
        {IMPACT_LEVELS.map(lv => (
          <span key={lv.v} style={{
            padding:"2px 8px", borderRadius:8, background:lv.bg, color:lv.color,
            fontWeight:500, border:`0.5px solid ${lv.color}20`,
          }}>
            {lv.v} – {lv.label}
          </span>
        ))}
        {!readOnly && (
          <span style={{ color:T.gray400, marginLeft:6 }}>
            · Clicca i bottoni nella matrice per assegnare il livello di impatto per ogni finestra temporale
          </span>
        )}
      </div>

      {/* Matrice BIA */}
      <div style={{ overflowX:"auto", borderRadius:10, border:`0.5px solid ${T.gray100}` }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
          <thead>
            {/* Intestazione finestre temporali */}
            <tr style={{ background:T.gray50 }}>
              <th style={{
                padding:"8px 10px", textAlign:"left", fontSize:10, fontWeight:500,
                color:T.gray400, borderRight:`0.5px solid ${T.gray100}`,
                textTransform:"uppercase", letterSpacing:".05em", minWidth:160,
              }}>
                Dimensione di impatto
              </th>
              {BIA_WINDOWS.map(w => (
                <th key={w.id} style={{
                  padding:"8px 6px", textAlign:"center", fontSize:11, fontWeight:600,
                  color:T.blue800, borderRight:`0.5px solid ${T.gray100}`, minWidth:80,
                }}>
                  {w.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Righe dimensioni */}
            {IMPACT_DIMS.map((dim, di) => (
              <BIADimRow
                key={dim.id}
                dim={dim}
                values={cells[dim.id] ?? []}
                onChange={(wi, val) => handleCellChange(dim.id, wi, val)}
                readOnly={readOnly}
              />
            ))}
            {/* Riga marker MTPD / RTO */}
            <RTOMarkerRow
              mtpd={mtpd}
              rtoOwner={rtoOwnerHours}
              rtoIT={rtoITHours}
              finalRTO={finalRTO}
            />
          </tbody>
        </table>
      </div>

      {/* Note e commenti */}
      <div style={{ marginTop:14 }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:5,
        }}>
          <label style={{
            fontSize:10, fontWeight:500, color:T.gray600,
            textTransform:"uppercase", letterSpacing:".05em",
          }}>
            Note e motivazioni
          </label>
          {!readOnly && (
            <button
              onClick={() => setEditNotes(e => !e)}
              style={{
                fontSize:11, color:T.blue600, background:"none", border:"none",
                cursor:"pointer", textDecoration:"underline",
              }}
            >
              {editNotes ? "Chiudi" : "Modifica"}
            </button>
          )}
        </div>
        {editNotes && !readOnly ? (
          <textarea
            value={notes}
            onChange={e => {
              setNotes(e.target.value);
              onChange?.({ cells, notes: e.target.value, mtpd, finalRTOHours: finalRTO });
            }}
            rows={3}
            placeholder="Motivare le scelte effettuate, indicare eventuali assunzioni o condizioni particolari…"
            style={{
              width:"100%", padding:"8px 10px", border:`0.5px solid ${T.gray200}`,
              borderRadius:6, fontSize:12, color:T.gray800, outline:"none",
              resize:"vertical", lineHeight:1.5, fontFamily:"inherit",
            }}
          />
        ) : (
          <div style={{
            padding:"8px 10px", background:T.gray50, borderRadius:6,
            fontSize:12, color: notes ? T.gray800 : T.gray400, lineHeight:1.5,
            minHeight:40, border:`0.5px solid ${T.gray100}`,
          }}>
            {notes || "Nessuna nota inserita."}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dati di esempio per la demo ──────────────────────────────────────────────
const SAMPLE_PROCESSES = [
  {
    id:1, name:"Production MM", sito:"Montecchio Maggiore",
    owner:"M. Ferretti", macro:"Operations",
    rtoOwnerHours: 8, rtoITHours: 12,
    peakPeriod:"Nov–Dic (+40%)",
    notes:"Impatto critico finanziario atteso già a 7gg. Picco Nov-Dic può anticipare il critico a 3gg.",
    cells: {
      reputation: [0, 0, 1, 1, 2, 3, 4, 4],
      legal:      [0, 0, 0, 1, 1, 2, 3, 4],
      financial:  [0, 1, 1, 2, 3, 3, 4, 4],
    },
  },
  {
    id:7, name:"IT Infrastructure", sito:"Milano",
    owner:"L. Moretti", macro:"IT",
    rtoOwnerHours: 4, rtoITHours: 4,
    peakPeriod:"—",
    notes:"MTPD molto basso: tutti i processi aziendali dipendono dall'IT. Downtime critico già a 8h.",
    cells: {
      reputation: [0, 1, 2, 3, 4, 4, 4, 4],
      legal:      [0, 0, 1, 2, 3, 3, 4, 4],
      financial:  [0, 1, 2, 3, 4, 4, 4, 4],
    },
  },
  {
    id:11, name:"HSE", sito:"Montecchio Maggiore",
    owner:"G. Monti", macro:"HSE",
    rtoOwnerHours: 2, rtoITHours: 4,
    peakPeriod:"—",
    notes:"Impatto legale/normativo elevatissimo: segnalazione obbligatoria entro 8h da evento.",
    cells: {
      reputation: [0, 2, 3, 4, 4, 4, 4, 4],
      legal:      [0, 1, 3, 4, 4, 4, 4, 4],
      financial:  [0, 0, 1, 2, 3, 3, 3, 3],
    },
  },
  {
    id:4, name:"Supply Chain S&OP", sito:"Montecchio Maggiore",
    owner:"R. Greco", macro:"Supply Chain",
    rtoOwnerHours: 24, rtoITHours: 24,
    peakPeriod:"Jan (+20%)",
    notes:"Impatto supply chain visibile dopo 3gg di interruzione, critico a 14gg.",
    cells: {
      reputation: [0, 0, 0, 1, 1, 2, 3, 3],
      legal:      [0, 0, 0, 0, 1, 1, 2, 3],
      financial:  [0, 0, 1, 1, 2, 3, 3, 4],
    },
  },
  {
    // Processo nuovo senza dati → utente deve compilare
    id:3, name:"Production TE", sito:"Termoli",
    owner:"D. Esposito", macro:"Operations",
    rtoOwnerHours: 16, rtoITHours: 24,
    peakPeriod:"Giu–Set (+30%)",
    notes:"",
    cells: {
      reputation: new Array(8).fill(0),
      legal:      new Array(8).fill(0),
      financial:  new Array(8).fill(0),
    },
  },
];

function rtoLabel(h) {
  if (!h && h !== 0) return "—";
  if (h < 24) return `${h}h`;
  if (h === 24) return "1g";
  return `${Math.round(h / 24)}g`;
}

// ─── App demo ─────────────────────────────────────────────────────────────────
export default function BIAEngineDemo() {
  const [selProcId, setSelProcId] = useState(1);
  const [procData,  setProcData]  = useState(
    Object.fromEntries(SAMPLE_PROCESSES.map(p => [p.id, { cells:p.cells, notes:p.notes }]))
  );
  const [toast, setToast]   = useState(null);

  const proc = SAMPLE_PROCESSES.find(p => p.id === selProcId) || SAMPLE_PROCESSES[0];
  const data = procData[selProcId];

  // Calcoli live per la lista processi
  const procSummaries = SAMPLE_PROCESSES.map(p => {
    const d = procData[p.id];
    const mtpd = computeMTPD(d.cells);
    const finalRTO = computeFinalRTO(p.rtoOwnerHours, p.rtoITHours);
    const coherent = checkRTOvsMTPD(finalRTO, mtpd);
    const filled = IMPACT_DIMS.some(dim => d.cells[dim.id]?.some(v => v > 0));
    return { ...p, mtpd, finalRTO, coherent, filled };
  });

  function handleBIAChange({ cells, notes, mtpd, finalRTOHours }) {
    setProcData(prev => ({ ...prev, [selProcId]: { cells, notes } }));
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", background:T.gray50, minHeight:"100vh" }}>

      {/* Toast */}
      <div style={{
        position:"fixed", bottom:20, left:"50%",
        transform:`translateX(-50%) translateY(${toast ? 0 : 12}px)`,
        background:T.teal600, color:"#fff", padding:"8px 16px", borderRadius:7,
        fontSize:11, fontWeight:500, opacity:toast ? 1 : 0,
        transition:"opacity .2s, transform .2s", zIndex:200, pointerEvents:"none",
      }}>✓ {toast}</div>

      {/* Header */}
      <div style={{
        background:"#fff", borderBottom:`0.5px solid ${T.gray100}`,
        padding:"11px 20px", display:"flex", alignItems:"center",
        justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            width:28, height:28, background:T.blue600, borderRadius:6,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"#fff", fontSize:13, fontWeight:600,
          }}>N</div>
          <div style={{ width:1, height:24, background:T.gray100 }} />
          <span style={{ fontSize:13, fontWeight:500, color:T.gray800 }}>BIA Engine</span>
          <span style={{ fontSize:11, color:T.gray400 }}>
            Business Impact Analysis · ISO 22301
          </span>
        </div>
        <button
          onClick={() => showToast("BIA salvata")}
          style={{
            padding:"7px 14px", borderRadius:7, border:"none",
            background:T.blue600, color:"#fff", fontWeight:500,
            fontSize:12, cursor:"pointer",
          }}
        >
          Salva BIA
        </button>
      </div>

      <div style={{ display:"flex", minHeight:"calc(100vh - 51px)" }}>

        {/* Sidebar lista processi */}
        <div style={{
          width:220, background:"#fff", borderRight:`0.5px solid ${T.gray100}`,
          overflowY:"auto", flexShrink:0,
        }}>
          <div style={{
            padding:"10px 12px 6px", fontSize:10, fontWeight:500,
            color:T.gray400, textTransform:"uppercase", letterSpacing:".05em",
          }}>
            Processi da analizzare
          </div>
          {procSummaries.map(p => (
            <button
              key={p.id}
              onClick={() => setSelProcId(p.id)}
              style={{
                display:"block", width:"100%", textAlign:"left",
                padding:"9px 12px", border:"none", cursor:"pointer",
                background: selProcId === p.id ? T.blue50 : "transparent",
                borderLeft: selProcId === p.id ? `2.5px solid ${T.blue600}` : "2.5px solid transparent",
                transition:"all .1s",
              }}
              onMouseEnter={e => { if (selProcId !== p.id) e.currentTarget.style.background = T.gray50; }}
              onMouseLeave={e => { if (selProcId !== p.id) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                <span style={{
                  width:7, height:7, borderRadius:"50%", flexShrink:0,
                  background: !p.filled ? T.gray200
                    : !p.coherent ? T.amber400
                    : T.teal400,
                }} />
                <span style={{
                  fontSize:11, fontWeight: selProcId === p.id ? 500 : 400,
                  color: selProcId === p.id ? T.blue800 : T.gray800,
                  lineHeight:1.3,
                }}>
                  {p.name}
                </span>
              </div>
              <div style={{ display:"flex", gap:5, marginLeft:13 }}>
                {p.filled ? (
                  <>
                    <span style={{
                      fontSize:9, padding:"1px 5px", borderRadius:4,
                      background:T.red50, color:T.red600, fontWeight:500,
                    }}>
                      MTPD {p.mtpd.label}
                    </span>
                    <span style={{
                      fontSize:9, padding:"1px 5px", borderRadius:4,
                      background: p.coherent ? T.blue50 : T.amber50,
                      color: p.coherent ? T.blue800 : T.amber600, fontWeight:500,
                    }}>
                      RTO {rtoLabel(p.finalRTO)}
                    </span>
                  </>
                ) : (
                  <span style={{
                    fontSize:9, padding:"1px 5px", borderRadius:4,
                    background:T.gray50, color:T.gray400,
                  }}>
                    Da compilare
                  </span>
                )}
              </div>
            </button>
          ))}

          {/* Legenda stato */}
          <div style={{ padding:"12px", borderTop:`0.5px solid ${T.gray100}`, marginTop:8 }}>
            {[
              [T.teal400,  "BIA completata"],
              [T.amber400, "Incoerenza RTO/MTPD"],
              [T.gray200,  "Da compilare"],
            ].map(([c, l]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, fontSize:10, color:T.gray600 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:c }} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Area principale */}
        <div style={{ flex:1, padding:20, overflowY:"auto" }}>

          {/* Intestazione processo */}
          <div style={{
            background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:10,
            padding:"14px 16px", marginBottom:16,
            display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          }}>
            <div>
              <div style={{ fontSize:15, fontWeight:500, color:T.gray800 }}>{proc.name}</div>
              <div style={{ fontSize:11, color:T.gray400, marginTop:2 }}>
                {proc.macro} · {proc.sito} · Owner: {proc.owner}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {/* Input RTO owner */}
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:T.gray400, marginBottom:2 }}>RTO owner dichiarato</div>
                <div style={{ fontSize:12, fontWeight:500, color:T.gray800 }}>
                  {rtoLabel(proc.rtoOwnerHours)}
                </div>
              </div>
              <div style={{ width:1, height:28, background:T.gray100 }} />
              {/* Input RTO IT */}
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:T.teal600, marginBottom:2 }}>RTO IT</div>
                <div style={{ fontSize:12, fontWeight:500, color:T.teal600 }}>
                  {rtoLabel(proc.rtoITHours)}
                </div>
              </div>
            </div>
          </div>

          {/* Infobox metodologia */}
          <div style={{
            background:T.blue50, border:`0.5px solid ${T.blue100}`, borderRadius:7,
            padding:"8px 12px", marginBottom:14, fontSize:11, color:T.blue800,
            display:"flex", gap:8,
          }}>
            <span style={{ fontSize:14, flexShrink:0 }}>ℹ</span>
            <span>
              Per ogni finestra temporale, seleziona il livello di impatto (0–4) per ciascuna
              dimensione. L'<strong>MTPD</strong> è calcolato automaticamente come la prima
              finestra in cui almeno una dimensione raggiunge il livello <strong>4 – Critico</strong>.
              L'<strong>RTO finale</strong> è il massimo tra RTO owner e RTO IT (principio conservativo).
            </span>
          </div>

          {/* Matrice BIA */}
          <div style={{
            background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:10,
            padding:16,
          }}>
            <BIAMatrix
              processName={proc.name}
              rtoOwnerHours={proc.rtoOwnerHours}
              rtoITHours={proc.rtoITHours}
              initialCells={data.cells}
              initialNotes={data.notes}
              peakPeriod={proc.peakPeriod}
              onChange={handleBIAChange}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
