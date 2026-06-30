// ─── Registry dei modelli di criticità (strategy pattern) ─────────────────────
// Ogni modello è parametrizzabile: la sezione Impostazioni sceglie il modello
// attivo e ne regola i parametri. Le funzioni compute() sono pure: ricevono
// l'input e i parametri, non leggono stato globale → riusabili lato backend.
//
// compute(input, params) → oggetto che include SEMPRE `classFinal` (una delle
// CRIT_CLASSES). I campi extra servono al pannello di dettaglio.

import { CRIT_CLASSES } from "./demoData.js";

const r4 = v => Math.round(v * 10000) / 10000;

// Matrice VxL di default, condivisa dai modelli
export const DEFAULT_VXL = {
  basso: { bassa:1, media:2, alta:3 },
  medio: { bassa:2, media:4, alta:6 },
  alto:  { bassa:3, media:6, alta:9 },
};

function vxlScore(vxl, vuln, likelihood) {
  return vxl?.[vuln]?.[likelihood] ?? 1;
}

// ─── Modello A — NIER §6.5 (legacy, continuo) ─────────────────────────────────
function classifyByThresholds(c, th) {
  if (c <= th.moltoAlta) return "molto alta";
  if (c <= th.alta)      return "alta";
  if (c <= th.media)     return "media";
  if (c <= th.bassa)     return "bassa";
  return "molto bassa";
}

const legacyModel = {
  id: "legacy",
  label: "NIER §6.5 (legacy)",
  description: "Indice continuo (t/Tmax)/VxL con criticità finale = min(C_MTPD, C_RTO). Mantenuto per compatibilità con lo storico.",
  defaultParams: {
    vxl: DEFAULT_VXL,
    maxH: 720, // orizzonte di normalizzazione (30g)
    thresholds: { moltoAlta:0.05, alta:0.14, media:0.24, bassa:0.35 },
  },
  compute({ mtpdHours, rtoHours, vuln, likelihood }, params) {
    const vxl = vxlScore(params.vxl, vuln, likelihood);
    const cMTPD = (mtpdHours / params.maxH) / vxl;
    const cRTO  = (rtoHours  / params.maxH) / vxl;
    const cFinal = Math.min(cMTPD, cRTO);
    return {
      vxl,
      cMTPD: r4(cMTPD), cRTO: r4(cRTO), cFinal: r4(cFinal),
      classMTPD:  classifyByThresholds(cMTPD,  params.thresholds),
      classRTO:   classifyByThresholds(cRTO,   params.thresholds),
      classFinal: classifyByThresholds(cFinal, params.thresholds),
    };
  },
};

// ─── Modello B — Matrice di criticità (urgenza × VxL) ─────────────────────────
// urgencyBands: soglie crescenti di tempo (maxH=null = ∞, ultima banda).
// vxlBands: soglie crescenti di punteggio VxL.
// matrix[urgencyIndex][vxlIndex] = classe di criticità.
const matrixModel = {
  id: "matrix",
  label: "Matrice di criticità",
  description: "Incrocia bande di urgenza temporale (da RTO/MTPD) con bande di esposizione al rischio (VxL). Interpretabile e allineato a ISO 31010.",
  defaultParams: {
    vxl: DEFAULT_VXL,
    timeMetric: "rto", // "rto" | "mtpd" | "min"
    urgencyBands: [
      { maxH: 8,    label: "Critica"     },
      { maxH: 24,   label: "Alta"        },
      { maxH: 72,   label: "Media"       },
      { maxH: 336,  label: "Bassa"       },
      { maxH: null, label: "Molto bassa" },
    ],
    vxlBands: [
      { maxScore: 2, label: "basso"      },
      { maxScore: 4, label: "medio"      },
      { maxScore: 6, label: "alto"       },
      { maxScore: 9, label: "molto alto" },
    ],
    matrix: [
      ["media",       "alta",        "molto alta",  "molto alta"],
      ["media",       "media",       "alta",        "molto alta"],
      ["bassa",       "media",       "media",       "alta"      ],
      ["molto bassa", "bassa",       "media",       "media"     ],
      ["molto bassa", "molto bassa", "bassa",       "bassa"     ],
    ],
  },
  compute({ mtpdHours, rtoHours, vuln, likelihood }, params) {
    const vxl = vxlScore(params.vxl, vuln, likelihood);
    const t = params.timeMetric === "mtpd" ? mtpdHours
            : params.timeMetric === "min"  ? Math.min(rtoHours, mtpdHours)
            : rtoHours;
    const ui = Math.max(0, params.urgencyBands.findIndex(b => b.maxH == null || t <= b.maxH));
    const vi = Math.max(0, params.vxlBands.findIndex(b => vxl <= b.maxScore));
    const uiSafe = ui === -1 ? params.urgencyBands.length - 1 : ui;
    const viSafe = vi === -1 ? params.vxlBands.length - 1 : vi;
    const classFinal = params.matrix[uiSafe]?.[viSafe] ?? "media";
    return {
      vxl,
      timeUsedH: t,
      urgencyIndex: uiSafe, urgencyLabel: params.urgencyBands[uiSafe]?.label,
      vxlIndex: viSafe,     vxlBandLabel: params.vxlBands[viSafe]?.label,
      // Per coerenza di interfaccia con il modello legacy:
      classMTPD: classFinal, classRTO: classFinal, classFinal,
    };
  },
};

// ─── Registry ──────────────────────────────────────────────────────────────────
export const MODELS = [matrixModel, legacyModel];
export const MODELS_BY_ID = Object.fromEntries(MODELS.map(m => [m.id, m]));
export const DEFAULT_MODEL_ID = "matrix";

// Verifica che una classe sia valida (per editor matrice)
export const isCritClass = c => CRIT_CLASSES.includes(c);
