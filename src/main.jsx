import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  Activity, Archive, ArrowLeft, BookOpen, Check, ChevronRight, CircleHelp,
  ClipboardList, Crown, FileText, Folder, KeyRound, LogOut, Mail, Menu,
  MessageSquare, Package, Plus, Search, Settings, Shield, Sparkles, Terminal,
  Trash2, User, Users, WandSparkles, X, Zap
} from "lucide-react";
import "./style.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const nav = [
  ["overview", "Visão geral", Activity],
  ["personnel", "Arquivos pessoais", Users],
  ["journal", "Diário de bordo", BookOpen],
  ["inventory", "Inventário", Package],
  ["relations", "Relações", Folder],
  ["board", "Mural coletivo", MessageSquare],
  ["oracle", "Oráculo", WandSparkles],
  ["achievements", "Conquistas", Crown],
];
const prompts = [
  "Qual lembrança seu personagem tentaria preservar para sempre?",
  "O que ele jamais admitiria aos outros semideuses?",
  "Se pudesse fazer uma pergunta a seu progenitor divino, qual seria?",
  "Qual é a linha que ele acredita nunca cruzar?",
  "Que pessoa do acampamento ele procuraria em um dia difícil?"
];

function App() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [data, setData] = useState({ character: null, journal: [], inventory: [], relations: [], posts: [], achievements: [] });
  const [profile, setProfile] = useState(null);
  const [modal, setModal] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  async function loadData() {
    if (!supabase || !session) return;
    const uid = session.user.id;
    const [p,c,j,i,r,b,a] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("characters").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("journal_entries").select("*").eq("user_id", uid).order("created_at", {ascending:false}),
      supabase.from("inventory_items").select("*").eq("user_id", uid).order("created_at", {ascending:false}),
      supabase.from("relations").select("*").eq("user_id", uid).order("created_at", {ascending:false}),
      supabase.from("board_posts").select("*, profiles(display_name)").order("created_at", {ascending:false}).limit(50),
      supabase.from("user_achievements").select("*, achievements(*)").eq("user_id", uid).order("unlocked_at", {ascending:false})
    ]);
    setProfile(p.data);
    setData({character:c.data, journal:j.data||[], inventory:i.data||[], relations:r.data||[], posts:b.data||[], achievements:a.data||[]});
  }

  async function signOut() { await supabase?.auth.signOut(); setSession(null); }
  const userName = profile?.display_name || session?.user?.email?.split("@")[0] || "Semideus";
  const isAdmin = profile?.role === "admin";

  if (loading) return <div className="boot"><Terminal/><p>INITIALIZING ARCHIVE...</p></div>;
  if (!supabase) return <SetupScreen />;
  if (!session) return <AuthScreen />;
  if (!profile) return <div className="boot"><Activity/><p>CARREGANDO REGISTRO DO SEMIDEUS...</p></div>;

  async function save(table, payload, id=null) {
    setBusy(true); setNotice("");
    const q = id ? supabase.from(table).update(payload).eq("id",id) : supabase.from(table).insert({...payload,user_id:session.user.id});
    const {error} = await q;
    setBusy(false);
    if (error) setNotice(error.message);
    else { setModal(""); setNotice("REGISTRO ATUALIZADO COM SUCESSO."); await loadData(); }
  }
  async function remove(table,id) {
    if (!confirm("Remover este registro permanentemente?")) return;
    const {error}=await supabase.from(table).delete().eq("id",id);
    setNotice(error ? error.message : "REGISTRO REMOVIDO."); await loadData();
  }
  async function saveCharacter(form) {
    setBusy(true);
    const payload={...form,user_id:session.user.id};
    const q=data.character
      ? supabase.from("characters").update(payload).eq("id",data.character.id)
      : supabase.from("characters").insert(payload);
    const {error}=await q; setBusy(false);
    if(error) setNotice(error.message); else {setModal("");setNotice("ARQUIVO PESSOAL SALVO.");loadData();}
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Shield size={22}/></div><div><b>DEMIGOD</b><small>ARCHIVES / 002</small></div></div>
      <div className="side-label">DATABASE MENU</div>
      <nav>{nav.map(([id,label,Icon])=><button key={id} className={page===id?"nav-item active":"nav-item"} onClick={()=>setPage(id)}><Icon size={17}/><span>{label}</span>{page===id&&<ChevronRight size={14}/>}</button>)}</nav>
      <div className="side-bottom"><div className="status"><span className="pulse"/> SISTEMA OPERACIONAL</div><div className="user-mini"><div className="avatar">{userName.slice(0,1).toUpperCase()}</div><div className="user-label"><b>{userName}</b><small>{isAdmin?"ADMINISTRADORA":"SEMIDEUS REGISTRADO"}</small></div><button title="Sair" onClick={signOut}><LogOut size={16}/></button></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb"><span>DATABASE</span><ChevronRight size={13}/><b>{nav.find(n=>n[0]===page)?.[1].toUpperCase()}</b></div><div className="top-right"><span className="secure"><KeyRound size={13}/> CONEXÃO SEGURA</span><span className="clock">CAMP HALF-BLOOD / NY</span></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">RESTRICTED ACCESS // CLASSIFICATION: DEMIGOD</div><h1>{pageTitle(page)}</h1><p>{pageSubtitle(page)}</p></div><div className="heading-icon"><Archive size={25}/></div></div>
        {notice&&<div className="notice"><Check size={15}/>{notice}<button onClick={()=>setNotice("")}><X size={14}/></button></div>}
        {page==="overview"&&<Overview data={data} userName={userName} setPage={setPage} setModal={setModal}/>}
        {page==="personnel"&&<Personnel character={data.character} setModal={setModal}/>}
        {page==="journal"&&<Collection title="Diário de bordo" subtitle="REGISTROS PESSOAIS • VISÍVEIS SOMENTE PARA VOCÊ" rows={data.journal} fields={["title","content","mood"]} labels={["Título","Anotação","Humor"]} table="journal_entries" setModal={setModal} remove={remove} search={search} setSearch={setSearch}/>}
        {page==="inventory"&&<Collection title="Inventário" subtitle="ITENS, RELÍQUIAS E EQUIPAMENTOS" rows={data.inventory} fields={["name","description","category"]} labels={["Nome do item","Descrição","Categoria"]} table="inventory_items" setModal={setModal} remove={remove} search={search} setSearch={setSearch}/>}
        {page==="relations"&&<Collection title="Mapa de relações" subtitle="LAÇOS, ALIANÇAS E RIVALIDADES" rows={data.relations} fields={["character_name","relation_type","notes"]} labels={["Nome do personagem","Tipo de relação","Observações"]} table="relations" setModal={setModal} remove={remove} search={search} setSearch={setSearch}/>}
        {page==="board"&&<Board posts={data.posts} session={session} profile={profile} save={save} remove={remove} isAdmin={isAdmin}/>}
        {page==="oracle"&&<Oracle save={save} busy={busy}/>}
        {page==="achievements"&&<Achievements rows={data.achievements}/>}
      </div>
      <footer><span>THE DEMIGOD ARCHIVES</span><span>BUILD 1.0.0 • CAMP HALF-BLOOD</span></footer>
    </main>
    {modal==="character"&&<CharacterModal character={data.character} onClose={()=>setModal("")} onSave={saveCharacter} busy={busy}/>}
    {modal==="journal"&&<EntryModal title="Novo registro no diário" fields={[["title","Título"],["content","Anotação","textarea"],["mood","Humor"]]} onClose={()=>setModal("")} onSave={v=>save("journal_entries",v)} busy={busy}/>}
    {modal==="inventory"&&<EntryModal title="Adicionar item" fields={[["name","Nome do item"],["description","Descrição","textarea"],["category","Categoria"]]} onClose={()=>setModal("")} onSave={v=>save("inventory_items",v)} busy={busy}/>}
    {modal==="relations"&&<EntryModal title="Registrar relação" fields={[["character_name","Nome do personagem"],["relation_type","Tipo de relação"],["notes","Observações","textarea"]]} onClose={()=>setModal("")} onSave={v=>save("relations",v)} busy={busy}/>}
  </div>;
}

