import { useState, useMemo } from "react";

// ─── Palette ──────────────────────────────────────────────────────────────────
const T = {
  blue50:"#E6F1FB", blue100:"#B5D4F4", blue400:"#378ADD", blue600:"#185FA5", blue800:"#0C447C",
  teal50:"#E1F5EE", teal400:"#1D9E75", teal600:"#0F6E56", teal800:"#085041",
  amber50:"#FAEEDA",amber400:"#BA7517",amber600:"#854F0B",
  red50:"#FCEBEB",  red100:"#F7C1C1",  red400:"#E24B4A",  red600:"#A32D2D",  red800:"#7C1D1D",
  green50:"#EAF3DE",green400:"#639922",green600:"#3B6D11",
  gray50:"#F1EFE8", gray100:"#D3D1C7", gray200:"#B4B2A9",
  gray400:"#888780",gray600:"#5F5E5A", gray800:"#444441",
  pu50:"#EEEDFE",   pu600:"#534AB7",   pu800:"#3C3489",
};

// ─── Costanti metodologiche (dalla procedura NIER §6.5) ───────────────────────

// Matrice VxL (Vulnerabilità × Likelihood) — valori numerici per il calcolo
// Righe = Vulnerabilità, Colonne = Likelihood (bassa/media/alta)
//          Lk_b  Lk_m  Lk_a
const VXL_MATRIX = {
  basso: { bassa:1, media:2, alta: 3 },
  medio: { bassa:2, media:4, alta: 6 },
  alto:  { bassa:3, media:6, alta: 9 },
};

// Normalizzazione MTPD: finestra → valore normalizzato (0–1, inversamente proporzionale alla durata)
// MTPD breve = processo più critico = valore più alto
// MTPDmax = 720h (30g) → normalizzato = 1 (meno critico)
// MTPD 1h  → normalizzato vicino a 0 (più critico)
// Formula: norm = MTPD_ore / MTPD_max_ore
const MTPD_MAX_H  = 720; // 30g
const RTO_MAX_H   = 720; // 30g

/**
 * Calcola Criticality(MTPD) e Criticality(RTO) secondo la procedura NIER §6.5.
 *
 * Formule:
 *   Criticality(MTPD) = (MTPD_h / MTPD_max_h) / VxL
 *   Criticality(RTO)  = (RTO_h  / RTO_max_h)  / VxL
 *
 * Soglie classificazione (procedura §6.5):
 *   C ≤ 0.05            → Molto Alta
 *   0.05 < C ≤ 0.14     → Alta
 *   0.14 < C ≤ 0.24     → Media
 *   0.24 < C ≤ 0.35     → Bassa
 *   C > 0.35            → Molto Bassa
 *
 * La criticità finale è il valore più basso (= più conservativo) tra i due indici.
 */
export function computeCriticality({ mtpdHours, rtoHours, vuln, likelihood }) {
  const vxl = VXL_MATRIX[vuln]?.[likelihood] ?? 1;

  const cMTPD = (mtpdHours / MTPD_MAX_H) / vxl;
  const cRTO  = (rtoHours  / RTO_MAX_H)  / vxl;

  // Criticità finale = valore più basso (più conservativo)
  const cFinal = Math.min(cMTPD, cRTO);

  return {
    vxl,
    cMTPD:  round4(cMTPD),
    cRTO:   round4(cRTO),
    cFinal: round4(cFinal),
    classMTPD:  classifyC(cMTPD),
    classRTO:   classifyC(cRTO),
    classFinal: classifyC(cFinal),
  };
}

function round4(v) { return Math.round(v * 10000) / 10000; }

export function classifyC(c) {
  if (c <= 0.05)                 return "molto alta";
  if (c > 0.05  && c <= 0.14)   return "alta";
  if (c > 0.14  && c <= 0.24)   return "media";
  if (c > 0.24  && c <= 0.35)   return "bassa";
  return                                "molto bassa";
}

// ─── Metadati visuali per i livelli di criticità ──────────────────────────────
export const CRIT_META = {
  "molto alta":  { color: T.red800,   bg: T.red100,   border: T.red400   },
  "alta":        { color: T.red600,   bg: T.red50,    border: T.red400   },
  "media":       { color: T.blue800,  bg: T.blue50,   border: T.blue400  },
  "bassa":       { color: T.green600, bg: T.green50,  border: T.green400 },
  "molto bassa": { color: T.teal600,  bg: T.teal50,   border: T.teal400  },
};

