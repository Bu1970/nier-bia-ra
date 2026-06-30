// ─── Fonte dati condivisa + engine pure ──────────────────────────────────────
// Unica fonte di verità per processi e calcoli metodologici, condivisa da
// Dashboard e ProcessView. Pronta per essere sostituita da chiamate al backend
// FastAPI: basterà rimpiazzare PROCESSES con i dati provenienti dalle API,
// mantenendo invariate le funzioni pure (computeMTPD, computeCriticality, …).
//
// Convenzione dimensioni di impatto: rep / leg / fin (allineata a ProcessView).

// ─── Palette (design system NIER) ─────────────────────────────────────────────
export const T = {
  blue50:"#E6F1FB", blue100:"#B5D4F4", blue400:"#378ADD", blue600:"#185FA5", blue800:"#0C447C",
  teal50:"#E1F5EE", teal400:"#1D9E75", teal600:"#0F6E56",
  amber50:"#FAEEDA",amber400:"#BA7517",amber600:"#854F0B",
  red50:"#FCEBEB",  red100:"#F7C1C1",  red400:"#E24B4A",  red600:"#A32D2D",  red800:"#7C1D1D",
  green50:"#EAF3DE",green400:"#639922",green600:"#3B6D11",
  gray50:"#F1EFE8", gray100:"#D3D1C7", gray200:"#B4B2A9",
  gray400:"#888780",gray600:"#5F5E5A", gray800:"#444441",
  pu50:"#EEEDFE",   pu600:"#534AB7",   pu800:"#3C3489",
};

// ─── Costanti metodologiche (procedura NIER §6.3 / §6.5) ──────────────────────
export const BIA_WINDOWS = [
  { id:"1h",  label:"1h",  hours:1   },
  { id:"4h",  label:"4h",  hours:4   },
  { id:"8h",  label:"8h",  hours:8   },
  { id:"1g",  label:"1g",  hours:24  },
  { id:"3g",  label:"3g",  hours:72  },
  { id:"7g",  label:"7g",  hours:168 },
  { id:"14g", label:"14g", hours:336 },
  { id:"30g", label:"30g", hours:720 },
];

export const IMPACT_DIMS = [
  { id:"rep", label:"Reputazione / Fiducia clienti" },
  { id:"leg", label:"Legale / Normativo"            },
  { id:"fin", label:"Finanziario"                   },
];

// Matrice VxL (Vulnerabilità × Likelihood)
const VXL_MATRIX = {
  basso: { bassa:1, media:2, alta:3 },
  medio: { bassa:2, media:4, alta:6 },
  alto:  { bassa:3, media:6, alta:9 },
};

export const MTPD_MAX_H = 720; // 30g
export const RTO_MAX_H  = 720; // 30g

// Categorie input (per lookup icona/etichetta in dashboard)
export const CATEGORIES = [
  { id:"HR",        label:"Risorse umane",     icon:"👤" },
  { id:"MATERIALS", label:"Materie prime",     icon:"📦" },
  { id:"EQUIPMENT", label:"Impianti/strumenti",icon:"⚙️" },
  { id:"SOFTWARE",  label:"Software",          icon:"💻" },
  { id:"UTILITIES", label:"Utilities",         icon:"⚡" },
  { id:"SERVICES",  label:"Servizi",           icon:"🤝" },
  { id:"LOCATION",  label:"Location",          icon:"📍" },
];
export function catMeta(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[0]; }

// Ordine e metadati visuali dei livelli di criticità
export const CRIT_CLASSES = ["molto alta", "alta", "media", "bassa", "molto bassa"];
export const CRIT_META = {
  "molto alta":  { color:T.red800,   bg:T.red100,  border:T.red400   },
  "alta":        { color:T.red600,   bg:T.red50,   border:T.red400   },
  "media":       { color:T.blue800,  bg:T.blue50,  border:T.blue400  },
  "bassa":       { color:T.green600, bg:T.green50, border:T.green400 },
  "molto bassa": { color:T.teal600,  bg:T.teal50,  border:T.teal400  },
};

// ─── Funzioni pure (riusabili lato server) ────────────────────────────────────

