import { useState, useEffect, useRef } from "react";

// ─── Palette ──────────────────────────────────────────────────────────────────
const T = {
  blue50:"#E6F1FB", blue100:"#B5D4F4", blue400:"#378ADD", blue600:"#185FA5", blue800:"#0C447C",
  teal50:"#E1F5EE",  teal400:"#1D9E75",  teal600:"#0F6E56",
  amber50:"#FAEEDA", amber400:"#BA7517", amber600:"#854F0B",
  red50:"#FCEBEB",   red400:"#E24B4A",   red600:"#A32D2D",
  green50:"#EAF3DE", green400:"#639922", green600:"#3B6D11",
  gray50:"#F1EFE8",  gray100:"#D3D1C7",  gray200:"#B4B2A9",
  gray400:"#888780", gray600:"#5F5E5A",  gray800:"#444441",
  pu50:"#EEEDFE",    pu800:"#3C3489",
};

// ─── Categorie e relativi campi ───────────────────────────────────────────────
export const CATEGORIES = [
  { id:"HR",        label:"Risorse umane",       icon:"👤", desc:"Personale necessario al processo",          c:T.blue600,  bg:T.blue50  },
  { id:"MATERIALS", label:"Materie prime",        icon:"📦", desc:"Materiali e materie prime consumabili",     c:T.amber600, bg:T.amber50 },
  { id:"EQUIPMENT", label:"Impianti / strumenti", icon:"⚙️",  desc:"Macchinari, apparecchiature, strumenti",   c:T.gray600,  bg:T.gray50  },
  { id:"SOFTWARE",  label:"Software",             icon:"💻", desc:"Applicativi e sistemi informativi",         c:T.teal600,  bg:T.teal50  },
  { id:"UTILITIES", label:"Utilities",            icon:"⚡", desc:"Energia, acqua, gas, aria compressa",       c:T.amber400, bg:T.amber50 },
  { id:"SERVICES",  label:"Servizi",              icon:"🤝", desc:"Servizi affidati in outsourcing",           c:T.blue400,  bg:T.blue50  },
  { id:"LOCATION",  label:"Location",             icon:"📍", desc:"Luoghi in cui si svolge il processo",       c:T.red600,   bg:T.red50   },
];