// Metadati per Vulnerabilità
export const VULN_META = {
  alto:  { color: T.red600,   bg: T.red50   },
  medio: { color: T.amber600, bg: T.amber50 },
  basso: { color: T.green600, bg: T.green50 },
};

// Metadati per Likelihood
export const LK_META = {
  alta:  { color: T.red600,   bg: T.red50   },
  media: { color: T.amber600, bg: T.amber50 },
  bassa: { color: T.green600, bg: T.green50 },
};

// ─── Badge component ──────────────────────────────────────────────────────────
function Badge({ children, bg, color, border }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", padding:"2px 8px",
      borderRadius:10, fontSize:10, fontWeight:500,
      background:bg, color,
      border: border ? `0.5px solid ${border}` : "none",
      whiteSpace:"nowrap",
    }}>
      {children}
    </span>
  );
}

function CritBadge({ level, size = "normal" }) {
  const m = CRIT_META[level] || CRIT_META["media"];
  const pad = size === "large" ? "3px 10px" : "2px 8px";
  const fs  = size === "large" ? 11 : 10;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", padding:pad,
      borderRadius:10, fontSize:fs, fontWeight:600,
      background:m.bg, color:m.color, border:`0.5px solid ${m.border}`,
      whiteSpace:"nowrap",
    }}>
      {level}
    </span>
  );
}

// ─── Barra di visualizzazione indice (da 0 a 1) ───────────────────────────────
// Attenzione: valori bassi = criticità alta; la barra è invertita visivamente.
function CritBar({ value, classLevel }) {
  const m = CRIT_META[classLevel] || CRIT_META["media"];
  const pct = Math.min(value / 0.5, 1) * 100; // scala 0–0.5 → 0–100%
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:6, borderRadius:3, background:T.gray100, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:3,
          width:`${pct}%`,
          background: m.color,
          transition:"width .3s",
        }}/>
      </div>
      <span style={{ fontSize:10, fontWeight:500, color:m.color, minWidth:36, textAlign:"right" }}>
        {value.toFixed(4)}
      </span>
    </div>
  );
}

