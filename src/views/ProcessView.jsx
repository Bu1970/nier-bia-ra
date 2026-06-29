import { useState, useRef, useCallback } from "react";

// ─── Palette condivisa ────────────────────────────────────────────────────────
const T = {
  blue50:"#E6F1FB",blue100:"#B5D4F4",blue400:"#378ADD",blue600:"#185FA5",blue800:"#0C447C",
  teal50:"#E1F5EE",teal400:"#1D9E75",teal600:"#0F6E56",
  amber50:"#FAEEDA",amber400:"#BA7517",amber600:"#854F0B",
  red50:"#FCEBEB",red100:"#F7C1C1",red400:"#E24B4A",red600:"#A32D2D",red800:"#7C1D1D",
  green50:"#EAF3DE",green400:"#639922",green600:"#3B6D11",
  gray50:"#F1EFE8",gray100:"#D3D1C7",gray200:"#B4B2A9",
  gray400:"#888780",gray600:"#5F5E5A",gray800:"#444441",
  pu50:"#EEEDFE",pu800:"#3C3489",
};

// Costanti metodologiche
const BIA_WINDOWS=[
  {id:"1h",label:"1h",hours:1},{id:"4h",label:"4h",hours:4},
  {id:"8h",label:"8h",hours:8},{id:"1g",label:"1g",hours:24},
  {id:"3g",label:"3g",hours:72},{id:"7g",label:"7g",hours:168},
  {id:"14g",label:"14g",hours:336},{id:"30g",label:"30g",hours:720},
];
const IMPACT_DIMS=[
  {id:"rep",label:"Reputazione / Fiducia clienti"},
  {id:"leg",label:"Legale / Normativo"},
  {id:"fin",label:"Finanziario"},
];
const IMPACT_LEVELS=[
  {v:0,label:"—",      color:T.gray400,bg:T.gray50 },
  {v:1,label:"Basso",  color:T.green600,bg:T.green50},
  {v:2,label:"Medio",  color:T.amber600,bg:T.amber50},
  {v:3,label:"Alto",   color:T.red600,  bg:T.red50  },
  {v:4,label:"Critico",color:T.red800,  bg:T.red100 },
];
const VXL={basso:{bassa:1,media:2,alta:3},medio:{bassa:2,media:4,alta:6},alto:{bassa:3,media:6,alta:9}};
const MTPD_MAX_H=720,RTO_MAX_H=720;
const CATEGORIES=[
  {id:"HR",       label:"Risorse umane",      icon:"👤",desc:"Personale necessario al processo",       c:T.blue600, bg:T.blue50 },
  {id:"MATERIALS",label:"Materie prime",       icon:"📦",desc:"Materiali e materie prime consumabili",  c:T.amber600,bg:T.amber50},
  {id:"EQUIPMENT",label:"Impianti/strumenti",  icon:"⚙️", desc:"Macchinari, apparecchiature, strumenti", c:T.gray600, bg:T.gray50 },
  {id:"SOFTWARE", label:"Software",            icon:"💻",desc:"Applicativi e sistemi informativi",      c:T.teal600, bg:T.teal50 },
  {id:"UTILITIES",label:"Utilities",           icon:"⚡",desc:"Energia, acqua, gas, aria compressa",    c:T.amber400,bg:T.amber50},
  {id:"SERVICES", label:"Servizi",             icon:"🤝",desc:"Servizi affidati in outsourcing",        c:T.blue400, bg:T.blue50 },
  {id:"LOCATION", label:"Location",            icon:"📍",desc:"Luoghi in cui si svolge il processo",    c:T.red600,  bg:T.red50  },
];
const CAT_FIELDS={
  HR:[{id:"qty_normal",label:"Numero normale",type:"number",req:true,ph:"es. 12",help:"Persone necessarie in condizioni ordinarie"},{id:"qty_min",label:"Numero minimo",type:"number",req:true,ph:"es. 6",help:"Minimo indispensabile"},{id:"recovery",label:"Strategia di recovery esistente",type:"textarea",req:false,ph:"es. Back-up da altra funzione…"},{id:"issues",label:"Criticità segnalate",type:"textarea",req:false,ph:""}],
  MATERIALS:[{id:"qty_normal",label:"Quantità normale",type:"number",req:true,ph:"es. 500",help:"In unità di misura del processo"},{id:"qty_min",label:"Quantità minima",type:"number",req:true,ph:"es. 200"},{id:"supplier_count",label:"N. fornitori attivi",type:"number",req:true,ph:"es. 3"},{id:"supplier_min",label:"N. fornitori minimi",type:"number",req:true,ph:"es. 1",help:"Minimo per approvvigionamento"},{id:"recovery",label:"Strategia di recovery esistente",type:"textarea",req:false,ph:""},{id:"issues",label:"Criticità segnalate",type:"textarea",req:false,ph:""}],
  EQUIPMENT:[{id:"qty_normal",label:"Quantità normale",type:"number",req:true,ph:"es. 4"},{id:"qty_min",label:"Quantità minima",type:"number",req:true,ph:"es. 2",help:"Minimo per non interrompere il processo"},{id:"recovery",label:"Strategia di recovery esistente",type:"textarea",req:false,ph:""},{id:"issues",label:"Criticità segnalate",type:"textarea",req:false,ph:""}],
  SOFTWARE:[{id:"supplier",label:"Fornitore",type:"text",req:true,ph:"es. SAP, Siemens…"},{id:"importance",label:"Livello di importanza",type:"select",req:true,options:[{v:"",l:"Seleziona…"},{v:"critica",l:"Critica – blocca il processo"},{v:"alta",l:"Alta – impatto significativo"},{v:"media",l:"Media – workaround disponibile"}]},{id:"rpo",label:"RPO",type:"text",req:false,ph:"es. 1h, 4h, 1g",help:"Opzionale. Non può superare l'RTO del processo."},{id:"data_critical",label:"Dato/sistema critico",type:"checkbox",req:false,help:"Il software gestisce dati critici per la continuità"},{id:"recovery",label:"Strategia di recovery esistente",type:"textarea",req:false,ph:""},{id:"issues",label:"Criticità segnalate",type:"textarea",req:false,ph:""}],
  UTILITIES:[{id:"supplier",label:"Fornitore/gestore",type:"text",req:true,ph:"es. Enel…"},{id:"importance",label:"Livello di importanza",type:"select",req:true,options:[{v:"",l:"Seleziona…"},{v:"critica",l:"Critica"},{v:"alta",l:"Alta"},{v:"media",l:"Media"}]},{id:"recovery",label:"Strategia di recovery esistente",type:"textarea",req:false,ph:""},{id:"issues",label:"Criticità segnalate",type:"textarea",req:false,ph:""}],
  SERVICES:[{id:"supplier_count",label:"N. fornitori attivi",type:"number",req:true,ph:"es. 2"},{id:"supplier_min",label:"N. fornitori minimi",type:"number",req:true,ph:"es. 1",help:"Minimo per garantire il servizio"},{id:"recovery",label:"Strategia di recovery esistente",type:"textarea",req:false,ph:""},{id:"issues",label:"Criticità segnalate",type:"textarea",req:false,ph:""}],
  LOCATION:[{id:"location_name",label:"Nome/indirizzo location",type:"text",req:true,ph:"es. Via Chimica 1, Montecchio Maggiore"},{id:"recovery",label:"Strategia di recovery esistente",type:"textarea",req:false,ph:""},{id:"issues",label:"Criticità segnalate",type:"textarea",req:false,ph:""}],
};
const CRIT_META={
  "molto alta":{color:T.red800,bg:T.red100,border:T.red400},
  "alta":      {color:T.red600,bg:T.red50, border:T.red400},
  "media":     {color:T.blue800,bg:T.blue50,border:T.blue400},
  "bassa":     {color:T.green600,bg:T.green50,border:T.green400},
  "molto bassa":{color:T.teal600,bg:T.teal50,border:T.teal400},
};

