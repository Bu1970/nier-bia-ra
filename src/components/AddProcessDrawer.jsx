import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { T } from "../data/demoData.js";

// Conversione etichetta tempo → ore (accetta "8h", "1g", "3g"…) per coerenza con BIA_WINDOWS
function parseHours(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const FIELD = { width:"100%", padding:"7px 9px", border:`0.5px solid ${T.gray200}`, borderRadius:6, fontSize:12, color:"#1a1a18", background:"#fff", outline:"none", fontFamily:"inherit" };
const LABEL = { display:"block", fontSize:10, fontWeight:500, color:T.gray600, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 };

export default function AddProcessDrawer({ open, onClose, onCreated }) {
  const { anagrafiche, addProcess } = useData();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  // Reset quando si apre
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) { setWasOpen(true); setForm({}); setErrors({}); }
  if (!open && wasOpen) setWasOpen(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: null })); };

  function validate() {
    const e = {};
    if (!form.name?.trim()) e.name = "Il nome del processo è obbligatorio";
    if (!form.sito) e.sito = "Seleziona un sito";
    if (!form.owner) e.owner = "Seleziona un responsabile";
    if (form.rtoOwnerHours == null || form.rtoOwnerHours === "") e.rtoOwnerHours = "Obbligatorio";
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const id = addProcess({
      name: form.name.trim(),
      macro: form.macro || "—",
      sito: form.sito,
      owner: form.owner,
      rtoOwnerHours: parseHours(form.rtoOwnerHours),
      rtoITHours: parseHours(form.rtoITHours),
      peakPeriod: form.peakPeriod?.trim() || "—",
    });
    onCreated?.(id, form.name.trim());
    onClose();
  }

  const sel = (k, list, ph) => (
    <select value={form[k] || ""} onChange={e => set(k, e.target.value)} style={{ ...FIELD, cursor:"pointer", borderColor: errors[k] ? T.red400 : T.gray200 }}>
      <option value="">{ph}</option>
      {list.map(o => <option key={o.id} value={o.nome}>{o.nome}</option>)}
    </select>
  );

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.22)", opacity:open?1:0, pointerEvents:open?"auto":"none", transition:"opacity .2s", zIndex:100 }} />
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:400, background:"#fff", borderLeft:`0.5px solid ${T.gray100}`,
        transform:open?"translateX(0)":"translateX(100%)", transition:"transform .24s cubic-bezier(.4,0,.2,1)", zIndex:101, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 18px", borderBottom:`0.5px solid ${T.gray100}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:500 }}>Nuovo processo</div>
            <div style={{ fontSize:11, color:T.gray400, marginTop:2 }}>Crea una nuova scheda di analisi</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:`0.5px solid ${T.gray200}`, borderRadius:6, color:T.gray600, fontSize:16, padding:"3px 8px", lineHeight:1, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:18 }}>
          <div style={{ marginBottom:14 }}>
            <label style={LABEL}>Nome processo <span style={{ color:T.red600 }}>*</span></label>
            <input value={form.name || ""} onChange={e => set("name", e.target.value)} placeholder="es. Production MM"
              style={{ ...FIELD, borderColor: errors.name ? T.red400 : T.gray200 }} />
            {errors.name && <div style={{ fontSize:10, color:T.red600, marginTop:3 }}>⚠ {errors.name}</div>}
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={LABEL}>Area / funzione</label>
            {sel("macro", anagrafiche.aree, "Seleziona area…")}
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={LABEL}>Sito <span style={{ color:T.red600 }}>*</span></label>
            {sel("sito", anagrafiche.siti, "Seleziona sito…")}
            {errors.sito && <div style={{ fontSize:10, color:T.red600, marginTop:3 }}>⚠ {errors.sito}</div>}
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={LABEL}>Responsabile <span style={{ color:T.red600 }}>*</span></label>
            {sel("owner", anagrafiche.responsabili, "Seleziona responsabile…")}
            {errors.owner && <div style={{ fontSize:10, color:T.red600, marginTop:3 }}>⚠ {errors.owner}</div>}
          </div>
          <div style={{ display:"flex", gap:10, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label style={LABEL}>RTO owner (ore) <span style={{ color:T.red600 }}>*</span></label>
              <input type="number" min={0} value={form.rtoOwnerHours ?? ""} onChange={e => set("rtoOwnerHours", e.target.value)} placeholder="es. 8"
                style={{ ...FIELD, borderColor: errors.rtoOwnerHours ? T.red400 : T.gray200 }} />
              {errors.rtoOwnerHours && <div style={{ fontSize:10, color:T.red600, marginTop:3 }}>⚠ {errors.rtoOwnerHours}</div>}
            </div>
            <div style={{ flex:1 }}>
              <label style={LABEL}>RTO IT (ore)</label>
              <input type="number" min={0} value={form.rtoITHours ?? ""} onChange={e => set("rtoITHours", e.target.value)} placeholder="es. 12" style={FIELD} />
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={LABEL}>Periodo di picco (opzionale)</label>
            <input value={form.peakPeriod || ""} onChange={e => set("peakPeriod", e.target.value)} placeholder="es. Nov–Dic (+40%)" style={FIELD} />
          </div>
          <div style={{ background:T.blue50, border:`0.5px solid ${T.blue100}`, borderRadius:7, padding:"8px 11px", fontSize:11, color:T.blue800 }}>
            ℹ Il processo viene creato vuoto: input e matrice BIA verranno compilati dal responsabile nella scheda.
          </div>
        </div>
        <div style={{ padding:"12px 18px", borderTop:`0.5px solid ${T.gray100}`, display:"flex", gap:7 }}>
          <button onClick={handleSave} style={{ flex:1, padding:"8px 0", borderRadius:7, border:"none", background:T.blue600, color:"#fff", fontWeight:500, fontSize:12, cursor:"pointer" }}>Crea processo</button>
          <button onClick={onClose} style={{ padding:"8px 14px", borderRadius:7, border:`0.5px solid ${T.gray200}`, background:"#fff", color:T.gray600, fontSize:12, cursor:"pointer" }}>Annulla</button>
        </div>
      </div>
    </>
  );
}
