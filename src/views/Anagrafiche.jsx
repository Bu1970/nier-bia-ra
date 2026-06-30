import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { T } from "../data/demoData.js";

// ─── Registri gestiti dall'admin ──────────────────────────────────────────────
const REGISTRIES = [
  { key:"siti",         label:"Siti",            icon:"📍", singular:"sito",          fields:[{k:"nome",l:"Nome",req:true},{k:"descrizione",l:"Descrizione"}] },
  { key:"responsabili", label:"Responsabili",    icon:"👤", singular:"responsabile",  fields:[{k:"nome",l:"Nome",req:true},{k:"email",l:"Email"},{k:"funzione",l:"Funzione"}] },
  { key:"aree",         label:"Aree / funzioni", icon:"🏢", singular:"area",          fields:[{k:"nome",l:"Nome",req:true}] },
  { key:"fornitori",    label:"Fornitori",       icon:"🤝", singular:"fornitore",     fields:[{k:"nome",l:"Nome",req:true},{k:"tipo",l:"Tipo"}] },
  { key:"software",     label:"Software",        icon:"💻", singular:"software",      fields:[{k:"nome",l:"Nome",req:true},{k:"fornitore",l:"Fornitore"},{k:"criticita",l:"Criticità"}] },
];

// Input non controllato che committa al blur (evita re-render per keystroke).
function CellInput({ defaultValue, placeholder, onCommit }) {
  return (
    <input defaultValue={defaultValue} placeholder={placeholder}
      onBlur={e => onCommit(e.target.value)}
      style={{ width:"100%", padding:"6px 8px", border:`0.5px solid ${T.gray200}`, borderRadius:5,
        fontSize:12, fontFamily:"inherit", outline:"none", background:"#fff" }}
      onFocus={e => e.target.style.borderColor = T.blue400}
      onBlurCapture={e => e.target.style.borderColor = T.gray200} />
  );
}

function RegistryEditor({ reg }) {
  const { anagrafiche, addItem, updateItem, removeItem } = useData();
  const items = anagrafiche[reg.key] || [];
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontSize:12, color:T.gray600 }}>
          <strong>{items.length}</strong> {items.length === 1 ? reg.singular : reg.label.toLowerCase()} in anagrafica
        </div>
        <button onClick={() => addItem(reg.key, Object.fromEntries(reg.fields.map(f => [f.k, ""])))}
          style={{ padding:"6px 12px", borderRadius:7, border:"none", background:T.blue600, color:"#fff", fontWeight:500, fontSize:12, cursor:"pointer" }}>
          + Aggiungi {reg.singular}
        </button>
      </div>
      {items.length === 0 ? (
        <div style={{ background:"#fff", border:`0.5px dashed ${T.gray100}`, borderRadius:10, padding:28, textAlign:"center", color:T.gray400, fontSize:12 }}>
          Nessun elemento. Clicca “Aggiungi {reg.singular}”.
        </div>
      ) : (
        <div style={{ background:"#fff", border:`0.5px solid ${T.gray100}`, borderRadius:10, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:T.gray50 }}>
                {reg.fields.map(f => (
                  <th key={f.k} style={{ padding:"7px 10px", textAlign:"left", fontSize:10, fontWeight:500, color:T.gray400, textTransform:"uppercase", letterSpacing:".04em", borderBottom:`0.5px solid ${T.gray100}` }}>
                    {f.l}{f.req && <span style={{ color:T.red600 }}> *</span>}
                  </th>
                ))}
                <th style={{ width:40, borderBottom:`0.5px solid ${T.gray100}` }} />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom:`0.5px solid ${T.gray100}` }}>
                  {reg.fields.map(f => (
                    <td key={f.k} style={{ padding:"6px 8px" }}>
                      <CellInput defaultValue={item[f.k]} placeholder={f.l}
                        onCommit={v => updateItem(reg.key, item.id, { [f.k]: v })} />
                    </td>
                  ))}
                  <td style={{ padding:"6px 8px", textAlign:"center" }}>
                    <button onClick={() => removeItem(reg.key, item.id)} title="Elimina"
                      style={{ background:"none", border:"none", cursor:"pointer", color:T.gray400, fontSize:13, padding:"2px 4px" }}
                      onMouseEnter={e => e.currentTarget.style.color = T.red600}
                      onMouseLeave={e => e.currentTarget.style.color = T.gray400}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Anagrafiche() {
  const [tab, setTab] = useState(REGISTRIES[0].key);
  const reg = REGISTRIES.find(r => r.key === tab) || REGISTRIES[0];
  return (
    <div style={{ padding:"18px 20px", maxWidth:1180, margin:"0 auto", color:T.gray800 }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:17, fontWeight:600 }}>Anagrafiche</div>
        <div style={{ fontSize:12, color:T.gray400, marginTop:2 }}>
          Registri di base richiamati nei processi e negli input. Le modifiche si salvano automaticamente.
        </div>
      </div>
      <div style={{ display:"flex", gap:4, marginBottom:16, flexWrap:"wrap" }}>
        {REGISTRIES.map(r => (
          <button key={r.key} onClick={() => setTab(r.key)}
            style={{ padding:"7px 13px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12,
              display:"flex", alignItems:"center", gap:6,
              fontWeight: tab === r.key ? 600 : 400,
              background: tab === r.key ? T.blue50 : "#fff",
              color: tab === r.key ? T.blue800 : T.gray600,
              boxShadow: tab === r.key ? "none" : `inset 0 0 0 0.5px ${T.gray100}` }}>
            <span>{r.icon}</span>{r.label}
          </button>
        ))}
      </div>
      <RegistryEditor reg={reg} />
    </div>
  );
}
