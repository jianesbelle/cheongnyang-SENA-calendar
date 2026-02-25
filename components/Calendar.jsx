import { useState, useMemo, useEffect } from "react";

const SCHOOL_SCHEDULE = [
  { period:"1교시", start:"09:00", end:"09:45" },
  { period:"2교시", start:"09:55", end:"10:40" },
  { period:"3교시", start:"10:50", end:"11:35" },
  { period:"4교시", start:"11:45", end:"12:30" },
  { period:"5교시", start:"13:30", end:"14:15" },
  { period:"6교시", start:"14:25", end:"15:10" },
  { period:"7교시", start:"15:10", end:"15:55" },
  { period:"직접 입력", start:"", end:"" },
];
const CLASS_LIST = ["1-1반","1-2반","1-3반","1-4반","1-5반","1-6반","1-7반","1-8반","1-9반","1-10반"];
const ROOM_STYLE = {
  "음악실": { bg:"#FFD6E0", border:"#FF9EB5", icon:"🎵", textColor:"#C2185B" },
  "교실":   { bg:"#C8E6FF", border:"#7EC8FF", icon:"🏫", textColor:"#1565C0" },
};
const CATEGORY_SUB = {
  수업:null, 업무:["학생회회의","대의원회의","기타"], 창체:["자율","봉사","진로","동아리"],
  방과후:null, 연구:null, 휴업:null,
  회의:["교직원회의","교과협의회","학업성적관리위원회","기타"], 전학공:["교간형","교내형"],
};
const CATEGORIES = {
  수업:   { color:"#BFDBFE", border:"#93C5FD" },
  업무:   { color:"#BBF7D0", border:"#6EE7B7" },
  창체:   { color:"#FEF08A", border:"#FDE047" },
  방과후: { color:"#DDD6FE", border:"#C4B5FD" },
  연구:   { color:"#FDE68A", border:"#FBBF24" },
  휴업:   { color:"#FECACA", border:"#FCA5A5" },
  회의:   { color:"#FED7AA", border:"#FDBA74" },
  전학공: { color:"#CCFBF1", border:"#99F6E4" },
};
const KO_DAYS = ["일","월","화","수","목","금","토"];
const today   = new Date();
const fmtDate = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

const DEFAULT_ROOM_RANGES = [
  { id:1, room:"음악실", start:"2026-03-04", end:"2026-03-27", label:"3월 음악실" },
  { id:2, room:"음악실", start:"2026-04-23", end:"2026-05-22", label:"4-5월 음악실" },
  { id:3, room:"음악실", start:"2026-06-22", end:"2026-07-06", label:"6-7월 음악실" },
];

function getAutoRoom(dateStr, roomRanges) {
  for (const r of roomRanges) {
    if (r.room === "음악실" && dateStr >= r.start && dateStr <= r.end) return "음악실";
  }
  return "교실";
}
function getCellEventColor(evs) {
  const priority = ["휴업","연구","창체","회의","업무","전학공","방과후"];
  for (const cat of priority) {
    if (evs.some(e => e.category === cat)) return CATEGORIES[cat]?.color;
  }
  return null;
}
function countTeachingDays(dates, allEvents) {
  return dates.filter(d => {
    if (!d) return false;
    const dow = new Date(d).getDay();
    if (dow === 0 || dow === 6) return false;
    return !allEvents.some(e => e.date === d && e.category === "휴업");
  }).length;
}
const toObsidian = (ev) => {
  const sub = ev.subOption==="기타" ? ev.subOptionEtc : ev.subOption;
  const tags = [sub, ev.className, ev.room].filter(Boolean);
  const tagStr = tags.length ? ` [${tags.join(" · ")}]` : "";
  const time = ev.period && ev.period!=="직접 입력"
    ? ` (${ev.period} ${ev.startTime}~${ev.endTime})`
    : ev.startTime ? ` (${ev.startTime}~${ev.endTime})` : "";
  return `[[${ev.date}]] #${ev.category} ${ev.title}${tagStr}${time}`;
};