// MTPD = prima finestra con almeno una dimensione a livello 4 (critico).
export function computeMTPD(cells) {
  for (let wi = 0; wi < BIA_WINDOWS.length; wi++) {
    if (IMPACT_DIMS.some(d => (cells?.[d.id]?.[wi] ?? 0) === 4)) return BIA_WINDOWS[wi];
  }
  return BIA_WINDOWS[BIA_WINDOWS.length - 1]; // nessun critico → 30g
}

// True se almeno una cella della matrice impatti è valorizzata (> 0).
export function isBIAFilled(cells) {
  return IMPACT_DIMS.some(d => cells?.[d.id]?.some(v => v > 0));
}

// RTO finale = max(RTO owner, RTO IT).
export function computeFinalRTO(rtoOwnerHours, rtoITHours) {
  return Math.max(rtoOwnerHours ?? 0, rtoITHours ?? 0);
}

// Coerenza: RTO finale non può superare l'MTPD.
export function checkRTOvsMTPD(finalRTOHours, mtpdWindow) {
  return finalRTOHours <= mtpdWindow.hours;
}

function round4(v) { return Math.round(v * 10000) / 10000; }

export function classifyC(c) {
  if (c <= 0.05) return "molto alta";
  if (c <= 0.14) return "alta";
  if (c <= 0.24) return "media";
  if (c <= 0.35) return "bassa";
  return "molto bassa";
}

// Criticality(MTPD)=(MTPD/720)/VxL, Criticality(RTO)=(RTO/720)/VxL,
// Criticità finale = min (principio conservativo §6.5).
export function computeCriticality({ mtpdHours, rtoHours, vuln, likelihood }) {
  const vxl = VXL_MATRIX[vuln]?.[likelihood] ?? 1;
  const cMTPD = (mtpdHours / MTPD_MAX_H) / vxl;
  const cRTO  = (rtoHours  / RTO_MAX_H)  / vxl;
  const cFinal = Math.min(cMTPD, cRTO);
  return {
    vxl,
    cMTPD:  round4(cMTPD),  cRTO:  round4(cRTO),  cFinal: round4(cFinal),
    classMTPD:  classifyC(cMTPD),
    classRTO:   classifyC(cRTO),
    classFinal: classifyC(cFinal),
  };
}

export function rtoLabel(h) {
  if (h == null) return "—";
  if (h < 24) return `${h}h`;
  if (h === 24) return "1g";
  return `${Math.round(h / 24)}g`;
}

// ─── Riepilogo aggregato di un processo (usato dalla Dashboard) ───────────────
// Calcola MTPD, RTO, coerenza e distribuzione di criticità degli input.
// `computeCrit` è la funzione di calcolo criticità del modello attivo
// (default: modello legacy §6.5). Riceve {mtpdHours, rtoHours, vuln, likelihood}
// e restituisce almeno { classFinal }.
export function summarizeProcess(p, computeCrit = computeCriticality) {
  const cells   = p.initialBIA || {};
  const filled  = isBIAFilled(cells);
  const mtpd    = computeMTPD(cells);
  const rto     = computeFinalRTO(p.rtoOwnerHours, p.rtoITHours);
  const coherent = checkRTOvsMTPD(rto, mtpd);
  const inputs  = p.initialInputs || [];

  // Criticità calcolabile solo per input con vulnerabilità e likelihood.
  // Ordinata per gravità: prima per ordine di classe (molto alta → molto bassa),
  // poi per cFinal se disponibile (modelli continui).
  const crit = inputs
    .filter(i => i.vuln && i.likelihood)
    .map(i => ({ ...i, ...computeCrit({ mtpdHours:mtpd.hours, rtoHours:rto, vuln:i.vuln, likelihood:i.likelihood }) }))
    .sort((a, b) =>
      (CRIT_CLASSES.indexOf(a.classFinal) - CRIT_CLASSES.indexOf(b.classFinal)) ||
      ((a.cFinal ?? 0) - (b.cFinal ?? 0)));

  const classCounts = Object.fromEntries(CRIT_CLASSES.map(c => [c, crit.filter(r => r.classFinal === c).length]));
  const highCrit = classCounts["molto alta"] + classCounts["alta"];
  const worst = crit[0] || null; // input col valore più basso = più critico
  const issues = inputs.filter(i => i.issues).length;
  const catFilled = CATEGORIES.filter(c => inputs.some(i => i.cat === c.id)).length;

  return {
    ...p,
    filled, mtpd, rto, coherent, inputs, crit, classCounts,
    highCrit, worstClass: worst?.classFinal || null, issues, catFilled,
  };
}

