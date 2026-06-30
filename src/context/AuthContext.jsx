import { createContext, useContext, useState, useMemo, useCallback } from "react";

// ─── Autenticazione/ruolo (MOCK, senza backend) ──────────────────────────────
// Prototipo: l'utente corrente si cambia da un selettore in top bar.
// Domani sarà sostituito da login reale + JWT lato FastAPI.
//
// Ruoli:
//   admin  → BC Manager / Direzione: vede tutto, gestisce impostazioni e anagrafiche
//   owner  → Responsabile di processo: vede solo il proprio processo

export const ADMIN_USER = { role: "admin", name: "BC Manager", label: "BC Manager / Direzione" };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(ADMIN_USER);

  const loginAdmin = useCallback(() => setUser(ADMIN_USER), []);
  const loginOwner = useCallback((ownerName) => setUser({
    role: "owner", name: ownerName, ownerName, label: `Responsabile · ${ownerName}`,
  }), []);

  const value = useMemo(() => ({ user, loginAdmin, loginOwner }), [user, loginAdmin, loginOwner]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth deve essere usato dentro <AuthProvider>");
  return c;
}