export const CAT_FIELDS = {
  HR:[
    {id:"qty_normal", label:"Numero normale",    type:"number",   req:true,  ph:"es. 12",  help:"Persone necessarie in condizioni ordinarie"},
    {id:"qty_min",    label:"Numero minimo",      type:"number",   req:true,  ph:"es. 6",   help:"Minimo indispensabile per garantire continuità"},
    {id:"recovery",   label:"Strategia di recovery esistente", type:"textarea", req:false, ph:"es. Back-up da altra funzione, reperibilità H24…"},
    {id:"issues",     label:"Criticità segnalate", type:"textarea", req:false, ph:"Descrivere eventuali criticità note…"},
  ],
  MATERIALS:[
    {id:"qty_normal",     label:"Quantità normale",    type:"number", req:true, ph:"es. 500", help:"In unità di misura del processo"},
    {id:"qty_min",        label:"Quantità minima",      type:"number", req:true, ph:"es. 200"},
    {id:"supplier_count", label:"N. fornitori attivi",  type:"number", req:true, ph:"es. 3"},
    {id:"supplier_min",   label:"N. fornitori minimi",  type:"number", req:true, ph:"es. 1",  help:"Minimo per garantire approvvigionamento"},
    {id:"recovery",       label:"Strategia di recovery esistente", type:"textarea", req:false, ph:"es. Stock sicurezza 30gg, contratto quadro…"},
    {id:"issues",         label:"Criticità segnalate",  type:"textarea", req:false, ph:""},
  ],
  EQUIPMENT:[
    {id:"qty_normal", label:"Quantità normale", type:"number", req:true,  ph:"es. 4"},
    {id:"qty_min",    label:"Quantità minima",   type:"number", req:true,  ph:"es. 2", help:"Minimo per non interrompere il processo"},
    {id:"recovery",   label:"Strategia di recovery esistente", type:"textarea", req:false, ph:"es. Prioritizzazione batch critici…"},
    {id:"issues",     label:"Criticità segnalate", type:"textarea", req:false, ph:""},
  ],
  SOFTWARE:[
    {id:"supplier",     label:"Fornitore",                     type:"text",     req:true,  ph:"es. SAP, Siemens, Microsoft…"},
    {id:"importance",   label:"Livello di importanza",         type:"select",   req:true,
      options:[{v:"",l:"Seleziona…"},{v:"critica",l:"Critica – blocca il processo"},{v:"alta",l:"Alta – impatto significativo"},{v:"media",l:"Media – workaround disponibile"}]},
    {id:"rpo",          label:"RPO (Recovery Point Objective)",type:"text",     req:false, ph:"es. 1h, 4h, 1g", help:"Opzionale. Non può superare l'RTO del processo."},
    {id:"data_critical",label:"Dato/sistema critico",          type:"checkbox", req:false, help:"Il software gestisce dati critici per la continuità"},
    {id:"recovery",     label:"Strategia di recovery esistente",type:"textarea",req:false, ph:"es. Failover su server DR…"},
    {id:"issues",       label:"Criticità segnalate",           type:"textarea", req:false, ph:""},
  ],
  UTILITIES:[
    {id:"supplier",   label:"Fornitore / gestore",   type:"text",   req:true,  ph:"es. Enel, gestore interno…"},
    {id:"importance", label:"Livello di importanza", type:"select", req:true,
      options:[{v:"",l:"Seleziona…"},{v:"critica",l:"Critica – blocca il processo"},{v:"alta",l:"Alta – impatto significativo"},{v:"media",l:"Media – workaround disponibile"}]},
    {id:"recovery",   label:"Strategia di recovery esistente", type:"textarea", req:false, ph:"es. Gruppo elettrogeno 500kW…"},
    {id:"issues",     label:"Criticità segnalate",   type:"textarea", req:false, ph:""},
  ],
  SERVICES:[
    {id:"supplier_count", label:"N. fornitori attivi",  type:"number", req:true, ph:"es. 2"},
    {id:"supplier_min",   label:"N. fornitori minimi",  type:"number", req:true, ph:"es. 1", help:"Minimo per garantire il servizio"},
    {id:"recovery",       label:"Strategia di recovery esistente", type:"textarea", req:false, ph:"es. SLA contrattuale 4h…"},
    {id:"issues",         label:"Criticità segnalate",  type:"textarea", req:false, ph:""},
  ],
  LOCATION:[
    {id:"location_name", label:"Nome / indirizzo location", type:"text", req:true, ph:"es. Stabilimento MM – Via Chimica 1, Montecchio Maggiore"},
    {id:"recovery",      label:"Strategia di recovery esistente", type:"textarea", req:false, ph:"es. Produzione parziale in edificio adiacente…"},
    {id:"issues",        label:"Criticità segnalate",  type:"textarea", req:false, ph:""},
  ],
};

const VULN = ["basso","medio","alto"];
const vulnC = {alto:T.red600,   medio:T.amber600, basso:T.green600};
const vulnBg = {alto:T.red50,    medio:T.amber50,  basso:T.green50};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function catMeta(id){ return CATEGORIES.find(c=>c.id===id)||CATEGORIES[0]; }
function inputDetail(inp){
  if(inp.qty_normal!=null) return `Qtà: ${inp.qty_normal} (min ${inp.qty_min})`;
  if(inp.supplier)         return `${inp.supplier}${inp.importance?" · "+inp.importance:""}${inp.rpo?" · RPO "+inp.rpo:""}`;
  if(inp.supplier_count!=null) return `${inp.supplier_count} fornitori (min ${inp.supplier_min})`;
  return inp.location_name || "—";
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({children, bg, color}){
  return <span style={{display:"inline-flex",alignItems:"center",padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:500,background:bg,color,whiteSpace:"nowrap"}}>{children}</span>;
}

// ─── Singolo campo nel drawer ─────────────────────────────────────────────────
function DrawerField({field, value, onChange, error}){
  const base = {width:"100%",padding:"7px 9px",border:`0.5px solid ${error?T.red400:T.gray200}`,borderRadius:6,fontSize:12,color:"#1a1a18",background:"#fff",outline:"none",fontFamily:"inherit",transition:"border-color .15s"};
  if(field.type==="select") return(
    <select value={value||""} onChange={e=>onChange(e.target.value)} style={{...base,cursor:"pointer"}}>
      {field.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
    </select>);
  if(field.type==="textarea") return(
    <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={field.ph} rows={3}
      style={{...base,resize:"vertical",minHeight:60,lineHeight:1.5}}/>);
  if(field.type==="checkbox") return(
    <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12}}>
      <input type="checkbox" checked={!!value} onChange={e=>onChange(e.target.checked)}
        style={{width:14,height:14,accentColor:T.blue600}}/>
      <span style={{color:T.gray600}}>{field.help||field.label}</span>
    </label>);
  return(
    <input type={field.type} value={value||""} onChange={e=>onChange(e.target.value)}
      placeholder={field.ph} style={base}
      onFocus={e=>e.target.style.borderColor=T.blue400}
      onBlur={e=>e.target.style.borderColor=error?T.red400:T.gray200}/>);
}