// Engine functions
function computeMTPD(cells){
  for(let wi=0;wi<BIA_WINDOWS.length;wi++){
    if(IMPACT_DIMS.some(d=>(cells[d.id]?.[wi]??0)===4))return BIA_WINDOWS[wi];
  }
  return BIA_WINDOWS[BIA_WINDOWS.length-1];
}
function computeFinalRTO(own,it){return Math.max(own??0,it??0);}
function checkRTOvsMTPD(rtoH,mtpd){return rtoH<=mtpd.hours;}
function computeCriticality({mtpdHours,rtoHours,vuln,likelihood}){
  const vxl=VXL[vuln]?.[likelihood]??1;
  const cM=r4((mtpdHours/MTPD_MAX_H)/vxl);
  const cR=r4((rtoHours/RTO_MAX_H)/vxl);
  const cF=r4(Math.min(cM,cR));
  return{vxl,cMTPD:cM,cRTO:cR,cFinal:cF,classMTPD:clsC(cM),classRTO:clsC(cR),classFinal:clsC(cF)};
}
function r4(v){return Math.round(v*10000)/10000;}
function clsC(c){if(c<=0.05)return"molto alta";if(c<=0.14)return"alta";if(c<=0.24)return"media";if(c<=0.35)return"bassa";return"molto bassa";}
function rtoLabel(h){if(!h&&h!==0)return"—";if(h<24)return`${h}h`;if(h===24)return"1g";return`${Math.round(h/24)}g`;}
function catMeta(id){return CATEGORIES.find(c=>c.id===id)||CATEGORIES[0];}
function inputDetail(inp){
  if(inp.qty_normal!=null)return`Qtà: ${inp.qty_normal} (min ${inp.qty_min})`;
  if(inp.supplier)return`${inp.supplier}${inp.importance?" · "+inp.importance:""}${inp.rpo?" · RPO "+inp.rpo:""}`;
  if(inp.supplier_count!=null)return`${inp.supplier_count} forn. (min ${inp.supplier_min})`;
  return inp.location_name||"—";
}

// Shared components
function Badge({children,bg,color,border}){return <span style={{display:"inline-flex",alignItems:"center",padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:500,background:bg,color,border:border?`0.5px solid ${border}`:"none",whiteSpace:"nowrap"}}>{children}</span>;}
function CritBadge({level}){const m=CRIT_META[level]||CRIT_META["media"];return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:m.bg,color:m.color,border:`0.5px solid ${m.border}`,whiteSpace:"nowrap"}}>{level}</span>;}
function Pill({label,bg,color}){return <span style={{fontSize:10,fontWeight:500,padding:"2px 8px",borderRadius:8,background:bg,color}}>{label}</span>;}

// DrawerField
function DrawerField({field,value,onChange,error}){
  const base={width:"100%",padding:"7px 9px",border:`0.5px solid ${error?T.red400:T.gray200}`,borderRadius:6,fontSize:12,color:"#1a1a18",background:"#fff",outline:"none",fontFamily:"inherit",transition:"border-color .15s"};
  if(field.type==="select")return(<select value={value||""} onChange={e=>onChange(e.target.value)} style={{...base,cursor:"pointer"}}>{field.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>);
  if(field.type==="textarea")return(<textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={field.ph} rows={3} style={{...base,resize:"vertical",minHeight:60,lineHeight:1.5}}/>);
  if(field.type==="checkbox")return(<label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12}}><input type="checkbox" checked={!!value} onChange={e=>onChange(e.target.checked)} style={{width:14,height:14,accentColor:T.blue600}}/><span style={{color:T.gray600}}>{field.help||field.label}</span></label>);
  return(<input type={field.type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={field.ph} style={base} onFocus={e=>e.target.style.borderColor=T.blue400} onBlur={e=>e.target.style.borderColor=error?T.red400:T.gray200}/>);
}