// ─── Matrice VxL interattiva ──────────────────────────────────────────────────
function VxLMatrix({ selectedVuln, selectedLk }) {
  const vulns = ["basso","medio","alto"];
  const lks   = ["bassa","media","alta"];
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ borderCollapse:"collapse", fontSize:10 }}>
        <thead>
          <tr>
            <th style={{ padding:"5px 10px", textAlign:"left", background:T.gray50,
              borderRight:`0.5px solid ${T.gray100}`, borderBottom:`0.5px solid ${T.gray100}`,
              color:T.gray600, fontSize:10 }}>Vuln. / Likelihood</th>
            {lks.map(lk => (
              <th key={lk} style={{
                padding:"5px 14px", textAlign:"center",
                background: selectedLk===lk ? LK_META[lk].bg : T.gray50,
                color: selectedLk===lk ? LK_META[lk].color : T.gray600,
                borderRight:`0.5px solid ${T.gray100}`,
                borderBottom:`0.5px solid ${T.gray100}`,
                fontWeight: selectedLk===lk ? 600 : 400,
                transition:"all .15s",
              }}>
                Lk {lk}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vulns.map(v => (
            <tr key={v}>
              <td style={{
                padding:"5px 10px", fontWeight:500, fontSize:10,
                background: selectedVuln===v ? VULN_META[v].bg : T.gray50,
                color: selectedVuln===v ? VULN_META[v].color : T.gray600,
                borderRight:`0.5px solid ${T.gray100}`,
                borderBottom:`0.5px solid ${T.gray100}`,
                transition:"all .15s",
              }}>
                Vuln. {v}
              </td>
              {lks.map(lk => {
                const score  = VXL_MATRIX[v][lk];
                const active = selectedVuln===v && selectedLk===lk;
                const maxScore = 9;
                const intensity = score / maxScore;
                const bg = active ? T.blue600
                  : score >= 6 ? T.red100 : score >= 3 ? T.amber50 : T.green50;
                const col = active ? "#fff"
                  : score >= 6 ? T.red800 : score >= 3 ? T.amber600 : T.green600;
                return (
                  <td key={lk} style={{
                    padding:"6px 14px", textAlign:"center", fontWeight: active ? 700 : 500,
                    background: bg, color: col,
                    borderRight:`0.5px solid ${T.gray100}`,
                    borderBottom:`0.5px solid ${T.gray100}`,
                    fontSize:11, transition:"all .15s",
                    outline: active ? `2px solid ${T.blue400}` : "none",
                  }}>
                    {score}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Componente: riga singolo input nel ranking ───────────────────────────────
function InputCritRow({ row, rank, onSelect, selected }) {
  const r = computeCriticality({
    mtpdHours:   row.mtpdH,
    rtoHours:    row.rtoH,
    vuln:        row.vuln,
    likelihood:  row.likelihood,
  });
  const fm = CRIT_META[r.classFinal];
  const vm = VULN_META[row.vuln]    || {};
  const lm = LK_META[row.likelihood] || {};
  return (
    <tr
      onClick={() => onSelect(row.id)}
      style={{
        cursor:"pointer",
        background: selected ? T.blue50 : "transparent",
        transition:"background .1s",
      }}
      onMouseEnter={e => { if(!selected) e.currentTarget.style.background = T.gray50; }}
      onMouseLeave={e => { if(!selected) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Rank */}
      <td style={{ padding:"7px 8px", textAlign:"center", fontWeight:600,
        fontSize:11, color: rank <= 3 ? T.red600 : T.gray400 }}>{rank}</td>
      {/* Processo / Input */}
      <td style={{ padding:"7px 8px" }}>
        <div style={{ fontWeight:500, fontSize:11 }}>{row.inputName}</div>
        <div style={{ fontSize:10, color:T.gray400, marginTop:1 }}>
          {row.procName} · <span style={{ color:T.gray600 }}>{row.cat}</span>
        </div>
      </td>
      {/* Vulnerabilità */}
      <td style={{ padding:"7px 8px" }}>
        <Badge bg={vm.bg} color={vm.color}>{row.vuln}</Badge>
      </td>
      {/* Likelihood */}
      <td style={{ padding:"7px 8px" }}>
        <Badge bg={lm.bg} color={lm.color}>{row.likelihood}</Badge>
      </td>
      {/* VxL */}
      <td style={{ padding:"7px 8px", textAlign:"center" }}>
        <span style={{
          display:"inline-block", width:24, height:24, borderRadius:4,
          lineHeight:"24px", textAlign:"center", fontSize:11, fontWeight:700,
          background: r.vxl >= 6 ? T.red100 : r.vxl >= 3 ? T.amber50 : T.green50,
          color: r.vxl >= 6 ? T.red800 : r.vxl >= 3 ? T.amber600 : T.green600,
        }}>{r.vxl}</span>
      </td>
      {/* MTPD */}
      <td style={{ padding:"7px 8px", textAlign:"center" }}>
        <Badge
          bg={row.mtpdH <= 8  ? T.red50  : row.mtpdH <= 72 ? T.amber50 : T.gray50}
          color={row.mtpdH <= 8 ? T.red600 : row.mtpdH <= 72 ? T.amber600 : T.gray600}>
          {row.mtpdLabel}
        </Badge>
      </td>
      {/* RTO */}
      <td style={{ padding:"7px 8px", textAlign:"center", fontSize:11, color:T.gray600 }}>
        {row.rtoLabel}
      </td>
      {/* Crit(MTPD) */}
      <td style={{ padding:"7px 8px" }}>
        <CritBadge level={r.classMTPD} />
      </td>
      {/* Crit(RTO) */}
      <td style={{ padding:"7px 8px" }}>
        <CritBadge level={r.classRTO} />
      </td>
      {/* Criticità finale */}
      <td style={{ padding:"7px 8px" }}>
        <CritBadge level={r.classFinal} size="large" />
      </td>
      {/* Azione */}
      <td style={{ padding:"7px 8px" }}>
        {row.action
          ? <Badge bg={T.pu50} color={T.pu800}>{row.action}</Badge>
          : <span style={{ fontSize:10, color:T.gray200 }}>—</span>}
      </td>
    </tr>
  );
}

// ─── Pannello dettaglio calcolo per input selezionato ─────────────────────────
function CritDetail({ row }) {
  if (!row) return (
    <div style={{ padding:24, textAlign:"center", color:T.gray400, fontSize:12 }}>
      Seleziona un input dalla tabella per vedere il dettaglio del calcolo.
    </div>
  );
  const r  = computeCriticality({ mtpdHours:row.mtpdH, rtoHours:row.rtoH, vuln:row.vuln, likelihood:row.likelihood });
  const fm = CRIT_META[r.classFinal];
  return (
    <div style={{ padding:16 }}>
      {/* Intestazione */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:500, color:T.gray800 }}>{row.inputName}</div>
        <div style={{ fontSize:11, color:T.gray400, marginTop:2 }}>
          {row.procName} · {row.cat} · Sito: {row.sito}
        </div>
      </div>

      {/* Criticità finale in evidenza */}
      <div style={{
        background:fm.bg, border:`1px solid ${fm.border}`, borderRadius:8,
        padding:"12px 14px", marginBottom:16, display:"flex", alignItems:"center",
        justifyContent:"space-between",
      }}>
        <div>
          <div style={{ fontSize:10, color:fm.color, textTransform:"uppercase",
            letterSpacing:".05em", marginBottom:4 }}>Criticità finale</div>
          <div style={{ fontSize:22, fontWeight:700, color:fm.color,
            textTransform:"uppercase" }}>{r.classFinal}</div>
          <div style={{ fontSize:10, color:fm.color, marginTop:3 }}>
            min(C_MTPD, C_RTO) = min({r.cMTPD}, {r.cRTO}) = {r.cFinal}
          </div>
        </div>
        <div style={{ fontSize:36, opacity:.2 }}>
          {r.classFinal === "molto alta" ? "🔴" : r.classFinal === "alta" ? "🟠" :
           r.classFinal === "media"      ? "🔵" : r.classFinal === "bassa" ? "🟢" : "✅"}
        </div>
      </div>

      {/* Step 1: VxL */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:500, color:T.gray800, marginBottom:8 }}>
          Step 1 — Matrice Vulnerabilità × Likelihood (VxL)
        </div>
        <VxLMatrix selectedVuln={row.vuln} selectedLk={row.likelihood} />
        <div style={{ marginTop:6, fontSize:11, color:T.gray600 }}>
          Vuln. <strong>{row.vuln}</strong> × Lk <strong>{row.likelihood}</strong> =
          <strong style={{ color:T.blue800 }}> VxL = {r.vxl}</strong>
        </div>
      </div>

      {/* Step 2: Normalizzazione */}
      <div style={{
        background:T.gray50, borderRadius:7, padding:"10px 12px", marginBottom:14,
        fontSize:11, color:T.gray600,
      }}>
        <div style={{ fontWeight:500, color:T.gray800, marginBottom:6 }}>
          Step 2 — Normalizzazione MTPD e RTO
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <div>
            <span style={{ color:T.gray400 }}>MTPD = </span>
            <strong>{row.mtpdLabel}</strong>
            <span style={{ color:T.gray400 }}> = {row.mtpdH}h</span>
            <div style={{ marginTop:2 }}>
              norm = {row.mtpdH} / {MTPD_MAX_H} = <strong>{(row.mtpdH/MTPD_MAX_H).toFixed(4)}</strong>
            </div>
          </div>
          <div>
            <span style={{ color:T.gray400 }}>RTO = </span>
            <strong>{row.rtoLabel}</strong>
            <span style={{ color:T.gray400 }}> = {row.rtoH}h</span>
            <div style={{ marginTop:2 }}>
              norm = {row.rtoH} / {RTO_MAX_H} = <strong>{(row.rtoH/RTO_MAX_H).toFixed(4)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Indici */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:500, color:T.gray800, marginBottom:8 }}>
          Step 3 — Calcolo indici di criticità
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {/* Crit MTPD */}
          <div style={{
            background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:7,
            padding:"10px 12px",
          }}>
            <div style={{ fontSize:10, color:T.gray600, marginBottom:4 }}>
              Criticality(MTPD)
            </div>
            <div style={{ fontSize:10, color:T.gray400, fontFamily:"monospace",
              marginBottom:6, background:T.gray50, padding:"4px 7px", borderRadius:4 }}>
              ({row.mtpdH}/{MTPD_MAX_H}) / {r.vxl} = {r.cMTPD}
            </div>
            <CritBadge level={r.classMTPD} />
            <div style={{ marginTop:6 }}>
              <CritBar value={r.cMTPD} classLevel={r.classMTPD} />
            </div>
          </div>
          {/* Crit RTO */}
          <div style={{
            background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:7,
            padding:"10px 12px",
          }}>
            <div style={{ fontSize:10, color:T.gray600, marginBottom:4 }}>
              Criticality(RTO)
            </div>
            <div style={{ fontSize:10, color:T.gray400, fontFamily:"monospace",
              marginBottom:6, background:T.gray50, padding:"4px 7px", borderRadius:4 }}>
              ({row.rtoH}/{RTO_MAX_H}) / {r.vxl} = {r.cRTO}
            </div>
            <CritBadge level={r.classRTO} />
            <div style={{ marginTop:6 }}>
              <CritBar value={r.cRTO} classLevel={r.classRTO} />
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Finale */}
      <div style={{
        background:T.blue50, border:`0.5px solid ${T.blue100}`, borderRadius:7,
        padding:"10px 12px", fontSize:11, color:T.blue800, marginBottom:14,
      }}>
        <strong>Step 4 — Criticità finale (principio conservativo)</strong>
        <div style={{ marginTop:4, fontFamily:"monospace", fontSize:10 }}>
          min(C_MTPD={r.cMTPD}, C_RTO={r.cRTO}) = <strong>{r.cFinal}</strong> → <strong>{r.classFinal.toUpperCase()}</strong>
        </div>
        <div style={{ marginTop:4, fontSize:10, color:T.blue600 }}>
          Il valore più basso è quello più conservativo: indica il legame tra
          {r.cFinal === r.cMTPD ? " il tempo di tolleranza del processo (MTPD)" : " il tempo di ripristino richiesto (RTO)"}
          {" "}e la sua esposizione al rischio (VxL = {r.vxl}).
        </div>
      </div>

      {/* Soglie di riferimento */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:500, color:T.gray600,
          textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>
          Soglie di classificazione (procedura §6.5)
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          {[
            ["≤ 0.05",         "molto alta",  CRIT_META["molto alta"]],
            ["0.05 < C ≤ 0.14","alta",        CRIT_META["alta"]],
            ["0.14 < C ≤ 0.24","media",       CRIT_META["media"]],
            ["0.24 < C ≤ 0.35","bassa",       CRIT_META["bassa"]],
            ["> 0.35",         "molto bassa", CRIT_META["molto bassa"]],
          ].map(([range, label, meta]) => (
            <div key={label} style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"4px 8px", borderRadius:5, fontSize:10,
              background: r.classFinal === label ? meta.bg : "transparent",
              border: r.classFinal === label ? `1px solid ${meta.border}` : "0.5px solid transparent",
              fontWeight: r.classFinal === label ? 600 : 400,
            }}>
              <span style={{
                width:7, height:7, borderRadius:"50%",
                background: r.classFinal === label ? meta.color : T.gray200,
                flexShrink:0,
              }}/>
              <span style={{ minWidth:110, color:T.gray600, fontFamily:"monospace" }}>{range}</span>
              <span style={{ color: r.classFinal === label ? meta.color : T.gray600 }}>
                {label}
              </span>
              {r.classFinal === label && (
                <span style={{ marginLeft:"auto", fontSize:9, color:meta.color }}>← questo input</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Azione collegata */}
      {row.action && (
        <div style={{
          background:T.pu50, border:`0.5px solid ${T.pu600}40`, borderRadius:7,
          padding:"8px 12px", fontSize:11, color:T.pu800,
        }}>
          <strong>Azione correttiva collegata:</strong> {row.action}
        </div>
      )}
    </div>
  );
}

// ─── Dataset di esempio ───────────────────────────────────────────────────────
// mtpdH  = ore dell'MTPD (calcolato dal BIA engine)
// rtoH   = ore dell'RTO finale (max owner/IT)
// vuln   = basso/medio/alto (valutazione process owner)
// likelihood = bassa/media/alta (calcolata dal RA per sito)
const INPUTS_DATA = [
  {id:1,  procName:"Production MM",     inputName:"Reattori batch R1–R4",           cat:"Impianti",      sito:"MM",     mtpdH:72,  mtpdLabel:"3g",  rtoH:12,  rtoLabel:"12h", vuln:"alto",  likelihood:"alta",  action:"Piano manutenzione preventiva R3"},
  {id:2,  procName:"Production MM",     inputName:"API – Principio attivo X",       cat:"Materie prime", sito:"MM",     mtpdH:72,  mtpdLabel:"3g",  rtoH:12,  rtoLabel:"12h", vuln:"alto",  likelihood:"media", action:"Qualifica terzo fornitore API"},
  {id:3,  procName:"IT Infrastructure", inputName:"Data center primario – Milano",  cat:"Location",      sito:"MI",     mtpdH:24,  mtpdLabel:"1g",  rtoH:4,   rtoLabel:"4h",  vuln:"medio", likelihood:"media", action:"DR test failover (RTO 4h)"},
  {id:4,  procName:"IT Infrastructure", inputName:"DR site – Lonigo",               cat:"Location",      sito:"LO",     mtpdH:24,  mtpdLabel:"1g",  rtoH:4,   rtoLabel:"4h",  vuln:"alto",  likelihood:"bassa", action:"Completamento setup DR site"},
  {id:5,  procName:"EMERSON Delta V",   inputName:"DCS/SCADA Delta V",              cat:"Software",      sito:"MM",     mtpdH:8,   mtpdLabel:"8h",  rtoH:2,   rtoLabel:"2h",  vuln:"medio", likelihood:"alta",  action:"Contratto manutenzione H24 Emerson"},
  {id:6,  procName:"HSE",               inputName:"Sistema allarme gas",            cat:"Impianti",      sito:"MM",     mtpdH:8,   mtpdLabel:"8h",  rtoH:2,   rtoLabel:"2h",  vuln:"basso", likelihood:"bassa", action:null},
  {id:7,  procName:"Utilities & Waste", inputName:"Centrale vapore",                cat:"Utilities",     sito:"MM",     mtpdH:24,  mtpdLabel:"1g",  rtoH:4,   rtoLabel:"4h",  vuln:"medio", likelihood:"alta",  action:"Revisione caldaia backup B2"},
  {id:8,  procName:"Production LO",     inputName:"Linea produzione LO-2",          cat:"Impianti",      sito:"LO",     mtpdH:72,  mtpdLabel:"3g",  rtoH:12,  rtoLabel:"12h", vuln:"alto",  likelihood:"media", action:"Riparazione encoder LO-2"},
  {id:9,  procName:"Supply Chain S&OP", inputName:"Fornitore API primario",         cat:"Materie prime", sito:"MM",     mtpdH:168, mtpdLabel:"7g",  rtoH:24,  rtoLabel:"1g",  vuln:"medio", likelihood:"media", action:"Dual sourcing: secondo contratto"},
  {id:10, procName:"Warehouse",         inputName:"Magazzino MM – area R",          cat:"Location",      sito:"MM",     mtpdH:72,  mtpdLabel:"3g",  rtoH:12,  rtoLabel:"12h", vuln:"medio", likelihood:"media", action:null},
  {id:11, procName:"Quality",           inputName:"LIMS – gestione analisi",        cat:"Software",      sito:"MM",     mtpdH:168, mtpdLabel:"7g",  rtoH:24,  rtoLabel:"1g",  vuln:"medio", likelihood:"media", action:null},
  {id:12, procName:"Admin, Finance",    inputName:"SAP (modulo FI)",                cat:"Software",      sito:"MI",     mtpdH:336, mtpdLabel:"14g", rtoH:48,  rtoLabel:"2g",  vuln:"basso", likelihood:"media", action:null},
  {id:13, procName:"Production MM",     inputName:"Energia elettrica",              cat:"Utilities",     sito:"MM",     mtpdH:72,  mtpdLabel:"3g",  rtoH:4,   rtoLabel:"4h",  vuln:"basso", likelihood:"alta",  action:null},
  {id:14, procName:"IT Infrastructure", inputName:"SAP S/4HANA (server)",           cat:"Software",      sito:"MI",     mtpdH:24,  mtpdLabel:"1g",  rtoH:4,   rtoLabel:"4h",  vuln:"basso", likelihood:"media", action:null},
  {id:15, procName:"HSE",               inputName:"Sistema antincendio sprinkler",  cat:"Impianti",      sito:"MM",     mtpdH:8,   mtpdLabel:"8h",  rtoH:2,   rtoLabel:"2h",  vuln:"basso", likelihood:"bassa", action:null},
  {id:16, procName:"Production MM",     inputName:"Operatori linea A",              cat:"Risorse umane", sito:"MM",     mtpdH:72,  mtpdLabel:"3g",  rtoH:12,  rtoLabel:"12h", vuln:"medio", likelihood:"media", action:null},
  {id:17, procName:"Supply Chain S&OP", inputName:"Supervisori S&OP",              cat:"Risorse umane", sito:"MM",     mtpdH:168, mtpdLabel:"7g",  rtoH:24,  rtoLabel:"1g",  vuln:"basso", likelihood:"bassa", action:null},
  {id:18, procName:"Production TE",     inputName:"Linea produzione TE-1",          cat:"Impianti",      sito:"TE",     mtpdH:120, mtpdLabel:"5g",  rtoH:24,  rtoLabel:"1g",  vuln:"alto",  likelihood:"media", action:null},
];

// ─── Filtri / sort ────────────────────────────────────────────────────────────
function useFilters(data) {
  const [filterClass, setFilterClass]   = useState("");
  const [filterProc, setFilterProc]     = useState("");
  const [filterVuln, setFilterVuln]     = useState("");
  const [sortBy, setSortBy]             = useState("cFinal"); // "cFinal" | "mtpd" | "rto"

  const enriched = useMemo(() =>
    data.map(row => {
      const r = computeCriticality({ mtpdHours:row.mtpdH, rtoHours:row.rtoH,
        vuln:row.vuln, likelihood:row.likelihood });
      return { ...row, ...r };
    }),
  [data]);

  const filtered = useMemo(() =>
    enriched
      .filter(r =>
        (!filterClass || r.classFinal === filterClass) &&
        (!filterProc  || r.procName  === filterProc)  &&
        (!filterVuln  || r.vuln      === filterVuln))
      .sort((a, b) => {
        if (sortBy === "mtpd")   return a.mtpdH  - b.mtpdH;
        if (sortBy === "rto")    return a.rtoH   - b.rtoH;
        return a.cFinal - b.cFinal; // default: ordine crescente indice (= decrescente criticità)
      }),
  [enriched, filterClass, filterProc, filterVuln, sortBy]);

  return { filtered, filterClass, setFilterClass, filterProc, setFilterProc,
           filterVuln, setFilterVuln, sortBy, setSortBy,
           procs: [...new Set(data.map(r => r.procName))].sort() };
}

// ─── App principale ───────────────────────────────────────────────────────────
export default function CriticalityEngineDemo() {
  const { filtered, filterClass, setFilterClass, filterProc, setFilterProc,
          filterVuln, setFilterVuln, sortBy, setSortBy, procs } = useFilters(INPUTS_DATA);
  const [selId, setSelId] = useState(1);
  const selRow = INPUTS_DATA.find(r => r.id === selId) || null;

  // KPI summary
  const all = INPUTS_DATA.map(row => ({
    ...row, ...computeCriticality({ mtpdHours:row.mtpdH, rtoHours:row.rtoH,
      vuln:row.vuln, likelihood:row.likelihood })
  }));
  const counts = ["molto alta","alta","media","bassa","molto bassa"].map(c =>
    ({ c, n: all.filter(r => r.classFinal === c).length }));

  const filterBtn = (active, label, onClick, bg, color) => (
    <button onClick={onClick} style={{
      padding:"4px 10px", borderRadius:5, fontSize:11, cursor:"pointer",
      border: active ? `1.5px solid ${color}` : `0.5px solid ${T.gray100}`,
      background: active ? bg : "#fff",
      color: active ? color : T.gray600,
      fontWeight: active ? 500 : 400, transition:"all .1s",
    }}>{label}</button>
  );

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", background:T.gray50, minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ background:"#fff", borderBottom:`0.5px solid ${T.gray100}`,
        padding:"10px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:28, height:28, background:T.blue600, borderRadius:6,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#fff", fontSize:13, fontWeight:600 }}>N</div>
        <div style={{ width:1, height:24, background:T.gray100 }}/>
        <span style={{ fontSize:13, fontWeight:500 }}>Criticality Engine</span>
        <span style={{ fontSize:11, color:T.gray400 }}>VxL · Crit(MTPD) · Crit(RTO) · Procedura NIER §6.5</span>
      </div>

      <div style={{ padding:"16px 20px" }}>

        {/* KPI bar */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:9, marginBottom:16 }}>
          {counts.map(({ c, n }) => {
            const m = CRIT_META[c];
            return (
              <div key={c} style={{
                background: m.bg, border:`1px solid ${m.border}`, borderRadius:8,
                padding:"8px 12px", cursor:"pointer",
                outline: filterClass === c ? `2px solid ${m.color}` : "none",
              }} onClick={() => setFilterClass(filterClass === c ? "" : c)}>
                <div style={{ fontSize:10, color:m.color, textTransform:"uppercase",
                  letterSpacing:".05em", marginBottom:3 }}>{c}</div>
                <div style={{ fontSize:20, fontWeight:600, color:m.color }}>{n}</div>
                <div style={{ fontSize:10, color:m.color, opacity:.7, marginTop:2 }}>
                  {n === 1 ? "input" : "input"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Infobox metodologia */}
        <div style={{ background:T.blue50, border:`0.5px solid ${T.blue100}`, borderRadius:7,
          padding:"8px 12px", marginBottom:14, fontSize:11, color:T.blue800,
          display:"flex", gap:7 }}>
          <span style={{ fontSize:14, flexShrink:0 }}>ℹ</span>
          <span>
            Criticality(MTPD) = (MTPD/MTPD<sub>max</sub>) / VxL &emsp;
            Criticality(RTO) = (RTO/RTO<sub>max</sub>) / VxL &emsp;
            <strong>Criticità finale = min(C_MTPD, C_RTO)</strong> — principio conservativo.
            Clicca su una riga per vedere il calcolo passo per passo.
          </span>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:14 }}>

          {/* Tabella ranking */}
          <div>
            {/* Filtri */}
            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, color:T.gray600 }}>Criticità:</span>
              {filterBtn(!filterClass,"Tutte",()=>setFilterClass(""),T.blue50,T.blue800)}
              {["molto alta","alta","media","bassa","molto bassa"].map(c => {
                const m = CRIT_META[c];
                return filterBtn(filterClass===c, c, ()=>setFilterClass(filterClass===c?"":c), m.bg, m.color);
              })}
              <span style={{ fontSize:11, color:T.gray600, marginLeft:4 }}>Vuln.:</span>
              {["alto","medio","basso"].map(v => {
                const m = VULN_META[v];
                return filterBtn(filterVuln===v, v, ()=>setFilterVuln(filterVuln===v?"":v), m.bg, m.color);
              })}
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, color:T.gray600 }}>Processo:</span>
              {filterBtn(!filterProc,"Tutti",()=>setFilterProc(""),T.blue50,T.blue800)}
              {procs.map(p => filterBtn(filterProc===p, p.split(" ").slice(0,2).join(" "),
                ()=>setFilterProc(filterProc===p?"":p), T.gray50, T.gray800))}
              <span style={{ fontSize:11, color:T.gray600, marginLeft:4 }}>Ordina per:</span>
              {[["cFinal","Criticità"],["mtpd","MTPD"],["rto","RTO"]].map(([v,l]) =>
                filterBtn(sortBy===v, l, ()=>setSortBy(v), T.blue50, T.blue600))}
            </div>

            <div style={{ background:"#fff", border:`0.5px solid ${T.gray100}`,
              borderRadius:10, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"auto" }}>
                <thead>
                  <tr style={{ background:T.gray50 }}>
                    {["#","Input / Processo","Vuln.","Likelihood","VxL","MTPD","RTO",
                      "Crit(MTPD)","Crit(RTO)","Criticità finale","Azione"].map(h => (
                      <th key={h} style={{ padding:"6px 8px", textAlign:"left",
                        fontSize:10, fontWeight:500, color:T.gray400,
                        borderBottom:`0.5px solid ${T.gray100}`,
                        textTransform:"uppercase", letterSpacing:".04em",
                        whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={11} style={{ padding:24, textAlign:"center",
                      color:T.gray400, fontSize:12 }}>
                      Nessun input corrisponde ai filtri selezionati.
                    </td></tr>
                  ) : filtered.map((row, idx) => (
                    <InputCritRow
                      key={row.id}
                      row={row}
                      rank={idx + 1}
                      onSelect={setSelId}
                      selected={selId === row.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pannello dettaglio */}
          <div style={{ background:"#fff", border:`0.5px solid ${T.gray100}`,
            borderRadius:10, overflow:"hidden", alignSelf:"start",
            position:"sticky", top:0, maxHeight:"calc(100vh - 120px)", overflowY:"auto" }}>
            <div style={{ padding:"10px 16px", borderBottom:`0.5px solid ${T.gray100}`,
              background:T.gray50 }}>
              <div style={{ fontSize:11, fontWeight:500, color:T.gray800 }}>
                Dettaglio calcolo
              </div>
              <div style={{ fontSize:10, color:T.gray400, marginTop:1 }}>
                Calcolo passo per passo secondo §6.5
              </div>
            </div>
            <CritDetail row={selRow} />
          </div>

        </div>
      </div>
    </div>
  );
}
