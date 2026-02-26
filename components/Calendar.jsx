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
const PERIOD_CATS = ["수업","창체","방과후"];
const KO_DAYS = ["일","월","화","수","목","금","토"];
const today = new Date();
const fmtDate = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

const DEFAULT_ROOM_RANGES = [
  { id:1, room:"음악실", start:"2026-03-04", end:"2026-03-27", label:"3월 음악실" },
  { id:2, room:"음악실", start:"2026-04-23", end:"2026-05-22", label:"4-5월 음악실" },
  { id:3, room:"음악실", start:"2026-06-22", end:"2026-07-06", label:"6-7월 음악실" },
];
const DEFAULT_BANNERS = [
  { id:1, label:"나이스", url:"https://www.neis.go.kr", color:"#BFDBFE" },
  { id:2, label:"에듀넷", url:"https://www.edunet.net", color:"#BBF7D0" },
  { id:3, label:"학교알리미", url:"https://www.schoolinfo.go.kr", color:"#FEF08A" },
  { id:4, label:"구글클래스룸", url:"https://classroom.google.com", color:"#DDD6FE" },
];

function getAutoRoom(dateStr, roomRanges) {
  for (const r of roomRanges) {
    if (r.room==="음악실" && dateStr>=r.start && dateStr<=r.end) return "음악실";
  }
  return "교실";
}
function getCellEventColor(evs, customCats=[]) {
  const priority = ["휴업","연구","창체","회의","업무","전학공","방과후"];
  for (const cat of priority) {
    if (evs.some(e=>e.category===cat)) return CATEGORIES[cat]?.color;
  }
  for (const cc of customCats) {
    if (evs.some(e=>e.category===cc.name)) return cc.color;
  }
  return null;
}
function countTeachingDays(dates, allEvents) {
  return dates.filter(d => {
    if (!d) return false;
    const dow = new Date(d).getDay();
    if (dow===0||dow===6) return false;
    return !allEvents.some(e=>e.date===d&&e.category==="휴업");
  }).length;
}

const EMPTY_FORM = { title:"", category:"수업", period:"1교시", className:"", room:"음악실", subOption:"", subOptionEtc:"", startTime:"09:00", endTime:"09:45" };

function Pills({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:5 }}>
      {options.map(o=>(
        <button key={o} onClick={()=>onChange(o)} style={{
          padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700,
          border:value===o?"2px solid #3D3530":"2px solid #DDD8CE",
          background:value===o?"#3D3530":"#FFF", color:value===o?"#FFF":"#666",
          cursor:"pointer", fontFamily:"inherit"
        }}>{o}</button>
      ))}
    </div>
  );
}

function EventForm({ form, setForm, onSave, onCancel, mode, selDate, roomRanges, customCats=[], onAddCustomCat }) {
  const subs = CATEGORY_SUB[form.category];
  const autoRoom = getAutoRoom(selDate, roomRanges);
  const showPeriod = PERIOD_CATS.includes(form.category);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#E8D5FF");
  const handleAddCat = () => {
    const nm = newCatName.trim();
    if(!nm) return;
    onAddCustomCat({name:nm, color:newCatColor});
    setForm(f=>({...f, category:nm}));
    setNewCatName("");
  };

  const handleCat = (cat) => {
    setForm(f => ({
      ...f, category:cat,
      subOption: CATEGORY_SUB[cat]?CATEGORY_SUB[cat][0]:"", subOptionEtc:"",
      period: PERIOD_CATS.includes(cat)?(f.period||"1교시"):"",
      className: cat==="수업"?f.className:"",
      room: cat==="수업"?autoRoom:f.room,
      startTime: cat==="휴업"?"":(f.startTime||"09:00"),
      endTime: cat==="휴업"?"":(f.endTime||"09:45"),
    }));
  };
  const handlePeriod = (p) => {
    const s = SCHOOL_SCHEDULE.find(x=>x.period===p);
    setForm(f=>({...f, period:p, startTime:s?.start||f.startTime, endTime:s?.end||f.endTime}));
  };

  return (<>
    <div style={{marginBottom:13}}>
      <div className="fl">일정 제목</div>
      <input className="fi" placeholder="예) 음악 감상 수업" value={form.title}
        onChange={e=>setForm(f=>({...f,title:e.target.value}))}
        onKeyDown={e=>e.key==="Enter"&&onSave()} />
    </div>
    <div style={{marginBottom:13}}>
      <div className="fl">카테고리</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginTop:4}}>
        {Object.entries(CATEGORIES).map(([k,v])=>(
          <button key={k} onClick={()=>handleCat(k)} style={{
            padding:"6px 4px", borderRadius:6, border:`2px solid ${form.category===k?"#3D3530":v.color}`,
            background:v.color, cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit"
          }}>{k}</button>
        ))}
        {customCats.map(c=>(
          <button key={c.name} onClick={()=>setForm(f=>({...f,category:c.name,subOption:"",subOptionEtc:""}))} style={{
            padding:"6px 4px", borderRadius:6, border:`2px solid ${form.category===c.name?"#3D3530":c.color}`,
            background:c.color, cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit"
          }}>{c.name}</button>
        ))}
        <button onClick={()=>setForm(f=>({...f,category:"__new__",subOption:"",subOptionEtc:""}))} style={{
          padding:"6px 4px", borderRadius:6, border:`2px dashed ${form.category==="__new__"?"#3D3530":"#ccc"}`,
          background:"#FFF", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit", color:"#aaa"
        }}>+ 새 탭</button>
      </div>
      {form.category==="__new__" && (
        <div style={{marginTop:10,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input className="fi" placeholder="카테고리 이름" value={newCatName} onChange={e=>setNewCatName(e.target.value)}
            style={{flex:1,fontSize:13,minWidth:100}}
            onKeyDown={e=>{ if(e.key==="Enter") handleAddCat(); }}/>
          <input type="color" value={newCatColor} onChange={e=>setNewCatColor(e.target.value)}
            style={{width:36,height:36,border:"1.5px solid #DDD8CE",borderRadius:8,cursor:"pointer",padding:2}}/>
          <button className="bp" style={{padding:"8px 14px",fontSize:12}} onClick={handleAddCat}>추가</button>
        </div>
      )}
    </div>
    <div className="dv"/>
    {form.category==="수업" && <>
      <div style={{background:autoRoom==="음악실"?"#FFD6E0":"#C8E6FF",borderRadius:8,padding:"7px 12px",marginBottom:12,fontSize:12,fontWeight:700,color:autoRoom==="음악실"?"#C2185B":"#1565C0",display:"flex",alignItems:"center",gap:6}}>
        <span>{autoRoom==="음악실"?"🎵":"🏫"}</span>
        <span>이 날 자동 감지: <b>{autoRoom}</b></span>
      </div>
      <div style={{marginBottom:13}}>
        <div className="fl">📍 수업 장소</div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          {["음악실","교실"].map(r=>(
            <button key={r} onClick={()=>setForm(f=>({...f,room:r}))} style={{
              flex:1,padding:"8px 0",borderRadius:8,fontSize:13,fontWeight:700,
              border:`2px solid ${form.room===r?ROOM_STYLE[r].border:"#DDD8CE"}`,
              background:form.room===r?ROOM_STYLE[r].bg:"#FFF",
              color:form.room===r?ROOM_STYLE[r].textColor:"#999",
              cursor:"pointer",fontFamily:"inherit"
            }}>{ROOM_STYLE[r].icon} {r}</button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:13}}>
        <div className="fl">🏫 반</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginTop:4}}>
          {CLASS_LIST.map(c=>(
            <button key={c} onClick={()=>setForm(f=>({...f,className:c}))} style={{
              padding:"7px 2px",borderRadius:8,fontSize:11.5,fontWeight:700,
              border:`2px solid ${form.className===c?"#3D3530":"#DDD8CE"}`,
              background:form.className===c?"#3D3530":"#FFF",
              color:form.className===c?"#FFF":"#555",
              cursor:"pointer",fontFamily:"inherit"
            }}>{c}</button>
          ))}
        </div>
      </div>
    </>}
    {showPeriod && (
      <div style={{marginBottom:13}}>
        <div className="fl">🕐 교시</div>
        <select className="fi fs" value={form.period} onChange={e=>handlePeriod(e.target.value)}>
          {SCHOOL_SCHEDULE.map(s=><option key={s.period} value={s.period}>{s.period}{s.start?` (${s.start}~${s.end})`:""}</option>)}
        </select>
      </div>
    )}
    {form.category==="업무" && subs && <div style={{marginBottom:13}}><div className="fl">📋 업무 유형</div><Pills options={subs} value={form.subOption} onChange={v=>setForm(f=>({...f,subOption:v,subOptionEtc:""}))} />{form.subOption==="기타"&&<input className="fi" style={{marginTop:8}} placeholder="직접 입력" value={form.subOptionEtc} onChange={e=>setForm(f=>({...f,subOptionEtc:e.target.value}))}/>}</div>}
    {form.category==="창체" && subs && <div style={{marginBottom:13}}><div className="fl">🌱 창체 유형</div><Pills options={subs} value={form.subOption} onChange={v=>setForm(f=>({...f,subOption:v}))} /></div>}
    {form.category==="회의" && subs && <div style={{marginBottom:13}}><div className="fl">🗣 회의 유형</div><Pills options={subs} value={form.subOption} onChange={v=>setForm(f=>({...f,subOption:v,subOptionEtc:""}))} />{form.subOption==="기타"&&<input className="fi" style={{marginTop:8}} placeholder="직접 입력" value={form.subOptionEtc} onChange={e=>setForm(f=>({...f,subOptionEtc:e.target.value}))}/>}</div>}
    {form.category==="전학공" && subs && <div style={{marginBottom:13}}><div className="fl">🔬 전학공 유형</div><Pills options={subs} value={form.subOption} onChange={v=>setForm(f=>({...f,subOption:v}))} /></div>}
    {form.category!=="휴업" && <>
      <div className="dv"/>
      <div style={{marginBottom:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><div className="fl">시작</div><input className="fi" type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}/></div>
        <div><div className="fl">종료</div><input className="fi" type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}/></div>
      </div>
    </>}
    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
      <button className="bg" onClick={onCancel}>취소</button>
      <button className="bp" onClick={onSave}>{mode==="edit"?"수정 저장":"저장"}</button>
    </div>
  </>);
}

function RoomRangeEditor({ ranges, onChange, onClose }) {
  const [local, setLocal] = useState(ranges.map(r=>({...r})));
  const [newRange, setNewRange] = useState({room:"음악실",start:"",end:"",label:""});
  const update = (id,field,val)=>setLocal(l=>l.map(r=>r.id===id?{...r,[field]:val}:r));
  const remove = (id)=>setLocal(l=>l.filter(r=>r.id!==id));
  const addNew = ()=>{
    if(!newRange.start||!newRange.end) return;
    setLocal(l=>[...l,{...newRange,id:Date.now()}]);
    setNewRange({room:"음악실",start:"",end:"",label:""});
  };
  return (
    <div className="mo" onClick={onClose}>
      <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700,color:"#3D3530"}}>🎵 음악실 사용기간 설정</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#bbb"}}>×</button>
        </div>
        {local.map(r=>(
          <div key={r.id} style={{background:ROOM_STYLE[r.room]?.bg||"#F5F2EA",borderRadius:8,padding:"10px 12px",marginBottom:8,border:`1.5px solid ${ROOM_STYLE[r.room]?.border||"#DDD"}`}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:7}}>
              <select value={r.room} onChange={e=>update(r.id,"room",e.target.value)} className="fi fs" style={{width:"auto",flex:"0 0 90px",fontSize:12,padding:"5px 28px 5px 8px"}}>
                <option>음악실</option><option>교실</option>
              </select>
              <input className="fi" type="text" placeholder="메모" value={r.label} onChange={e=>update(r.id,"label",e.target.value)} style={{flex:1,fontSize:12,padding:"5px 10px"}}/>
              <button onClick={()=>remove(r.id)} style={{background:"#FEE2E2",border:"none",borderRadius:6,padding:"5px 10px",color:"#DC2626",cursor:"pointer",fontWeight:700,fontSize:12}}>삭제</button>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input className="fi" type="date" value={r.start} onChange={e=>update(r.id,"start",e.target.value)} style={{flex:1,fontSize:12,padding:"5px 10px"}}/>
              <span style={{color:"#aaa"}}>~</span>
              <input className="fi" type="date" value={r.end} onChange={e=>update(r.id,"end",e.target.value)} style={{flex:1,fontSize:12,padding:"5px 10px"}}/>
            </div>
          </div>
        ))}
        <div style={{background:"#F5F2EA",borderRadius:8,padding:"10px 12px",marginBottom:16}}>
          <div className="fl" style={{marginBottom:8}}>+ 새 기간 추가</div>
          <div style={{display:"flex",gap:8,marginBottom:7}}>
            <select value={newRange.room} onChange={e=>setNewRange(n=>({...n,room:e.target.value}))} className="fi fs" style={{width:"auto",flex:"0 0 90px",fontSize:12,padding:"5px 28px 5px 8px"}}>
              <option>음악실</option><option>교실</option>
            </select>
            <input className="fi" type="text" placeholder="메모(선택)" value={newRange.label} onChange={e=>setNewRange(n=>({...n,label:e.target.value}))} style={{flex:1,fontSize:12,padding:"5px 10px"}}/>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input className="fi" type="date" value={newRange.start} onChange={e=>setNewRange(n=>({...n,start:e.target.value}))} style={{flex:1,fontSize:12,padding:"5px 10px"}}/>
            <span style={{color:"#aaa"}}>~</span>
            <input className="fi" type="date" value={newRange.end} onChange={e=>setNewRange(n=>({...n,end:e.target.value}))} style={{flex:1,fontSize:12,padding:"5px 10px"}}/>
            <button onClick={addNew} style={{background:"#3D3530",color:"#FFF",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700,whiteSpace:"nowrap"}}>추가</button>
          </div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="bg" onClick={onClose}>취소</button>
          <button className="bp" onClick={()=>{onChange(local);onClose();}}>저장</button>
        </div>
      </div>
    </div>
  );
}

