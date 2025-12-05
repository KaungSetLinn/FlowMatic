import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListUl,faPlayCircle,faCheckCircle,faExclamationCircle,}
from "@fortawesome/free-solid-svg-icons";


const STATUS_COLOR_MAP = { active: "#f59e0b", completed: "#22c55e", urgent: "#ef4444" };


const Calendar = () => {
  const STORAGE_KEY = "calendar_events";
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState({ open: false, event: null, isNew: false });
  const [modalAnimating, setModalAnimating] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortType, setSortType] = useState("dueDate"); 

  const sortFunctions = {
  dueDate: (a, b) => new Date(a.start) - new Date(b.start),
  priority: (a, b) =>
    ({ high: 1, medium: 2, low: 3 }[a.priority] -
     { high: 1, medium: 2, low: 3 }[b.priority]),
  status: (a, b) =>
    ({ active: 1, completed: 2 }[a.status] -
     { active: 1, completed: 2 }[b.status]),
};





  useEffect(() => {
    const mockTasks = [
      { id: 1, title: "要件定義書の作成", dueDate: "2025-11-05", priority: "high", status: "active" },
      { id: 2, title: "クライアント確認ミーティング", dueDate: "2025-11-02", priority: "high", status: "completed" },
      { id: 3, title: "設計レビュー準備", dueDate: "2025-11-12", priority: "medium", status: "active" },
      { id: 4, title: "資料修正作業", dueDate: "2025-11-08", priority: "medium", status: "completed" },
      { id: 5, title: "ドキュメント整理", dueDate: "2025-11-20", priority: "low", status: "active" },
      { id: 6, title: "バックアップ確認", dueDate: "2025-11-01", priority: "low", status: "completed" },
    ];
    const taskEvents = mockTasks.map(t => ({
      ...t,
      start: t.dueDate + "T09:00",
      end: t.dueDate + "T10:00",
      color: STATUS_COLOR_MAP[t.status] || "#3b82f6",
      allDay: false,
    }));
    const storedEvents = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    setEvents([...taskEvents, ...storedEvents].filter((v,i,a)=>i===a.findIndex(e=>e.id===v.id)));
  }, []);


  useEffect(() => { setTimeout(() => calendarRef.current?.getApi().updateSize(), 500); }, []);


  const addNotification = text => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };


  const saveEvents = (newEvents, msg) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents)); setEvents(newEvents); addNotification(msg); };


  const handleSave = evt => {
    const newEvent = { ...evt, color: STATUS_COLOR_MAP[evt.status] || "#3b82f6" };
    saveEvents(modal.isNew ? [...events, newEvent] : events.map(e => e.id === newEvent.id ? newEvent : e), modal.isNew ? "イベントを追加しました 📝" : "イベントを保存しました 💾");
    closeModal();
  };


  const handleDelete = () => { if(window.confirm("本当に削除しますか？")) { saveEvents(events.filter(e => e.id !== modal.event.id), "イベントが削除されました 🗑️"); closeModal(); } };


  const openModal = (event=null, isNew=false) => { setModalAnimating(true); setModal({ open:true,event,isNew }); requestAnimationFrame(()=>setModalReady(true)); };
  const closeModal = () => { setModalReady(false); setModal(prev=>({...prev,open:false})); setTimeout(()=>setModalAnimating(false),750)};


  const formatDateJP = date => { const d = new Date(date.getTime()-date.getTimezoneOffset()*60000); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };


  const filters = [
    { type:"all", label:"すべて", icon:faListUl, color:"blue" },
    { type:"active", label:"進行中", icon:faPlayCircle, color:"yellow" },
    { type:"completed", label:"完了", icon:faCheckCircle, color:"green" },
    { type:"high", label:"締め切り近い", icon:faExclamationCircle, color:"red" },
  ];


  return (
    <div className="max-w-6xl mx-auto min-h-screen bg-gray-50 py-8 relative flex flex-row-reverse gap-6">
      <style>{`
        .today-circle { background:white !important; border:3px solid #3b82f6 !important; border-radius:50% !important; box-sizing:border-box !important; }
        .fc-event,.fc-event:hover,.fc-event.fc-event-draggable { background:inherit !important;color:inherit !important; }
        .fc .fc-today-button { background:#3b82f6 !important;color:white !important;border:none !important;font-weight:bold !important;}
        .fc .fc-today-button:hover{background:#2563eb !important;}
        .fc .fc-prev-button,.fc .fc-next-button{background:#3b82f6;color:white;border:none;}
        .fc .fc-prev-button:hover,.fc .fc-next-button:hover{background:#2563eb;}
        .fc .fc-toolbar-title{font-weight:bold !important;font-size:2rem;}
        .fc .fc-col-header-cell-cushion{font-weight:bold;}
        .fc .fc-col-header-cell.fc-day-sat .fc-col-header-cell-cushion{color:#3b82f6;}
        .fc .fc-col-header-cell.fc-day-sun .fc-col-header-cell-cushion{color:#ef4444;}
        .modal-overlay{opacity:0;backdrop-filter:blur(0px);background:rgba(0,0,0,0);transition:0.45s;}
        .modal-overlay.show{opacity:1;backdrop-filter:blur(4px);background:rgba(0,0,0,0.3);}
        .modal-content{opacity:0;transform:scale(0.95);transition:0.45s;}
        .modal-content.show{opacity:1;transform:scale(1);}
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #dff3ff !important;
      `}</style>


      {/* サイドパネル */}
      <div className="w-64 bg-white rounded-xl shadow-md p-4 flex-shrink-0">
        <h2 className="text-lg font-semibold mb-4">タスク一覧</h2>
        <select
          className="w-full border rounded p-2 mb-3"
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
        >
        <option value="dueDate">期限が早い順</option>
        <option value="priority">優先度順（高 → 低）</option>
        <option value="status">ステータス順</option>
        </select>
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.map(f=>{
            const isActive = filter===f.type;
            const colorClasses = { blue: isActive?"bg-blue-600 text-white":"bg-white border border-blue-300 text-blue-600 hover:bg-blue-50", yellow: isActive?"bg-yellow-500 text-white":"bg-white border border-yellow-300 text-yellow-600 hover:bg-yellow-50", green:isActive?"bg-green-600 text-white":"bg-white border border-green-300 text-green-600 hover:bg-green-50", red:isActive?"bg-red-600 text-white":"bg-white border border-red-300 text-red-600 hover:bg-red-50"}[f.color];
            return <button key={f.type} onClick={()=>setFilter(f.type)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${colorClasses}`}><FontAwesomeIcon icon={f.icon}/> {f.label}</button>
          })}
        </div>
        <div className="space-y-2 max-h-[80vh] overflow-y-auto">
          {events.filter(e=>filter==="all"?true:filter==="urgent"?(()=>{const d=new Date(e.start.split("T")[0]),today=new Date();return Math.ceil((d-today)/(1000*60*60*24))<=3})():e.status===filter).sort(sortFunctions[sortType]).map(e=>(
            <div key={e.id} className="p-2 rounded-md cursor-pointer flex items-center justify-between hover:bg-gray-100 transition" onClick={()=>openModal(e)}>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor:e.color}}></span>
                <div>
                  <p className={`text-sm font-medium ${e.status==="completed"?"line-through text-gray-400":""}`}>{e.title}</p>
                  <p className="text-xs text-gray-500">{e.start.split("T")[0]}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${e.priority==="high"?"bg-red-100 text-red-700":e.priority==="medium"?"bg-yellow-100 text-yellow-700":"bg-green-100 text-green-700"}`}>{e.priority==="high"?"高":e.priority==="medium"?"中":"低"}</span>
            </div>
          ))}
        </div>
      </div>


      {/* カレンダー */}
      <div className="flex-1 bg-white rounded-xl shadow-md p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          locale="ja" firstDay={0} headerToolbar={{left:"title",center:"",right:"prev next today"}} selectable editable
          events={events.map(e=>({...e,backgroundColor:STATUS_COLOR_MAP[e.status]||"#3b82f6",borderColor:"transparent",textColor:"#fff",display:"block"}))}
          eventDisplay="block"
          dayCellContent={arg=>{const d=arg.date.getDay();return <div className="text-sm font-medium" style={{color:d===0?"#ef4444":d===6?"#3b82f6":"#374151"}}>{arg.date.getDate()}</div>}}
          eventContent={arg=><div className={`whitespace-normal text-sm font-semibold ${arg.event.extendedProps.status==="completed"?"line-through":""}`} style={{backgroundColor:arg.event.backgroundColor,color:arg.event.textColor,borderRadius:"4px",padding:"1px 3px"}}>{arg.event.title}</div>}
          select={info=>{const allDay=info.allDay,start=formatDateJP(info.start)+(allDay?"T00:00":"T09:00"),end=formatDateJP(info.end)+(allDay?"T00:00":"T10:00");openModal({id:String(Date.now()),title:"",start,end,color:"#3b82f6",allDay},true)}}
          eventClick={info=>openModal(events.find(e=>e.id===info.event.id))}
          height="auto" contentHeight="auto"
          eventDrop={(info) => {
            const updated = events.map(e =>
             e.id === info.event.id
              ? { ...e, start: info.event.startStr, end: info.event.endStr }
              : e
            );
            saveEvents(updated, "イベントを移動しました 🔄");
          }}
 
        />
      </div>


      {/* 通知 */}
      <div className="fixed top-5 right-5 space-y-2 z-[2000]">
        {notifications.map(n=><div key={n.id} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg animate-slide-in">{n.text}</div>)}
      </div>


      {/* モーダル */}
      {modal.open||modalAnimating ? (
        <div className={`modal-overlay fixed inset-0 flex justify-center items-center z-[3000] ${modalReady?"show":""}`} onClick={closeModal}>
          <div className={`modal-content bg-white rounded-xl p-6 w-[420px] shadow-lg max-h-[90vh] overflow-y-auto ${modalReady?"show":""}`} onClick={e=>e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">{modal.isNew?"📝 新規イベント":"✏️ イベント編集"}</h3>
            {["title","start","end","status","priority","comment"].map(field=>{
              if(field==="title") return <div key={field}><label className="text-sm text-gray-600">タイトル</label><input type="text" className="w-full p-2 border rounded" value={modal.event.title} onChange={e=>setModal(p=>({...p,event:{...p.event,title:e.target.value}}))} /></div>
              if(field==="comment") return <div key={field}><label className="text-sm text-gray-600">コメント</label><textarea className="w-full p-2 border rounded" rows={4} value={modal.event.comment||""} onChange={e=>setModal(p=>({...p,event:{...p.event,comment:e.target.value}}))}/></div>
              return <div key={field}><label className="text-sm text-gray-600">{field==="start"?"開始日":field==="end"?"終了日":field==="status"?"ステータス":"優先度"}</label>{
                field==="start"||field==="end"?<input type="datetime-local" className="w-full p-2 border rounded" value={modal.event[field]} onChange={e=>setModal(p=>({...p,event:{...p.event,[field]:e.target.value}}))}/>:
                <select className="w-full p-2 border rounded" value={modal.event[field]||(field==="status"?"active":"medium")} onChange={e=>setModal(p=>({...p,event:{...p.event,[field]:e.target.value}}))}>{field==="status"?<><option value="active">進行中</option><option value="completed">完了</option></>:<><option value="high">高</option><option value="medium">中</option><option value="low">低</option></>}</select>
              }</div>
            })}
            <div className="mt-5 flex justify-between items-center">
              {!modal.isNew && <button onClick={handleDelete} className="px-3 py-1.5 bg-red-500 text-white rounded">削除</button>}
              <div className="flex ml-auto gap-3">
                <button onClick={closeModal} className="px-3 py-1.5 bg-gray-300 rounded">キャンセル</button>
                <button onClick={()=>{
                  if(!modal.event.title.trim()){addNotification("タイトルは必須です");return;}
                  if(new Date(modal.event.end)<new Date(modal.event.start)){addNotification("終了日は開始日より後に設定してください");return;}
                  handleSave(modal.event);
                }} className="px-4 py-1.5 bg-blue-600 text-white rounded">保存</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};


export default Calendar;