// ─── Drawer component ─────────────────────────────────────────────────────────
function Drawer({open, editInput, preFillCat, onClose, onSave}){
  const [selCat, setSelCat]     = useState("");
  const [formData, setFormData] = useState({});
  const [errors, setErrors]     = useState({});
  const [saved, setSaved]       = useState(false);

  // Il campo nome è NON CONTROLLATO: usiamo un ref per leggerne il valore
  // senza causare re-render ad ogni tasto (che spostava il cursore all'inizio).
  const nameRef = useRef(null);

  useEffect(()=>{
    if(!open) return;
    if(editInput){
      setSelCat(editInput.cat);
      setFormData({...editInput});
    } else {
      setSelCat(preFillCat||"");
      setFormData({});
    }
    setErrors({}); setSaved(false);
    // Imposta il valore nel DOM direttamente, poi metti il focus
    setTimeout(()=>{
      if(nameRef.current){
        nameRef.current.value = editInput?.name || "";
        nameRef.current.focus();
      }
    }, 100);
  },[open, editInput, preFillCat]);

  // Legge il valore corrente del campo nome dal DOM
  function getNameValue(){ return nameRef.current?.value?.trim() || ""; }

  function handleCatChange(id){
    if(editInput) return;
    setSelCat(id);
    // Preserva vuln ma cancella i campi specifici della categoria precedente;
    // il nome vive nel DOM e non viene toccato.
    setFormData(prev=>({ vuln: prev.vuln||"" }));
    setErrors(prev=>{ const {cat:_, name:__, ...rest}=prev; return rest; });
  }

  function setField(id, val){
    setFormData(prev=>({...prev,[id]:val}));
    if(errors[id]) setErrors(prev=>({...prev,[id]:null}));
  }

  // Cancella errore nome quando l'utente inizia a correggere
  function handleNameFocus(){
    if(errors.name) setErrors(prev=>({...prev, name:null}));
  }

  function validate(){
    const nameVal = getNameValue();
    const e={};
    if(!nameVal)   e.name="Il nome è obbligatorio";
    if(!selCat)    e.cat="Seleziona una categoria";
    if(!formData.vuln) e.vuln="La vulnerabilità è obbligatoria";
    (CAT_FIELDS[selCat]||[]).forEach(f=>{
      if(f.req && f.type!=="checkbox" && (formData[f.id]===undefined||formData[f.id]===""))
        e[f.id]="Campo obbligatorio";
    });
    if(formData.qty_min!=null && formData.qty_normal!=null && +formData.qty_min>+formData.qty_normal)
      e.qty_min="Il minimo non può superare il valore normale";
    if(formData.supplier_min!=null && formData.supplier_count!=null && +formData.supplier_min>+formData.supplier_count)
      e.supplier_min="Il minimo non può superare il totale";
    return e;
  }

  function handleSave(){
    const e=validate();
    if(Object.keys(e).length){ setErrors(e); return; }
    setSaved(true);
    setTimeout(()=>{
      onSave({ ...formData, name: getNameValue(), cat: selCat });
      setSaved(false);
    }, 500);
  }

  const cat    = catMeta(selCat);
  const fields = CAT_FIELDS[selCat]||[];
  const isEdit = !!editInput;

  return(<>
    {/* Overlay */}
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.22)",opacity:open?1:0,pointerEvents:open?"auto":"none",transition:"opacity .2s",zIndex:100}}/>
    {/* Pannello */}
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:400,background:"#fff",borderLeft:`0.5px solid ${T.gray100}`,transform:open?"translateX(0)":"translateX(100%)",transition:"transform .24s cubic-bezier(.4,0,.2,1)",zIndex:101,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"14px 18px",borderBottom:`0.5px solid ${T.gray100}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:selCat?cat.bg:"#fff",flexShrink:0,transition:"background .2s"}}>
        <div>
          <div style={{fontSize:13,fontWeight:500}}>{isEdit?"Modifica input":"Nuovo input"}</div>
          <div style={{fontSize:11,color:T.gray600,marginTop:2}}>{selCat?`Categoria: ${cat.icon} ${cat.label}`:"Seleziona la categoria per vedere i campi specifici"}</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:`0.5px solid ${T.gray200}`,borderRadius:6,color:T.gray600,fontSize:16,padding:"3px 8px",lineHeight:1,cursor:"pointer"}}>✕</button>
      </div>

      {/* Body */}
      <div style={{flex:1,overflowY:"auto",padding:18}}>
        {/* ── Campo nome: NON CONTROLLATO ──
            defaultValue non viene usato perché impostiamo il valore via ref
            nell'useEffect; nessun onChange → nessun re-render ad ogni tasto. */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:10,fontWeight:500,color:T.gray600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>
            Nome input <span style={{color:T.red600}}>*</span>
          </label>
          <input
            ref={nameRef}
            type="text"
            placeholder="es. Reattori batch, SAP S/4HANA, Fornitore API X…"
            onFocus={e=>{ handleNameFocus(); e.target.style.borderColor=T.blue400; }}
            onBlur={e=>{ e.target.style.borderColor=errors.name?T.red400:T.gray200; }}
            style={{width:"100%",padding:"7px 9px",border:`0.5px solid ${errors.name?T.red400:T.gray200}`,borderRadius:6,fontSize:12,color:"#1a1a18",outline:"none",fontFamily:"inherit",transition:"border-color .15s"}}
          />
          {errors.name && <div style={{fontSize:10,color:T.red600,marginTop:3}}>⚠ {errors.name}</div>}
        </div>

        {/* Selettore categoria (solo nuovo) */}
        {!isEdit && (
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:10,fontWeight:500,color:T.gray600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:5}}>Categoria <span style={{color:T.red600}}>*</span></label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
              {CATEGORIES.map(c=>(
                <button key={c.id} onClick={()=>handleCatChange(c.id)} style={{padding:"7px 9px",borderRadius:6,fontSize:11,textAlign:"left",display:"flex",alignItems:"center",gap:6,cursor:"pointer",background:selCat===c.id?c.bg:"#fff",border:selCat===c.id?`1.5px solid ${c.c}`:`0.5px solid ${T.gray100}`,color:selCat===c.id?c.c:T.gray600,fontWeight:selCat===c.id?500:400,transition:"all .12s"}}>
                  <span style={{fontSize:14}}>{c.icon}</span>{c.label}
                </button>))}
            </div>
            {errors.cat && <div style={{fontSize:10,color:T.red600,marginTop:4}}>⚠ {errors.cat}</div>}
          </div>
        )}

        {/* Campi specifici categoria */}
        {selCat && (<>
          <div style={{borderTop:`0.5px solid ${T.gray100}`,paddingTop:14,marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:500,textTransform:"uppercase",letterSpacing:".06em",color:cat.c,display:"flex",alignItems:"center",gap:5,marginBottom:12}}>
              {cat.icon} Campi {cat.label}
            </div>
            {fields.map(f=>(
              <div key={f.id} style={{marginBottom:14}}>
                {f.type!=="checkbox" && (
                  <label style={{display:"block",fontSize:10,fontWeight:500,color:T.gray600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>
                    {f.label}{f.req&&<span style={{color:T.red600}}> *</span>}
                  </label>)}
                {f.help && f.type!=="checkbox" && <div style={{fontSize:10,color:T.gray400,marginBottom:4,lineHeight:1.4}}>{f.help}</div>}
                <DrawerField field={f} value={formData[f.id]} onChange={v=>setField(f.id,v)} error={errors[f.id]}/>
                {errors[f.id] && <div style={{fontSize:10,color:T.red600,marginTop:3}}>⚠ {errors[f.id]}</div>}
              </div>))}
          </div>

          {/* Vulnerabilità */}
          <div style={{borderTop:`0.5px solid ${T.gray100}`,paddingTop:14}}>
            <label style={{display:"block",fontSize:10,fontWeight:500,color:T.gray600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>
              Vulnerabilità <span style={{color:T.red600}}>*</span>
            </label>
            <div style={{fontSize:10,color:T.gray400,marginBottom:6,lineHeight:1.4}}>
              In caso di interruzione, quanto questo input è esposto al rischio di impattare la continuità?
            </div>
            <div style={{display:"flex",gap:5}}>
              {VULN.map(v=>(
                <button key={v} onClick={()=>setField("vuln",v)} style={{flex:1,padding:"6px 4px",borderRadius:6,fontSize:11,textAlign:"center",cursor:"pointer",border:formData.vuln===v?`1.5px solid ${vulnC[v]}`:`0.5px solid ${T.gray100}`,background:formData.vuln===v?vulnBg[v]:"#fff",color:formData.vuln===v?vulnC[v]:T.gray600,fontWeight:formData.vuln===v?500:400,transition:"all .12s"}}>
                  {v.charAt(0).toUpperCase()+v.slice(1)}
                </button>))}
            </div>
            {errors.vuln && <div style={{fontSize:10,color:T.red600,marginTop:4}}>⚠ {errors.vuln}</div>}
          </div>
        </>)}
      </div>

      {/* Footer */}
      <div style={{padding:"12px 18px",borderTop:`0.5px solid ${T.gray100}`,display:"flex",gap:7,flexShrink:0}}>
        <button onClick={handleSave} style={{flex:1,padding:"8px 0",borderRadius:7,border:"none",background:saved?T.teal600:T.blue600,color:"#fff",fontWeight:500,fontSize:12,cursor:"pointer",transition:"background .2s"}}>
          {saved?"✓ Salvato":(isEdit?"Salva modifiche":"Aggiungi input")}
        </button>
        <button onClick={onClose} style={{padding:"8px 14px",borderRadius:7,border:`0.5px solid ${T.gray200}`,background:"#fff",color:T.gray600,fontSize:12,cursor:"pointer"}}>Annulla</button>
      </div>
    </div>
  </>);
}

// ─── Riga input nella tabella ─────────────────────────────────────────────────
function InputRow({inp, onEdit, onDelete}){
  const cat = catMeta(inp.cat);
  const [hov, setHov] = useState(false);
  return(
    <tr onClick={()=>onEdit(inp)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?T.blue50:"transparent",cursor:"pointer"}}>
      <td style={{padding:"7px 9px",textAlign:"center",fontSize:14}}>{cat.icon}</td>
      <td style={{padding:"7px 9px",fontWeight:500,fontSize:12}}>
        {inp.name}
        {inp.data_critical && <span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:T.pu50,color:T.pu800,marginLeft:5}}>data-critical</span>}
      </td>
      <td style={{padding:"7px 9px",fontSize:11,color:T.gray600}}>{inputDetail(inp)}</td>
      <td style={{padding:"7px 9px"}}>{inp.vuln?<Badge bg={vulnBg[inp.vuln]} color={vulnC[inp.vuln]}>{inp.vuln}</Badge>:<span style={{color:T.gray400,fontSize:11}}>—</span>}</td>
      <td style={{padding:"7px 9px"}}>{inp.issues?<Badge bg={T.amber50} color={T.amber600}>⚠ issue</Badge>:<Badge bg={T.teal50} color={T.teal600}>OK</Badge>}</td>
      <td style={{padding:"7px 9px",textAlign:"right"}}>
        <button onClick={e=>{e.stopPropagation();onDelete(inp.id);}} style={{background:"none",border:"none",cursor:"pointer",color:T.gray400,fontSize:13,padding:"2px 5px",borderRadius:4}}
          onMouseEnter={e=>e.currentTarget.style.color=T.red600}
          onMouseLeave={e=>e.currentTarget.style.color=T.gray400}>✕</button>
      </td>
    </tr>);
}

// ─── Sezione categoria (sempre visibile) ──────────────────────────────────────
function CategorySection({cat, items, onAdd, onEdit, onDelete}){
  const isEmpty = items.length===0;
  return(
    <div style={{background:"#fff",border:`0.5px ${isEmpty?"dashed":"solid"} ${isEmpty?T.gray100:T.gray100}`,borderRadius:10,marginBottom:10,overflow:"hidden"}}>
      {/* Header sezione */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:isEmpty?"none":`0.5px solid ${T.gray100}`}}>
        <div style={{width:28,height:28,borderRadius:6,background:cat.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{cat.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:500}}>{cat.label}</div>
          <div style={{fontSize:10,color:T.gray400,marginTop:1}}>{cat.desc}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {!isEmpty && <span style={{fontSize:10,padding:"1px 7px",borderRadius:8,fontWeight:500,background:cat.bg,color:cat.c}}>{items.length} input</span>}
          <button onClick={()=>onAdd(cat.id)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 11px",borderRadius:6,fontSize:11,fontWeight:500,border:`0.5px solid ${cat.c}`,color:cat.c,background:"#fff",cursor:"pointer",transition:"background .1s"}}
            onMouseEnter={e=>e.currentTarget.style.background=cat.bg}
            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
            <span style={{fontSize:13}}>+</span> Aggiungi
          </button>
        </div>
      </div>

      {isEmpty ? (
        /* Stato vuoto */
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}>
          <span style={{fontSize:20,opacity:.25}}>{cat.icon}</span>
          <div>
            <div style={{fontSize:12,color:T.gray400}}>Nessun input inserito per questa categoria</div>
            <div style={{fontSize:11,color:T.gray400,fontStyle:"italic",marginTop:1}}>Clicca "Aggiungi" per inserire {cat.label.toLowerCase()} necessari a questo processo</div>
          </div>
        </div>
      ) : (
        /* Tabella input */
        <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
          <thead>
            <tr style={{background:T.gray50}}>
              {["","Nome input","Dettaglio chiave","Vulnerabilità","Issue",""].map((h,i)=>(
                <th key={i} style={{padding:"5px 9px",textAlign:"left",fontSize:10,fontWeight:500,color:T.gray400,borderBottom:`0.5px solid ${T.gray100}`,textTransform:"uppercase",letterSpacing:".05em",width:["36px","auto","30%","80px","70px","36px"][i]}}>{h}</th>))}
            </tr>
          </thead>
          <tbody>
            {items.map(inp=><InputRow key={inp.id} inp={inp} onEdit={onEdit} onDelete={onDelete}/>)}
            {/* Riga "+ aggiungi" in fondo alla sezione */}
            <tr onClick={()=>onAdd(cat.id)} style={{cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.blue50}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td colSpan={6} style={{padding:"7px 9px",borderTop:`0.5px solid ${T.gray100}`}}>
                <div style={{display:"flex",alignItems:"center",gap:5,color:cat.c,fontSize:11,fontWeight:500}}>
                  <span style={{fontSize:14,lineHeight:1}}>+</span>
                  <span>Aggiungi {cat.label.toLowerCase()}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>);
}

// ─── Barra completezza processo ───────────────────────────────────────────────
function CompletenessBar({inputs}){
  const filled = CATEGORIES.filter(c=>inputs.some(i=>i.cat===c.id)).length;
  const pct = Math.round(filled/CATEGORIES.length*100);
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,background:"#fff",border:`0.5px solid ${T.gray100}`,borderRadius:8,padding:"10px 14px",marginBottom:16}}>
      <span style={{fontSize:11,color:T.gray600,whiteSpace:"nowrap"}}>Completezza processo:</span>
      <div style={{flex:1}}>
        <div style={{display:"flex",gap:3}}>
          {CATEGORIES.map(c=>{const has=inputs.some(i=>i.cat===c.id);return(
            <div key={c.id} title={`${c.label}: ${inputs.filter(i=>i.cat===c.id).length} input`}
              style={{flex:1,height:6,borderRadius:3,background:has?c.c:T.gray100,transition:"background .3s"}}/>);})}
        </div>
        <div style={{display:"flex",gap:3,marginTop:4}}>
          {CATEGORIES.map(c=>{const has=inputs.some(i=>i.cat===c.id);return(
            <div key={c.id} style={{flex:1,fontSize:9,textAlign:"center",color:has?c.c:T.gray200}}>{c.icon}</div>);})}
        </div>
      </div>
      <span style={{fontSize:11,fontWeight:500,color:pct===100?T.teal600:pct>=57?T.amber600:T.red600}}>{pct}%</span>
    </div>);
}

// ─── Dati di esempio ──────────────────────────────────────────────────────────
const SAMPLE_PROCS=[
  {id:1, name:"Production MM",    macro:"Operations"},
  {id:7, name:"IT Infrastructure",macro:"IT"},
  {id:11,name:"HSE",              macro:"HSE"},
];
const INITIAL_INPUTS=[
  {id:1, pid:1,cat:"EQUIPMENT",name:"Reattori batch R1–R4",       qty_normal:4,   qty_min:2,   vuln:"alto", recovery:"Prioritizzazione batch critici",issues:"R3 fermo – ETA 15/06"},
  {id:2, pid:1,cat:"MATERIALS",name:"API – Principio attivo X",   qty_normal:500, qty_min:200, supplier_count:2,supplier_min:1,vuln:"alto", recovery:"Stock sicurezza 30gg",issues:"Fornitore primario in ritardo Q2"},
  {id:3, pid:1,cat:"MATERIALS",name:"Solventi (Acetone, EtOH)",   qty_normal:8000,qty_min:3000,supplier_count:3,supplier_min:2,vuln:"basso",recovery:"Contratto quadro multi-fornitore",issues:""},
  {id:4, pid:1,cat:"SOFTWARE", name:"MES Opcenter (Siemens)",     supplier:"Siemens",importance:"critica",rpo:"4h",data_critical:true, vuln:"medio",recovery:"Failover su server DR",issues:""},
  {id:5, pid:1,cat:"SOFTWARE", name:"ERP SAP S/4HANA",           supplier:"SAP",  importance:"critica",rpo:"1h",data_critical:true, vuln:"basso",recovery:"Cluster HA + backup",issues:""},
  {id:6, pid:1,cat:"HR",       name:"Operatori linea A",         qty_normal:14,  qty_min:7,  vuln:"medio",recovery:"Back-up da linea B",issues:""},
  {id:7, pid:1,cat:"HR",       name:"Supervisori di produzione", qty_normal:4,   qty_min:2,  vuln:"basso",recovery:"Reperibilità H24",issues:""},
  {id:8, pid:1,cat:"UTILITIES",name:"Energia elettrica",         supplier:"Enel",importance:"critica",vuln:"basso",recovery:"GE 500kW (4h autonomia)",issues:""},
  {id:9, pid:1,cat:"UTILITIES",name:"Acqua demineralizzata",     supplier:"Interna",importance:"alta",vuln:"medio",recovery:"Serbatoio riserva 500m³",issues:""},
  {id:10,pid:1,cat:"LOCATION", name:"Stabilimento MM – ed. R",  location_name:"Via Chimica 1, MM",vuln:"medio",recovery:"Produzione parziale edificio S",issues:""},
  {id:11,pid:7,cat:"SOFTWARE", name:"SAP S/4HANA (server)",     supplier:"SAP/AWS",importance:"critica",rpo:"1h",data_critical:true,vuln:"basso",recovery:"Replica sincrona DR site",issues:""},
  {id:12,pid:7,cat:"SOFTWARE", name:"Active Directory",         supplier:"Microsoft",importance:"critica",rpo:"30min",data_critical:true,vuln:"basso",recovery:"Cluster AD a 3 nodi",issues:""},
  {id:13,pid:7,cat:"LOCATION", name:"Data center – Milano",     location_name:"Via Pirelli 35, MI",vuln:"medio",recovery:"DR site Lonigo (RTO 4h)",issues:"DR site non ancora certificato"},
  {id:14,pid:7,cat:"LOCATION", name:"DR site – Lonigo",         location_name:"Via Industria 8, LO",vuln:"alto",recovery:"—",issues:"Setup in corso, test failover mancanti"},
  {id:15,pid:7,cat:"HR",       name:"Sistemisti infrastruttura",qty_normal:6,   qty_min:3,  vuln:"medio",recovery:"Reperibilità 24/7",issues:""},
  {id:16,pid:7,cat:"SERVICES", name:"Connettività internet",    supplier_count:2,supplier_min:1,vuln:"basso",recovery:"Backup LTE 1Gbps",issues:""},
  {id:17,pid:7,cat:"UTILITIES",name:"UPS + generatore",         supplier:"Interna",importance:"critica",vuln:"basso",recovery:"UPS 30min + GE 100kW",issues:""},
  {id:18,pid:11,cat:"EQUIPMENT",name:"Sistema allarme gas",     qty_normal:1,   qty_min:1,  vuln:"basso",recovery:"Allarme portatile + presidio manuale",issues:""},
  {id:19,pid:11,cat:"EQUIPMENT",name:"Sistema antincendio",     qty_normal:1,   qty_min:1,  vuln:"basso",recovery:"Estintori + VVF convenzionati",issues:""},
  {id:20,pid:11,cat:"HR",       name:"Addetti emergenza (ASPP)",qty_normal:8,   qty_min:4,  vuln:"basso",recovery:"Reperibilità garantita",issues:""},
];

// ─── App principale ────────────────────────────────────────────────────────────
export default function InputDrawerDemo(){
  const [inputs,   setInputs]   = useState(INITIAL_INPUTS);
  const [selProc,  setSelProc]  = useState(1);
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [editInput, setEditInput]=useState(null);
  const [preFillCat,setPreFillCat]=useState("");
  const [toast,    setToast]    = useState(null);
  let nextId = useRef(200);

  const proc       = SAMPLE_PROCS.find(p=>p.id===selProc)||SAMPLE_PROCS[0];
  const procInputs = inputs.filter(i=>i.pid===selProc);
  const filled     = CATEGORIES.filter(c=>procInputs.some(i=>i.cat===c.id)).length;

  function openNew(catId){
    setEditInput(null); setPreFillCat(catId||""); setDrawerOpen(true);
  }
  function openEdit(inp){
    setEditInput(inp); setPreFillCat(""); setDrawerOpen(true);
  }
  function closeDrawer(){ setDrawerOpen(false); setTimeout(()=>{setEditInput(null);setPreFillCat("");},250); }

  function handleSave(data){
    if(editInput){
      setInputs(prev=>prev.map(i=>i.id===editInput.id?{...i,...data}:i));
      showToast("Input aggiornato");
    } else {
      setInputs(prev=>[...prev,{...data,id:nextId.current++,pid:selProc}]);
      showToast("Nuovo input aggiunto");
    }
    closeDrawer();
  }
  function handleDelete(id){
    setInputs(prev=>prev.filter(i=>i.id!==id));
    showToast("Input eliminato");
  }
  function showToast(msg){
    setToast(msg); setTimeout(()=>setToast(null),2600);
  }

  return(
    <div style={{fontFamily:"system-ui,sans-serif",background:T.gray50,minHeight:"100vh"}}>
      {/* Toast */}
      <div style={{position:"fixed",bottom:20,left:"50%",transform:`translateX(-50%) translateY(${toast?0:12}px)`,background:T.teal600,color:"#fff",padding:"8px 16px",borderRadius:7,fontSize:11,fontWeight:500,opacity:toast?1:0,transition:"opacity .2s,transform .2s",zIndex:200,pointerEvents:"none"}}>
        ✓ {toast}
      </div>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.gray100}`,padding:"11px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:28,height:28,background:T.blue600,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:600}}>N</div>
          <div style={{width:1,height:24,background:T.gray100}}/>
          <span style={{fontSize:11,color:T.gray600}}>Processo:</span>
          {SAMPLE_PROCS.map(p=>(
            <button key={p.id} onClick={()=>setSelProc(p.id)} style={{padding:"4px 11px",borderRadius:5,fontSize:11,cursor:"pointer",border:selProc===p.id?`1.5px solid ${T.blue600}`:`0.5px solid ${T.gray100}`,background:selProc===p.id?T.blue50:"#fff",color:selProc===p.id?T.blue800:T.gray600,fontWeight:selProc===p.id?500:400}}>
              {p.name}
            </button>))}
        </div>
        <button onClick={()=>openNew("")} style={{padding:"7px 14px",borderRadius:7,border:"none",background:T.blue600,color:"#fff",fontWeight:500,fontSize:12,cursor:"pointer"}}>+ Aggiungi input</button>
      </div>

      {/* Contenuto */}
      <div style={{padding:"18px 20px"}}>
        {/* KPI */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:16}}>
          {[
            ["Input inseriti",   procInputs.length,                                      T.gray800],
            ["Categorie compilate", `${filled} / 7`,                                    filled===7?T.teal600:filled>=4?T.amber600:T.red600],
            ["Vulnerabilità alta", procInputs.filter(i=>i.vuln==="alto").length,        T.red600],
            ["Issue aperte",      procInputs.filter(i=>i.issues).length,                T.amber600],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:"#fff",border:`0.5px solid ${T.gray100}`,borderRadius:8,padding:"10px 13px"}}>
              <div style={{fontSize:10,color:T.gray400,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>{l}</div>
              <div style={{fontSize:21,fontWeight:500,color:c}}>{v}</div>
            </div>))}
        </div>

        {/* Barra completezza */}
        <CompletenessBar inputs={procInputs}/>

        {/* Sezioni categoria – sempre tutte visibili */}
        {CATEGORIES.map(cat=>(
          <CategorySection
            key={cat.id}
            cat={cat}
            items={procInputs.filter(i=>i.cat===cat.id)}
            onAdd={openNew}
            onEdit={openEdit}
            onDelete={handleDelete}
          />))}
      </div>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        editInput={editInput}
        preFillCat={preFillCat}
        onClose={closeDrawer}
        onSave={handleSave}
      />
    </div>);
}