const PRESET = [
  { id:101, date:"2026-03-02", title:"대체공휴일",              category:"휴업",  period:"", className:"", room:"", subOption:"",          subOptionEtc:"", startTime:"", endTime:"" },
  { id:102, date:"2026-03-03", title:"입학식",                  category:"업무",  period:"", className:"", room:"", subOption:"기타",       subOptionEtc:"입학식", startTime:"09:00", endTime:"12:00" },
  { id:103, date:"2026-03-12", title:"학급정부회장선거",        category:"업무",  period:"", className:"", room:"", subOption:"학생회회의", subOptionEtc:"", startTime:"", endTime:"" },
  { id:104, date:"2026-03-12", title:"동아리조직",              category:"창체",  period:"", className:"", room:"", subOption:"동아리",     subOptionEtc:"", startTime:"", endTime:"" },
  { id:105, date:"2026-03-18", title:"학부모총회",              category:"회의",  period:"", className:"", room:"", subOption:"기타",       subOptionEtc:"학부모총회", startTime:"", endTime:"" },
  { id:106, date:"2026-03-25", title:"진로캠프행사(2,3학년)",  category:"창체",  period:"", className:"", room:"", subOption:"진로",       subOptionEtc:"", startTime:"", endTime:"" },
  { id:107, date:"2026-03-30", title:"전일제창체",              category:"창체",  period:"", className:"", room:"", subOption:"자율",       subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:108, date:"2026-04-16", title:"과학의달행사(5~7교시)",  category:"창체",  period:"", className:"", room:"", subOption:"자율",       subOptionEtc:"", startTime:"13:30", endTime:"15:55" },
  { id:109, date:"2026-04-27", title:"중간고사(2,3학년)",      category:"연구",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:110, date:"2026-04-28", title:"진로캠프/고사",          category:"창체",  period:"", className:"", room:"", subOption:"진로",       subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:111, date:"2026-04-29", title:"진로캠프/고사",          category:"창체",  period:"", className:"", room:"", subOption:"진로",       subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:112, date:"2026-05-01", title:"축제형휴업일",           category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:113, date:"2026-05-04", title:"축제형휴업일",           category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:114, date:"2026-05-05", title:"어린이날",               category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:115, date:"2026-05-06", title:"대체공휴일(어린이날)",   category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:116, date:"2026-05-18", title:"동아리활동",             category:"창체",  period:"", className:"", room:"", subOption:"동아리",     subOptionEtc:"", startTime:"", endTime:"" },
  { id:117, date:"2026-05-25", title:"대체공휴일(휴업)",       category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:118, date:"2026-05-28", title:"스포츠한마당(체육대회)", category:"창체",  period:"", className:"", room:"", subOption:"자율",       subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:119, date:"2026-06-02", title:"1전일제 진로캠프",       category:"창체",  period:"", className:"", room:"", subOption:"진로",       subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:120, date:"2026-06-03", title:"지방선거일(휴업)",       category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:121, date:"2026-06-11", title:"동아리활동",             category:"창체",  period:"", className:"", room:"", subOption:"동아리",     subOptionEtc:"", startTime:"", endTime:"" },
  { id:122, date:"2026-06-29", title:"7월고사",                category:"연구",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:123, date:"2026-06-30", title:"7월고사",                category:"연구",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:124, date:"2026-07-01", title:"외부진로캠프1",          category:"창체",  period:"", className:"", room:"", subOption:"진로",       subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:125, date:"2026-07-03", title:"기말고사",               category:"연구",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:126, date:"2026-07-08", title:"최종서류제출/시대회보고서", category:"업무", period:"", className:"", room:"", subOption:"기타",     subOptionEtc:"서류제출", startTime:"", endTime:"" },
  { id:127, date:"2026-07-10", title:"진로캠프(2~4학년 4~7교시)", category:"창체", period:"", className:"", room:"", subOption:"진로",   subOptionEtc:"", startTime:"13:30", endTime:"15:55" },
  { id:128, date:"2026-07-15", title:"동아리활동",             category:"창체",  period:"", className:"", room:"", subOption:"동아리",     subOptionEtc:"", startTime:"", endTime:"" },
  { id:129, date:"2026-07-17", title:"휴업일",                 category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:130, date:"2026-07-21", title:"여름방학식",             category:"업무",  period:"", className:"", room:"", subOption:"기타",       subOptionEtc:"방학식", startTime:"09:00", endTime:"12:00" },
];

const EMPTY_FORM = { title:"", category:"수업", period:"1교시", className:"", room:"음악실", subOption:"", subOptionEtc:"", startTime:"09:00", endTime:"09:45" };

function Pills({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:5 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700,
          border: value===o ? "2px solid #3D3530" : "2px solid #DDD8CE",
          background: value===o ? "#3D3530" : "#FFF",
          color: value===o ? "#FFF" : "#666",
          cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit"
        }}>{o}</button>
      ))}
    </div>
  );
}

