import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { PROCESSES } from "../data/demoData.js";

// ─── Stato dati condiviso: processi + anagrafiche ─────────────────────────────
// Unica fonte di verità mutabile (oggi seed da demoData, domani backend FastAPI).
// Persistita su localStorage; in contesti dove non è disponibile, ricade sui seed.

const KEY = "nier-bia-ra.data.v1";

let _seq = 0;
const uid = (p) => `${p}_${Date.now().toString(36)}${(_seq++).toString(36)}`;

const uniq = (arr) => [...new Set(arr.filter(Boolean))];

function seedAnagrafiche() {
  const inputs = PROCESSES.flatMap(p => p.initialInputs || []);
  return {
    siti:         uniq(PROCESSES.map(p => p.sito)).map(n => ({ id: uid("s"),  nome: n, descrizione: "" })),
    responsabili: uniq(PROCESSES.map(p => p.owner)).map(n => ({ id: uid("r"), nome: n, email: "", funzione: "" })),
    aree:         uniq(PROCESSES.map(p => p.macro)).map(n => ({ id: uid("a"), nome: n })),
    fornitori:    uniq(inputs.map(i => i.supplier)).map(n => ({ id: uid("f"), nome: n, tipo: "" })),
    software:     uniq(inputs.filter(i => i.cat === "SOFTWARE").map(i => i.name)).map(n => {
      const inp = inputs.find(i => i.name === n);
      return { id: uid("sw"), nome: n, fornitore: inp?.supplier || "", criticita: inp?.importance || "" };
    }),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.processes && p?.anagrafiche) return p;
    }
  } catch { /* storage non disponibile */ }
  return { processes: PROCESSES.map(p => ({ ...p })), anagrafiche: seedAnagrafiche() };
}

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* noop */ }
  }, [state]);

  const addProcess = useCallback((proc) => {
    const id = uid("p");
    setState(s => ({ ...s, processes: [...s.processes, {
      id,
      initialBIA: { rep: new Array(8).fill(0), leg: new Array(8).fill(0), fin: new Array(8).fill(0) },
      initialInputs: [],
      peakPeriod: "—",
      ...proc,
    }] }));
    return id;
  }, []);

  const updateProcess = useCallback((id, patch) => {
    setState(s => ({ ...s, processes: s.processes.map(p =>
      p.id === id ? { ...p, ...(typeof patch === "function" ? patch(p) : patch) } : p) }));
  }, []);

  const addItem = useCallback((reg, item) => {
    setState(s => ({ ...s, anagrafiche: { ...s.anagrafiche, [reg]: [...s.anagrafiche[reg], { id: uid(reg), ...item }] } }));
  }, []);
  const updateItem = useCallback((reg, id, patch) => {
    setState(s => ({ ...s, anagrafiche: { ...s.anagrafiche, [reg]: s.anagrafiche[reg].map(x => x.id === id ? { ...x, ...patch } : x) } }));
  }, []);
  const removeItem = useCallback((reg, id) => {
    setState(s => ({ ...s, anagrafiche: { ...s.anagrafiche, [reg]: s.anagrafiche[reg].filter(x => x.id !== id) } }));
  }, []);

  const value = useMemo(() => ({
    processes: state.processes,
    anagrafiche: state.anagrafiche,
    addProcess, updateProcess, addItem, updateItem, removeItem,
  }), [state, addProcess, updateProcess, addItem, updateItem, removeItem]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const c = useContext(DataContext);
  if (!c) throw new Error("useData deve essere usato dentro <DataProvider>");
  return c;
}