// ─── Dataset processi (demo — sostituibile con dati backend) ──────────────────
export const PROCESSES = [
  {
    id:1, name:"Production MM", macro:"Operations", sito:"Montecchio Maggiore",
    owner:"M. Ferretti", rtoOwnerHours:8, rtoITHours:12, peakPeriod:"Nov–Dic (+40%)",
    initialBIA:{ rep:[0,0,1,1,2,3,4,4], leg:[0,0,0,1,1,2,3,4], fin:[0,1,1,2,3,3,4,4] },
    initialInputs:[
      { id:1, cat:"EQUIPMENT", name:"Reattori batch R1–R4", qty_normal:4, qty_min:2, vuln:"alto",  likelihood:"alta",  recovery:"Prioritizzazione batch critici", issues:"R3 fermo – ETA 15/06" },
      { id:2, cat:"MATERIALS", name:"API – Principio attivo X", qty_normal:500, qty_min:200, supplier_count:2, supplier_min:1, vuln:"alto", likelihood:"media", recovery:"Stock sicurezza 30gg", issues:"Fornitore primario in ritardo Q2" },
      { id:3, cat:"SOFTWARE",  name:"MES Opcenter (Siemens)", supplier:"Siemens", importance:"critica", rpo:"4h", data_critical:true, vuln:"medio", likelihood:"media", recovery:"Failover su server DR", issues:"" },
      { id:4, cat:"HR",        name:"Operatori linea A", qty_normal:14, qty_min:7, vuln:"medio", likelihood:"media", recovery:"Back-up da linea B", issues:"" },
      { id:5, cat:"UTILITIES", name:"Energia elettrica", supplier:"Enel", importance:"critica", vuln:"basso", likelihood:"alta", recovery:"GE 500kW (4h autonomia)", issues:"" },
      { id:6, cat:"LOCATION",  name:"Stabilimento MM – ed. R", location_name:"Via Chimica 1, MM", vuln:"medio", likelihood:"media", recovery:"Produzione parziale edificio S", issues:"" },
    ],
  },
  {
    id:7, name:"IT Infrastructure", macro:"IT", sito:"Milano",
    owner:"L. Moretti", rtoOwnerHours:4, rtoITHours:4, peakPeriod:"—",
    initialBIA:{ rep:[0,1,2,3,4,4,4,4], leg:[0,0,1,2,3,3,4,4], fin:[0,1,2,3,4,4,4,4] },
    initialInputs:[
      { id:10, cat:"SOFTWARE", name:"SAP S/4HANA (server)", supplier:"SAP/AWS", importance:"critica", rpo:"1h", data_critical:true, vuln:"basso", likelihood:"media", recovery:"Replica sincrona DR site", issues:"" },
      { id:11, cat:"SOFTWARE", name:"Active Directory", supplier:"Microsoft", importance:"critica", rpo:"30min", data_critical:true, vuln:"basso", likelihood:"media", recovery:"Cluster AD a 3 nodi", issues:"" },
      { id:12, cat:"LOCATION", name:"Data center – Milano", location_name:"Via Pirelli 35, MI", vuln:"medio", likelihood:"media", recovery:"DR site Lonigo (RTO 4h)", issues:"DR site non ancora certificato" },
      { id:13, cat:"LOCATION", name:"DR site – Lonigo", location_name:"Via Industria 8, LO", vuln:"alto", likelihood:"bassa", recovery:"—", issues:"Setup in corso" },
      { id:14, cat:"HR",       name:"Sistemisti", qty_normal:6, qty_min:3, vuln:"medio", likelihood:"media", recovery:"Reperibilità 24/7", issues:"" },
      { id:15, cat:"UTILITIES",name:"UPS + generatore", supplier:"Interna", importance:"critica", vuln:"basso", likelihood:"bassa", recovery:"UPS 30min + GE 100kW", issues:"" },
    ],
  },
  {
    id:3, name:"Production TE", macro:"Operations", sito:"Termoli",
    owner:"D. Esposito", rtoOwnerHours:16, rtoITHours:24, peakPeriod:"Giu–Set (+30%)",
    initialBIA:{ rep:new Array(8).fill(0), leg:new Array(8).fill(0), fin:new Array(8).fill(0) },
    initialInputs:[],
  },
];