function BannerEditor({ banners, onChange, onClose }) {
  const [local, setLocal] = useState(banners.map(b=>({...b})));
  const [newB, setNewB] = useState({label:"",url:"",color:"#BFDBFE"});
  const COLORS = ["#BFDBFE","#BBF7D0","#FEF08A","#DDD6FE","#FDE68A","#FECACA","#FED7AA","#CCFBF1"];
  const update = (id,field,val)=>setLocal(l=>l.map(b=>b.id===id?{...b,[field]:val}:b));
  const remove = (id)=>setLocal(l=>l.filter(b=>b.id!==id));
  const addNew = ()=>{
    if(!newB.label.trim()||!newB.url.trim()) return;
    const url = newB.url.startsWith("http")?newB.url:"https://"+newB.url;
    setLocal(l=>[...l,{...newB,url,id:Date.now()}]);
    setNewB({label:"",url:"",color:"#BFDBFE"});
  };
  return (
    <div className="mo" onClick={onClose}>
      <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700,color:"#3D3530"}}>🔗 즐겨찾기 배너 편집</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#bbb"}}>×</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
          {local.map(b=>(
            <div key={b.id} style={{display:"flex",gap:8,alignItems:"center",background:b.color,borderRadius:8,padding:"8px 12px"}}>
              <input className="fi" value={b.label} onChange={e=>update(b.id,"label",e.target.value)} placeholder="이름" style={{flex:"0 0 80px",fontSize:12,padding:"5px 8px"}}/>
              <input className="fi" value={b.url} onChange={e=>update(b.id,"url",e.target.value)} placeholder="URL" style={{flex:1,fontSize:12,padding:"5px 8px"}}/>
              <button onClick={()=>remove(b.id)} style={{background:"#FEE2E2",border:"none",borderRadius:6,padding:"5px 10px",color:"#DC2626",cursor:"pointer",fontWeight:700,fontSize:12,flexShrink:0}}>삭제</button>
            </div>
          ))}
        </div>
        <div style={{background:"#F5F2EA",borderRadius:8,padding:"10px 12px",marginBottom:16}}>
          <div className="fl" style={{marginBottom:8}}>+ 새 배너 추가</div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <input className="fi" value={newB.label} onChange={e=>setNewB(n=>({...n,label:e.target.value}))} placeholder="이름" style={{flex:"0 0 70px",fontSize:12,padding:"5px 8px"}}/>
            <input className="fi" value={newB.url} onChange={e=>setNewB(n=>({...n,url:e.target.value}))} placeholder="URL 입력" style={{flex:1,fontSize:12,padding:"5px 8px"}}/>
            <select value={newB.color} onChange={e=>setNewB(n=>({...n,color:e.target.value}))} style={{border:"1.5px solid #DDD8CE",borderRadius:6,padding:"5px",fontSize:12,cursor:"pointer"}}>
              {COLORS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addNew} style={{background:"#3D3530",color:"#FFF",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>추가</button>
          </div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="bg" onClick={onClose}>취소</button>
          <button className="bp" onClick={()=>{onChange(local);onClose();}}>저장</button>
        </div>
      </div>
    </div>
  );
}


const CLASS_INFO = {
  "1-1반":  { homeroom:"오진희", location:"청4층" },
  "1-2반":  { homeroom:"김지혜", location:"청3층" },
  "1-3반":  { homeroom:"조미선", location:"본1층" },
  "1-4반":  { homeroom:"조영선", location:"본1층" },
  "1-5반":  { homeroom:"김로사",  location:"청2층" },
  "1-6반":  { homeroom:"박미선", location:"청2층" },
  "1-7반":  { homeroom:"홍경숙", location:"청2층" },
  "1-8반":  { homeroom:"사공가희", location:"본3층" },
  "1-9반":  { homeroom:"이경선", location:"본3층" },
  "1-10반": { homeroom:"김혜현", location:"본3층" },
};
const STUDENTS = {
  "1-1반":  [{no:1,name:"권하윤"},{no:2,name:"김라희"},{no:3,name:"김수현"},{no:4,name:"김시연"},{no:5,name:"김연서"},{no:6,name:"박가현"},{no:7,name:"박소율"},{no:8,name:"성서윤"},{no:9,name:"이서연"},{no:10,name:"이윤슬"},{no:11,name:"정지희"},{no:12,name:"채린"},{no:13,name:"최담희"},{no:14,name:"최지수"},{no:15,name:"가합(AL AZZAWI)"},{no:16,name:"강다니엘"},{no:17,name:"곽주언"},{no:18,name:"김시율"},{no:19,name:"김재하"},{no:20,name:"김지성"},{no:21,name:"박로이"},{no:22,name:"박승현"},{no:23,name:"유건희"},{no:24,name:"이도율"},{no:25,name:"이창민"},{no:26,name:"이현도"},{no:27,name:"전윤형"},{no:28,name:"정우진"},{no:29,name:"하서우"},{no:30,name:"함현태"}],
  "1-2반":  [{no:1,name:"알리사(BOGATYREVA)"},{no:2,name:"김예림"},{no:3,name:"김이령"},{no:4,name:"박서윤"},{no:5,name:"박유빈"},{no:6,name:"박윤희"},{no:7,name:"방재윤"},{no:8,name:"손유하"},{no:9,name:"신도은"},{no:10,name:"오예음"},{no:11,name:"유지혜"},{no:12,name:"윤혜린"},{no:13,name:"이든"},{no:14,name:"이해은"},{no:15,name:"홍지수"},{no:16,name:"김강민"},{no:17,name:"김예찬"},{no:18,name:"김정운"},{no:19,name:"김지훈"},{no:20,name:"김하랑"},{no:21,name:"사준우"},{no:22,name:"송도윤"},{no:23,name:"심재민"},{no:24,name:"이승우"},{no:25,name:"임건우"},{no:26,name:"전승오"},{no:27,name:"전지후"},{no:28,name:"정용화"},{no:29,name:"최은호"},{no:30,name:"하늘빛"}],
  "1-3반":  [{no:1,name:"강채하"},{no:2,name:"권하윤"},{no:3,name:"김규리"},{no:4,name:"김예빈"},{no:5,name:"박서빈"},{no:6,name:"왕세빈"},{no:7,name:"유서연"},{no:8,name:"유송현"},{no:9,name:"이소이"},{no:10,name:"이지유"},{no:11,name:"정소윤"},{no:12,name:"정혜원"},{no:13,name:"조하연"},{no:14,name:"한채린"},{no:15,name:"황은성"},{no:16,name:"김대한"},{no:17,name:"김도현"},{no:18,name:"김재희"},{no:19,name:"박준영"},{no:20,name:"박태후"},{no:21,name:"성민우"},{no:22,name:"신은찬"},{no:23,name:"윤시유"},{no:24,name:"윤지성"},{no:25,name:"이예담"},{no:26,name:"이정빈"},{no:27,name:"임재윤"},{no:28,name:"임준혁"},{no:29,name:"정주원"},{no:30,name:"최태앙"}],
  "1-4반":  [{no:1,name:"발레리아(AN VALERIYA)"},{no:2,name:"길다연"},{no:3,name:"김나율"},{no:4,name:"김보윤"},{no:5,name:"김채린"},{no:6,name:"박윤아"},{no:7,name:"박희현"},{no:8,name:"서지우"},{no:9,name:"송유민"},{no:10,name:"오나경"},{no:11,name:"유은서"},{no:12,name:"장호정"},{no:13,name:"정봄"},{no:14,name:"차인서"},{no:15,name:"공민규"},{no:16,name:"김도윤"},{no:17,name:"김서준"},{no:18,name:"김서하"},{no:19,name:"김윤건"},{no:20,name:"김현중"},{no:21,name:"박상우"},{no:22,name:"박지호"},{no:23,name:"서효준"},{no:24,name:"안덕호"},{no:25,name:"안서진"},{no:26,name:"이준희"},{no:27,name:"정주원"},{no:28,name:"진연준"},{no:29,name:"허시형"}],
  "1-5반":  [{no:1,name:"김도이"},{no:2,name:"김민채"},{no:3,name:"김보민"},{no:4,name:"김소윤"},{no:5,name:"김재인"},{no:6,name:"김하영"},{no:7,name:"문서영"},{no:8,name:"문지현"},{no:9,name:"박가을"},{no:10,name:"박지원"},{no:11,name:"송주하"},{no:12,name:"염주원"},{no:13,name:"이지유"},{no:14,name:"임수아"},{no:15,name:"전민지"},{no:16,name:"예브게니(KIM YEVGENIY)"},{no:17,name:"김강"},{no:18,name:"김건"},{no:19,name:"김서진"},{no:20,name:"김재겸"},{no:21,name:"석강후"},{no:22,name:"석현준"},{no:23,name:"양태양"},{no:24,name:"이경환"},{no:25,name:"이민형"},{no:26,name:"이승훈"},{no:27,name:"이시율"},{no:28,name:"이영빈"},{no:29,name:"이윤후"},{no:30,name:"임주성"}],
  "1-6반":  [{no:1,name:"미라슬라바(KIM MIRASLAVA)"},{no:2,name:"김가현"},{no:3,name:"김승은"},{no:4,name:"김연서"},{no:5,name:"김지우"},{no:6,name:"백화연"},{no:7,name:"서다혜"},{no:8,name:"안서현"},{no:9,name:"안혜준"},{no:10,name:"전유정"},{no:11,name:"정근하"},{no:12,name:"정민경"},{no:13,name:"조한나"},{no:14,name:"최세아"},{no:15,name:"김도율"},{no:16,name:"김주원"},{no:17,name:"김태양"},{no:18,name:"노유원"},{no:19,name:"류찬희"},{no:20,name:"성민기"},{no:21,name:"송진후"},{no:22,name:"안수호"},{no:23,name:"윤유섭"},{no:24,name:"이도훈"},{no:25,name:"이선재"},{no:26,name:"이승범"},{no:27,name:"주하빈"},{no:28,name:"차민혁"},{no:29,name:"최민우"},{no:30,name:"강지형"}],
  "1-7반":  [{no:1,name:"김베라(KIM VERA)"},{no:2,name:"김사랑"},{no:3,name:"김시연"},{no:4,name:"김채아"},{no:5,name:"박규리"},{no:6,name:"박서윤"},{no:7,name:"신다희"},{no:8,name:"이수현"},{no:9,name:"장제이"},{no:10,name:"정예현"},{no:11,name:"조수인"},{no:12,name:"조아율"},{no:13,name:"최서연"},{no:14,name:"최진영"},{no:15,name:"허정원"},{no:16,name:"발레라(TKHAY VALERIY)"},{no:17,name:"김도연"},{no:18,name:"김도혁"},{no:19,name:"김범수"},{no:20,name:"김세진"},{no:21,name:"김이든"},{no:22,name:"김태환"},{no:23,name:"양도윤"},{no:24,name:"이승현"},{no:25,name:"이은찬"},{no:26,name:"이재예"},{no:27,name:"이풍윤"},{no:28,name:"정민규"},{no:29,name:"정하람"},{no:30,name:"최지환"}],
  "1-8반":  [{no:1,name:"김서연"},{no:2,name:"김서윤"},{no:3,name:"김주희"},{no:4,name:"김혜리"},{no:5,name:"김혜원"},{no:6,name:"박주연"},{no:7,name:"손연재"},{no:8,name:"신다혜"},{no:9,name:"신지현"},{no:10,name:"이혜율"},{no:11,name:"정하율"},{no:12,name:"젠혜림"},{no:13,name:"조다빈"},{no:14,name:"조수아"},{no:15,name:"최지유"},{no:16,name:"강도훈"},{no:17,name:"강민기"},{no:18,name:"김단우"},{no:19,name:"김재성"},{no:20,name:"노한결"},{no:21,name:"오정윤"},{no:22,name:"이강우"},{no:23,name:"이규현"},{no:24,name:"이수하"},{no:25,name:"이원재"},{no:26,name:"이정빈"},{no:27,name:"이주원"},{no:28,name:"이진호"},{no:29,name:"장수찬"},{no:30,name:"홍태호"}],
  "1-9반":  [{no:1,name:"이유진(BURTEUJINYESUI)"},{no:2,name:"김루빈"},{no:3,name:"김세림"},{no:4,name:"김지아"},{no:5,name:"김태이"},{no:6,name:"김하람"},{no:7,name:"심주하"},{no:8,name:"윤효린"},{no:9,name:"이수빈"},{no:10,name:"이아린"},{no:11,name:"이윤솔"},{no:12,name:"이채영"},{no:13,name:"정보현"},{no:14,name:"황예슬"},{no:15,name:"황지유"},{no:16,name:"김원혁"},{no:17,name:"김은성"},{no:18,name:"김태혁"},{no:19,name:"김환"},{no:20,name:"류강후"},{no:21,name:"류재민"},{no:22,name:"서준휘"},{no:23,name:"선예준"},{no:24,name:"안건우"},{no:25,name:"윤용한"},{no:26,name:"이찬율"},{no:27,name:"이홍강"},{no:28,name:"임지환"},{no:29,name:"정시훈"},{no:30,name:"조현규"}],
  "1-10반": [{no:1,name:"크리스티나(TSOY CHRISTINA)"},{no:2,name:"김담희"},{no:3,name:"김연비"},{no:4,name:"김지우"},{no:5,name:"김지유"},{no:6,name:"배온유"},{no:7,name:"성윤진"},{no:8,name:"심유하"},{no:9,name:"안영서"},{no:10,name:"엄다윤"},{no:11,name:"오지연"},{no:12,name:"유지민"},{no:13,name:"최은솔"},{no:14,name:"추다희"},{no:15,name:"권준혁"},{no:16,name:"김도훈"},{no:17,name:"김태영"},{no:18,name:"나하람"},{no:19,name:"박주원"},{no:20,name:"박준현"},{no:21,name:"손시현"},{no:22,name:"신지호"},{no:23,name:"이상진"},{no:24,name:"이시운"},{no:25,name:"이주헌"},{no:26,name:"이지환"},{no:27,name:"장무빈"},{no:28,name:"최규원"},{no:29,name:"최종원"},{no:30,name:"추민후"}],
};