function pageTitle(p){return ({overview:"Painel de controle",personnel:"Arquivos pessoais",journal:"Diário de bordo",inventory:"Inventário",relations:"Mapa de relações",board:"Mural coletivo",oracle:"Oráculo de Delfos",achievements:"Conquistas"})[p];}
function pageSubtitle(p){return ({overview:"Bem-vindo ao banco de dados do Acampamento Meio-Sangue.",personnel:"Identidade, origem e características registradas.",journal:"Suas memórias e anotações em um só lugar.",inventory:"Mantenha seus equipamentos organizados.",relations:"Registre os vínculos construídos no acampamento.",board:"Um espaço compartilhado entre os semideuses.",oracle:"Responda aos enigmas e receba uma reflexão do Oráculo.",achievements:"Distintivos e reconhecimentos conquistados."})[p];}
function Overview({data,userName,setPage,setModal}){
  const cards=[["PERSONNEL FILE",data.character?"REGISTRO ATIVO":"NENHUM REGISTRO",Users,"personnel"],["LOGBOOK",`${data.journal.length} ENTRADAS`,BookOpen,"journal"],["INVENTORY",`${data.inventory.length} ITENS`,Package,"inventory"],["RELATIONS",`${data.relations.length} VÍNCULOS`,Folder,"relations"]];
  return <><div className="welcome"><div><div className="eyebrow">WELCOME BACK,</div><h2>{userName.toUpperCase()}<span className="cursor">_</span></h2><p>O arquivo está pronto. O que deseja consultar hoje?</p></div><div className="welcome-symbol"><Sparkles size={34}/></div></div><div className="stats">{cards.map(([a,b,I,p])=><button className="stat-card" key={a} onClick={()=>setPage(p)}><div className="stat-top"><I size={18}/><span>OPEN FILE <ChevronRight size={12}/></span></div><b>{b}</b><small>{a}</small></button>)}</div><div className="section-head"><div><div className="eyebrow">QUICK ACCESS</div><h3>Acesso rápido</h3></div></div><div className="quick-grid"><button onClick={()=>setModal("character")}><User/><b>{data.character?"Editar personagem":"Criar personagem"}</b><small>PERSONNEL / NEW ENTRY</small></button><button onClick={()=>setModal("journal")}><FileText/><b>Novo registro</b><small>LOGBOOK / ADD NOTE</small></button><button onClick={()=>setPage("oracle")}><WandSparkles/><b>Consultar Oráculo</b><small>ORACLE / CONSULT</small></button></div><div className="quote"><span>ARCHIVE MESSAGE // 001</span><p>“Mesmo os feitos mais extraordinários começam com uma história que alguém decidiu registrar.”</p></div></>;
}
function Personnel({character,setModal}){
  if(!character)return <div className="empty"><Users size={30}/><h3>Nenhum semideus registrado</h3><p>Seu arquivo pessoal ainda não foi criado.</p><button className="primary" onClick={()=>setModal("character")}><Plus size={16}/> Criar meu arquivo</button></div>;
  const fields=[["Nome completo",character.full_name],["Apelido",character.nickname],["Idade",character.age],["Progenitor divino",character.parent_god],["Chalé",character.cabin],["Arma",character.weapon],["Personalidade",character.personality],["Habilidades",character.abilities],["Pontos fortes",character.strengths],["Pontos fracos",character.weaknesses],["Maior medo",character.fear],["Maior desejo",character.desire],["Curiosidades",character.fun_facts]];
  return <div className="file-card"><div className="file-head"><div className="file-stamp">PERSONNEL<br/>RECORD</div><div><div className="eyebrow">SUBJECT IDENTIFIED</div><h2>{character.full_name}</h2><p>{character.nickname||"NO ALIAS REGISTERED"} • {character.cabin||"CHALÉ NÃO INFORMADO"}</p></div><button className="outline" onClick={()=>setModal("character")}>EDITAR ARQUIVO</button></div><div className="field-grid">{fields.map(([k,v])=><div className="data-field" key={k}><small>{k}</small><p>{v||"—"}</p></div>)}</div></div>;
}
function Collection({title,subtitle,rows,fields,labels,table,setModal,remove,search,setSearch}){
  const filtered=rows.filter(r=>fields.some(f=>String(r[f]||"").toLowerCase().includes(search.toLowerCase())));
  return <><div className="toolbar"><div className="search"><Search size={16}/><input placeholder="Pesquisar registros..." value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="primary" onClick={()=>setModal(table==="journal_entries"?"journal":table==="inventory_items"?"inventory":"relations")}><Plus size={16}/> NOVO REGISTRO</button></div><div className="records"><div className="records-head"><span>{subtitle}</span><span>{filtered.length} RECORD(S)</span></div>{filtered.length===0?<div className="empty small"><Archive size={25}/><p>Nenhum registro encontrado.</p></div>:filtered.map(r=><div className="record" key={r.id}><div className="record-icon"><FileText size={18}/></div><div className="record-body"><b>{r[fields[0]]||"Registro sem título"}</b><p>{r[fields[1]]||r[fields[2]]||""}</p><small>{new Date(r.created_at).toLocaleString("pt-BR")}</small></div><button className="icon-btn danger" onClick={()=>remove(table,r.id)} title="Excluir"><Trash2 size={16}/></button></div>)}</div></>;
}
function Board({posts,session,profile,save,remove,isAdmin}){
  const [body,setBody]=useState("");
  async function publish(){if(!body.trim())return;await save("board_posts",{body,display_name:profile.display_name||session.user.email.split("@")[0]});setBody("");}
  return <><div className="compose"><div className="eyebrow">TRANSMISSION / PUBLIC CHANNEL</div><textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Deixe uma mensagem para os outros semideuses..."/><div className="compose-bottom"><small>Compartilhe ideias, curiosidades e mensagens fora da narrativa.</small><button className="primary" onClick={publish}><MessageSquare size={15}/> PUBLICAR</button></div></div><div className="post-list">{posts.map(p=><article className="post" key={p.id}><div className="post-top"><div className="avatar">{(p.display_name||p.profiles?.display_name||"S").slice(0,1).toUpperCase()}</div><div><b>{p.display_name||p.profiles?.display_name||"Semideus"}</b><small>{new Date(p.created_at).toLocaleString("pt-BR")}</small></div>{(p.user_id===session.user.id||isAdmin)&&<button className="icon-btn danger" onClick={()=>remove("board_posts",p.id)}><Trash2 size={15}/></button>}</div><p>{p.body}</p></article>)}</div></>;
}
function Oracle({save,busy}){
  const [answers,setAnswers]=useState({});
  const [done,setDone]=useState(false);
  return <div className="oracle-card"><div className="oracle-art"><WandSparkles size={34}/><span>DELPHI // CONSULTATION TERMINAL</span></div><div className="eyebrow">PERSONAL REFLECTION PROTOCOL</div><h2>As perguntas do Oráculo</h2><p className="muted">Não há respostas certas. Responda como seu personagem responderia.</p>{prompts.map((q,i)=><label className="question" key={q}><span>0{i+1} / {q}</span><textarea value={answers[i]||""} onChange={e=>setAnswers({...answers,[i]:e.target.value})} placeholder="Sua resposta..."/></label>)}<button className="primary" disabled={busy||Object.values(answers).filter(x=>x.trim()).length===0} onClick={async()=>{await save("oracle_responses",{answers});setDone(true);}}>ENVIAR RESPOSTAS <Zap size={15}/></button>{done&&<p className="success">SUAS RESPOSTAS FORAM REGISTRADAS.</p>}</div>;
}
function Achievements({rows}){
  return <div className="achievement-grid">{rows.length===0?<div className="empty"><Crown size={30}/><h3>Nenhuma conquista desbloqueada</h3><p>Seus distintivos aparecerão aqui quando forem concedidos pela administração.</p></div>:rows.map(r=><div className="achievement" key={r.id}><Crown size={27}/><b>{r.achievements?.name||"Conquista"}</b><p>{r.achievements?.description||"Distintivo do Acampamento"}</p></div>)}</div>;
}
function CharacterModal({character,onClose,onSave,busy}){
  const fields=[["full_name","Nome completo"],["nickname","Apelido"],["age","Idade"],["parent_god","Progenitor divino"],["cabin","Chalé"],["weapon","Arma"],["personality","Personalidade","textarea"],["abilities","Habilidades","textarea"],["strengths","Pontos fortes","textarea"],["weaknesses","Pontos fracos","textarea"],["fear","Maior medo","textarea"],["desire","Maior desejo","textarea"],["fun_facts","Curiosidades","textarea"]];
  return <Modal title="Arquivo pessoal do semideus" onClose={onClose}><form onSubmit={e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));onSave(f);}}><div className="form-grid">{fields.map(([k,l,t])=><label className={t==="textarea"?"wide":""} key={k}>{l}{t==="textarea"?<textarea name={k} defaultValue={character?.[k]||""}/>:<input name={k} defaultValue={character?.[k]||""} required={k==="full_name"}/>}</label>)}</div><div className="modal-actions"><button type="button" className="outline" onClick={onClose}>CANCELAR</button><button className="primary" disabled={busy}>{busy?"SALVANDO...":"SALVAR ARQUIVO"}</button></div></form></Modal>;
}
function EntryModal({title,fields,onClose,onSave,busy}){
  return <Modal title={title} onClose={onClose}><form onSubmit={e=>{e.preventDefault();onSave(Object.fromEntries(new FormData(e.currentTarget)));}}><div className="form-grid">{fields.map(([k,l,t])=><label className={t==="textarea"?"wide":""} key={k}>{l}{t==="textarea"?<textarea name={k} required/>:<input name={k} required/>}</label>)}</div><div className="modal-actions"><button type="button" className="outline" onClick={onClose}>CANCELAR</button><button className="primary" disabled={busy}>SALVAR REGISTRO</button></div></form></Modal>;
}
function Modal({title,onClose,children}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><div><div className="eyebrow">NEW DATABASE ENTRY</div><h3>{title}</h3></div><button className="icon-btn" onClick={onClose}><X/></button></div>{children}</div></div>;}
function AuthScreen(){
  const [mode,setMode]=useState("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
  async function submit(e){e.preventDefault();setBusy(true);setMsg("");let result;if(mode==="login")result=await supabase.auth.signInWithPassword({email,password});else result=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}});setBusy(false);setMsg(result.error?.message|| (mode==="login"?"ACESSO AUTORIZADO.":"CONTA CRIADA. Verifique seu e-mail se a confirmação estiver ativada."));}
  return <div className="auth-screen"><div className="auth-panel"><div className="auth-logo"><Shield size={28}/><span>CHB / DATABASE</span></div><div className="eyebrow">RESTRICTED ACCESS // 002</div><h1>THE DEMIGOD<br/><em>ARCHIVES</em></h1><p className="muted">Identifique-se para acessar os registros do Acampamento Meio-Sangue.</p><form onSubmit={submit}>{mode==="signup"&&<label>Nome de exibição<input value={name} onChange={e=>setName(e.target.value)} required/></label>}<label><Mail size={15}/> E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label><KeyRound size={15}/> Senha<input type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="primary full" disabled={busy}>{busy?"VERIFICANDO...":mode==="login"?"ACESSAR ARQUIVO":"CRIAR CONTA"} <ChevronRight size={16}/></button></form>{msg&&<div className="auth-message">{msg}</div>}<button className="switch" onClick={()=>{setMode(mode==="login"?"signup":"login");setMsg("");}}>{mode==="login"?"Novo por aqui? Criar conta":"Já possui cadastro? Entrar"}</button><small className="classification">AUTHORIZED PERSONNEL ONLY • CAMP HALF-BLOOD</small></div></div>;
}
function SetupScreen(){return <div className="auth-screen"><div className="auth-panel"><div className="auth-logo"><Shield size={28}/><span>CHB / DATABASE</span></div><div className="eyebrow">INITIAL SETUP REQUIRED</div><h1>THE DEMIGOD<br/><em>ARCHIVES</em></h1><p className="muted">O projeto está instalado, mas ainda precisa ser conectado ao banco de dados Supabase.</p><ol className="setup-list"><li>Crie um projeto gratuito no Supabase.</li><li>Execute o arquivo <code>supabase/schema.sql</code> no SQL Editor.</li><li>Copie a URL e a chave anon para um arquivo <code>.env</code>.</li><li>Consulte o README para publicar e convidar os jogadores.</li></ol><div className="auth-message">A autenticação real será ativada após essa configuração.</div></div></div>;}
createRoot(document.getElementById("root")).render(<App/>);