// InputDrawerPanel
function InputDrawerPanel({open,editInput,preFillCat,onClose,onSave}){
  const [selCat,setSelCat]=useState("");
  const [formData,setFormData]=useState({});
  const [errors,setErrors]=useState({});
  const [saved,setSaved]=useState(false);
  const nameRef=useRef(null);
  const wasOpen=useRef(false);
  if(open&&!wasOpen.current){
    wasOpen.current=true;
    setTimeout(()=>{
      if(editInput){setSelCat(editInput.cat);setFormData({...editInput});}
      else{setSelCat(preFillCat||"");setFormData({});}
      setErrors({});setSaved(false);
      if(nameRef.current){nameRef.current.value=editInput?.name||"";setTimeout(()=>nameRef.current?.focus(),80);}
    },0);
  }
  if(!open&&wasOpen.current)wasOpen.current=false;
  function getName(){return nameRef.current?.value?.trim()||"";}
  function handleCatChange(id){if(editInput)return;setSelCat(id);setFormData(prev=>({vuln:prev.vuln||""}));setErrors({});}
  function setField(id,val){setFormData(prev=>({...prev,[id]:val}));if(errors[id])setErrors(prev=>({...prev,[id]:null}));}
  function validate(){
    const n=getName(),e={};
    if(!n)e.name="Il nome è obbligatorio";
    if(!selCat)e.cat="Seleziona una categoria";
    if(!formData.vuln)e.vuln="La vulnerabilità è obbligatoria";
    (CAT_FIELDS[selCat]||[]).forEach(f=>{if(f.req&&f.type!=="checkbox"&&(formData[f.id]===undefined||formData[f.id]===""))e[f.id]="Campo obbligatorio";});
    if(formData.qty_min!=null&&formData.qty_normal!=null&&+formData.qty_min>+formData.qty_normal)e.qty_min="Il minimo non può superare il valore normale";
    if(formData.supplier_min!=null&&formData.supplier_count!=null&&+formData.supplier_min>+formData.supplier_count)e.supplier_min="Il minimo non può superare il totale";
    return e;
  }
  function handleSave(){const e=validate();if(Object.keys(e).length){setErrors(e);return;}setSaved(true);setTimeout(()=>{onSave({...formData,name:getName(),cat:selCat});setSaved(false);},500);}
  const cat=catMeta(selCat);const fields=CAT_FIELDS[selCat]||[];const isEdit=!!editInput;
  const vC={alto:T.red600,medio:T.amber600,basso:T.green600};const vBg={alto:T.red50,medio:T.amber50,basso:T.green50};
  return(<>
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.22)",opacity:open?1:0,pointerEvents:open?"auto":"none",transition:"opacity .2s",zIndex:100}}/>
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:400,background:"#fff",borderLeft:`0.5px solid ${T.gray100}`,transform:open?"translateX(0)":"translateX(100%)",transition:"transform .24s cubic-bezier(.4,0,.2,1)",zIndex:101,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"14px 18px",borderBottom:`0.5px solid ${T.gray100}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:selCat?cat.bg:"#fff",flexShrink:0,transition:"background .2s"}}>
        <div><div style={{fontSize:13,fontWeight:500}}>{isEdit?"Modifica input":"Nuovo input"}</div><div style={{fontSize:11,color:T.gray600,marginTop:2}}>{selCat?`${cat.icon} ${cat.label}`:"Seleziona la categoria"}</div></div>
        <button onClick={onClose} style={{background:"none",border:`0.5px solid ${T.gray200}`,borderRadius:6,color:T.gray600,fontSize:16,padding:"3px 8px",lineHeight:1,cursor:"pointer"}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:18}}>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:10,fontWeight:500,color:T.gray600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>Nome input <span style={{color:T.red600}}>*</span></label>
          <input ref={nameRef} type="text" placeholder="es. Reattori batch, SAP S/4HANA…"
            onFocus={e=>{if(errors.name)setErrors(p=>({...p,name:null}));e.target.style.borderColor=T.blue400;}}
            onBlur={e=>{e.target.style.borderColor=errors.name?T.red400:T.gray200;}}
            style={{width:"100%",padding:"7px 9px",border:`0.5px solid ${errors.name?T.red400:T.gray200}`,borderRadius:6,fontSize:12,color:"#1a1a18",outline:"none",fontFamily:"inherit"}}/>
          {errors.name&&<div style={{fontSize:10,color:T.red600,marginTop:3}}>⚠ {errors.name}</div>}
        </div>
        {!isEdit&&(<div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:10,fontWeight:500,color:T.gray600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:5}}>Categoria <span style={{color:T.red600}}>*</span></label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {CATEGORIES.map(c=>(<button key={c.id} onClick={()=>handleCatChange(c.id)} style={{padding:"7px 9px",borderRadius:6,fontSize:11,textAlign:"left",display:"flex",alignItems:"center",gap:6,cursor:"pointer",background:selCat===c.id?c.bg:"#fff",border:selCat===c.id?`1.5px solid ${c.c}`:`0.5px solid ${T.gray100}`,color:selCat===c.id?c.c:T.gray600,fontWeight:selCat===c.id?500:400,transition:"all .12s"}}><span style={{fontSize:14}}>{c.icon}</span>{c.label}</button>))}
          </div>
          {errors.cat&&<div style={{fontSize:10,color:T.red600,marginTop:4}}>⚠ {errors.cat}</div>}
        </div>)}
        {selCat&&(<>
          <div style={{borderTop:`0.5px solid ${T.gray100}`,paddingTop:14,marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:500,textTransform:"uppercase",letterSpacing:".06em",color:cat.c,display:"flex",alignItems:"center",gap:5,marginBottom:12}}>{cat.icon} Campi {cat.label}</div>
            {fields.map(f=>(<div key={f.id} style={{marginBottom:14}}>
              {f.type!=="checkbox"&&<label style={{display:"block",fontSize:10,fontWeight:500,color:T.gray600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>{f.label}{f.req&&<span style={{color:T.red600}}> *</span>}</label>}
              {f.help&&f.type!=="checkbox"&&<div style={{fontSize:10,color:T.gray400,marginBottom:4,lineHeight:1.4}}>{f.help}</div>}
              <DrawerField field={f} value={formData[f.id]} onChange={v=>setField(f.id,v)} error={errors[f.id]}/>
              {errors[f.id]&&<div style={{fontSize:10,color:T.red600,marginTop:3}}>⚠ {errors[f.id]}</div>}
            </div>))}
          </div>
          <div style={{borderTop:`0.5px solid ${T.gray100}`,paddingTop:14}}>
            <label style={{display:"block",fontSize:10,fontWeight:500,color:T.gray600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>Vulnerabilità <span style={{color:T.red600}}>*</span></label>
            <div style={{fontSize:10,color:T.gray400,marginBottom:6,lineHeight:1.4}}>In caso di interruzione, quanto questo input è esposto al rischio di impattare la continuità?</div>
            <div style={{display:"flex",gap:5}}>{["basso","medio","alto"].map(v=>(<button key={v} onClick={()=>setField("vuln",v)} style={{flex:1,padding:"6px 4px",borderRadius:6,fontSize:11,textAlign:"center",cursor:"pointer",border:formData.vuln===v?`1.5px solid ${vC[v]}`:`0.5px solid ${T.gray100}`,background:formData.vuln===v?vBg[v]:"#fff",color:formData.vuln===v?vC[v]:T.gray600,fontWeight:formData.vuln===v?500:400,transition:"all .12s"}}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>))}</div>
            {errors.vuln&&<div style={{fontSize:10,color:T.red600,marginTop:4}}>⚠ {errors.vuln}</div>}
          </div>
        </>)}
      </div>
      <div style={{padding:"12px 18px",borderTop:`0.5px solid ${T.gray100}`,display:"flex",gap:7,flexShrink:0}}>
        <button onClick={handleSave} style={{flex:1,padding:"8px 0",borderRadius:7,border:"none",background:saved?T.teal600:T.blue600,color:"#fff",fontWeight:500,fontSize:12,cursor:"pointer",transition:"background .2s"}}>{saved?"✓ Salvato":isEdit?"Salva modifiche":"Aggiungi input"}</button>
        <button onClick={onClose} style={{padding:"8px 14px",borderRadius:7,border:`0.5px solid ${T.gray200}`,background:"#fff",color:T.gray600,fontSize:12,cursor:"pointer"}}>Annulla</button>
      </div>
    </div>
  </>);
}

// TabInputs
function TabInputs({inputs,onAdd,onEdit,onDelete}){
  const filled=CATEGORIES.filter(c=>inputs.some(i=>i.cat===c.id)).length;
  const pct=Math.round(filled/CATEGORIES.length*100);
  const vC={alto:T.red600,medio:T.amber600,basso:T.green600};const vBg={alto:T.red50,medio:T.amber50,basso:T.green50};
  return(<div>
    <div style={{background:"#fff",border:`0.5px solid ${T.gray100}`,borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:11,color:T.gray600,whiteSpace:"nowrap"}}>Completezza:</span>
      <div style={{flex:1}}>
        <div style={{display:"flex",gap:3}}>{CATEGORIES.map(c=>{const has=inputs.some(i=>i.cat===c.id);return(<div key={c.id} title={`${c.label}: ${inputs.filter(i=>i.cat===c.id).length}`} style={{flex:1,height:6,borderRadius:3,background:has?c.c:T.gray100,transition:"background .3s"}}/>);})}</div>
        <div style={{display:"flex",gap:3,marginTop:3}}>{CATEGORIES.map(c=>{const has=inputs.some(i=>i.cat===c.id);return(<div key={c.id} style={{flex:1,fontSize:9,textAlign:"center",color:has?c.c:T.gray200}}>{c.icon}</div>);})}</div>
      </div>
      <span style={{fontSize:11,fontWeight:500,color:pct===100?T.teal600:pct>=57?T.amber600:T.red600}}>{pct}%</span>
    </div>
    {CATEGORIES.map(cat=>{
      const items=inputs.filter(i=>i.cat===cat.id);const isEmpty=!items.length;
      return(<div key={cat.id} style={{background:"#fff",border:`0.5px ${isEmpty?"dashed":"solid"} ${T.gray100}`,borderRadius:10,marginBottom:10,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",borderBottom:isEmpty?"none":`0.5px solid ${T.gray100}`}}>
          <div style={{width:27,height:27,borderRadius:6,background:cat.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{cat.icon}</div>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500}}>{cat.label}</div><div style={{fontSize:10,color:T.gray400,marginTop:1}}>{cat.desc}</div></div>
          {!isEmpty&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:8,fontWeight:500,background:cat.bg,color:cat.c,marginRight:8}}>{items.length}</span>}
          <button onClick={()=>onAdd(cat.id)} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:500,border:`0.5px solid ${cat.c}`,color:cat.c,background:"#fff",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=cat.bg} onMouseLeave={e=>e.currentTarget.style.background="#fff"}><span style={{fontSize:13}}>+</span> Aggiungi</button>
        </div>
        {isEmpty?(<div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 13px"}}>
          <span style={{fontSize:18,opacity:.25}}>{cat.icon}</span>
          <div><div style={{fontSize:12,color:T.gray400}}>Nessun input per questa categoria</div><div style={{fontSize:11,color:T.gray400,fontStyle:"italic",marginTop:1}}>Clicca "Aggiungi" per inserire {cat.label.toLowerCase()} necessari al processo</div></div>
        </div>):(
          <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
            <thead><tr style={{background:T.gray50}}>{["","Nome input","Dettaglio","Vulnerabilità","Issue",""].map((h,i)=>(<th key={i} style={{padding:"5px 9px",textAlign:"left",fontSize:10,fontWeight:500,color:T.gray400,borderBottom:`0.5px solid ${T.gray100}`,textTransform:"uppercase",letterSpacing:".05em",width:["32px","auto","28%","76px","66px","32px"][i]}}>{h}</th>))}</tr></thead>
            <tbody>
              {items.map(inp=>(<tr key={inp.id} onClick={()=>onEdit(inp)} style={{cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=T.blue50} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"6px 9px",textAlign:"center",fontSize:13}}>{cat.icon}</td>
                <td style={{padding:"6px 9px",fontWeight:500,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inp.name}{inp.data_critical&&<span style={{fontSize:9,padding:"1px 4px",borderRadius:3,background:T.pu50,color:T.pu800,marginLeft:5}}>DC</span>}</td>
                <td style={{padding:"6px 9px",fontSize:11,color:T.gray600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inputDetail(inp)}</td>
                <td style={{padding:"6px 9px"}}>{inp.vuln?<Badge bg={vBg[inp.vuln]} color={vC[inp.vuln]}>{inp.vuln}</Badge>:<span style={{color:T.gray400,fontSize:11}}>—</span>}</td>
                <td style={{padding:"6px 9px"}}>{inp.issues?<Badge bg={T.amber50} color={T.amber600}>⚠ issue</Badge>:<Badge bg={T.teal50} color={T.teal600}>OK</Badge>}</td>
                <td style={{padding:"6px 9px",textAlign:"right"}}><button onClick={e=>{e.stopPropagation();onDelete(inp.id);}} style={{background:"none",border:"none",cursor:"pointer",color:T.gray400,fontSize:12,padding:"2px 4px",borderRadius:4}} onMouseEnter={e=>e.currentTarget.style.color=T.red600} onMouseLeave={e=>e.currentTarget.style.color=T.gray400}>✕</button></td>
              </tr>))}
              <tr onClick={()=>onAdd(cat.id)} style={{cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=T.blue50} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td colSpan={6} style={{padding:"6px 9px",borderTop:`0.5px solid ${T.gray100}`}}><div style={{display:"flex",alignItems:"center",gap:5,color:cat.c,fontSize:11,fontWeight:500}}><span style={{fontSize:13,lineHeight:1}}>+</span>Aggiungi {cat.label.toLowerCase()}</div></td>
              </tr>
            </tbody>
          </table>)}
      </div>);})}
  </div>);
}

// TabBIA
function TabBIA({process:proc,biaCells,onChange}){
  const mtpd=computeMTPD(biaCells);const finalRTO=computeFinalRTO(proc.rtoOwnerHours,proc.rtoITHours);const coherent=checkRTOvsMTPD(finalRTO,mtpd);
  function setCellVal(dimId,wi,val){const next={...biaCells,[dimId]:[...biaCells[dimId]]};next[dimId][wi]=val;onChange(next);}
  const rl=h=>{if(!h&&h!==0)return"—";if(h<24)return`${h}h`;if(h===24)return"1g";return`${Math.round(h/24)}g`;};
  return(<div>
    {!coherent&&<div style={{background:T.amber50,border:`0.5px solid ${T.amber400}`,borderRadius:7,padding:"8px 11px",marginBottom:12,fontSize:11,color:T.amber600,display:"flex",gap:7}}><span>⚠</span><span><strong>Incoerenza RTO/MTPD</strong> — RTO finale ({rl(finalRTO)}) supera l'MTPD ({mtpd?.label}). Rivedere impatti o RTO dichiarato.</span></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
      {[
        {l:"MTPD (calcolato)",v:mtpd?.label??"—",c:T.red600,bg:T.red50,brd:T.red400,s:"Prima finestra con impatto critico"},
        {l:"RTO owner",v:rl(proc.rtoOwnerHours),c:T.gray800,bg:T.gray50,brd:T.gray200,s:"Dichiarato dal process owner"},
        {l:"RTO IT",v:rl(proc.rtoITHours),c:T.teal600,bg:T.teal50,brd:T.teal400,s:"Limite minimo (BIA IT)"},
        {l:"RTO finale",v:rl(finalRTO),c:coherent?T.blue800:T.amber600,bg:coherent?T.blue50:T.amber50,brd:coherent?T.blue400:T.amber400,s:coherent?"max(owner,IT) ✓ ≤ MTPD":"⚠ RTO > MTPD"},
      ].map(k=>(<div key={k.l} style={{background:k.bg,border:`1px solid ${k.brd}`,borderRadius:8,padding:"9px 12px"}}><div style={{fontSize:10,color:k.c,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3,opacity:.8}}>{k.l}</div><div style={{fontSize:20,fontWeight:600,color:k.c,lineHeight:1}}>{k.v}</div><div style={{fontSize:10,color:k.c,marginTop:3,opacity:.7}}>{k.s}</div></div>))}
    </div>
    {proc.peakPeriod&&proc.peakPeriod!=="—"&&<div style={{background:T.red50,border:`0.5px solid ${T.red400}`,borderRadius:7,padding:"7px 11px",marginBottom:12,fontSize:11,color:T.red600,display:"flex",gap:6}}><span>📅</span><span><strong>Picco operativo:</strong> {proc.peakPeriod} — impatto amplificato in questo periodo.</span></div>}
    <div style={{background:T.blue50,border:`0.5px solid ${T.blue100}`,borderRadius:7,padding:"7px 11px",marginBottom:12,fontSize:11,color:T.blue800,display:"flex",gap:7}}><span>ℹ</span><span>Assegna il livello (0–4) per ogni finestra e dimensione. <strong>MTPD</strong> = prima finestra con almeno un impatto <strong>4 – Critico</strong>. <strong>RTO finale</strong> = max(owner, IT).</span></div>
    <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:10,flexWrap:"wrap",fontSize:10}}><span style={{color:T.gray400}}>Livelli:</span>{IMPACT_LEVELS.map(lv=>(<span key={lv.v} style={{padding:"2px 8px",borderRadius:8,background:lv.bg,color:lv.color,fontWeight:500}}>{lv.v} – {lv.label}</span>))}</div>
    <div style={{overflowX:"auto",borderRadius:10,border:`0.5px solid ${T.gray100}`}}>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:680}}>
        <thead><tr style={{background:T.gray50}}>
          <th style={{padding:"7px 10px",textAlign:"left",fontSize:10,fontWeight:500,color:T.gray400,borderRight:`0.5px solid ${T.gray100}`,textTransform:"uppercase",letterSpacing:".05em",minWidth:148}}>Dimensione</th>
          {BIA_WINDOWS.map(w=>(<th key={w.id} style={{padding:"7px 5px",textAlign:"center",fontSize:11,fontWeight:600,color:T.blue800,borderRight:`0.5px solid ${T.gray100}`,minWidth:78}}>{w.label}</th>))}
        </tr></thead>
        <tbody>
          {IMPACT_DIMS.map(dim=>(<tr key={dim.id}>
            <td style={{padding:"6px 10px",fontSize:11,fontWeight:500,color:T.gray800,background:T.gray50,borderRight:`0.5px solid ${T.gray100}`,whiteSpace:"nowrap"}}>{dim.label}</td>
            {BIA_WINDOWS.map((w,wi)=>{
              const v=biaCells[dim.id]?.[wi]??0;const lv=IMPACT_LEVELS[v]||IMPACT_LEVELS[0];
              return(<td key={w.id} style={{padding:"4px 3px",textAlign:"center",background:v>0?lv.bg:"transparent",borderRight:`0.5px solid ${T.gray100}`,transition:"background .15s"}}>
                <div style={{display:"flex",gap:2,justifyContent:"center"}}>
                  {IMPACT_LEVELS.map(il=>(<button key={il.v} onClick={()=>setCellVal(dim.id,wi,v===il.v?0:il.v)} title={il.label} style={{width:30,height:24,border:"none",borderRadius:3,background:v===il.v?il.bg:T.gray50,color:v===il.v?il.color:T.gray400,fontWeight:v===il.v?700:400,fontSize:10,cursor:"pointer",outline:v===il.v?`1.5px solid ${il.color}`:"none",transition:"all .1s"}}>{il.v}</button>))}
                </div>
              </td>);})}
          </tr>))}
          <tr style={{borderTop:`1.5px solid ${T.blue100}`}}>
            <td style={{padding:"5px 10px",fontSize:10,fontWeight:500,color:T.blue800,background:T.blue50,borderRight:`0.5px solid ${T.gray100}`}}>Indicatori MTPD/RTO</td>
            {BIA_WINDOWS.map((w,wi)=>{
              const isMTPD=mtpd?.id===w.id;const isOwn=Math.abs(proc.rtoOwnerHours-w.hours)<0.5;const isIT=Math.abs(proc.rtoITHours-w.hours)<0.5;const isFin=Math.abs(finalRTO-w.hours)<0.5;
              return(<td key={w.id} style={{padding:"3px 2px",textAlign:"center",background:isMTPD?T.red100:isFin?T.blue50:"transparent",borderRight:`0.5px solid ${T.gray100}`}}>
                <div style={{display:"flex",flexDirection:"column",gap:1,alignItems:"center"}}>
                  {isMTPD&&<span style={{fontSize:9,padding:"1px 4px",borderRadius:3,background:T.red400,color:"#fff",fontWeight:600}}>MTPD</span>}
                  {isOwn&&<span style={{fontSize:9,padding:"1px 4px",borderRadius:3,background:T.gray400,color:"#fff"}}>RTO owner</span>}
                  {isIT&&<span style={{fontSize:9,padding:"1px 4px",borderRadius:3,background:T.teal400,color:"#fff"}}>RTO IT</span>}
                  {isFin&&!isOwn&&!isIT&&<span style={{fontSize:9,padding:"1px 4px",borderRadius:3,background:T.blue600,color:"#fff",fontWeight:600}}>RTO finale</span>}
                </div>
              </td>);})}
          </tr>
        </tbody>
      </table>
    </div>
  </div>);
}

// TabCriticality
function TabCriticality({inputs,mtpdHours,rtoHours}){
  const [selId,setSelId]=useState(null);
  const enriched=inputs.filter(i=>i.vuln&&i.likelihood).map(i=>{const r=computeCriticality({mtpdHours,rtoHours,vuln:i.vuln,likelihood:i.likelihood});return{...i,...r};}).sort((a,b)=>a.cFinal-b.cFinal);
  const sel=enriched.find(r=>r.id===selId)||null;const missing=inputs.filter(i=>!i.vuln||!i.likelihood);
  const vC={alto:T.red600,medio:T.amber600,basso:T.green600};const vBg={alto:T.red50,medio:T.amber50,basso:T.green50};const lkC={alta:T.red600,media:T.amber600,bassa:T.green600};const lkBg={alta:T.red50,media:T.amber50,bassa:T.green50};
  if(!enriched.length)return(<div style={{background:"#fff",border:`0.5px solid ${T.gray100}`,borderRadius:10,padding:32,textAlign:"center",color:T.gray400,fontSize:13}}>Nessun input ha vulnerabilità e likelihood valorizzate.<br/>Completare gli input nella tab Input per calcolare la criticità.</div>);
  return(<div>
    {missing.length>0&&<div style={{background:T.amber50,border:`0.5px solid ${T.amber400}`,borderRadius:7,padding:"7px 11px",marginBottom:10,fontSize:11,color:T.amber600,display:"flex",gap:7}}><span>⚠</span><span><strong>{missing.length} input</strong> senza vulnerabilità o likelihood — non inclusi nel calcolo.</span></div>}
    <div style={{background:T.blue50,border:`0.5px solid ${T.blue100}`,borderRadius:7,padding:"7px 11px",marginBottom:12,fontSize:11,color:T.blue800,display:"flex",gap:7}}><span>ℹ</span><span>Criticality = (MTPD/720)/VxL e (RTO/720)/VxL — principio conservativo §6.5. Clicca una riga per il calcolo passo per passo.</span></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:12}}>
      <div style={{background:"#fff",border:`0.5px solid ${T.gray100}`,borderRadius:10,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{background:T.gray50}}>{["#","Input","Cat.","Vuln.","Likelihood","VxL","Crit(MTPD)","Crit(RTO)","Criticità finale"].map(h=>(<th key={h} style={{padding:"5px 8px",textAlign:"left",fontSize:10,fontWeight:500,color:T.gray400,borderBottom:`0.5px solid ${T.gray100}`,textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
          <tbody>{enriched.map((r,i)=>(<tr key={r.id} onClick={()=>setSelId(r.id)} style={{background:selId===r.id?T.blue50:"transparent",cursor:"pointer"}} onMouseEnter={e=>{if(selId!==r.id)e.currentTarget.style.background=T.gray50;}} onMouseLeave={e=>{if(selId!==r.id)e.currentTarget.style.background="transparent";}}>
            <td style={{padding:"6px 8px",textAlign:"center",fontWeight:600,color:i<3?T.red600:T.gray400}}>{i+1}</td>
            <td style={{padding:"6px 8px",fontWeight:500,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</td>
            <td style={{padding:"6px 8px"}}><span style={{fontSize:14}}>{catMeta(r.cat).icon}</span></td>
            <td style={{padding:"6px 8px"}}><Badge bg={vBg[r.vuln]} color={vC[r.vuln]}>{r.vuln}</Badge></td>
            <td style={{padding:"6px 8px"}}><Badge bg={lkBg[r.likelihood]} color={lkC[r.likelihood]}>{r.likelihood}</Badge></td>
            <td style={{padding:"6px 8px",textAlign:"center"}}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:4,fontSize:11,fontWeight:700,background:r.vxl>=6?T.red100:r.vxl>=3?T.amber50:T.green50,color:r.vxl>=6?T.red800:r.vxl>=3?T.amber600:T.green600}}>{r.vxl}</span></td>
            <td style={{padding:"6px 8px"}}><CritBadge level={r.classMTPD}/></td>
            <td style={{padding:"6px 8px"}}><CritBadge level={r.classRTO}/></td>
            <td style={{padding:"6px 8px"}}><CritBadge level={r.classFinal}/></td>
          </tr>))}</tbody>
        </table>
      </div>
      <div style={{background:"#fff",border:`0.5px solid ${T.gray100}`,borderRadius:10,overflow:"hidden",alignSelf:"start",position:"sticky",top:0}}>
        <div style={{padding:"9px 13px",borderBottom:`0.5px solid ${T.gray100}`,background:T.gray50}}><div style={{fontSize:11,fontWeight:500}}>Dettaglio calcolo §6.5</div></div>
        {!sel?(<div style={{padding:20,textAlign:"center",color:T.gray400,fontSize:11}}>Seleziona un input per il calcolo dettagliato.</div>):(()=>{
          const m=CRIT_META[sel.classFinal]||CRIT_META["media"];const pct=v=>Math.min(v/0.5,1)*100;
          const vulns=["basso","medio","alto"],lks=["bassa","media","alta"];
          return(<div style={{padding:14,maxHeight:"60vh",overflowY:"auto"}}>
            <div style={{marginBottom:10}}><div style={{fontSize:12,fontWeight:500}}>{sel.name}</div><div style={{fontSize:10,color:T.gray400,marginTop:2}}>{catMeta(sel.cat).label}</div></div>
            <div style={{background:m.bg,border:`1px solid ${m.border}`,borderRadius:8,padding:"10px 12px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><div style={{fontSize:10,color:m.color,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Criticità finale</div><div style={{fontSize:18,fontWeight:700,color:m.color,textTransform:"uppercase"}}>{sel.classFinal}</div><div style={{fontSize:10,color:m.color,marginTop:2,opacity:.8}}>min({sel.cMTPD}, {sel.cRTO}) = {sel.cFinal}</div></div>
            </div>
            <div style={{background:T.gray50,borderRadius:7,padding:"9px 11px",marginBottom:10,fontSize:11}}>
              <div style={{fontWeight:500,marginBottom:7}}>Step 1 — VxL</div>
              <table style={{borderCollapse:"collapse",fontSize:10,width:"100%"}}>
                <thead><tr><th style={{padding:"3px 7px",textAlign:"left",background:T.gray50,border:`0.5px solid ${T.gray100}`,color:T.gray600}}>V/Lk</th>{lks.map(lk=><th key={lk} style={{padding:"3px 7px",textAlign:"center",border:`0.5px solid ${T.gray100}`,background:sel.likelihood===lk?lkBg[lk]:T.gray50,color:sel.likelihood===lk?lkC[lk]:T.gray600,fontWeight:sel.likelihood===lk?600:400}}>{lk}</th>)}</tr></thead>
                <tbody>{vulns.map(v=>(<tr key={v}><th style={{padding:"3px 7px",textAlign:"left",fontWeight:sel.vuln===v?600:400,border:`0.5px solid ${T.gray100}`,background:sel.vuln===v?vBg[v]:T.gray50,color:sel.vuln===v?vC[v]:T.gray600}}>{v}</th>{lks.map(lk=>{const s=VXL[v][lk],active=v===sel.vuln&&lk===sel.likelihood;const bg=active?T.blue600:s>=6?T.red100:s>=3?T.amber50:T.green50;const c=active?"#fff":s>=6?T.red800:s>=3?T.amber600:T.green600;return<td key={lk} style={{padding:"3px 7px",textAlign:"center",border:`0.5px solid ${T.gray100}`,background:bg,color:c,fontWeight:active?700:500,outline:active?`2px solid ${T.blue400}`:"none"}}>{s}</td>;})}</tr>))}</tbody>
              </table>
              <div style={{marginTop:6,color:T.gray600}}>Vuln. <strong>{sel.vuln}</strong> × Lk <strong>{sel.likelihood}</strong> = <strong style={{color:T.blue800}}>VxL = {sel.vxl}</strong></div>
            </div>
            {[{label:"Criticality(MTPD)",f:`(${mtpdHours}/${MTPD_MAX_H})/${sel.vxl}`,val:sel.cMTPD,cl:sel.classMTPD},{label:"Criticality(RTO)",f:`(${rtoHours}/${RTO_MAX_H})/${sel.vxl}`,val:sel.cRTO,cl:sel.classRTO}].map(({label,f,val,cl})=>{
              const cm=CRIT_META[cl]||CRIT_META["media"];
              return(<div key={label} style={{background:"#fff",border:`0.5px solid ${T.gray100}`,borderRadius:7,padding:"9px 11px",marginBottom:8}}>
                <div style={{fontSize:10,color:T.gray600,marginBottom:3}}>{label}</div>
                <div style={{fontFamily:"monospace",fontSize:10,background:T.gray50,padding:"3px 7px",borderRadius:4,marginBottom:5}}>{f} = {val}</div>
                <CritBadge level={cl}/>
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:5}}><div style={{flex:1,height:5,borderRadius:3,background:T.gray100,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:cm.color,width:`${pct(val)}%`,transition:"width .3s"}}/></div><span style={{fontSize:10,fontWeight:500,color:cm.color,minWidth:36,textAlign:"right"}}>{val.toFixed(4)}</span></div>
              </div>);})}
            <div style={{background:T.blue50,border:`0.5px solid ${T.blue100}`,borderRadius:7,padding:"9px 11px",fontSize:11,color:T.blue800}}>
              <strong>Criticità finale</strong><div style={{marginTop:3,fontFamily:"monospace",fontSize:10}}>min({sel.cMTPD}, {sel.cRTO}) = <strong>{sel.cFinal}</strong></div>
              <div style={{marginTop:3,fontSize:10,color:T.blue600}}>Fattore determinante: <strong>{sel.cFinal===sel.cMTPD?"Criticality(MTPD)":"Criticality(RTO)"}</strong></div>
            </div>
          </div>);
        })()}
      </div>
    </div>
  </div>);
}

// ProcessView principale
export default function ProcessView({process:proc,onBack}){
  const [activeTab,setActiveTab]=useState("inputs");
  const [inputs,setInputs]=useState(proc.initialInputs||[]);
  const [biaCells,setBiaCells]=useState(()=>{const base={};IMPACT_DIMS.forEach(d=>{base[d.id]=(proc.initialBIA?.[d.id]||new Array(BIA_WINDOWS.length).fill(0));});return base;});
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [editInput,setEditInput]=useState(null);
  const [preFillCat,setPreFillCat]=useState("");
  const [toast,setToast]=useState(null);
  const nextId=useRef(1000);
  const mtpd=computeMTPD(biaCells);const finalRTO=computeFinalRTO(proc.rtoOwnerHours,proc.rtoITHours);const coherent=checkRTOvsMTPD(finalRTO,mtpd);
  const filled=CATEGORIES.filter(c=>inputs.some(i=>i.cat===c.id)).length;
  const issues=inputs.filter(i=>i.issues).length;
  const critHigh=inputs.filter(i=>i.vuln&&i.likelihood&&computeCriticality({mtpdHours:mtpd.hours,rtoHours:finalRTO,vuln:i.vuln,likelihood:i.likelihood}).classFinal==="molto alta").length;
  function showToast(msg){setToast(msg);setTimeout(()=>setToast(null),2400);}
  function openNew(catId){setEditInput(null);setPreFillCat(catId||"");setDrawerOpen(true);}
  function openEdit(inp){setEditInput(inp);setPreFillCat("");setDrawerOpen(true);}
  function closeDrawer(){setDrawerOpen(false);setTimeout(()=>{setEditInput(null);setPreFillCat("");},250);}
  function handleSave(data){if(editInput){setInputs(prev=>prev.map(i=>i.id===editInput.id?{...i,...data}:i));showToast("Input aggiornato");}else{setInputs(prev=>[...prev,{...data,id:nextId.current++}]);showToast("Nuovo input aggiunto");}closeDrawer();}
  function handleDelete(id){setInputs(prev=>prev.filter(i=>i.id!==id));showToast("Input eliminato");}
  const rl=h=>{if(!h&&h!==0)return"—";if(h<24)return`${h}h`;if(h===24)return"1g";return`${Math.round(h/24)}g`;};
  const TABS=[{id:"inputs",label:"Input",badge:filled<7?`${filled}/7`:null,bc:T.amber400},{id:"bia",label:"BIA",badge:!coherent?"!":null,bc:T.amber400},{id:"criticality",label:"Criticità",badge:critHigh>0?`${critHigh}`:null,bc:T.red600}];
  return(<div style={{fontFamily:"system-ui,sans-serif",background:T.gray50,minHeight:"100vh",color:T.gray800}}>
    <div style={{position:"fixed",bottom:20,left:"50%",transform:`translateX(-50%) translateY(${toast?0:12}px)`,background:T.teal600,color:"#fff",padding:"8px 16px",borderRadius:7,fontSize:11,fontWeight:500,opacity:toast?1:0,transition:"opacity .2s,transform .2s",zIndex:200,pointerEvents:"none"}}>✓ {toast}</div>
    <div style={{background:"#fff",borderBottom:`0.5px solid ${T.gray100}`,padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",border:`0.5px solid ${T.gray200}`,borderRadius:6,background:"#fff",color:T.gray600,fontSize:12,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=T.gray50} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>‹ Processi</button>
        <div style={{width:1,height:20,background:T.gray100}}/>
        <div style={{width:8,height:8,borderRadius:"50%",background:!coherent?T.amber400:filled>=5?T.teal400:T.gray200}}/>
        <div><span style={{fontSize:13,fontWeight:500}}>{proc.name}</span><span style={{fontSize:11,color:T.gray400,marginLeft:8}}>{proc.macro} · {proc.sito} · {proc.owner}</span></div>
      </div>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,color:T.gray400}}>MTPD</div><div style={{fontSize:13,fontWeight:500,color:T.red600}}>{mtpd.label}</div></div>
          <div style={{width:1,height:24,background:T.gray100}}/>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,color:T.gray400}}>RTO finale</div><div style={{fontSize:13,fontWeight:500,color:coherent?T.blue800:T.amber600}}>{rl(finalRTO)}</div></div>
          {critHigh>0&&<><div style={{width:1,height:24,background:T.gray100}}/><div style={{textAlign:"right"}}><div style={{fontSize:10,color:T.gray400}}>Crit. molto alta</div><div style={{fontSize:13,fontWeight:500,color:T.red800}}>{critHigh} input</div></div></>}
          {issues>0&&<><div style={{width:1,height:24,background:T.gray100}}/><div style={{textAlign:"right"}}><div style={{fontSize:10,color:T.gray400}}>Issue aperte</div><div style={{fontSize:13,fontWeight:500,color:T.amber600}}>{issues}</div></div></>}
        </div>
        <button onClick={()=>showToast("Scheda salvata")} style={{padding:"7px 14px",borderRadius:7,border:"none",background:T.blue600,color:"#fff",fontWeight:500,fontSize:12,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=T.blue800} onMouseLeave={e=>e.currentTarget.style.background=T.blue600}>Salva scheda</button>
      </div>
    </div>
    <div style={{padding:"14px 18px"}}>
      <div style={{display:"flex",borderBottom:`0.5px solid ${T.gray100}`,marginBottom:14,background:"#fff",border:`0.5px solid ${T.gray100}`,borderRadius:"10px 10px 0 0",padding:"0 2px"}}>
        {TABS.map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:"10px 16px",border:"none",background:"transparent",cursor:"pointer",fontSize:12,fontWeight:activeTab===t.id?500:400,color:activeTab===t.id?T.blue800:T.gray600,borderBottom:activeTab===t.id?`2px solid ${T.blue600}`:"2px solid transparent",marginBottom:-0.5,transition:"color .1s",display:"flex",alignItems:"center",gap:6}}>
          {t.label}{t.badge&&<span style={{fontSize:10,padding:"1px 5px",borderRadius:8,background:t.bc+"20",color:t.bc,fontWeight:500}}>{t.badge}</span>}
        </button>))}
        {activeTab==="inputs"&&<button onClick={()=>openNew("")} style={{marginLeft:"auto",marginRight:8,alignSelf:"center",padding:"5px 12px",borderRadius:6,border:"none",background:T.blue600,color:"#fff",fontWeight:500,fontSize:11,cursor:"pointer"}}>+ Aggiungi input</button>}
      </div>
      {activeTab==="inputs"&&<TabInputs inputs={inputs} onAdd={openNew} onEdit={openEdit} onDelete={handleDelete}/>}
      {activeTab==="bia"&&<TabBIA process={proc} biaCells={biaCells} onChange={setBiaCells}/>}
      {activeTab==="criticality"&&<TabCriticality inputs={inputs} mtpdHours={mtpd.hours} rtoHours={finalRTO}/>}
    </div>
    <InputDrawerPanel open={drawerOpen} editInput={editInput} preFillCat={preFillCat} onClose={closeDrawer} onSave={handleSave}/>
  </div>);
}

// Demo wrapper
const DEMO_PROCESSES=[
  {id:1,name:"Production MM",macro:"Operations",sito:"Montecchio Maggiore",owner:"M. Ferretti",rtoOwnerHours:8,rtoITHours:12,peakPeriod:"Nov–Dic (+40%)",
   initialBIA:{rep:[0,0,1,1,2,3,4,4],leg:[0,0,0,1,1,2,3,4],fin:[0,1,1,2,3,3,4,4]},
   initialInputs:[
    {id:1,cat:"EQUIPMENT",name:"Reattori batch R1–R4",qty_normal:4,qty_min:2,vuln:"alto",likelihood:"alta",recovery:"Prioritizzazione batch critici",issues:"R3 fermo – ETA 15/06"},
    {id:2,cat:"MATERIALS",name:"API – Principio attivo X",qty_normal:500,qty_min:200,supplier_count:2,supplier_min:1,vuln:"alto",likelihood:"media",recovery:"Stock sicurezza 30gg",issues:"Fornitore primario in ritardo Q2"},
    {id:3,cat:"SOFTWARE", name:"MES Opcenter (Siemens)",supplier:"Siemens",importance:"critica",rpo:"4h",data_critical:true,vuln:"medio",likelihood:"media",recovery:"Failover su server DR",issues:""},
    {id:4,cat:"HR",       name:"Operatori linea A",qty_normal:14,qty_min:7,vuln:"medio",likelihood:"media",recovery:"Back-up da linea B",issues:""},
    {id:5,cat:"UTILITIES",name:"Energia elettrica",supplier:"Enel",importance:"critica",vuln:"basso",likelihood:"alta",recovery:"GE 500kW (4h autonomia)",issues:""},
    {id:6,cat:"LOCATION", name:"Stabilimento MM – ed. R",location_name:"Via Chimica 1, MM",vuln:"medio",likelihood:"media",recovery:"Produzione parziale edificio S",issues:""},
   ]},
  {id:7,name:"IT Infrastructure",macro:"IT",sito:"Milano",owner:"L. Moretti",rtoOwnerHours:4,rtoITHours:4,peakPeriod:"—",
   initialBIA:{rep:[0,1,2,3,4,4,4,4],leg:[0,0,1,2,3,3,4,4],fin:[0,1,2,3,4,4,4,4]},
   initialInputs:[
    {id:10,cat:"SOFTWARE",name:"SAP S/4HANA (server)",supplier:"SAP/AWS",importance:"critica",rpo:"1h",data_critical:true,vuln:"basso",likelihood:"media",recovery:"Replica sincrona DR site",issues:""},
    {id:11,cat:"SOFTWARE",name:"Active Directory",supplier:"Microsoft",importance:"critica",rpo:"30min",data_critical:true,vuln:"basso",likelihood:"media",recovery:"Cluster AD a 3 nodi",issues:""},
    {id:12,cat:"LOCATION",name:"Data center – Milano",location_name:"Via Pirelli 35, MI",vuln:"medio",likelihood:"media",recovery:"DR site Lonigo (RTO 4h)",issues:"DR site non ancora certificato"},
    {id:13,cat:"LOCATION",name:"DR site – Lonigo",location_name:"Via Industria 8, LO",vuln:"alto",likelihood:"bassa",recovery:"—",issues:"Setup in corso"},
    {id:14,cat:"HR",      name:"Sistemisti",qty_normal:6,qty_min:3,vuln:"medio",likelihood:"media",recovery:"Reperibilità 24/7",issues:""},
    {id:15,cat:"UTILITIES",name:"UPS + generatore",supplier:"Interna",importance:"critica",vuln:"basso",likelihood:"bassa",recovery:"UPS 30min + GE 100kW",issues:""},
   ]},
  {id:3,name:"Production TE",macro:"Operations",sito:"Termoli",owner:"D. Esposito",rtoOwnerHours:16,rtoITHours:24,peakPeriod:"Giu–Set (+30%)",
   initialBIA:{rep:new Array(8).fill(0),leg:new Array(8).fill(0),fin:new Array(8).fill(0)},
   initialInputs:[]},
];

export function ProcessViewDemo(){
  const [selProc,setSelProc]=useState(null);
  if(selProc)return <ProcessView process={selProc} onBack={()=>setSelProc(null)}/>;
  return(<div style={{fontFamily:"system-ui,sans-serif",background:T.gray50,minHeight:"100vh"}}>
    <div style={{background:"#fff",borderBottom:`0.5px solid ${T.gray100}`,padding:"12px 20px",display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:28,height:28,background:T.blue600,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:600}}>N</div>
      <div style={{width:1,height:24,background:T.gray100}}/>
      <span style={{fontSize:13,fontWeight:500}}>NIER BIA-RA</span>
      <span style={{fontSize:11,color:T.gray400}}>Seleziona un processo per aprire la scheda consolidata</span>
    </div>
    <div style={{padding:"20px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,maxWidth:800}}>
        {DEMO_PROCESSES.map(p=>{
          const biaFilled=IMPACT_DIMS.some(d=>p.initialBIA?.[d.id]?.some(v=>v>0));
          const cells=Object.fromEntries(IMPACT_DIMS.map(d=>[d.id,(p.initialBIA?.[d.id]||new Array(8).fill(0))]));
          const mtpd=biaFilled?computeMTPD(cells):null;
          const rto=computeFinalRTO(p.rtoOwnerHours,p.rtoITHours);
          const inpFilled=CATEGORIES.filter(c=>p.initialInputs?.some(i=>i.cat===c.id)).length;
          return(<button key={p.id} onClick={()=>setSelProc(p)} style={{textAlign:"left",background:"#fff",border:`0.5px solid ${T.gray100}`,borderRadius:10,padding:16,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.blue400;e.currentTarget.style.boxShadow="0 2px 8px rgba(55,138,221,.12)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.gray100;e.currentTarget.style.boxShadow="none";}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{fontSize:13,fontWeight:500}}>{p.name}</div>
              <span style={{fontSize:10,padding:"1px 6px",borderRadius:5,background:T.gray50,color:T.gray600}}>{p.macro}</span>
            </div>
            <div style={{fontSize:11,color:T.gray400,marginBottom:10}}>{p.sito} · {p.owner}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {mtpd&&<Pill label={`MTPD ${mtpd.label}`} bg={T.red50} color={T.red600}/>}
              <Pill label={`RTO ${rtoLabel(rto)}`} bg={T.blue50} color={T.blue800}/>
              <Pill label={`${inpFilled}/7 cat.`} bg={inpFilled>=5?T.teal50:T.amber50} color={inpFilled>=5?T.teal600:T.amber600}/>
            </div>
          </button>);})}
      </div>
    </div>
  </div>);
}