function EventForm({ form, setForm, onSave, onCancel, mode, selDate, roomRanges }) {
  const subs = CATEGORY_SUB[form.category];
  const autoRoom = getAutoRoom(selDate, roomRanges);

  const handleCat = (cat) => {
    setForm(f => ({
      ...f, category:cat,
      subOption: CATEGORY_SUB[cat] ? CATEGORY_SUB[cat][0] : "", subOptionEtc:"",
      period:    cat==="수업" ? (f.period||"1교시") : f.period,
      className: cat==="수업" ? (f.className||"1-1반") : f.className,
      room:      cat==="수업" ? autoRoom : f.room,
      startTime: cat==="수업" ? (f.startTime||"09:00") : f.startTime,
      endTime:   cat==="수업" ? (f.endTime||"09:45")   : f.endTime,
    }));
  };
  const handlePeriod = (p) => {
    const s = SCHOOL_SCHEDULE.find(x => x.period===p);
    setForm(f => ({ ...f, period:p, startTime:s?.start||f.startTime, endTime:s?.end||f.endTime }));
  };

  return (<>
    <div style={{ marginBottom:13 }}>
      <div className="fl">일정 제목</div>
      <input className="fi" placeholder="예) 음악 감상 수업" value={form.title}
        onChange={e => setForm(f => ({...f, title:e.target.value}))}
        onKeyDown={e => e.key==="Enter" && onSave()} />
    </div>
    <div style={{ marginBottom:13 }}>
      <div className="fl">카테고리</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5, marginTop:4 }}>
        {Object.entries(CATEGORIES).map(([k,v]) => (
          <button key={k} onClick={() => handleCat(k)} style={{
            padding:"6px 4px", borderRadius:6, border:`2px solid ${form.category===k?"#3D3530":v.color}`,
            background:v.color, cursor:"pointer", fontSize:11, fontWeight:700, textAlign:"center",
            transition:"all 0.15s", fontFamily:"inherit"
          }}>{k}</button>
        ))}
      </div>
    </div>
    <div className="dv"/>
    {form.category==="수업" && <>
      <div style={{ background: autoRoom==="음악실"?"#FFD6E0":"#C8E6FF", borderRadius:8, padding:"7px 12px", marginBottom:12, fontSize:12, fontWeight:700, color:autoRoom==="음악실"?"#C2185B":"#1565C0", display:"flex", alignItems:"center", gap:6 }}>
        <span>{autoRoom==="음악실"?"🎵":"🏫"}</span>
        <span>이 날 자동 감지: <b>{autoRoom}</b></span>
        <span style={{ fontSize:11, fontWeight:400, opacity:0.7 }}>(아래서 직접 변경 가능)</span>
      </div>
      <div style={{ marginBottom:13 }}>
        <div className="fl">📍 수업 장소</div>
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          {["음악실","교실"].map(r => (
            <button key={r} onClick={() => setForm(f=>({...f,room:r}))} style={{
              flex:1, padding:"8px 0", borderRadius:8, fontSize:13, fontWeight:700,
              border:`2px solid ${form.room===r?ROOM_STYLE[r].border:"#DDD8CE"}`,
              background:form.room===r?ROOM_STYLE[r].bg:"#FFF",
              color:form.room===r?ROOM_STYLE[r].textColor:"#999",
              cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit"
            }}>{ROOM_STYLE[r].icon} {r}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:13 }}>
        <div className="fl">🕐 교시</div>
        <select className="fi fs" value={form.period} onChange={e => handlePeriod(e.target.value)}>
          {SCHOOL_SCHEDULE.map(s => <option key={s.period} value={s.period}>{s.period}{s.start?` (${s.start}~${s.end})`:""}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:13 }}>
        <div className="fl">🏫 반</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4, marginTop:4 }}>
          {CLASS_LIST.map(c => (
            <button key={c} onClick={() => setForm(f=>({...f,className:c}))} style={{
              padding:"7px 2px", borderRadius:8, fontSize:11.5, fontWeight:700,
              border:`2px solid ${form.className===c?"#3D3530":"#DDD8CE"}`,
              background:form.className===c?"#3D3530":"#FFF",
              color:form.className===c?"#FFF":"#555",
              cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit"
            }}>{c}</button>
          ))}
        </div>
      </div>
    </>}
    {form.category==="업무"  && subs && <div style={{marginBottom:13}}><div className="fl">📋 업무 유형</div><Pills options={subs} value={form.subOption} onChange={v=>setForm(f=>({...f,subOption:v,subOptionEtc:""}))} />{form.subOption==="기타"&&<input className="fi" style={{marginTop:8}} placeholder="직접 입력" value={form.subOptionEtc} onChange={e=>setForm(f=>({...f,subOptionEtc:e.target.value}))}/>}</div>}
    {form.category==="창체"  && subs && <div style={{marginBottom:13}}><div className="fl">🌱 창체 유형</div><Pills options={subs} value={form.subOption} onChange={v=>setForm(f=>({...f,subOption:v}))} /></div>}
    {form.category==="회의"  && subs && <div style={{marginBottom:13}}><div className="fl">🗣 회의 유형</div><Pills options={subs} value={form.subOption} onChange={v=>setForm(f=>({...f,subOption:v,subOptionEtc:""}))} />{form.subOption==="기타"&&<input className="fi" style={{marginTop:8}} placeholder="직접 입력" value={form.subOptionEtc} onChange={e=>setForm(f=>({...f,subOptionEtc:e.target.value}))}/>}</div>}
    {form.category==="전학공"&& subs && <div style={{marginBottom:13}}><div className="fl">🔬 전학공 유형</div><Pills options={subs} value={form.subOption} onChange={v=>setForm(f=>({...f,subOption:v}))} /></div>}
    <div className="dv"/>
    <div style={{ marginBottom:16, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
      <div><div className="fl">시작</div><input className="fi" type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}/></div>
      <div><div className="fl">종료</div><input className="fi" type="time" value={form.endTime}   onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}/></div>
    </div>
    {form.title && <div style={{ background:"#F5F2EA", borderRadius:8, padding:"9px 12px", marginBottom:14, fontSize:11, color:"#888", fontFamily:"monospace", lineHeight:1.7, wordBreak:"break-all" }}>
      🔗 {toObsidian({...form, date:selDate})}
    </div>}
    <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
      <button className="bg" onClick={onCancel}>취소</button>
      <button className="bp" onClick={onSave}>{mode==="edit"?"수정 저장":"저장"}</button>
    </div>
  </>);
}

function RoomRangeEditor({ ranges, onChange, onClose }) {
  const [local, setLocal] = useState(ranges.map(r=>({...r})));
  const [newRange, setNewRange] = useState({ room:"음악실", start:"", end:"", label:"" });
  const update = (id, field, val) => setLocal(l => l.map(r => r.id===id ? {...r,[field]:val} : r));
  const remove  = (id) => setLocal(l => l.filter(r => r.id!==id));
  const addNew  = () => {
    if (!newRange.start || !newRange.end) return;
    setLocal(l => [...l, { ...newRange, id:Date.now() }]);
    setNewRange({ room:"음악실", start:"", end:"", label:"" });
  };
  return (
    <div className="mo" onClick={onClose}>
      <div className="mb" onClick={e=>e.stopPropagation()} style={{ maxWidth:480 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:"#3D3530" }}>🎵 음악실 사용기간 설정</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#bbb" }}>×</button>
        </div>
        <div style={{ background:"#FFF8F0", borderRadius:8, padding:"9px 12px", marginBottom:14, fontSize:12, color:"#92400E", lineHeight:1.6 }}>
          💡 기간 내 날짜라도 <b>창체·연구·휴업</b>이 있으면 수업 추가 시 자동으로 <b>교실</b>로 감지됩니다.
        </div>
        {local.map(r => (
          <div key={r.id} style={{ background:ROOM_STYLE[r.room]?.bg||"#F5F2EA", borderRadius:8, padding:"10px 12px", marginBottom:8, border:`1.5px solid ${ROOM_STYLE[r.room]?.border||"#DDD"}` }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:7 }}>
              <select value={r.room} onChange={e=>update(r.id,"room",e.target.value)} className="fi fs" style={{ width:"auto", flex:"0 0 90px", fontSize:12, padding:"5px 28px 5px 8px" }}>
                <option>음악실</option><option>교실</option>
              </select>
              <input className="fi" type="text" placeholder="메모" value={r.label} onChange={e=>update(r.id,"label",e.target.value)} style={{ flex:1, fontSize:12, padding:"5px 10px" }}/>
              <button onClick={()=>remove(r.id)} style={{ background:"#FEE2E2", border:"none", borderRadius:6, padding:"5px 10px", color:"#DC2626", cursor:"pointer", fontWeight:700, fontSize:12 }}>삭제</button>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <input className="fi" type="date" value={r.start} onChange={e=>update(r.id,"start",e.target.value)} style={{ flex:1, fontSize:12, padding:"5px 10px" }}/>
              <span style={{ color:"#aaa" }}>~</span>
              <input className="fi" type="date" value={r.end} onChange={e=>update(r.id,"end",e.target.value)} style={{ flex:1, fontSize:12, padding:"5px 10px" }}/>
            </div>
          </div>
        ))}
        <div style={{ background:"#F5F2EA", borderRadius:8, padding:"10px 12px", marginBottom:16 }}>
          <div className="fl" style={{ marginBottom:8 }}>+ 새 기간 추가</div>
          <div style={{ display:"flex", gap:8, marginBottom:7 }}>
            <select value={newRange.room} onChange={e=>setNewRange(n=>({...n,room:e.target.value}))} className="fi fs" style={{ width:"auto", flex:"0 0 90px", fontSize:12, padding:"5px 28px 5px 8px" }}>
              <option>음악실</option><option>교실</option>
            </select>
            <input className="fi" type="text" placeholder="메모(선택)" value={newRange.label} onChange={e=>setNewRange(n=>({...n,label:e.target.value}))} style={{ flex:1, fontSize:12, padding:"5px 10px" }}/>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <input className="fi" type="date" value={newRange.start} onChange={e=>setNewRange(n=>({...n,start:e.target.value}))} style={{ flex:1, fontSize:12, padding:"5px 10px" }}/>
            <span style={{ color:"#aaa" }}>~</span>
            <input className="fi" type="date" value={newRange.end} onChange={e=>setNewRange(n=>({...n,end:e.target.value}))} style={{ flex:1, fontSize:12, padding:"5px 10px" }}/>
            <button onClick={addNew} style={{ background:"#3D3530", color:"#FFF", border:"none", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:13, fontWeight:700, whiteSpace:"nowrap" }}>추가</button>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button className="bg" onClick={onClose}>취소</button>
          <button className="bp" onClick={()=>{ onChange(local); onClose(); }}>저장</button>
        </div>
      </div>
    </div>
  );
}

