import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { MODELS_BY_ID, DEFAULT_MODEL_ID } from "../data/criticalityModels.js";

// ─── Configurazione applicativa (modello di criticità + parametri) ────────────
// Persistita su localStorage. In futuro la stessa struttura potrà essere
// caricata/salvata via API FastAPI senza cambiare i consumer.

const STORAGE_KEY = "nier-bia-ra.config.v1";
const CONFIG_VERSION = 1;

function defaultConfig() {
  return {
    version: CONFIG_VERSION,
    activeModelId: DEFAULT_MODEL_ID,
    // params per-modello; se assente si usano i defaultParams del modello
    params: {},
  };
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig();
    const parsed = JSON.parse(raw);
    if (parsed?.version !== CONFIG_VERSION) return defaultConfig();
    if (!MODELS_BY_ID[parsed.activeModelId]) parsed.activeModelId = DEFAULT_MODEL_ID;
    return { ...defaultConfig(), ...parsed };
  } catch {
    return defaultConfig();
  }
}

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(loadConfig);

  // Persistenza automatica
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch { /* storage non disponibile */ }
  }, [config]);

  const activeModel = MODELS_BY_ID[config.activeModelId] || MODELS_BY_ID[DEFAULT_MODEL_ID];
  const activeParams = config.params[config.activeModelId] ?? activeModel.defaultParams;

  const setActiveModel = useCallback((id) => {
    if (MODELS_BY_ID[id]) setConfig(c => ({ ...c, activeModelId: id }));
  }, []);

  // Aggiorna i parametri del modello indicato (merge superficiale sui campi passati)
  const setParams = useCallback((modelId, patch) => {
    setConfig(c => {
      const base = c.params[modelId] ?? MODELS_BY_ID[modelId].defaultParams;
      const next = typeof patch === "function" ? patch(base) : { ...base, ...patch };
      return { ...c, params: { ...c.params, [modelId]: next } };
    });
  }, []);

  const resetParams = useCallback((modelId) => {
    setConfig(c => {
      const { [modelId]: _, ...rest } = c.params;
      return { ...c, params: rest };
    });
  }, []);

  // Funzione di calcolo del modello attivo, pronta per i consumer
  const computeCrit = useCallback(
    (input) => activeModel.compute(input, activeParams),
    [activeModel, activeParams]
  );

  const value = useMemo(() => ({
    config, activeModel, activeParams,
    setActiveModel, setParams, resetParams, computeCrit,
  }), [config, activeModel, activeParams, setActiveModel, setParams, resetParams, computeCrit]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig deve essere usato dentro <ConfigProvider>");
  return ctx;
}