const FAMILY_CATS = {
  "인서": [
    {key:"초등학교", color:"#BFDBFE", icon:"🏫"},
    {key:"태권도",   color:"#FEF08A", icon:"🥋"},
    {key:"축구",     color:"#BBF7D0", icon:"⚽"},
    {key:"수영",     color:"#BAE6FD", icon:"🏊"},
    {key:"교회",     color:"#DDD6FE", icon:"⛪"},
  ],
  "인율": [
    {key:"유치원",   color:"#FBCFE8", icon:"🌸"},
    {key:"교회",     color:"#DDD6FE", icon:"⛪"},
  ],
  "인우": [
    {key:"유치원",   color:"#FBCFE8", icon:"🌸"},
    {key:"교회",     color:"#DDD6FE", icon:"⛪"},
  ],
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
  // ── 2학기 ──
  { id:201, date:"2026-08-03", title:"2학기 개학",             category:"업무",  period:"", className:"", room:"", subOption:"기타",       subOptionEtc:"개학", startTime:"09:00", endTime:"12:00" },
  { id:202, date:"2026-08-15", title:"광복절",                 category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:203, date:"2026-08-17", title:"대체휴일",               category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:204, date:"2026-08-18", title:"학급정·부회장선거",      category:"업무",  period:"", className:"", room:"", subOption:"학생회회의", subOptionEtc:"", startTime:"", endTime:"" },
  { id:205, date:"2026-08-24", title:"자기주도학습캠프(2-①~④)", category:"창체", period:"", className:"", room:"", subOption:"자율",       subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:206, date:"2026-08-26", title:"동아리활동(1,2,3)",      category:"창체",  period:"", className:"", room:"", subOption:"동아리",     subOptionEtc:"", startTime:"", endTime:"" },
  { id:207, date:"2026-08-31", title:"전일제 진로체험(1)",     category:"창체",  period:"", className:"", room:"", subOption:"진로",       subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:208, date:"2026-09-08", title:"외부진로체험(2)",        category:"창체",  period:"", className:"", room:"", subOption:"진로",       subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:209, date:"2026-09-16", title:"전일제 창체활동",        category:"창체",  period:"", className:"", room:"", subOption:"자율",       subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:210, date:"2026-09-17", title:"동아리활동(1,2,3)",      category:"창체",  period:"", className:"", room:"", subOption:"동아리",     subOptionEtc:"", startTime:"", endTime:"" },
  { id:211, date:"2026-09-24", title:"추석연휴",               category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:212, date:"2026-09-25", title:"추석",                   category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:213, date:"2026-09-28", title:"재량휴업일",             category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:214, date:"2026-10-01", title:"스포츠데이/외부문화체험(1,2,3)", category:"창체", period:"", className:"", room:"", subOption:"자율", subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:215, date:"2026-10-03", title:"개천절",                 category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:216, date:"2026-10-05", title:"대체휴일",               category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:217, date:"2026-10-06", title:"동아리활동(1,2,3)",      category:"창체",  period:"", className:"", room:"", subOption:"동아리",     subOptionEtc:"", startTime:"", endTime:"" },
  { id:218, date:"2026-10-09", title:"한글날",                 category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:219, date:"2026-10-15", title:"직업교육박람회(3학년 ④~⑥)", category:"창체", period:"", className:"", room:"", subOption:"진로",     subOptionEtc:"", startTime:"13:30", endTime:"15:55" },
  { id:220, date:"2026-10-21", title:"1차시험(3학년)",         category:"연구",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:221, date:"2026-10-22", title:"1차시험(1,2,3학년)",     category:"연구",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:222, date:"2026-10-23", title:"1차시험(1,2,3학년)",     category:"연구",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:223, date:"2026-10-30", title:"동아리활동(1,2,3)",      category:"창체",  period:"", className:"", room:"", subOption:"동아리",     subOptionEtc:"", startTime:"", endTime:"" },
  { id:224, date:"2026-11-09", title:"동아리활동(1,2,3)",      category:"창체",  period:"", className:"", room:"", subOption:"동아리",     subOptionEtc:"", startTime:"", endTime:"" },
  { id:225, date:"2026-11-10", title:"청량제",                 category:"창체",  period:"", className:"", room:"", subOption:"자율",       subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:226, date:"2026-11-11", title:"인천교육한마당",         category:"업무",  period:"", className:"", room:"", subOption:"기타",       subOptionEtc:"한마당", startTime:"09:00", endTime:"15:55" },
  { id:227, date:"2026-11-19", title:"수능일(재량휴업)",       category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:228, date:"2026-11-20", title:"재량휴업일",             category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:229, date:"2026-12-07", title:"2차시험(1,2학년)",       category:"연구",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:230, date:"2026-12-08", title:"2차시험(1,2학년)",       category:"연구",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:231, date:"2026-12-09", title:"2차시험(1,2학년)",       category:"연구",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"09:00", endTime:"15:55" },
  { id:232, date:"2026-12-23", title:"학생회장선거",           category:"업무",  period:"", className:"", room:"", subOption:"학생회회의", subOptionEtc:"", startTime:"", endTime:"" },
  { id:233, date:"2026-12-25", title:"성탄절",                 category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
  { id:234, date:"2026-12-30", title:"종업/졸업식",            category:"업무",  period:"", className:"", room:"", subOption:"기타",       subOptionEtc:"졸업식", startTime:"09:00", endTime:"12:00" },
  { id:235, date:"2027-01-01", title:"새해 첫날",              category:"휴업",  period:"", className:"", room:"", subOption:"",           subOptionEtc:"", startTime:"", endTime:"" },
];

export default function Calendar() {
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tab, setTab]     = useState("calendar");
  const [events, setEvents]         = useState(PRESET);
  const [roomRanges, setRoomRanges] = useState(DEFAULT_ROOM_RANGES);
  const [banners, setBanners]       = useState(DEFAULT_BANNERS);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [lastSynced, setLastSynced] = useState(null);
  const [todos, setTodos]       = useState([]);
  const [newTodo, setNewTodo]   = useState("");
  const [newTodoDate, setNewTodoDate] = useState("");
  const [editingTodo, setEditingTodo] = useState(null);
  const [editingMemo, setEditingMemo] = useState(null);
  const [memos, setMemos]       = useState([]);
  const [memoTitle, setMemoTitle] = useState("");
  const [memoBody, setMemoBody]   = useState("");
  const [memoDate, setMemoDate]   = useState("");
  const [listFilter, setListFilter] = useState("전체");
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [customCats, setCustomCats] = useState([]);
  const [docs, setDocs] = useState([]);
  const [editingDoc, setEditingDoc] = useState(null);
  const [newDoc, setNewDoc] = useState({title:"",category:"공지",date:"",body:""});
  const [timetable, setTimetable] = useState([
    {id:"tt1",  dow:0, period:"1교시", className:"1-7반",  startTime:"09:00", endTime:"09:45"},
    {id:"tt2",  dow:0, period:"3교시", className:"1-2반",  startTime:"10:50", endTime:"11:35"},
    {id:"tt3",  dow:0, period:"4교시", className:"1-10반", startTime:"11:45", endTime:"12:30"},
    {id:"tt4",  dow:0, period:"6교시", className:"1-4반",  startTime:"14:25", endTime:"15:10"},
    {id:"tt5",  dow:1, period:"1교시", className:"1-3반",  startTime:"09:00", endTime:"09:45"},
    {id:"tt6",  dow:1, period:"2교시", className:"1-9반",  startTime:"09:55", endTime:"10:40"},
    {id:"tt7",  dow:1, period:"5교시", className:"1-6반",  startTime:"13:30", endTime:"14:15"},
    {id:"tt8",  dow:1, period:"6교시", className:"1-8반",  startTime:"14:25", endTime:"15:10"},
    {id:"tt9",  dow:2, period:"2교시", className:"1-1반",  startTime:"09:55", endTime:"10:40"},
    {id:"tt10", dow:2, period:"3교시", className:"1-5반",  startTime:"10:50", endTime:"11:35"},
    {id:"tt11", dow:2, period:"5교시", className:"1-3반",  startTime:"13:30", endTime:"14:15"},
    {id:"tt12", dow:2, period:"6교시", className:"1-9반",  startTime:"14:25", endTime:"15:10"},
    {id:"tt13", dow:3, period:"1교시", className:"1-8반",  startTime:"09:00", endTime:"09:45"},
    {id:"tt14", dow:3, period:"2교시", className:"1-5반",  startTime:"09:55", endTime:"10:40"},
    {id:"tt15", dow:3, period:"5교시", className:"1-6반",  startTime:"13:30", endTime:"14:15"},
    {id:"tt16", dow:3, period:"6교시", className:"1-7반",  startTime:"14:25", endTime:"15:10"},
    {id:"tt17", dow:4, period:"1교시", className:"1-4반",  startTime:"09:00", endTime:"09:45"},
    {id:"tt18", dow:4, period:"2교시", className:"1-2반",  startTime:"09:55", endTime:"10:40"},
    {id:"tt19", dow:4, period:"4교시", className:"1-1반",  startTime:"11:45", endTime:"12:30"},
    {id:"tt20", dow:4, period:"5교시", className:"1-10반", startTime:"13:30", endTime:"14:15"},
  ]);
  const [editingCell, setEditingCell] = useState(null);
  const [bulkMsg, setBulkMsg] = useState("");
  const [studentNotes, setStudentNotes] = useState({});
  const [stdTab, setStdTab] = useState("1-1반");
  const [stdSearch, setStdSearch] = useState("");
  const [stdDetailKey, setStdDetailKey] = useState(null);
  // ── My Planner (family) ──
  const [familyEvents, setFamilyEvents] = useState([]);
  const [familyCustomCats, setFamilyCustomCats] = useState({"인서":[],"인율":[],"인우":[]});
  const [familyChild, setFamilyChild] = useState("인서");
  const [familyView, setFamilyView] = useState("month"); // "month" | "week"
  const [familyModal, setFamilyModal] = useState(null);
  const [familyForm, setFamilyForm] = useState({title:"",cat:"",startTime:"",endTime:"",repeat:"none"});
  const [newFamCatName, setNewFamCatName] = useState("");
  const [newFamCatColor, setNewFamCatColor] = useState("#F9D4AA");
  const [famYear, setFamYear] = useState(today.getFullYear());
  const [famMonth, setFamMonth] = useState(today.getMonth());
  const [famWeekOffset, setFamWeekOffset] = useState(0);
  const [ttRegRange, setTtRegRange] = useState({start:"2026-03-03", end:"2026-07-17"});
  const [ttSkipDates, setTtSkipDates] = useState("2026-03-02,2026-04-27,2026-04-28,2026-04-29,2026-05-01,2026-05-04,2026-05-05,2026-05-06,2026-05-25,2026-06-03,2026-06-29,2026-06-30,2026-07-03,2026-07-17,2026-08-15,2026-08-17,2026-09-24,2026-09-25,2026-09-28,2026-10-03,2026-10-05,2026-10-09,2026-10-21,2026-10-22,2026-10-23,2026-11-19,2026-11-20,2026-12-07,2026-12-08,2026-12-09,2026-12-25,2026-12-30");
  // 2학기 시간표
  const [timetable2, setTimetable2] = useState([]);
  const [editingCell2, setEditingCell2] = useState(null);
  const [bulkMsg2, setBulkMsg2] = useState("");
  const [ttRegRange2, setTtRegRange2] = useState({start:"2026-08-03", end:"2026-12-30"});
  const [ttSkipDates2, setTtSkipDates2] = useState("2026-08-15,2026-08-17,2026-09-24,2026-09-25,2026-09-28,2026-10-03,2026-10-05,2026-10-09,2026-10-21,2026-10-22,2026-10-23,2026-11-19,2026-11-20,2026-12-07,2026-12-08,2026-12-09,2026-12-25,2026-12-30");

  useEffect(()=>{
    (async()=>{
      setSyncStatus("syncing");
      try {
        const res = await fetch("/api/load");
        const data = await res.json();
        if (data.events&&data.events.length)         setEvents(data.events);
        if (data.todos&&data.todos.length)           setTodos(data.todos);
        if (data.memos&&data.memos.length)           setMemos(data.memos);
        if (data.roomRanges&&data.roomRanges.length) setRoomRanges(data.roomRanges);
        if (data.banners&&data.banners.length)       setBanners(data.banners);
        if (data.customCats&&data.customCats.length)   setCustomCats(data.customCats);
        if (data.docs&&data.docs.length)               setDocs(data.docs);
        if (data.timetable&&data.timetable.length)     setTimetable(data.timetable);
        if (data.timetable2&&data.timetable2.length)    setTimetable2(data.timetable2);
        if (data.studentNotes)                          setStudentNotes(data.studentNotes);
        if (data.familyEvents)                          setFamilyEvents(data.familyEvents);
        if (data.familyCustomCats)                      setFamilyCustomCats(data.familyCustomCats);
        setSyncStatus("ok");
        setLastSynced(new Date().toLocaleTimeString("ko-KR"));
      } catch { setSyncStatus("idle"); }
    })();
  },[]);

  const saveAll = async (newE=events,newT=todos,newM=memos,newR=roomRanges,newB=banners,newCC=customCats,newD=docs,newTT=timetable,newTT2=timetable2,newSN=studentNotes,newFE=familyEvents,newFCC=familyCustomCats)=>{
    setSyncStatus("syncing");
    try {
      // Split into meta (everything except events) + events to avoid payload size issues
      const meta = {todos:newT,memos:newM,roomRanges:newR,banners:newB,customCats:newCC,docs:newD,timetable:newTT,timetable2:newTT2,studentNotes:newSN,familyEvents:newFE,familyCustomCats:newFCC};
      // Save events in chunks of 80 to avoid GAS payload limits
      const CHUNK = 80;
      if(newE.length > CHUNK) {
        for(let i=0; i<newE.length; i+=CHUNK) {
          const isLast = i+CHUNK >= newE.length;
          await fetch("/api/save",{method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({events:newE.slice(i,i+CHUNK), _evChunk:true, _evStart:i, _evTotal:newE.length, ...(isLast?meta:{})})});
        }
      } else {
        await fetch("/api/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({events:newE,...meta})});
      }
      setSyncStatus("ok");
      setLastSynced(new Date().toLocaleTimeString("ko-KR"));
    } catch { setSyncStatus("error"); }
  };

  const prevM = ()=>{ if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); };
  const nextM = ()=>{ if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); };

  const openAdd    = (date)=>{ setForm({...EMPTY_FORM,room:getAutoRoom(date,roomRanges)}); setModal({mode:"add",date}); };
  const openDetail = (e,ev)=>{ e.stopPropagation(); setModal({mode:"detail",date:ev.date,event:ev}); };
  const openEdit   = ()=>{ setForm({...modal.event}); setModal(m=>({...m,mode:"edit"})); };

  const handleSave = ()=>{
    if(!form.title.trim()) return;
    let newEvents;
    if(modal.mode==="add") newEvents=[...events,{id:Date.now(),...form,date:modal.date}];
    else newEvents=events.map(e=>e.id===modal.event.id?{...form,id:e.id}:e);
    setEvents(newEvents); saveAll(newEvents); setModal(null);
  };
  const handleDelete = ()=>{
    const newEvents=events.filter(e=>String(e.id)!==String(modal.event.id));
    setEvents(newEvents); saveAll(newEvents); setModal(null);
  };

  const handleDragStart = (id)=>{ setDragId(id); };
  const handleDragOver  = (e,targetId)=>{
    e.preventDefault();
    setDragOverId(targetId);
    if(dragId===targetId) return;
    const arr=[...events];
    const fromIdx=arr.findIndex(x=>String(x.id)===String(dragId));
    const toIdx  =arr.findIndex(x=>String(x.id)===String(targetId));
    if(fromIdx<0||toIdx<0) return;
    const [item]=arr.splice(fromIdx,1);
    arr.splice(toIdx,0,item);
    setEvents(arr);
  };
  const handleDrop = ()=>{ saveAll(events); setDragId(null); setDragOverId(null); };

  const dim = new Date(year,month+1,0).getDate();
  const fd  = new Date(year,month,1).getDay();
  const allDays = Array.from({length:dim},(_,i)=>fmtDate(year,month,i+1));
  const todayStr = fmtDate(today.getFullYear(),today.getMonth(),today.getDate());
  const getEvsFor = d=>events.filter(e=>e.date===d);
  const cells = Array(fd).fill(null).concat(allDays);
  while(cells.length%7!==0) cells.push(null);
  const weeks=[];
  for(let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7));
  const monthlyTeachingDays = useMemo(()=>countTeachingDays(allDays,events),[allDays,events]);

  const allCatColors = (cat)=>{ if(CATEGORIES[cat]) return CATEGORIES[cat].color; const cc=customCats.find(c=>c.name===cat); return cc?cc.color:"#E8E8E8"; };
  const chipBg  = ev=>ev.category==="수업"&&ev.room&&ROOM_STYLE[ev.room]?ROOM_STYLE[ev.room].bg:allCatColors(ev.category);
  const chipBdr = ev=>ev.category==="수업"&&ev.room&&ROOM_STYLE[ev.room]?ROOM_STYLE[ev.room].border:(CATEGORIES[ev.category]?.border||allCatColors(ev.category));
  const chipLabel = ev=>{
    if(ev.category==="수업") {
      const icon = ev.room?ROOM_STYLE[ev.room]?.icon||"🎵":"🎵";
      const p = ev.period?ev.period.replace("교시","")+"교시 ":"";
      const cls = ev.className||"";
      return `${icon} ${p}${cls}`.trim();
    }
    return ev.title;
  };

  const allCats = ["전체",...Object.keys(CATEGORIES),...customCats.map(c=>c.name)];
  const filteredEvents = [...events]
    .filter(e=>listFilter==="전체"||e.category===listFilter)
    .sort((a,b)=>a.date.localeCompare(b.date));

  const TABS = [{key:"calendar",label:"📅 캘린더"},{key:"list",label:"📋 전체보기"},{key:"todo",label:"✅ 할 일"},{key:"memo",label:"📝 메모"},{key:"docs",label:"📂 자료"},{key:"timetable",label:"🗓 시간표(1학기)"},{key:"timetable2",label:"🗓 시간표(2학기)"},{key:"students",label:"👥 학생"},{key:"family",label:"🌿 My Planner"}];

  return (
    <div style={{minHeight:"100vh",background:"#FDFCF8",fontFamily:"'Noto Serif KR','Apple SD Gothic Neo',serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap');
        *{box-sizing:border-box;}
        .bp{background:#3D3530;color:#FDFCF8;border:none;border-radius:8px;padding:8px 20px;cursor:pointer;font-size:14px;font-family:inherit;font-weight:700;}
        .bg{background:transparent;border:1.5px solid #ccc;border-radius:8px;padding:7px 16px;cursor:pointer;font-size:13px;font-family:inherit;color:#555;}
        .dc{height:130px;padding:6px 5px 4px;border:1px solid #EAE6DE;cursor:pointer;overflow-y:auto;overflow-x:hidden;}
        .dc::-webkit-scrollbar{width:3px;}.dc::-webkit-scrollbar-thumb{background:#DDD8CE;border-radius:3px;}
        .dc:hover{background:#F5F2EA !important;}
        .week-row{display:grid;grid-template-columns:repeat(7,1fr) 34px;grid-auto-rows:130px;}
        .ec{border-radius:4px;padding:2px 5px;font-size:10.5px;margin-top:2px;cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;border-left:3px solid;line-height:1.4;}
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
        .main-tab{padding:12px 16px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit;border-bottom:3px solid transparent;color:#aaa;transition:all 0.15s;}
        .main-tab.active{color:#3D3530;border-bottom-color:#3D3530;}
        @media(max-width:640px){.dc{height:80px;}.ec{font-size:9.5px;}.mb{padding:18px;}.wc{width:26px;min-width:26px;}}
      `}</style>

      <div style={{background:"#3D3530",color:"#FDFCF8",padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",width:"100%"}}>
        <div>
          <div style={{fontSize:11,opacity:0.5,letterSpacing:"0.12em",marginBottom:1}}>청량중학교 2026</div>
          <div style={{fontSize:17,fontWeight:700}}>📅 업무 플래너 · 김세나 선생님</div>
          <div style={{marginTop:4,fontSize:11,opacity:0.6}}>
            {syncStatus==="syncing"&&"💾 저장 중..."}
            {syncStatus==="ok"&&`✅ 저장됨 ${lastSynced}`}
            {syncStatus==="error"&&<span style={{color:"#FECACA"}}>⚠️ 저장 실패</span>}
          </div>
        </div>
        <button onClick={async()=>{await fetch("/api/logout",{method:"POST"});window.location.href="/login";}} title="로그아웃" style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,padding:"6px 12px",color:"rgba(255,255,255,0.7)",fontSize:12,cursor:"pointer",fontFamily:"inherit",flexShrink:0,marginTop:4}}>🔒 로그아웃</button>
        </div>
        <div style={{background:"#E87C3E",borderRadius:8,padding:"4px 12px",fontSize:13,fontWeight:800}}>
          📚 {month+1}월 수업일수 <span style={{fontSize:18}}>{monthlyTeachingDays}</span>일
        </div>
      </div>

      <div style={{background:"#F5F2EA",borderBottom:"1px solid #EAE6DE",padding:"8px 14px",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        {banners.map(b=>(
          <a key={b.id} href={b.url} target="_blank" rel="noreferrer" style={{background:b.color,borderRadius:6,padding:"4px 12px",fontSize:12,fontWeight:700,color:"#3D3530",textDecoration:"none",border:"1.5px solid rgba(0,0,0,0.08)"}}>🔗 {b.label}</a>
        ))}
        <button onClick={()=>setModal({mode:"banners"})} style={{background:"none",border:"1.5px dashed #ccc",borderRadius:6,padding:"4px 10px",fontSize:11,color:"#aaa",cursor:"pointer",fontFamily:"inherit"}}>+ 편집</button>
      </div>

      <div style={{background:"#FFF",borderBottom:"1px solid #EAE6DE",display:"flex",paddingLeft:8}}>
        {TABS.map(t=>(
          <button key={t.key} className={`main-tab${tab===t.key?" active":""}`} onClick={()=>setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab==="calendar" && <>
        <div style={{background:"#F5F2EA",padding:"7px 14px",display:"flex",gap:5,flexWrap:"wrap",borderBottom:"1px solid #EAE6DE",alignItems:"center"}}>
          {Object.entries(CATEGORIES).map(([k,v])=>(
            <span key={k} style={{background:v.color,borderLeft:`3px solid ${v.border}`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,color:"#3D3530"}}>{k}</span>
          ))}
          <button onClick={()=>setModal({mode:"rooms"})} style={{marginLeft:"auto",background:"#3D3530",color:"#FFF",border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>⚙️ 음악실 기간</button>
        </div>
        <div style={{padding:"12px 14px 6px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button className="nb" onClick={prevM}>‹</button>
          <h2 style={{margin:0,fontSize:21,fontWeight:700,color:"#3D3530"}}>{year}년 {month+1}월</h2>
          <button className="nb" onClick={nextM}>›</button>
        </div>
        <div style={{padding:"0 10px 14px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr) 34px",background:"#F5F2EA",borderRadius:"10px 10px 0 0",border:"1px solid #EAE6DE",borderBottom:"none"}}>
            {KO_DAYS.map((d,i)=>(
              <div key={d} style={{textAlign:"center",fontSize:14,fontWeight:800,padding:"10px 0",color:i===0?"#EF4444":i===6?"#3B82F6":"#3D3530"}}>{d}</div>
            ))}
            <div style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#E87C3E",padding:"10px 0",lineHeight:1.3}}>수업<br/>일수</div>
          </div>
          <div style={{border:"1px solid #EAE6DE",borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden"}}>
            {weeks.map((week,wi)=>{
              const weekDates=week.filter(Boolean);
              const wCount=countTeachingDays(weekDates,events);
              return (
                <div key={wi} className="week-row">
                  {week.map((d,di)=>{
                    const evs=d?getEvsFor(d):[];
                    const isT=d===todayStr;
                    const dow=di%7;
                    const isWeekend=dow===0||dow===6;
                    const inMusicRange=d&&!isWeekend&&getAutoRoom(d,roomRanges)==="음악실";
                    const eventColor=d&&!isWeekend?getCellEventColor(evs,customCats):null;
                    let cellBg="#FDFCF8";
                    if(!d||isWeekend) cellBg="#F9F7F3";
                    else if(isT) cellBg="#FFF8ED";
                    else if(eventColor) cellBg=eventColor+"55";
                    else if(inMusicRange) cellBg="rgba(255,214,224,0.30)";
                    return (
                      <div key={di} className="dc" onClick={()=>d&&openAdd(d)}
                        style={{background:cellBg,borderTop:d&&!isWeekend&&inMusicRange?"3px solid #FF9EB5":"1px solid #EAE6DE"}}>
                        {d&&<>
                          <div style={{fontSize:12,fontWeight:isT?800:500,color:isT?"#FFF":dow===0?"#EF4444":dow===6?"#3B82F6":"#3D3530",background:isT?"#E87C3E":"transparent",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:2}}>{d.slice(8)}</div>
                          {evs.map(ev=>(
                            <div key={ev.id} className="ec"
                              style={{background:chipBg(ev),borderLeftColor:chipBdr(ev),color:"#3D3530",opacity:String(ev.id)===String(dragId)?0.4:1}}
                              onClick={e=>openDetail(e,ev)}
                              draggable
                              onDragStart={()=>handleDragStart(ev.id)}
                              onDragOver={e=>handleDragOver(e,ev.id)}
                              onDrop={handleDrop}>
                              {chipLabel(ev)}
                            </div>
                          ))}
                        </>}
                      </div>
                    );
                  })}
                  <div className="wc">
                    <div style={{fontSize:15,fontWeight:800,color:wCount>0?"#E87C3E":"#ccc",lineHeight:1}}>{wCount}</div>
                    <div style={{fontSize:9,color:"#aaa"}}>일</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>}

      {tab==="list" && (
        <div style={{padding:16}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
            {allCats.map(c=>(
              <button key={c} onClick={()=>setListFilter(c)} style={{
                padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:700,border:"2px solid",
                borderColor:listFilter===c?"#3D3530":CATEGORIES[c]?.border||"#DDD8CE",
                background:listFilter===c?"#3D3530":CATEGORIES[c]?.color||customCats.find(x=>x.name===c)?.color||"#FFF",
                color:listFilter===c?"#FFF":"#333",cursor:"pointer",fontFamily:"inherit"
              }}>{c}</button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filteredEvents.length===0&&<div style={{textAlign:"center",color:"#ccc",padding:"40px 0",fontSize:14}}>일정이 없어요</div>}
            {filteredEvents.map(ev=>(
              <div key={ev.id} onClick={()=>setModal({mode:"detail",date:ev.date,event:ev})}
                style={{background:"#FFF",border:`1.5px solid ${CATEGORIES[ev.category]?.border||"#EAE6DE"}`,borderLeft:`5px solid ${CATEGORIES[ev.category]?.border||"#EAE6DE"}`,borderRadius:10,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{background:CATEGORIES[ev.category]?.color||customCats.find(c=>c.name===ev.category)?.color||"#E8E8E8",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>{ev.category}</span>
                    {ev.room&&ROOM_STYLE[ev.room]&&<span style={{fontSize:11,color:ROOM_STYLE[ev.room].textColor,fontWeight:700}}>{ROOM_STYLE[ev.room].icon}{ev.room}</span>}
                    {ev.className&&<span style={{fontSize:11,color:"#1D4ED8",fontWeight:700}}>{ev.className}</span>}
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:"#3D3530"}}>{ev.title}</div>
                  <div style={{fontSize:12,color:"#aaa",marginTop:3}}>{ev.date}{ev.period&&` · ${ev.period}`}{ev.startTime&&` · ${ev.startTime}~${ev.endTime}`}</div>
                </div>
                <div style={{fontSize:18,color:"#ccc"}}>›</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="todo" && (
        <div style={{padding:16,maxWidth:600,margin:"0 auto"}}>
          {editingTodo ? (
            <div style={{background:"#FFF",border:"1.5px solid #3D3530",borderRadius:12,padding:16,marginBottom:16}}>
              <div className="fl" style={{marginBottom:8}}>할 일 수정</div>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input className="fi" type="date" value={editingTodo.date||""} onChange={e=>setEditingTodo(t=>({...t,date:e.target.value}))} style={{flex:"0 0 140px",fontSize:13}}/>
                <input className="fi" value={editingTodo.text} onChange={e=>setEditingTodo(t=>({...t,text:e.target.value}))} style={{flex:1,fontSize:13}}/>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button className="bg" onClick={()=>setEditingTodo(null)}>취소</button>
                <button className="bp" onClick={()=>{ const n=todos.map(t=>String(t.id)===String(editingTodo.id)?editingTodo:t); setTodos(n); saveAll(events,n,memos); setEditingTodo(null); }}>저장</button>
              </div>
            </div>
          ) : (
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              <input className="fi" type="date" value={newTodoDate} onChange={e=>setNewTodoDate(e.target.value)} style={{flex:"0 0 140px",fontSize:13}}/>
              <input className="fi" style={{flex:1,fontSize:13,minWidth:120}} placeholder="할 일 입력 후 Enter" value={newTodo} onChange={e=>setNewTodo(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&newTodo.trim()){ const n=[...todos,{id:Date.now(),text:newTodo.trim(),done:false,date:newTodoDate}]; setTodos(n); saveAll(events,n,memos); setNewTodo(""); setNewTodoDate(""); }}}/>
              <button className="bp" onClick={()=>{ if(newTodo.trim()){ const n=[...todos,{id:Date.now(),text:newTodo.trim(),done:false,date:newTodoDate}]; setTodos(n); saveAll(events,n,memos); setNewTodo(""); setNewTodoDate(""); }}}>추가</button>
            </div>
          )}
          {todos.length===0&&<div style={{textAlign:"center",color:"#ccc",padding:"40px 0",fontSize:14}}>할 일이 없어요 🎉</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[...todos].filter(t=>!t.done).sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")).map(todo=>(
              <div key={todo.id} style={{display:"flex",alignItems:"center",gap:10,background:"#FFF",border:"1.5px solid #EAE6DE",borderRadius:10,padding:"12px 16px"}}>
                <button onClick={()=>{ const n=todos.map(t=>t.id===todo.id?{...t,done:true}:t); setTodos(n); saveAll(events,n,memos); }} style={{width:24,height:24,borderRadius:"50%",border:"2px solid #DDD8CE",background:"#FFF",cursor:"pointer",flexShrink:0}}></button>
                <div style={{flex:1}}>
                  {todo.date&&<div style={{fontSize:11,color:"#aaa",marginBottom:2}}>{todo.date}</div>}
                  <span style={{fontSize:14,color:"#3D3530"}}>{todo.text}</span>
                </div>
                <button onClick={()=>setEditingTodo({...todo})} style={{background:"#FEF08A",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700,color:"#92400E"}}>수정</button>
                <button onClick={()=>{ const n=todos.filter(t=>t.id!==todo.id); setTodos(n); saveAll(events,n,memos); }} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:18}}>×</button>
              </div>
            ))}
            {todos.filter(t=>t.done).length>0&&<>
              <div style={{fontSize:12,color:"#aaa",fontWeight:700,marginTop:8,paddingLeft:4}}>완료됨 ✓</div>
              {[...todos].filter(t=>t.done).sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")).map(todo=>(
                <div key={todo.id} style={{display:"flex",alignItems:"center",gap:10,background:"#F5F2EA",border:"1.5px solid #EAE6DE",borderRadius:10,padding:"12px 16px",opacity:0.65}}>
                  <button onClick={()=>{ const n=todos.map(t=>t.id===todo.id?{...t,done:false}:t); setTodos(n); saveAll(events,n,memos); }} style={{width:24,height:24,borderRadius:"50%",border:"2px solid #6EE7B7",background:"#BBF7D0",cursor:"pointer",flexShrink:0,color:"#059669",fontSize:13}}>✓</button>
                  <div style={{flex:1}}>
                    {todo.date&&<div style={{fontSize:11,color:"#aaa",marginBottom:2}}>{todo.date}</div>}
                    <span style={{fontSize:14,color:"#888",textDecoration:"line-through"}}>{todo.text}</span>
                  </div>
                  <button onClick={()=>{ const n=todos.filter(t=>t.id!==todo.id); setTodos(n); saveAll(events,n,memos); }} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:18}}>×</button>
                </div>
              ))}
              <button onClick={()=>{ const n=todos.filter(t=>!t.done); setTodos(n); saveAll(events,n,memos); }} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",alignSelf:"flex-end",marginTop:4}}>완료 항목 모두 삭제</button>
            </>}
          </div>
        </div>
      )}

      {tab==="memo" && (
        <div style={{padding:16,maxWidth:600,margin:"0 auto"}}>
          {editingMemo ? (
            <div style={{background:"#FFF",border:"1.5px solid #3D3530",borderRadius:12,padding:16,marginBottom:16}}>
              <div className="fl" style={{marginBottom:8}}>메모 수정</div>
              <div style={{marginBottom:8}}><div className="fl">날짜</div><input className="fi" type="date" value={editingMemo.date||""} onChange={e=>setEditingMemo(m=>({...m,date:e.target.value}))} style={{fontSize:13}}/></div>
              <div style={{marginBottom:8}}><div className="fl">제목</div><input className="fi" value={editingMemo.title} onChange={e=>setEditingMemo(m=>({...m,title:e.target.value}))} style={{fontSize:13}}/></div>
              <div style={{marginBottom:12}}><div className="fl">내용</div><textarea className="fi" value={editingMemo.body||""} onChange={e=>setEditingMemo(m=>({...m,body:e.target.value}))} style={{minHeight:90,fontSize:13,lineHeight:1.6}}/></div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button className="bg" onClick={()=>setEditingMemo(null)}>취소</button>
                <button className="bp" onClick={()=>{ const n=memos.map(m=>String(m.id)===String(editingMemo.id)?editingMemo:m); setMemos(n); saveAll(events,todos,n); setEditingMemo(null); }}>저장</button>
              </div>
            </div>
          ) : (
            <div style={{background:"#FFF",border:"1.5px solid #EAE6DE",borderRadius:12,padding:16,marginBottom:16}}>
              <div style={{marginBottom:8}}><div className="fl">📅 날짜 (선택)</div><input className="fi" type="date" value={memoDate} onChange={e=>setMemoDate(e.target.value)} style={{fontSize:13}}/></div>
              <div style={{marginBottom:8}}><div className="fl">제목</div><input className="fi" placeholder="메모 제목" value={memoTitle} onChange={e=>setMemoTitle(e.target.value)} style={{fontSize:13}}/></div>
              <div style={{marginBottom:12}}><div className="fl">내용</div><textarea className="fi" placeholder="자유롭게 입력하세요" value={memoBody} onChange={e=>setMemoBody(e.target.value)} style={{minHeight:90,fontSize:13,lineHeight:1.6}}/></div>
              <button className="bp" style={{width:"100%"}} onClick={()=>{ if(!memoTitle.trim()) return; const n=[{id:Date.now(),date:memoDate,title:memoTitle.trim(),body:memoBody.trim()},...memos]; setMemos(n); saveAll(events,todos,n); setMemoTitle(""); setMemoBody(""); setMemoDate(""); }}>메모 저장</button>
            </div>
          )}
          {memos.length===0&&<div style={{textAlign:"center",color:"#ccc",padding:"40px 0",fontSize:14}}>저장된 메모가 없어요</div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[...memos].sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")).map(m=>(
              <div key={m.id} style={{background:"#FFFDF5",border:"1.5px solid #FDE68A",borderRadius:12,padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>{m.date&&<div style={{fontSize:11,color:"#aaa",marginBottom:3}}>{m.date}</div>}<div style={{fontSize:15,fontWeight:700,color:"#3D3530"}}>{m.title}</div></div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>setEditingMemo({...m})} style={{background:"#FEF08A",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700,color:"#92400E"}}>수정</button>
                    <button onClick={()=>{ const n=memos.filter(x=>x.id!==m.id); setMemos(n); saveAll(events,todos,n); }} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:18}}>×</button>
                  </div>
                </div>
                {m.body&&<div style={{fontSize:13,color:"#555",marginTop:8,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{m.body}</div>}
              </div>
            ))}
          </div>
        </div>
      )}


      {tab==="docs" && (
        <div style={{padding:16,maxWidth:680,margin:"0 auto"}}>
          {editingDoc ? (
            <div style={{background:"#FFF",border:"1.5px solid #3D3530",borderRadius:12,padding:16,marginBottom:16}}>
              <div className="fl" style={{marginBottom:8}}>자료 수정</div>
              <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <select className="fi fs" value={editingDoc.category} onChange={e=>setEditingDoc(d=>({...d,category:e.target.value}))} style={{flex:"0 0 100px",fontSize:13}}>
                  {["공지","근거문서","업무매뉴얼","회의록","기타"].map(c=><option key={c}>{c}</option>)}
                </select>
                <input className="fi" type="date" value={editingDoc.date||""} onChange={e=>setEditingDoc(d=>({...d,date:e.target.value}))} style={{flex:"0 0 140px",fontSize:13}}/>
                <input className="fi" value={editingDoc.title} onChange={e=>setEditingDoc(d=>({...d,title:e.target.value}))} placeholder="제목" style={{flex:1,fontSize:13,minWidth:120}}/>
              </div>
              <div style={{marginBottom:12}}><textarea className="fi" value={editingDoc.body||""} onChange={e=>setEditingDoc(d=>({...d,body:e.target.value}))} placeholder="내용 입력" style={{minHeight:120,fontSize:13,lineHeight:1.7}}/></div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button className="bg" onClick={()=>setEditingDoc(null)}>취소</button>
                <button className="bp" onClick={()=>{ const n=docs.map(d=>String(d.id)===String(editingDoc.id)?editingDoc:d); setDocs(n); saveAll(events,todos,memos,roomRanges,banners,customCats,n); setEditingDoc(null); }}>저장</button>
              </div>
            </div>
          ) : (
            <div style={{background:"#FFF",border:"1.5px solid #EAE6DE",borderRadius:12,padding:16,marginBottom:16}}>
              <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <select className="fi fs" value={newDoc.category} onChange={e=>setNewDoc(d=>({...d,category:e.target.value}))} style={{flex:"0 0 100px",fontSize:13}}>
                  {["공지","근거문서","업무매뉴얼","회의록","기타"].map(c=><option key={c}>{c}</option>)}
                </select>
                <input className="fi" type="date" value={newDoc.date} onChange={e=>setNewDoc(d=>({...d,date:e.target.value}))} style={{flex:"0 0 140px",fontSize:13}}/>
                <input className="fi" value={newDoc.title} onChange={e=>setNewDoc(d=>({...d,title:e.target.value}))} placeholder="제목 입력" style={{flex:1,fontSize:13,minWidth:120}}/>
              </div>
              <div style={{marginBottom:12}}><textarea className="fi" value={newDoc.body} onChange={e=>setNewDoc(d=>({...d,body:e.target.value}))} placeholder="공지 내용, 근거 문서, 업무 매뉴얼 등 자유롭게 기록하세요" style={{minHeight:120,fontSize:13,lineHeight:1.7}}/></div>
              <button className="bp" style={{width:"100%"}} onClick={()=>{ if(!newDoc.title.trim()) return; const n=[{...newDoc,id:Date.now()},...docs]; setDocs(n); saveAll(events,todos,memos,roomRanges,banners,customCats,n); setNewDoc({title:"",category:"공지",date:"",body:""}); }}>저장</button>
            </div>
          )}
          {docs.length===0&&<div style={{textAlign:"center",color:"#ccc",padding:"40px 0",fontSize:14}}>저장된 자료가 없어요</div>}
          {["공지","근거문서","업무매뉴얼","회의록","기타"].map(cat=>{
            const catDocs=[...docs].filter(d=>d.category===cat).sort((a,b)=>(b.date||"0").localeCompare(a.date||"0"));
            if(catDocs.length===0) return null;
            const CAT_COLORS={공지:"#BFDBFE",근거문서:"#BBF7D0",업무매뉴얼:"#FEF08A",회의록:"#DDD6FE",기타:"#F5F2EA"};
            const CAT_BORDER={공지:"#93C5FD",근거문서:"#6EE7B7",업무매뉴얼:"#FDE047",회의록:"#C4B5FD",기타:"#DDD8CE"};
            return (
              <div key={cat} style={{marginBottom:20}}>
                <div style={{fontSize:12,fontWeight:800,color:"#3D3530",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{background:CAT_COLORS[cat],border:`1.5px solid ${CAT_BORDER[cat]}`,borderRadius:6,padding:"3px 10px"}}>{cat}</span>
                  <span style={{color:"#aaa",fontWeight:400}}>{catDocs.length}건</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {catDocs.map(d=>(
                    <div key={d.id} style={{background:"#FFF",border:`1.5px solid ${CAT_BORDER[cat]||"#EAE6DE"}`,borderLeft:`5px solid ${CAT_BORDER[cat]||"#EAE6DE"}`,borderRadius:10,padding:"12px 16px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:d.body?8:0}}>
                        <div>
                          {d.date&&<div style={{fontSize:11,color:"#aaa",marginBottom:3}}>{d.date}</div>}
                          <div style={{fontSize:14,fontWeight:700,color:"#3D3530"}}>{d.title}</div>
                        </div>
                        <div style={{display:"flex",gap:6,flexShrink:0}}>
                          <button onClick={()=>setEditingDoc({...d})} style={{background:"#FEF08A",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700,color:"#92400E"}}>수정</button>
                          <button onClick={()=>{ const n=docs.filter(x=>x.id!==d.id); setDocs(n); saveAll(events,todos,memos,roomRanges,banners,customCats,n); }} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:18}}>×</button>
                        </div>
                      </div>
                      {d.body&&<div style={{fontSize:13,color:"#555",lineHeight:1.7,whiteSpace:"pre-wrap",borderTop:"1px solid #EAE6DE",paddingTop:8}}>{d.body}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {tab==="timetable" && (() => {
        const DOW_KO = ["월","화","수","목","금"];
        const PERIODS = ["1교시","2교시","3교시","4교시","5교시","6교시","7교시"];
        const PERIOD_TIMES = {"1교시":["09:00","09:45"],"2교시":["09:55","10:40"],"3교시":["10:50","11:35"],"4교시":["11:45","12:30"],"5교시":["13:30","14:15"],"6교시":["14:25","15:10"],"7교시":["15:10","15:55"]};

        const handlePeriodChange = (p, cell) => {
          const times = PERIOD_TIMES[p] || [cell.startTime, cell.endTime];
          setEditingCell(c => ({...c, period:p, startTime:times[0], endTime:times[1]}));
        };

        const saveCell = () => {
          if(editingCell.isNew) {
            const nc = {...editingCell, id:"tt"+Date.now()};
            delete nc.isNew;
            const updated = [...timetable, nc];
            setTimetable(updated);
            saveAll(events,todos,memos,roomRanges,banners,customCats,docs,updated);
          } else {
            const updated = timetable.map(t => t.id===editingCell.id ? editingCell : t);
            setTimetable(updated);
            saveAll(events,todos,memos,roomRanges,banners,customCats,docs,updated);
          }
          setEditingCell(null);
        };

        const deleteCell = (id) => {
          const updated = timetable.filter(t => t.id !== id);
          setTimetable(updated);
          saveAll(events,todos,memos,roomRanges,banners,customCats,docs,updated);
        };

        const parseLocalDate = (s) => {
          const [y,m,d] = s.split('-').map(Number);
          return new Date(y, m-1, d); // local timezone
        };
        const fmtLocal = (d) =>
          `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        const bulkRegister = () => {
          const skipSet = new Set(ttSkipDates.split(",").map(s=>s.trim()).filter(Boolean));
          const newEvs = [];
          const startD = parseLocalDate(ttRegRange.start);
          const endD   = parseLocalDate(ttRegRange.end);
          const cur = new Date(startD);
          while(cur <= endD) {
            const jsDay = cur.getDay(); // 0=Sun,1=Mon...6=Sat
            const dow = jsDay - 1;      // 0=Mon...4=Fri, -1=Sun, 5=Sat
            const ds = fmtLocal(cur);
            if(dow >= 0 && dow <= 4 && !skipSet.has(ds)) {
              timetable.filter(t => Number(t.dow) === dow).forEach(t => {
                const exists = events.some(e =>
                  e.date===ds && e.className===t.className &&
                  e.period===t.period && e.category==="수업"
                );
                if(!exists) {
                  newEvs.push({
                    id: Date.now() + Math.floor(Math.random()*100000),
                    date: ds, title:"음악 수업", category:"수업",
                    period: t.period, className: t.className, room:"음악실",
                    subOption:"", subOptionEtc:"",
                    startTime: t.startTime, endTime: t.endTime
                  });
                }
              });
            }
            cur.setDate(cur.getDate() + 1);
          }
          if(newEvs.length === 0) {
            setBulkMsg("등록할 수업이 없어요. (이미 등록됐거나 기간 내 시간표가 비어있어요)");
            return;
          }
          const merged = [...events, ...newEvs];
          setEvents(merged);
          setBulkMsg("💾 저장 중...");
          try {
            await saveAll(merged);
            setBulkMsg(`✅ ${newEvs.length}개 수업이 달력에 등록됐어요!`);
          } catch(e) {
            setBulkMsg("⚠️ 저장 실패 - 다시 시도해 주세요");
          }
          setTimeout(()=>setBulkMsg(""), 5000);
        };

        const bulkDelete = () => {
          if(!window.confirm("이 기간의 [수업] 일정을 모두 삭제합니다. 계속하시겠어요?")) return;
          const startD = parseLocalDate(ttRegRange.start);
          const endD   = parseLocalDate(ttRegRange.end);
          const filtered = events.filter(e => {
            if(e.category !== "수업") return true;
            const ed = parseLocalDate(e.date);
            return !(ed >= startD && ed <= endD);
          });
          setEvents(filtered);
          saveAll(filtered);
          setBulkMsg("🗑 기간 내 수업이 삭제됐어요.");
          setTimeout(()=>setBulkMsg(""), 3000);
        };

        return (
          <div style={{padding:16,maxWidth:700,margin:"0 auto"}}>
            {/* 그리드 */}
            <div style={{background:"#F5F2EA",borderRadius:12,padding:12,marginBottom:16,overflowX:"auto"}}>
              <div style={{display:"grid",gridTemplateColumns:"68px repeat(5,1fr)",gap:4,minWidth:380}}>
                <div style={{background:"#3D3530",color:"#FFF",borderRadius:6,padding:"6px 4px",textAlign:"center",fontSize:12,fontWeight:700}}>교시</div>
                {DOW_KO.map(d=>(
                  <div key={d} style={{background:"#3D3530",color:"#FFF",borderRadius:6,padding:"6px 4px",textAlign:"center",fontSize:12,fontWeight:700}}>{d}요일</div>
                ))}
                {PERIODS.map(p=>(
                  <>
                    <div key={p+"label"} style={{background:"#FFF",borderRadius:6,padding:"6px 4px",textAlign:"center",fontSize:11,fontWeight:700,color:"#3D3530",alignSelf:"center"}}>
                      <div>{p}</div>
                      <div style={{fontSize:10,color:"#aaa",fontWeight:400}}>{PERIOD_TIMES[p]?.[0]||""}</div>
                    </div>
                    {[0,1,2,3,4].map(dow=>{
                      const cell = timetable.find(t=>t.dow===dow&&t.period===p);
                      return (
                        <div key={dow+p} onClick={()=>setEditingCell(cell||{dow,period:p,className:"",room:"음악실",startTime:PERIOD_TIMES[p]?.[0]||"",endTime:PERIOD_TIMES[p]?.[1]||"",isNew:true})}
                          style={{background:cell?"#BFDBFE":"#FFF",border:cell?"2px solid #93C5FD":"2px dashed #EAE6DE",borderRadius:6,padding:"6px 4px",textAlign:"center",cursor:"pointer",minHeight:52,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                          {cell ? <>
                            <div style={{fontSize:12,fontWeight:700,color:"#1D4ED8"}}>{cell.className}</div>
                            <div style={{fontSize:10,color:"#7EC8FF"}}>🎵음악실</div>
                          </> : <div style={{fontSize:16,color:"#DDD"}}>+</div>}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>

            {/* 셀 편집 모달 */}
            {editingCell && (
              <div className="mo" onClick={()=>setEditingCell(null)}>
                <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:360}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#3D3530"}}>
                      {["월","화","수","목","금"][editingCell.dow]}요일 {editingCell.period} 편집
                    </h3>
                    <button onClick={()=>setEditingCell(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#bbb"}}>×</button>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div className="fl">교시</div>
                    <select className="fi fs" value={editingCell.period} onChange={e=>handlePeriodChange(e.target.value, editingCell)}>
                      {PERIODS.map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div className="fl">반</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginTop:4}}>
                      {CLASS_LIST.map(c=>(
                        <button key={c} onClick={()=>setEditingCell(x=>({...x,className:c}))} style={{
                          padding:"6px 2px",borderRadius:8,fontSize:11,fontWeight:700,
                          border:`2px solid ${editingCell.className===c?"#3D3530":"#DDD8CE"}`,
                          background:editingCell.className===c?"#3D3530":"#FFF",
                          color:editingCell.className===c?"#FFF":"#555",
                          cursor:"pointer",fontFamily:"inherit"
                        }}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div><div className="fl">시작</div><input className="fi" type="time" value={editingCell.startTime} onChange={e=>setEditingCell(x=>({...x,startTime:e.target.value}))}/></div>
                    <div><div className="fl">종료</div><input className="fi" type="time" value={editingCell.endTime} onChange={e=>setEditingCell(x=>({...x,endTime:e.target.value}))}/></div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {!editingCell.isNew && <button onClick={()=>{deleteCell(editingCell.id);setEditingCell(null);}} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>삭제</button>}
                    <button className="bg" onClick={()=>setEditingCell(null)}>취소</button>
                    <button className="bp" style={{flex:1}} onClick={saveCell}>{editingCell.isNew?"추가":"저장"}</button>
                  </div>
                </div>
              </div>
            )}

            {/* 일괄 등록 */}
            <div style={{background:"#FFF",border:"1.5px solid #EAE6DE",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,color:"#3D3530",marginBottom:12}}>📅 달력에 일괄 등록/삭제</div>
              <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:120}}><div className="fl">시작일</div><input className="fi" type="date" value={ttRegRange.start} onChange={e=>setTtRegRange(r=>({...r,start:e.target.value}))} style={{fontSize:13}}/></div>
                <div style={{flex:1,minWidth:120}}><div className="fl">종료일</div><input className="fi" type="date" value={ttRegRange.end} onChange={e=>setTtRegRange(r=>({...r,end:e.target.value}))} style={{fontSize:13}}/></div>
              </div>
              <div style={{marginBottom:12}}>
                <div className="fl">제외할 날짜 (쉼표로 구분)</div>
                <textarea className="fi" value={ttSkipDates} onChange={e=>setTtSkipDates(e.target.value)} style={{fontSize:12,minHeight:60,lineHeight:1.6}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="bp" style={{flex:1}} onClick={bulkRegister}>📥 수업 일괄 등록</button>
                <button onClick={bulkDelete} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:8,padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>🗑 기간 수업 삭제</button>
              </div>
              {bulkMsg && <div style={{marginTop:10,background:bulkMsg.startsWith("✅")?"#BBF7D0":bulkMsg.startsWith("🗑")?"#FEE2E2":"#FEF08A",borderRadius:8,padding:"10px 14px",fontSize:13,fontWeight:700,color:"#3D3530"}}>{bulkMsg}</div>}
            </div>
            <div style={{fontSize:11,color:"#aaa",lineHeight:1.7,padding:"0 4px"}}>
              💡 셀 클릭해서 반·교시 수정 | + 클릭해서 새 수업 추가<br/>
              💡 일괄 등록은 중복 체크 후 추가됩니다
            </div>
          </div>
        );
      })()}


      {tab==="timetable2" && (() => {
        const DOW_KO = ["월","화","수","목","금"];
        const PERIODS = ["1교시","2교시","3교시","4교시","5교시","6교시","7교시"];
        const PERIOD_TIMES = {"1교시":["09:00","09:45"],"2교시":["09:55","10:40"],"3교시":["10:50","11:35"],"4교시":["11:45","12:30"],"5교시":["13:30","14:15"],"6교시":["14:25","15:10"],"7교시":["15:10","15:55"]};

        const handlePeriodChange = (p, cell) => {
          const times = PERIOD_TIMES[p] || [cell.startTime, cell.endTime];
          setEditingCell2(c => ({...c, period:p, startTime:times[0], endTime:times[1]}));
        };

        const saveCell = () => {
          if(editingCell2.isNew) {
            const nc = {...editingCell2, id:"tt"+Date.now()};
            delete nc.isNew;
            const updated = [...timetable2, nc];
            setTimetable2(updated);
            saveAll(events,todos,memos,roomRanges,banners,customCats,docs,timetable,updated);
          } else {
            const updated = timetable2.map(t => t.id===editingCell2.id ? editingCell : t);
            setTimetable2(updated);
            saveAll(events,todos,memos,roomRanges,banners,customCats,docs,timetable,updated);
          }
          setEditingCell2(null);
        };

        const deleteCell = (id) => {
          const updated = timetable2.filter(t => t.id !== id);
          setTimetable2(updated);
          saveAll(events,todos,memos,roomRanges,banners,customCats,docs,timetable,updated);
        };

        const parseLocalDate = (s) => {
          const [y,m,d] = s.split('-').map(Number);
          return new Date(y, m-1, d); // local timezone
        };
        const fmtLocal = (d) =>
          `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        const bulkRegister = () => {
          const skipSet = new Set(ttSkipDates2.split(",").map(s=>s.trim()).filter(Boolean));
          const newEvs = [];
          const startD = parseLocalDate(ttRegRange2.start);
          const endD   = parseLocalDate(ttRegRange2.end);
          const cur = new Date(startD);
          while(cur <= endD) {
            const jsDay = cur.getDay(); // 0=Sun,1=Mon...6=Sat
            const dow = jsDay - 1;      // 0=Mon...4=Fri, -1=Sun, 5=Sat
            const ds = fmtLocal(cur);
            if(dow >= 0 && dow <= 4 && !skipSet.has(ds)) {
              timetable2.filter(t => Number(t.dow) === dow).forEach(t => {
                const exists = events.some(e =>
                  e.date===ds && e.className===t.className &&
                  e.period===t.period && e.category==="수업"
                );
                if(!exists) {
                  newEvs.push({
                    id: Date.now() + Math.floor(Math.random()*100000),
                    date: ds, title:"음악 수업", category:"수업",
                    period: t.period, className: t.className, room:"음악실",
                    subOption:"", subOptionEtc:"",
                    startTime: t.startTime, endTime: t.endTime
                  });
                }
              });
            }
            cur.setDate(cur.getDate() + 1);
          }
          if(newEvs.length === 0) {
            setBulkMsg2("등록할 수업이 없어요. (이미 등록됐거나 기간 내 시간표가 비어있어요)");
            return;
          }
          const merged = [...events, ...newEvs];
          setEvents(merged);
          saveAll(merged);
          setBulkMsg2(`✅ ${newEvs.length}개 수업이 달력에 등록됐어요!`);
          setTimeout(()=>setBulkMsg2(""), 4000);
        };

        const bulkDelete = () => {
          if(!window.confirm("이 기간의 [수업] 일정을 모두 삭제합니다. 계속하시겠어요?")) return;
          const startD = parseLocalDate(ttRegRange2.start);
          const endD   = parseLocalDate(ttRegRange2.end);
          const filtered = events.filter(e => {
            if(e.category !== "수업") return true;
            const ed = parseLocalDate(e.date);
            return !(ed >= startD && ed <= endD);
          });
          setEvents(filtered);
          saveAll(filtered);
          setBulkMsg2("🗑 기간 내 수업이 삭제됐어요.");
          setTimeout(()=>setBulkMsg2(""), 3000);
        };

        return (
          <div style={{padding:16,maxWidth:700,margin:"0 auto"}}>
            {/* 그리드 */}
            <div style={{background:"#F5F2EA",borderRadius:12,padding:12,marginBottom:16,overflowX:"auto"}}>
              <div style={{display:"grid",gridTemplateColumns:"68px repeat(5,1fr)",gap:4,minWidth:380}}>
                <div style={{background:"#3D3530",color:"#FFF",borderRadius:6,padding:"6px 4px",textAlign:"center",fontSize:12,fontWeight:700}}>교시</div>
                {DOW_KO.map(d=>(
                  <div key={d} style={{background:"#3D3530",color:"#FFF",borderRadius:6,padding:"6px 4px",textAlign:"center",fontSize:12,fontWeight:700}}>{d}요일</div>
                ))}
                {PERIODS.map(p=>(
                  <>
                    <div key={p+"label"} style={{background:"#FFF",borderRadius:6,padding:"6px 4px",textAlign:"center",fontSize:11,fontWeight:700,color:"#3D3530",alignSelf:"center"}}>
                      <div>{p}</div>
                      <div style={{fontSize:10,color:"#aaa",fontWeight:400}}>{PERIOD_TIMES[p]?.[0]||""}</div>
                    </div>
                    {[0,1,2,3,4].map(dow=>{
                      const cell = timetable2.find(t=>t.dow===dow&&t.period===p);
                      return (
                        <div key={dow+p} onClick={()=>setEditingCell2(cell||{dow,period:p,className:"",room:"음악실",startTime:PERIOD_TIMES[p]?.[0]||"",endTime:PERIOD_TIMES[p]?.[1]||"",isNew:true})}
                          style={{background:cell?"#BFDBFE":"#FFF",border:cell?"2px solid #93C5FD":"2px dashed #EAE6DE",borderRadius:6,padding:"6px 4px",textAlign:"center",cursor:"pointer",minHeight:52,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                          {cell ? <>
                            <div style={{fontSize:12,fontWeight:700,color:"#1D4ED8"}}>{cell.className}</div>
                            <div style={{fontSize:10,color:"#7EC8FF"}}>🎵음악실</div>
                          </> : <div style={{fontSize:16,color:"#DDD"}}>+</div>}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>

            {/* 셀 편집 모달 */}
            {editingCell2 && (
              <div className="mo" onClick={()=>setEditingCell2(null)}>
                <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:360}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#3D3530"}}>
                      {["월","화","수","목","금"][editingCell2.dow]}요일 {editingCell2.period} 편집
                    </h3>
                    <button onClick={()=>setEditingCell2(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#bbb"}}>×</button>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div className="fl">교시</div>
                    <select className="fi fs" value={editingCell2.period} onChange={e=>handlePeriodChange(e.target.value, editingCell)}>
                      {PERIODS.map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div className="fl">반</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginTop:4}}>
                      {CLASS_LIST.map(c=>(
                        <button key={c} onClick={()=>setEditingCell2(x=>({...x,className:c}))} style={{
                          padding:"6px 2px",borderRadius:8,fontSize:11,fontWeight:700,
                          border:`2px solid ${editingCell2.className===c?"#3D3530":"#DDD8CE"}`,
                          background:editingCell2.className===c?"#3D3530":"#FFF",
                          color:editingCell2.className===c?"#FFF":"#555",
                          cursor:"pointer",fontFamily:"inherit"
                        }}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div><div className="fl">시작</div><input className="fi" type="time" value={editingCell2.startTime} onChange={e=>setEditingCell2(x=>({...x,startTime:e.target.value}))}/></div>
                    <div><div className="fl">종료</div><input className="fi" type="time" value={editingCell2.endTime} onChange={e=>setEditingCell2(x=>({...x,endTime:e.target.value}))}/></div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {!editingCell2.isNew && <button onClick={()=>{deleteCell(editingCell2.id);setEditingCell2(null);}} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>삭제</button>}
                    <button className="bg" onClick={()=>setEditingCell2(null)}>취소</button>
                    <button className="bp" style={{flex:1}} onClick={saveCell}>{editingCell2.isNew?"추가":"저장"}</button>
                  </div>
                </div>
              </div>
            )}

            {/* 일괄 등록 */}
            <div style={{background:"#FFF",border:"1.5px solid #EAE6DE",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,color:"#3D3530",marginBottom:12}}>📅 달력에 일괄 등록/삭제</div>
              <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:120}}><div className="fl">시작일</div><input className="fi" type="date" value={ttRegRange2.start} onChange={e=>setTtRegRange2(r=>({...r,start:e.target.value}))} style={{fontSize:13}}/></div>
                <div style={{flex:1,minWidth:120}}><div className="fl">종료일</div><input className="fi" type="date" value={ttRegRange2.end} onChange={e=>setTtRegRange2(r=>({...r,end:e.target.value}))} style={{fontSize:13}}/></div>
              </div>
              <div style={{marginBottom:12}}>
                <div className="fl">제외할 날짜 (쉼표로 구분)</div>
                <textarea className="fi" value={ttSkipDates2} onChange={e=>setTtSkipDates2(e.target.value)} style={{fontSize:12,minHeight:60,lineHeight:1.6}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="bp" style={{flex:1}} onClick={bulkRegister}>📥 수업 일괄 등록</button>
                <button onClick={bulkDelete} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:8,padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>🗑 기간 수업 삭제</button>
              </div>
              {bulkMsg2 && <div style={{marginTop:10,background:bulkMsg2.startsWith("✅")?"#BBF7D0":bulkMsg2.startsWith("🗑")?"#FEE2E2":"#FEF08A",borderRadius:8,padding:"10px 14px",fontSize:13,fontWeight:700,color:"#3D3530"}}>{bulkMsg2}</div>}
            </div>
            <div style={{fontSize:11,color:"#aaa",lineHeight:1.7,padding:"0 4px"}}>
              💡 셀 클릭해서 반·교시 수정 | + 클릭해서 새 수업 추가<br/>
              💡 일괄 등록은 중복 체크 후 추가됩니다
            </div>
          </div>
        );
      })()}



      {tab==="students" && (() => {
        const CLASSES = Object.keys(STUDENTS);
        const noteKey = (cls, no) => `${cls}_${no}`;
        const getNote = (cls, no) => studentNotes[noteKey(cls, no)] || {att:"", memo:""};
        const setNote = (cls, no, field, val) => {
          const k = noteKey(cls, no);
          const updated = {...studentNotes, [k]: {...getNote(cls, no), [field]: val}};
          setStudentNotes(updated);
          saveAll(events,todos,memos,roomRanges,banners,customCats,docs,timetable,updated);
        };

        // Search across all classes
        const searchResults = stdSearch.trim() ? CLASSES.flatMap(cls =>
          STUDENTS[cls].filter(s => s.name.includes(stdSearch)).map(s => ({...s, cls}))
        ) : [];

        const detail = stdDetailKey ? (() => {
          const [cls, no] = stdDetailKey.split("__");
          const st = STUDENTS[cls]?.find(s => String(s.no)===no);
          return st ? {cls, ...st, note: getNote(cls, Number(no))} : null;
        })() : null;

        return (
          <div style={{padding:16,maxWidth:720,margin:"0 auto"}}>
            {/* Search */}
            <div style={{marginBottom:14}}>
              <input className="fi" placeholder="🔍 학생 이름 검색" value={stdSearch} onChange={e=>setStdSearch(e.target.value)} style={{fontSize:14}}/>
              {stdSearch && searchResults.length > 0 && (
                <div style={{background:"#FFF",border:"1.5px solid #EAE6DE",borderRadius:10,marginTop:6,maxHeight:240,overflowY:"auto"}}>
                  {searchResults.map(s => (
                    <div key={s.cls+s.no} onClick={()=>{setStdDetailKey(`${s.cls}__${s.no}`);setStdSearch("");setStdTab(s.cls);}}
                      style={{padding:"10px 16px",cursor:"pointer",borderBottom:"1px solid #F5F2EA",display:"flex",alignItems:"center",gap:10}}>
                      <span style={{background:CATEGORIES["수업"].color,borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{s.cls}</span>
                      <span style={{fontSize:14,fontWeight:600}}>{s.no}번 {s.name}</span>
                      {getNote(s.cls,s.no).att&&<span style={{fontSize:11,color:"#EF4444",marginLeft:"auto"}}>{getNote(s.cls,s.no).att}</span>}
                    </div>
                  ))}
                </div>
              )}
              {stdSearch && searchResults.length === 0 && (
                <div style={{color:"#aaa",fontSize:13,marginTop:8,paddingLeft:4}}>검색 결과가 없어요</div>
              )}
            </div>

            {/* Class tabs */}
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
              {CLASSES.map(cls => (
                <button key={cls} onClick={()=>{setStdTab(cls);setStdDetailKey(null);}} style={{
                  padding:"6px 10px",borderRadius:8,fontSize:12,fontWeight:700,
                  border:`2px solid ${stdTab===cls?"#3D3530":"#DDD8CE"}`,
                  background:stdTab===cls?"#3D3530":"#FFF",
                  color:stdTab===cls?"#FFF":"#555",cursor:"pointer",fontFamily:"inherit"
                }}>{cls}</button>
              ))}
            </div>

            {/* Class header */}
            {CLASS_INFO[stdTab] && (
              <div style={{background:"#F5F2EA",borderRadius:10,padding:"10px 16px",marginBottom:12,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
                <div style={{fontSize:16,fontWeight:800,color:"#3D3530"}}>{stdTab}</div>
                <div style={{fontSize:13,color:"#666"}}>담임: <b>{CLASS_INFO[stdTab].homeroom} 선생님</b></div>
                <div style={{fontSize:13,color:"#666"}}>📍 {CLASS_INFO[stdTab].location}</div>
                <div style={{fontSize:13,color:"#aaa",marginLeft:"auto"}}>{STUDENTS[stdTab]?.length || 0}명</div>
              </div>
            )}

            {/* Student list */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:8}}>
              {(STUDENTS[stdTab]||[]).map(s => {
                const note = getNote(stdTab, s.no);
                const isSelected = stdDetailKey === `${stdTab}__${s.no}`;
                return (
                  <div key={s.no} onClick={()=>setStdDetailKey(isSelected?null:`${stdTab}__${s.no}`)}
                    style={{background:isSelected?"#FFF8ED":"#FFF",border:`1.5px solid ${isSelected?"#E87C3E":"#EAE6DE"}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",transition:"all 0.15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:isSelected?10:0}}>
                      <span style={{background:"#F0EDE7",borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:700,color:"#888",flexShrink:0}}>{s.no}번</span>
                      <span style={{fontSize:14,fontWeight:700,color:"#3D3530",flex:1}}>{s.name}</span>
                      {note.att && <span style={{fontSize:11,fontWeight:700,background:note.att==="결석"?"#FECACA":note.att==="지각"?"#FEF08A":note.att==="조퇴"?"#DDD6FE":"#BBF7D0",borderRadius:5,padding:"2px 8px",color:"#333",flexShrink:0}}>{note.att}</span>}
                      {note.memo && !isSelected && <span style={{fontSize:11,color:"#aaa"}}>📝</span>}
                    </div>
                    {isSelected && (
                      <div onClick={e=>e.stopPropagation()}>
                        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                          {["","출석","지각","결석","조퇴","공결"].map(v=>(
                            <button key={v} onClick={()=>setNote(stdTab,s.no,"att",v)} style={{
                              padding:"5px 10px",borderRadius:6,fontSize:12,fontWeight:700,fontFamily:"inherit",cursor:"pointer",
                              border:`2px solid ${note.att===v?"#3D3530":"#DDD8CE"}`,
                              background:note.att===v?"#3D3530":v==="결석"?"#FECACA":v==="지각"?"#FEF08A":v==="조퇴"?"#DDD6FE":v==="공결"?"#BBF7D0":v==="출석"?"#C8E6FF":"#FFF",
                              color:note.att===v?"#FFF":"#333"
                            }}>{v||"기본"}</button>
                          ))}
                        </div>
                        <textarea className="fi" value={note.memo} onChange={e=>setNote(stdTab,s.no,"memo",e.target.value)}
                          placeholder="메모 (악기, 특이사항, 수행평가 등)" style={{fontSize:12,minHeight:60,lineHeight:1.6,resize:"vertical"}}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div style={{marginTop:16,background:"#F5F2EA",borderRadius:10,padding:"10px 16px",fontSize:12,color:"#888"}}>
              {["결석","지각","조퇴","공결"].map(att=>{
                const cnt = (STUDENTS[stdTab]||[]).filter(s=>getNote(stdTab,s.no).att===att).length;
                return cnt>0?<span key={att} style={{marginRight:14}}><b style={{color:"#3D3530"}}>{att}</b> {cnt}명</span>:null;
              })}
              <span style={{marginRight:14}}><b style={{color:"#3D3530"}}>메모있음</b> {(STUDENTS[stdTab]||[]).filter(s=>getNote(stdTab,s.no).memo).length}명</span>
            </div>
          </div>
        );
      })()}


      {tab==="family" && (() => {
        const CHILDREN = ["인서","인율","인우"];
        const allCats = (child) => [...(FAMILY_CATS[child]||[]), ...(familyCustomCats[child]||[]).map(c=>({key:c.name,color:c.color,icon:"⭐"}))];
        const getCatStyle = (child, catKey) => allCats(child).find(c=>c.key===catKey) || {color:"#EAE6DE",icon:"📌"};

        // Expand recurring events for display
        const expandEvents = (child) => {
          const base = familyEvents.filter(e=>e.child===child);
          const expanded = [];
          base.forEach(ev => {
            if(!ev.repeat || ev.repeat==="none") { expanded.push(ev); return; }
            // weekly repeat: generate for ±6 months
            const start = new Date(ev.date);
            const limit = new Date(famYear, famMonth+3, 1);
            const earliest = new Date(famYear, famMonth-3, 1);
            let d = new Date(start);
            let count = 0;
            while(d <= limit && count < 200) {
              if(d >= earliest) expanded.push({...ev, date: d.toISOString().slice(0,10), id: ev.id+"_"+d.toISOString().slice(0,10)});
              if(ev.repeat==="weekly") d.setDate(d.getDate()+7);
              else if(ev.repeat==="daily") d.setDate(d.getDate()+1);
              else break;
              count++;
            }
          });
          return expanded;
        };

        // Month view helpers
        const daysInMonth = new Date(famYear, famMonth+1, 0).getDate();
        const firstDay = new Date(famYear, famMonth, 1).getDay();
        const todayStr = today.toISOString().slice(0,10);

        // Week view helpers
        const getWeekDates = () => {
          const base = new Date(today);
          base.setDate(base.getDate() + famWeekOffset*7);
          const dow = base.getDay();
          const mon = new Date(base); mon.setDate(base.getDate() - (dow===0?6:dow-1));
          return Array.from({length:7}, (_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return d.toISOString().slice(0,10); });
        };
        const DOW_KO = ["월","화","수","목","금","토","일"];
        const weekDates = getWeekDates();

        const openAdd = (date) => {
          const cats = allCats(familyChild);
          setFamilyForm({title:"", cat:cats[0]?.key||"", startTime:"09:00", endTime:"10:00", repeat:"none", date});
          setFamilyModal({mode:"add", date});
        };
        const openEdit = (ev, e) => {
          e.stopPropagation();
          setFamilyForm({title:ev.title, cat:ev.cat, startTime:ev.startTime||"", endTime:ev.endTime||"", repeat:ev.repeat||"none", date:ev.date});
          setFamilyModal({mode:"edit", ev});
        };
        const saveEvent = () => {
          if(!familyForm.title.trim()) return;
          let updated;
          if(familyModal.mode==="add") {
            const ne = {id:"fam"+Date.now(), child:familyChild, date:familyModal.date, ...familyForm};
            updated = [...familyEvents, ne];
          } else {
            // edit base event (by original id without suffix)
            const baseId = familyModal.ev.id.split("_")[0];
            updated = familyEvents.map(e => (e.id===baseId||e.id===familyModal.ev.id) ? {...e,...familyForm,child:familyChild} : e);
          }
          setFamilyEvents(updated);
          saveAll(events,todos,memos,roomRanges,banners,customCats,docs,timetable,studentNotes,updated);
          setFamilyModal(null);
        };
        const deleteEvent = () => {
          const baseId = familyModal.ev.id.split("_")[0];
          const updated = familyEvents.filter(e => e.id!==baseId && e.id!==familyModal.ev.id);
          setFamilyEvents(updated);
          saveAll(events,todos,memos,roomRanges,banners,customCats,docs,timetable,studentNotes,updated);
          setFamilyModal(null);
        };
        const addCustomCat = () => {
          const nm = newFamCatName.trim();
          if(!nm) return;
          const updated = {...familyCustomCats, [familyChild]:[...(familyCustomCats[familyChild]||[]),{name:nm,color:newFamCatColor}]};
          setFamilyCustomCats(updated);
          saveAll(events,todos,memos,roomRanges,banners,customCats,docs,timetable,studentNotes,familyEvents,updated);
          setNewFamCatName("");
        };

        const EventChip = ({ev}) => {
          const cs = getCatStyle(familyChild, ev.cat);
          return (
            <div onClick={(e)=>openEdit(ev,e)} style={{background:cs.color,borderRadius:5,padding:"2px 6px",fontSize:11,fontWeight:700,marginBottom:2,cursor:"pointer",color:"#333",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {cs.icon} {ev.title} {ev.startTime&&<span style={{fontSize:10,opacity:0.7}}>{ev.startTime}{ev.endTime&&ev.endTime!==ev.startTime?`–${ev.endTime}`:""}</span>}
            </div>
          );
        };

        const childEvs = expandEvents(familyChild);
        const evsByDate = {};
        childEvs.forEach(ev => { if(!evsByDate[ev.date]) evsByDate[ev.date]=[]; evsByDate[ev.date].push(ev); });

        return (
          <div style={{fontFamily:"inherit"}}>
            {/* Header */}
            <div style={{background:"linear-gradient(135deg,#F0FDF4,#ECFDF5)",borderBottom:"1.5px solid #BBF7D0",padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
              <div style={{fontSize:18,fontWeight:800,color:"#166534"}}>🌿 My Planner</div>
              {/* Child tabs */}
              <div style={{display:"flex",gap:6,flex:1}}>
                {CHILDREN.map(c=>(
                  <button key={c} onClick={()=>setFamilyChild(c)} style={{padding:"6px 14px",borderRadius:20,fontSize:13,fontWeight:700,border:"none",background:familyChild===c?"#16A34A":"#FFF",color:familyChild===c?"#FFF":"#16A34A",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
                    {c==="인서"?"👦":c==="인율"?"👧":"🐥"} {c}
                  </button>
                ))}
              </div>
              {/* View toggle */}
              <div style={{display:"flex",gap:4,background:"#FFF",borderRadius:10,padding:3,boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
                {["month","week"].map(v=>(
                  <button key={v} onClick={()=>setFamilyView(v)} style={{padding:"5px 12px",borderRadius:8,border:"none",background:familyView===v?"#16A34A":"transparent",color:familyView===v?"#FFF":"#555",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    {v==="month"?"월간":"주간"}
                  </button>
                ))}
              </div>
            </div>

            {/* Category legend + add */}
            <div style={{padding:"10px 16px",background:"#F0FDF4",borderBottom:"1px solid #BBF7D0",display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
              {allCats(familyChild).map(c=>(
                <span key={c.key} style={{background:c.color,borderRadius:12,padding:"3px 10px",fontSize:11,fontWeight:700,color:"#333"}}>{c.icon} {c.key}</span>
              ))}
              <div style={{display:"flex",gap:5,marginLeft:"auto",alignItems:"center"}}>
                <input value={newFamCatName} onChange={e=>setNewFamCatName(e.target.value)} placeholder="+ 새 카테고리" style={{border:"1.5px solid #BBF7D0",borderRadius:8,padding:"4px 10px",fontSize:12,width:110,fontFamily:"inherit",outline:"none"}} onKeyDown={e=>e.key==="Enter"&&addCustomCat()}/>
                <input type="color" value={newFamCatColor} onChange={e=>setNewFamCatColor(e.target.value)} style={{width:30,height:30,border:"1.5px solid #BBF7D0",borderRadius:8,cursor:"pointer",padding:2}}/>
                <button onClick={addCustomCat} style={{background:"#16A34A",color:"#FFF",border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>추가</button>
              </div>
            </div>

            {/* Month view */}
            {familyView==="month" && (
              <div style={{padding:12}}>
                {/* Nav */}
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,justifyContent:"center"}}>
                  <button onClick={()=>{ if(famMonth===0){setFamMonth(11);setFamYear(y=>y-1);}else setFamMonth(m=>m-1); }} style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontWeight:700,color:"#16A34A",fontFamily:"inherit"}}>‹</button>
                  <span style={{fontSize:16,fontWeight:800,color:"#166534",minWidth:100,textAlign:"center"}}>{famYear}년 {famMonth+1}월</span>
                  <button onClick={()=>{ if(famMonth===11){setFamMonth(0);setFamYear(y=>y+1);}else setFamMonth(m=>m+1); }} style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontWeight:700,color:"#16A34A",fontFamily:"inherit"}}>›</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                  {["일","월","화","수","목","금","토"].map(d=>(
                    <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:d==="일"?"#EF4444":d==="토"?"#3B82F6":"#666",paddingBottom:4}}>{d}</div>
                  ))}
                  {Array.from({length:firstDay}).map((_,i)=><div key={"pre"+i}/>)}
                  {Array.from({length:daysInMonth}).map((_,i)=>{
                    const day=i+1;
                    const ds=`${famYear}-${String(famMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                    const dayEvs=evsByDate[ds]||[];
                    const isToday=ds===todayStr;
                    const dow=(new Date(ds).getDay());
                    return (
                      <div key={day} onClick={()=>openAdd(ds)} style={{minHeight:70,background:isToday?"#DCFCE7":"#FFF",border:`1.5px solid ${isToday?"#16A34A":"#E5E7EB"}`,borderRadius:8,padding:"4px 5px",cursor:"pointer",transition:"background 0.1s"}}>
                        <div style={{fontSize:12,fontWeight:isToday?800:500,color:dow===0?"#EF4444":dow===6?"#3B82F6":isToday?"#16A34A":"#555",marginBottom:2}}>{day}</div>
                        {dayEvs.slice(0,3).map(ev=><EventChip key={ev.id} ev={ev}/>)}
                        {dayEvs.length>3&&<div style={{fontSize:10,color:"#aaa"}}>+{dayEvs.length-3}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Week view */}
            {familyView==="week" && (
              <div style={{padding:12}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,justifyContent:"center"}}>
                  <button onClick={()=>setFamWeekOffset(o=>o-1)} style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontWeight:700,color:"#16A34A",fontFamily:"inherit"}}>‹</button>
                  <span style={{fontSize:14,fontWeight:800,color:"#166534"}}>{weekDates[0].slice(5).replace("-","/")} – {weekDates[6].slice(5).replace("-","/")}</span>
                  <button onClick={()=>setFamWeekOffset(o=>o+1)} style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontWeight:700,color:"#16A34A",fontFamily:"inherit"}}>›</button>
                  <button onClick={()=>setFamWeekOffset(0)} style={{background:"#16A34A",color:"#FFF",border:"none",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>이번주</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                  {weekDates.map((ds,i)=>{
                    const d=new Date(ds); const dow=d.getDay(); const day=d.getDate(); const mon=d.getMonth()+1;
                    const isToday=ds===todayStr;
                    const dayEvs=evsByDate[ds]||[];
                    return (
                      <div key={ds} style={{minHeight:120}}>
                        <div onClick={()=>openAdd(ds)} style={{textAlign:"center",padding:"6px 4px",background:isToday?"#16A34A":"#F0FDF4",borderRadius:8,marginBottom:4,cursor:"pointer"}}>
                          <div style={{fontSize:11,color:isToday?"#FFF":dow===0?"#EF4444":dow===6?"#3B82F6":"#555",fontWeight:700}}>{DOW_KO[i]}</div>
                          <div style={{fontSize:16,fontWeight:800,color:isToday?"#FFF":dow===0?"#EF4444":dow===6?"#3B82F6":"#166534"}}>{day}</div>
                          <div style={{fontSize:10,color:isToday?"rgba(255,255,255,0.7)":"#aaa"}}>{mon}월</div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:3}}>
                          {dayEvs.map(ev=><EventChip key={ev.id} ev={ev}/>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add/Edit modal */}
            {familyModal && (
              <div className="mo" onClick={()=>setFamilyModal(null)}>
                <div className="mb" onClick={e=>e.stopPropagation()} style={{maxWidth:380}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <h3 style={{margin:0,fontSize:16,fontWeight:800,color:"#166534"}}>{familyModal.mode==="add"?"일정 추가":"일정 수정"} — {familyChild}</h3>
                    <button onClick={()=>setFamilyModal(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#bbb"}}>×</button>
                  </div>
                  <div style={{marginBottom:10}}><div className="fl">제목</div><input className="fi" value={familyForm.title} onChange={e=>setFamilyForm(f=>({...f,title:e.target.value}))} placeholder="일정 이름" style={{fontSize:14}}/></div>
                  <div style={{marginBottom:10}}>
                    <div className="fl">카테고리</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
                      {allCats(familyChild).map(c=>(
                        <button key={c.key} onClick={()=>setFamilyForm(f=>({...f,cat:c.key}))} style={{padding:"6px 12px",borderRadius:20,border:`2px solid ${familyForm.cat===c.key?"#16A34A":"#DDD"}`,background:familyForm.cat===c.key?c.color:"#FFF",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#333"}}>{c.icon} {c.key}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div><div className="fl">시작</div><input className="fi" type="time" value={familyForm.startTime} onChange={e=>setFamilyForm(f=>({...f,startTime:e.target.value}))}/></div>
                    <div><div className="fl">종료</div><input className="fi" type="time" value={familyForm.endTime} onChange={e=>setFamilyForm(f=>({...f,endTime:e.target.value}))}/></div>
                  </div>
                  <div style={{marginBottom:16}}>
                    <div className="fl">반복</div>
                    <div style={{display:"flex",gap:6,marginTop:4}}>
                      {[["none","없음"],["weekly","매주"],["daily","매일"]].map(([v,l])=>(
                        <button key={v} onClick={()=>setFamilyForm(f=>({...f,repeat:v}))} style={{flex:1,padding:"7px 4px",borderRadius:8,border:`2px solid ${familyForm.repeat===v?"#16A34A":"#DDD"}`,background:familyForm.repeat===v?"#16A34A":"#FFF",color:familyForm.repeat===v?"#FFF":"#555",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {familyModal.mode==="edit"&&<button onClick={deleteEvent} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:8,padding:"10px 14px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>삭제</button>}
                    <button className="bg" onClick={()=>setFamilyModal(null)} style={{flex:1}}>취소</button>
                    <button onClick={saveEvent} style={{flex:2,background:"#16A34A",color:"#FFF",border:"none",borderRadius:10,padding:"10px 16px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{familyModal.mode==="add"?"추가":"저장"}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {modal?.mode==="add"&&(
        <div className="mo" onClick={()=>setModal(null)}>
          <div className="mb" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:700,color:"#3D3530"}}>📌 일정 추가</h3>
              <span style={{color:"#bbb",fontSize:13}}>{modal.date}</span>
            </div>
            <EventForm form={form} setForm={setForm} onSave={handleSave} onCancel={()=>setModal(null)} mode="add" selDate={modal.date} roomRanges={roomRanges} customCats={customCats} onAddCustomCat={(nc)=>{ const updated=[...customCats,nc]; setCustomCats(updated); saveAll(events,todos,memos,roomRanges,banners,updated); }}/>
          </div>
        </div>
      )}

      {modal?.mode==="edit"&&(
        <div className="mo" onClick={()=>setModal(null)}>
          <div className="mb" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:700,color:"#E87C3E"}}>✏️ 일정 수정</h3>
              <span style={{color:"#bbb",fontSize:13}}>{modal.date}</span>
            </div>
            <EventForm form={form} setForm={setForm} onSave={handleSave} onCancel={()=>setModal(null)} mode="edit" selDate={modal.date} roomRanges={roomRanges} customCats={customCats} onAddCustomCat={(nc)=>{ const updated=[...customCats,nc]; setCustomCats(updated); saveAll(events,todos,memos,roomRanges,banners,updated); }}/>
          </div>
        </div>
      )}

      {modal?.mode==="detail"&&modal.event&&(
        <div className="mo" onClick={()=>setModal(null)}>
          <div className="mb" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                  <span style={{background:CATEGORIES[modal.event.category]?.color,borderLeft:`3px solid ${CATEGORIES[modal.event.category]?.border}`,borderRadius:5,padding:"3px 10px",fontSize:12,fontWeight:700}}>{modal.event.category}</span>
                  {modal.event.room&&ROOM_STYLE[modal.event.room]&&<span style={{background:ROOM_STYLE[modal.event.room].bg,border:`1.5px solid ${ROOM_STYLE[modal.event.room].border}`,borderRadius:5,padding:"3px 10px",fontSize:12,fontWeight:700,color:ROOM_STYLE[modal.event.room].textColor}}>{ROOM_STYLE[modal.event.room].icon} {modal.event.room}</span>}
                  {modal.event.subOption&&modal.event.subOption!=="기타"&&<span style={{background:"#F0EDE7",borderRadius:5,padding:"3px 10px",fontSize:12,fontWeight:600,color:"#555"}}>{modal.event.subOption}</span>}
                  {modal.event.subOption==="기타"&&modal.event.subOptionEtc&&<span style={{background:"#F0EDE7",borderRadius:5,padding:"3px 10px",fontSize:12,fontWeight:600,color:"#555"}}>{modal.event.subOptionEtc}</span>}
                  {modal.event.className&&<span style={{background:"#BFDBFE",borderRadius:5,padding:"3px 10px",fontSize:12,fontWeight:700,color:"#1D4ED8"}}>{modal.event.className}</span>}
                </div>
                <h3 style={{margin:0,fontSize:19,fontWeight:700,color:"#3D3530"}}>{modal.event.title}</h3>
              </div>
              <button onClick={()=>setModal(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#bbb",flexShrink:0}}>×</button>
            </div>
            <div style={{background:"#F5F2EA",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",gap:16,flexWrap:"wrap"}}>
              <div><div style={{fontSize:11,color:"#aaa",marginBottom:2}}>날짜</div><div style={{fontSize:13,fontWeight:600}}>{modal.event.date}</div></div>
              {modal.event.period&&modal.event.period!=="직접 입력"&&PERIOD_CATS.includes(modal.event.category)&&<div><div style={{fontSize:11,color:"#aaa",marginBottom:2}}>교시</div><div style={{fontSize:13,fontWeight:600}}>{modal.event.period}</div></div>}
              {modal.event.startTime&&<div><div style={{fontSize:11,color:"#aaa",marginBottom:2}}>시간</div><div style={{fontSize:13,fontWeight:600}}>{modal.event.startTime}~{modal.event.endTime}</div></div>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={handleDelete} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:8,padding:"10px 16px",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>🗑 삭제</button>
              <button onClick={openEdit} style={{background:"#FEF08A",color:"#92400E",border:"none",borderRadius:8,padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",flex:1}}>✏️ 수정</button>
            </div>
          </div>
        </div>
      )}

      {modal?.mode==="rooms"&&(
        <RoomRangeEditor ranges={roomRanges} onChange={r=>{setRoomRanges(r);saveAll(events,todos,memos,r);}} onClose={()=>setModal(null)}/>
      )}

      {modal?.mode==="banners"&&(
        <BannerEditor banners={banners} onChange={b=>{setBanners(b);saveAll(events,todos,memos,roomRanges,b);}} onClose={()=>setModal(null)}/>
      )}

      <div style={{background:"#F5F2EA",borderTop:"1px solid #EAE6DE",padding:"9px 14px"}}>
        <div style={{fontSize:11,color:"#bbb",marginBottom:5,fontWeight:700}}>청량중학교 2026 시정표</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
          {SCHOOL_SCHEDULE.filter(s=>s.start).map(s=>(
            <div key={s.period} style={{background:"#BFDBFE",borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:600,color:"#1D4ED8",whiteSpace:"nowrap"}}>{s.period} {s.start}–{s.end}</div>
          ))}
        </div>
        <div style={{fontSize:11,color:"#bbb",marginBottom:5,fontWeight:700}}>방과후</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          <div style={{background:"#DDD6FE",borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:600,color:"#5B21B6",whiteSpace:"nowrap"}}>방과후 15:30–17:00</div>
        </div>
      </div>
    </div>
  );
}