export default function Calendar() {
  const [year, setYear]     = useState(2026);
  const [month, setMonth]   = useState(2);
  const [events, setEvents] = useState(PRESET);
  const [roomRanges, setRoomRanges] = useState(DEFAULT_ROOM_RANGES);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [lastSynced, setLastSynced] = useState(null);

  // 체크리스트 & 메모
  const [checkTab, setCheckTab]     = useState(0);
  const [todos, setTodos]           = useState([]);
  const [newTodo, setNewTodo]       = useState("");
  const [memos, setMemos]           = useState([]);
  const [memoTitle, setMemoTitle]   = useState("");
  const [memoBody, setMemoBody]     = useState("");
  const [memoDate, setMemoDate]     = useState("");

  // ── 구글 시트에서 불러오기 ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setSyncStatus("syncing");
      try {
        const res = await fetch("/api/load");
        const data = await res.json();
        if (data.events     && data.events.length)     setEvents(data.events);
        if (data.todos      && data.todos.length)      setTodos(data.todos);
        if (data.memos      && data.memos.length)      setMemos(data.memos);
        if (data.roomRanges && data.roomRanges.length) setRoomRanges(data.roomRanges);
        setSyncStatus("ok");
        setLastSynced(new Date().toLocaleTimeString("ko-KR"));
      } catch {
        setSyncStatus("idle"); // 첫 실행 시 빈 시트면 그냥 idle
      }
    })();
  }, []);

  // ── 구글 시트에 저장하기 ───────────────────────────────────────────────
  const saveAll = async (newEvents=events, newTodos=todos, newMemos=memos, newRanges=roomRanges) => {
    setSyncStatus("syncing");
    try {
      await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events:newEvents, todos:newTodos, memos:newMemos, roomRanges:newRanges }),
      });
      setSyncStatus("ok");
      setLastSynced(new Date().toLocaleTimeString("ko-KR"));
    } catch {
      setSyncStatus("error");
    }
  };

  const prevM = () => { if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); };
  const nextM = () => { if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); };

  const openAdd = (date) => {
    const autoRoom = getAutoRoom(date, roomRanges);
    setForm({ ...EMPTY_FORM, room:autoRoom, date });
    setModal({ mode:"add", date });
  };
  const openDetail = (e, ev) => { e.stopPropagation(); setCopied(false); setModal({ mode:"detail", date:ev.date, event:ev }); };
  const openEdit   = () => { setForm({...modal.event}); setModal(m=>({...m, mode:"edit"})); };

  const handleSave = () => {
    if (!form.title.trim()) return;
    let newEvents;
    if (modal.mode==="add") {
      newEvents = [...events, { id:Date.now(), ...form, date:modal.date }];
    } else {
      newEvents = events.map(e => e.id===modal.event.id ? {...form, id:e.id} : e);
    }
    setEvents(newEvents);
    saveAll(newEvents);
    setModal(null);
  };
  const handleDelete = () => {
    const newEvents = events.filter(e => String(e.id) !== String(modal.event.id));
    setEvents(newEvents);
    saveAll(newEvents);
    setModal(null);
  };
  const doCopy = () => { navigator.clipboard.writeText(toObsidian(modal.event)); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  // 달력
  const dim = new Date(year,month+1,0).getDate();
  const fd  = new Date(year,month,1).getDay();
  const allDays = Array.from({ length:dim }, (_,i) => fmtDate(year,month,i+1));
  const todayStr = fmtDate(today.getFullYear(), today.getMonth(), today.getDate());
  const getEvsFor = d => events.filter(e=>e.date===d);
  const cells = Array(fd).fill(null).concat(allDays);
  while (cells.length%7!==0) cells.push(null);
  const weeks = [];
  for (let i=0; i<cells.length; i+=7) weeks.push(cells.slice(i,i+7));
  const monthlyTeachingDays = useMemo(() => countTeachingDays(allDays, events), [allDays, events]);

  const chipBg  = ev => ev.category==="수업" && ev.room && ROOM_STYLE[ev.room] ? ROOM_STYLE[ev.room].bg    : CATEGORIES[ev.category]?.color;
  const chipBdr = ev => ev.category==="수업" && ev.room && ROOM_STYLE[ev.room] ? ROOM_STYLE[ev.room].border : CATEGORIES[ev.category]?.border;
  const chipLabel = ev => {
    const room = ev.category==="수업" && ev.room ? `${ROOM_STYLE[ev.room]?.icon}` : "";
    const sub  = ev.subOption && ev.subOption!=="기타" ? `[${ev.subOption}]` : "";
    const etc  = ev.subOption==="기타" && ev.subOptionEtc ? `[${ev.subOptionEtc}]` : "";
    return `${room}${sub} ${ev.title}`.trim();
  };
  const activeRanges = roomRanges.filter(r => {
    const ms = fmtDate(year,month,1);
    const me = fmtDate(year,month,dim);
    return r.room==="음악실" && r.end >= ms && r.start <= me;
  });

  return (
    <div style={{ minHeight:"100vh", background:"#FDFCF8", fontFamily:"'Noto Serif KR','Apple SD Gothic Neo',serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap');
        *{box-sizing:border-box;}
        .bp{background:#3D3530;color:#FDFCF8;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-size:14px;font-family:inherit;transition:background 0.2s;}
        .bp:hover{background:#5a4f49;}
        .bg{background:transparent;border:1.5px solid #ccc;border-radius:8px;padding:7px 16px;cursor:pointer;font-size:13px;font-family:inherit;color:#555;}
        .bg:hover{border-color:#3D3530;color:#3D3530;}
        .dc{height:130px;padding:6px 5px 4px;border:1px solid #EAE6DE;cursor:pointer;transition:background 0.15s;overflow:hidden;}
        .dc:hover{background:#F5F2EA !important;}
        .week-row{display:grid;grid-template-columns:repeat(7,1fr) 34px;grid-auto-rows:130px;}
        .ec{border-radius:4px;padding:2px 5px;font-size:10.5px;margin-top:2px;cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:100%;border-left:3px solid;line-height:1.4;}
        .ec:hover{filter:brightness(0.92);}
        .mo{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;}
        .mb{background:#FDFCF8;border-radius:16px;padding:26px;width:100%;max-width:460px;box-shadow:0 20px 60px rgba(0,0,0,0.15);max-height:92vh;overflow-y:auto;}
        .fl{font-size:11px;color:#999;margin-bottom:5px;letter-spacing:0.06em;font-weight:700;}
        .fi{width:100%;border:1.5px solid #DDD8CE;border-radius:8px;padding:9px 12px;font-size:14px;font-family:inherit;background:#FFF;color:#333;outline:none;}
        .fi:focus{border-color:#3D3530;}
        .fs{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px;cursor:pointer;}
        .dv{height:1px;background:#EAE6DE;margin:13px 0;}
        .nb{background:transparent;border:none;cursor:pointer;padding:6px 10px;border-radius:8px;font-size:20px;color:#3D3530;}
        .nb:hover{background:#EAE6DE;}
        .wc{width:34px;min-width:34px;background:#F0EDE7;border:1px solid #EAE6DE;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:6px;gap:1px;}
        textarea.fi{resize:vertical;}
        @media(max-width:640px){.dc{height:80px;}.ec{font-size:9.5px;}.mb{padding:18px;}.wc{width:26px;min-width:26px;}}
      `}</style>

      {/* 헤더 */}
      <div style={{ background:"#3D3530", color:"#FDFCF8", padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11, opacity:0.5, letterSpacing:"0.12em", marginBottom:1 }}>청량중학교 2026</div>
          <div style={{ fontSize:17, fontWeight:700 }}>📅 업무 플래너 · 김세나 선생님</div>
          <div style={{ marginTop:4, display:"flex", alignItems:"center", gap:8 }}>
            {syncStatus==="syncing" && <span style={{ fontSize:11, opacity:0.6 }}>💾 저장 중...</span>}
            {syncStatus==="ok"      && <span style={{ fontSize:11, opacity:0.6 }}>✅ 저장됨 {lastSynced}</span>}
            {syncStatus==="error"   && <span style={{ fontSize:11, color:"#FECACA" }}>⚠️ 저장 실패 — 인터넷 확인</span>}
            {syncStatus==="ok" && <button onClick={()=>window.location.reload()} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:6, padding:"3px 8px", fontSize:11, color:"rgba(255,255,255,0.6)", cursor:"pointer", fontFamily:"inherit" }}>↻ 새로고침</button>}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
          <div style={{ background:"#E87C3E", borderRadius:8, padding:"4px 12px", fontSize:13, fontWeight:800 }}>
            📚 이번달 수업일수 <span style={{ fontSize:18 }}>{monthlyTeachingDays}</span>일
          </div>
          <div style={{ fontSize:11, opacity:0.5 }}>
            {today.getFullYear()}.{today.getMonth()+1}.{today.getDate()} {KO_DAYS[today.getDay()]}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div style={{ background:"#F5F2EA", padding:"7px 14px", display:"flex", gap:5, flexWrap:"wrap", borderBottom:"1px solid #EAE6DE", alignItems:"center" }}>
        {Object.entries(CATEGORIES).map(([k,v])=>(
          <span key={k} style={{ background:v.color, borderLeft:`3px solid ${v.border}`, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700, color:"#3D3530" }}>{k}</span>
        ))}
        <span style={{ width:1, height:16, background:"#DDD8CE", margin:"0 2px" }}/>
        <span style={{ background:ROOM_STYLE["음악실"].bg, border:`1.5px solid ${ROOM_STYLE["음악실"].border}`, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700, color:ROOM_STYLE["음악실"].textColor }}>🎵 음악실</span>
        <span style={{ background:ROOM_STYLE["교실"].bg, border:`1.5px solid ${ROOM_STYLE["교실"].border}`, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700, color:ROOM_STYLE["교실"].textColor }}>🏫 교실</span>
        <button onClick={()=>setModal({mode:"rooms"})} style={{ marginLeft:"auto", background:"#3D3530", color:"#FFF", border:"none", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>⚙️ 음악실 기간 설정</button>
      </div>

      {/* 음악실 기간 배너 */}
      {activeRanges.length > 0 && (
        <div style={{ background:"#FFF0F5", borderBottom:"1px solid #FFD6E0", padding:"6px 14px", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:11, color:"#C2185B", fontWeight:700 }}>🎵 이달 음악실 사용:</span>
          {activeRanges.map(r => (
            <span key={r.id} style={{ background:"#FFD6E0", border:"1px solid #FF9EB5", borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:600, color:"#C2185B" }}>
              {r.start.slice(5).replace("-","/")} ~ {r.end.slice(5).replace("-","/")} {r.label&&`(${r.label})`}
            </span>
          ))}
          <span style={{ fontSize:11, color:"#aaa" }}>· 행사일은 수동으로 교실 변경</span>
        </div>
      )}

      {/* 달력 네비 */}
      <div style={{ padding:"12px 14px 6px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button className="nb" onClick={prevM}>‹</button>
        <h2 style={{ margin:0, fontSize:21, fontWeight:700, color:"#3D3530" }}>{year}년 {month+1}월</h2>
        <button className="nb" onClick={nextM}>›</button>
      </div>

      {/* 달력 그리드 */}
      <div style={{ padding:"0 10px 14px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr) 34px", background:"#F5F2EA", borderRadius:"10px 10px 0 0", border:"1px solid #EAE6DE", borderBottom:"none" }}>
          {KO_DAYS.map((d,i)=>(
            <div key={d} style={{ textAlign:"center", fontSize:14, fontWeight:800, padding:"10px 0", color:i===0?"#EF4444":i===6?"#3B82F6":"#3D3530" }}>{d}</div>
          ))}
          <div style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"#E87C3E", padding:"10px 0", lineHeight:1.3 }}>수업<br/>일수</div>
        </div>
        <div style={{ border:"1px solid #EAE6DE", borderTop:"none", borderRadius:"0 0 10px 10px", overflow:"hidden" }}>
          {weeks.map((week, wi) => {
            const weekDates = week.filter(Boolean);
            const wCount = countTeachingDays(weekDates, events);
            return (
              <div key={wi} className="week-row">
                {week.map((d, di) => {
                  const evs = d ? getEvsFor(d) : [];
                  const isT = d===todayStr;
                  const dow = di%7;
                  const isWeekend = dow===0 || dow===6;
                  const inMusicRange = d && !isWeekend && getAutoRoom(d, roomRanges)==="음악실";
                  const eventColor  = d && !isWeekend ? getCellEventColor(evs) : null;
                  let cellBg = "#FDFCF8";
                  if (!d || isWeekend)  cellBg = "#F9F7F3";
                  else if (isT)         cellBg = "#FFF8ED";
                  else if (eventColor)  cellBg = eventColor + "55";
                  else if (inMusicRange) cellBg = "rgba(255,214,224,0.30)";
                  return (
                    <div key={di} className="dc"
                      onClick={() => d && openAdd(d)}
                      style={{ background:cellBg, borderTop: d && !isWeekend && inMusicRange ? "3px solid #FF9EB5" : "1px solid #EAE6DE" }}
                    >
                      {d && <>
                        <div style={{ fontSize:12, fontWeight:isT?800:500, color:isT?"#FFF":dow===0?"#EF4444":dow===6?"#3B82F6":"#3D3530", background:isT?"#E87C3E":"transparent", borderRadius:"50%", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:2 }}>{d.slice(8)}</div>
                        {evs.map(ev=>(
                          <div key={ev.id} className="ec" style={{ background:chipBg(ev), borderLeftColor:chipBdr(ev), color:"#3D3530" }} onClick={e=>openDetail(e,ev)}>{chipLabel(ev)}</div>
                        ))}
                      </>}
                    </div>
                  );
                })}
                <div className="wc">
                  <div style={{ fontSize:15, fontWeight:800, color:wCount>0?"#E87C3E":"#ccc", lineHeight:1 }}>{wCount}</div>
                  <div style={{ fontSize:9, color:"#aaa" }}>일</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:8, display:"flex", justifyContent:"flex-end" }}>
          <div style={{ background:"#3D3530", color:"#FFF", borderRadius:8, padding:"5px 16px", fontSize:13, fontWeight:700 }}>
            📚 {month+1}월 총 수업일수: <span style={{ fontSize:17, fontWeight:800 }}>{monthlyTeachingDays}</span>일
          </div>
        </div>
      </div>

      {/* 일정 추가 모달 */}
      {modal?.mode==="add" && (
        <div className="mo" onClick={()=>setModal(null)}>
          <div className="mb" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:"#3D3530" }}>📌 일정 추가</h3>
              <span style={{ color:"#bbb", fontSize:13 }}>{modal.date}</span>
            </div>
            <EventForm form={form} setForm={setForm} onSave={handleSave} onCancel={()=>setModal(null)} mode="add" selDate={modal.date} roomRanges={roomRanges}/>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {modal?.mode==="edit" && (
        <div className="mo" onClick={()=>setModal(null)}>
          <div className="mb" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:"#E87C3E" }}>✏️ 일정 수정</h3>
              <span style={{ color:"#bbb", fontSize:13 }}>{modal.date}</span>
            </div>
            <EventForm form={form} setForm={setForm} onSave={handleSave} onCancel={()=>setModal(null)} mode="edit" selDate={modal.date} roomRanges={roomRanges}/>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {modal?.mode==="detail" && modal.event && (
        <div className="mo" onClick={()=>setModal(null)}>
          <div className="mb" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
                  <span style={{ background:CATEGORIES[modal.event.category]?.color, borderLeft:`3px solid ${CATEGORIES[modal.event.category]?.border}`, borderRadius:5, padding:"3px 10px", fontSize:12, fontWeight:700 }}>{modal.event.category}</span>
                  {modal.event.room && ROOM_STYLE[modal.event.room] && <span style={{ background:ROOM_STYLE[modal.event.room].bg, border:`1.5px solid ${ROOM_STYLE[modal.event.room].border}`, borderRadius:5, padding:"3px 10px", fontSize:12, fontWeight:700, color:ROOM_STYLE[modal.event.room].textColor }}>{ROOM_STYLE[modal.event.room].icon} {modal.event.room}</span>}
                  {modal.event.subOption && modal.event.subOption!=="기타" && <span style={{ background:"#F0EDE7", borderRadius:5, padding:"3px 10px", fontSize:12, fontWeight:600, color:"#555" }}>{modal.event.subOption}</span>}
                  {modal.event.subOption==="기타" && modal.event.subOptionEtc && <span style={{ background:"#F0EDE7", borderRadius:5, padding:"3px 10px", fontSize:12, fontWeight:600, color:"#555" }}>{modal.event.subOptionEtc}</span>}
                  {modal.event.className && <span style={{ background:"#BFDBFE", borderRadius:5, padding:"3px 10px", fontSize:12, fontWeight:700, color:"#1D4ED8" }}>{modal.event.className}</span>}
                </div>
                <h3 style={{ margin:0, fontSize:19, fontWeight:700, color:"#3D3530" }}>{modal.event.title}</h3>
              </div>
              <button onClick={()=>setModal(null)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#bbb", lineHeight:1, flexShrink:0 }}>×</button>
            </div>
            <div style={{ background:"#F5F2EA", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", gap:16, flexWrap:"wrap" }}>
              <div><div style={{ fontSize:11, color:"#aaa", marginBottom:2 }}>날짜</div><div style={{ fontSize:13, fontWeight:600 }}>{modal.event.date}</div></div>
              {modal.event.period && modal.event.period!=="직접 입력" && <div><div style={{ fontSize:11, color:"#aaa", marginBottom:2 }}>교시</div><div style={{ fontSize:13, fontWeight:600 }}>{modal.event.period}</div></div>}
              {modal.event.startTime && <div><div style={{ fontSize:11, color:"#aaa", marginBottom:2 }}>시간</div><div style={{ fontSize:13, fontWeight:600 }}>{modal.event.startTime}~{modal.event.endTime}</div></div>}
            </div>
            <div style={{ background:"#1E1B16", borderRadius:8, padding:"9px 12px", marginBottom:12 }}>
              <div style={{ fontSize:10, color:"#666", marginBottom:3 }}>OBSIDIAN</div>
              <div style={{ fontSize:11, color:"#BBF7D0", fontFamily:"monospace", lineHeight:1.6, wordBreak:"break-all" }}>{toObsidian(modal.event)}</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handleDelete} style={{ background:"#FEE2E2", color:"#DC2626", border:"none", borderRadius:8, padding:"8px 12px", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>삭제</button>
              <button onClick={openEdit}     style={{ background:"#FEF08A", color:"#92400E", border:"none", borderRadius:8, padding:"8px 12px", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>✏️ 수정</button>
              <button className="bp" style={{ background:copied?"#059669":"#3D3530", flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }} onClick={doCopy}>{copied?"✓ 복사됨!":"📋 옵시디언 복사"}</button>
            </div>
          </div>
        </div>
      )}

      {/* 음악실 기간 설정 */}
      {modal?.mode==="rooms" && (
        <RoomRangeEditor ranges={roomRanges} onChange={r=>{ setRoomRanges(r); saveAll(events,todos,memos,r); }} onClose={()=>setModal(null)}/>
      )}

      {/* 체크리스트/메모 */}
      {modal?.mode==="checklist" && (
        <div className="mo" onClick={()=>setModal(null)}>
          <div className="mb" onClick={e=>e.stopPropagation()} style={{ maxWidth:420 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:"#3D3530" }}>📝 할 일 & 메모</h3>
              <button onClick={()=>setModal(null)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#bbb" }}>×</button>
            </div>
            <div style={{ display:"flex", gap:6, marginBottom:16 }}>
              {["할 일","메모"].map((t,i)=>(
                <button key={t} onClick={()=>setCheckTab(i)} style={{ flex:1, padding:"8px 0", borderRadius:8, fontWeight:700, fontSize:13, fontFamily:"inherit", border:"none", cursor:"pointer", background:checkTab===i?"#3D3530":"#F5F2EA", color:checkTab===i?"#FFF":"#888" }}>{t}</button>
              ))}
            </div>
            {checkTab===0 && <>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <input className="fi" style={{ flex:1, fontSize:13, padding:"8px 12px" }} placeholder="할 일 입력 후 Enter" value={newTodo} onChange={e=>setNewTodo(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&newTodo.trim()){ const n=[...todos,{id:Date.now(),text:newTodo.trim(),done:false}]; setTodos(n); saveAll(events,n,memos); setNewTodo(""); }}}/>
                <button className="bp" style={{ padding:"8px 14px" }} onClick={()=>{ if(newTodo.trim()){ const n=[...todos,{id:Date.now(),text:newTodo.trim(),done:false}]; setTodos(n); saveAll(events,n,memos); setNewTodo(""); }}}>추가</button>
              </div>
              {todos.length===0 && <div style={{ textAlign:"center", color:"#ccc", fontSize:13, padding:"20px 0" }}>할 일이 없어요 🎉</div>}
              <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:340, overflowY:"auto" }}>
                {todos.filter(t=>!t.done).map(todo=>(
                  <div key={todo.id} style={{ display:"flex", alignItems:"center", gap:8, background:"#FDFCF8", border:"1.5px solid #EAE6DE", borderRadius:8, padding:"9px 12px" }}>
                    <button onClick={()=>{ const n=todos.map(t=>t.id===todo.id?{...t,done:true}:t); setTodos(n); saveAll(events,n,memos); }} style={{ width:22, height:22, borderRadius:"50%", border:"2px solid #DDD8CE", background:"#FFF", cursor:"pointer", flexShrink:0 }}></button>
                    <span style={{ flex:1, fontSize:13 }}>{todo.text}</span>
                    <button onClick={()=>{ const n=todos.filter(t=>t.id!==todo.id); setTodos(n); saveAll(events,n,memos); }} style={{ background:"none", border:"none", color:"#ccc", cursor:"pointer", fontSize:16 }}>×</button>
                  </div>
                ))}
                {todos.filter(t=>t.done).length>0 && <>
                  <div style={{ fontSize:11, color:"#aaa", fontWeight:700, marginTop:6 }}>완료됨 ✓</div>
                  {todos.filter(t=>t.done).map(todo=>(
                    <div key={todo.id} style={{ display:"flex", alignItems:"center", gap:8, background:"#F5F2EA", border:"1.5px solid #EAE6DE", borderRadius:8, padding:"9px 12px", opacity:0.65 }}>
                      <button onClick={()=>{ const n=todos.map(t=>t.id===todo.id?{...t,done:false}:t); setTodos(n); saveAll(events,n,memos); }} style={{ width:22, height:22, borderRadius:"50%", border:"2px solid #6EE7B7", background:"#BBF7D0", cursor:"pointer", flexShrink:0, color:"#059669", fontSize:12 }}>✓</button>
                      <span style={{ flex:1, fontSize:13, color:"#888", textDecoration:"line-through" }}>{todo.text}</span>
                      <button onClick={()=>{ const n=todos.filter(t=>t.id!==todo.id); setTodos(n); saveAll(events,n,memos); }} style={{ background:"none", border:"none", color:"#ccc", cursor:"pointer", fontSize:16 }}>×</button>
                    </div>
                  ))}
                  <button onClick={()=>{ const n=todos.filter(t=>!t.done); setTodos(n); saveAll(events,n,memos); }} style={{ background:"#FEE2E2", color:"#DC2626", border:"none", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", alignSelf:"flex-end" }}>완료 항목 모두 삭제</button>
                </>}
              </div>
            </>}
            {checkTab===1 && <>
              <div style={{ marginBottom:8 }}><div className="fl">📅 날짜 (선택)</div><input className="fi" type="date" value={memoDate} onChange={e=>setMemoDate(e.target.value)} style={{ fontSize:13 }}/></div>
              <div style={{ marginBottom:12 }}>
                <div className="fl">메모 제목</div>
                <input className="fi" placeholder="제목 입력" value={memoTitle} onChange={e=>setMemoTitle(e.target.value)} style={{ fontSize:13, marginBottom:8 }}/>
                <textarea className="fi" placeholder="내용을 자유롭게 적어주세요" value={memoBody} onChange={e=>setMemoBody(e.target.value)} style={{ minHeight:90, fontSize:13, lineHeight:1.6 }}/>
              </div>
              <button className="bp" style={{ width:"100%", marginBottom:16 }} onClick={()=>{ if(!memoTitle.trim()) return; const n=[{id:Date.now(),date:memoDate,title:memoTitle.trim(),body:memoBody.trim()},...memos]; setMemos(n); saveAll(events,todos,n); setMemoTitle(""); setMemoBody(""); setMemoDate(""); }}>메모 저장</button>
              {memos.length===0 && <div style={{ textAlign:"center", color:"#ccc", fontSize:13, padding:"16px 0" }}>저장된 메모가 없어요</div>}
              <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:280, overflowY:"auto" }}>
                {memos.map(m=>(
                  <div key={m.id} style={{ background:"#FFFDF5", border:"1.5px solid #FDE68A", borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>{m.date && <div style={{ fontSize:11, color:"#aaa", marginBottom:2 }}>{m.date}</div>}<div style={{ fontSize:13, fontWeight:700, color:"#3D3530" }}>{m.title}</div></div>
                      <button onClick={()=>{ const n=memos.filter(x=>x.id!==m.id); setMemos(n); saveAll(events,todos,n); }} style={{ background:"none", border:"none", color:"#ccc", cursor:"pointer", fontSize:16 }}>×</button>
                    </div>
                    {m.body && <div style={{ fontSize:12, color:"#666", marginTop:6, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{m.body}</div>}
                  </div>
                ))}
              </div>
            </>}
          </div>
        </div>
      )}

      {/* 하단 시정표 */}
      <div style={{ background:"#F5F2EA", borderTop:"1px solid #EAE6DE", padding:"9px 14px" }}>
        <div style={{ fontSize:11, color:"#bbb", marginBottom:5, fontWeight:700 }}>청량중학교 2026 시정표</div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {SCHOOL_SCHEDULE.filter(s=>s.start).map(s=>(
            <div key={s.period} style={{ background:"#BFDBFE", borderRadius:6, padding:"3px 9px", fontSize:11, fontWeight:600, color:"#1D4ED8", whiteSpace:"nowrap" }}>{s.period} {s.start}–{s.end}</div>
          ))}
        </div>
      </div>

      {/* 플로팅 버튼 */}
      <button onClick={()=>setModal({mode:"checklist"})} style={{ position:"fixed", bottom:24, right:20, zIndex:90, background:"#3D3530", color:"#FFF", border:"none", borderRadius:50, width:56, height:56, fontSize:22, cursor:"pointer", boxShadow:"0 4px 20px rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>📝</button>
      {todos.filter(t=>!t.done).length>0 && (
        <div style={{ position:"fixed", bottom:64, right:16, zIndex:91, background:"#EF4444", color:"#FFF", borderRadius:50, width:20, height:20, fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
          {todos.filter(t=>!t.done).length}
        </div>
      )}
    </div>
  );
}
