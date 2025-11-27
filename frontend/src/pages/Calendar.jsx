import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

const STATUS_COLOR_MAP = {
  active: "#f59e0b",     // 進行中（黄）
  completed: "#22c55e",  // 完了（緑）
  urgent: "#ef4444",     // 締切間近（赤）
};

const Calendar = () => {
  const STORAGE_KEY = "calendar_events";
  const COLOR_OPTIONS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"];
  const PRIORITY_OPTIONS = ["high", "medium", "low"];
  const STATUS_OPTIONS = ["active", "completed"];
  const COLOR_MAP = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState({ open: false, event: null, isNew: false });
  const [currentDate, setCurrentDate] = useState("2025-10-01");
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");

  // 初回レンダリング時にタスク読み込み & localStorage マージ
  useEffect(() => {
    const mockTasks = [
      { id: 1, title: "要件定義書の作成", dueDate: "2025-11-05", priority: "high", status: "active" },
      { id: 2, title: "クライアント確認ミーティング", dueDate: "2025-11-02", priority: "high", status: "completed" },
      { id: 3, title: "設計レビュー準備", dueDate: "2025-11-12", priority: "medium", status: "active" },
      { id: 4, title: "資料修正作業", dueDate: "2025-11-08", priority: "medium", status: "completed" },
      { id: 5, title: "ドキュメント整理", dueDate: "2025-11-20", priority: "low", status: "active" },
      { id: 6, title: "バックアップ確認", dueDate: "2025-11-01", priority: "low", status: "completed" },
    ];

    const taskEvents = mockTasks.map((t) => ({
      id: t.id,
      title: t.title,
      start: t.dueDate + "T09:00",
      end: t.dueDate + "T10:00",
      color: STATUS_COLOR_MAP[t.status] || "#3b82f6",
      allDay: false,
      priority: t.priority,
      status: t.status,
    }));

    const storedEvents = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const combined = [...taskEvents, ...storedEvents];
    const unique = combined.filter(
      (evt, index, self) => index === self.findIndex((e) => e.id === evt.id)
    );
    setEvents(unique);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (calendarRef.current) calendarRef.current.getApi().updateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const addNotification = (text) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 3000);
  };

  const saveEvents = (newEvents, actionText) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
    setEvents(newEvents);
    addNotification(actionText);
  };

  const openModal = (event = null, isNew = false) => setModal({ open: true, event, isNew });
  const closeModal = () => setModal({ open: false, event: null, isNew: false });

  const handleSave = (evt) => {
    const newEvent = {
      ...evt,
      color: STATUS_COLOR_MAP[evt.status] || "#3b82f6",
    };
    const updatedEvents = modal.isNew ? [...events, newEvent] : events.map((e) => (e.id === newEvent.id ? newEvent : e));
    saveEvents(updatedEvents, modal.isNew ? "イベントを追加しました 📝" : "イベントを保存しました 💾");
    closeModal();
  };

  const handleDelete = () => {
    if (!window.confirm("本当に削除しますか？")) return;
    saveEvents(events.filter((e) => e.id !== modal.event.id), "イベントが削除されました 🗑️");
    closeModal();
  };

  const formatDateJP = (date) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const goPrev = () => { const api = calendarRef.current.getApi(); api.prev(); setCurrentDate(api.getDate().toISOString()); };
  const goNext = () => { const api = calendarRef.current.getApi(); api.next(); setCurrentDate(api.getDate().toISOString()); };
  const goToday = () => { const api = calendarRef.current.getApi(); api.today(); setCurrentDate(api.getDate().toISOString()); };

  return (
    <div className="max-w-6xl mx-auto min-h-screen bg-gray-50 py-8 relative flex gap-6">
      <style>
        {`.today-circle { background-color: white !important; border: 3px solid #3b82f6 !important; border-radius: 50% !important; box-sizing: border-box !important; }`}
      </style>

      {/* サイドパネル */}
      <div className="w-64 bg-white rounded-xl shadow-md p-4 flex-shrink-0">
        <h2 className="text-lg font-semibold mb-4">タスク一覧</h2>

        {/* フィルター */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: "🔵 すべて", value: "all" },
            { label: "🟡 進行中", value: "active" },
            { label: "🟢 完了", value: "completed" },
            { label: "🔴 締め切り間近", value: "urgent" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-2 py-1 rounded-full text-sm ${filter === f.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* タスク一覧 */}
        <div className="space-y-2 max-h-[80vh] overflow-y-auto">
          {events
            .filter((e) => {
              if (filter === "all") return true;
              if (filter === "urgent") {
                const due = new Date(e.start.split("T")[0]);
                const today = new Date();
                const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 3;
              }
              return e.status === filter;
            })
            .sort((a, b) => {
              const priorityOrder = { high: 1, medium: 2, low: 3 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
            .map((e) => (
              <div
                key={e.id}
                className="p-2 rounded-md cursor-pointer flex items-center justify-between hover:bg-gray-100 transition"
                onClick={() => openModal(e)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }}></span>
                  <div>
                    <p className={`text-sm font-medium ${e.status === "completed" ? "line-through text-gray-400" : ""}`}>{e.title}</p>
                    <p className="text-xs text-gray-500">{e.start.split("T")[0]}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    e.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : e.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {e.priority === "high" ? "高" : e.priority === "medium" ? "中" : "低"}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* カレンダー */}
      <div className="flex-1 bg-white rounded-xl shadow-md p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          locale="en"
          firstDay={0}
          headerToolbar={{ left: "title", center: "", right: "prev,next today" }}
          selectable
          editable
          events={events.map((e) => ({
            ...e,
            backgroundColor: e.color || "#3b82f6",
            borderColor: e.color || "#3b82f6",
            textColor: "#fff",
          }))}
          dayCellClassNames={(arg) => (arg.isToday ? ["today-circle"] : [])}
          eventContent={(arg) => (
            <div
              className={`whitespace-normal text-sm ${arg.event.extendedProps.status === "completed" ? "line-through" : ""}`}
              style={{ color: "white" }}
            >
              {!arg.event.allDay && <span className="font-bold mr-1">{arg.timeText}</span>}
              <span>{arg.event.title}</span>
            </div>
          )}
          select={(info) => {
            const allDay = info.allDay;
            const startStr = formatDateJP(info.start) + (allDay ? "T00:00" : "T09:00");
            const endStr = allDay ? formatDateJP(info.end) + "T00:00" : formatDateJP(info.end) + "T10:00";
            openModal({ id: String(Date.now()), title: "", start: startStr, end: endStr, color: "#3b82f6", allDay }, true);
          }}
          eventClick={(info) => openModal(events.find((e) => e.id === info.event.id))}
          height="auto"
          contentHeight="auto"
        />
      </div>

      {/* 通知 */}
      <div className="fixed top-5 right-5 space-y-2 z-[2000]">
        {notifications.map((n) => (
          <div key={n.id} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg animate-slide-in">{n.text}</div>
        ))}
      </div>

      {/* モーダル */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[1000]">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-fade-in">
            <h3 className="text-xl font-semibold mb-5 text-gray-800">{modal.isNew ? "📝 新しいイベント" : "✏️ イベント編集"}</h3>
            <input
              type="text"
              placeholder="タイトルを入力..."
              value={modal.event.title}
              onChange={(e) => setModal({ ...modal, event: { ...modal.event, title: e.target.value } })}
              className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:ring-2 focus:ring-blue-400"
            />

            <label className="flex items-center gap-2 mb-3 font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={modal.event.allDay || false}
                onChange={(e) => setModal({ ...modal, event: { ...modal.event, allDay: e.target.checked } })}
              /> 終日イベント
            </label>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">開始</label>
                <input
                  type="date"
                  value={modal.event.start?.split("T")[0] || ""}
                  onChange={(e) => setModal({ ...modal, event: { ...modal.event, start: e.target.value + "T" + (modal.event.start?.split("T")[1] || "09:00") } })}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
                {!modal.event.allDay && (
                  <input
                    type="time"
                    value={modal.event.start?.split("T")[1] || "09:00"}
                    onChange={(e) => setModal({ ...modal, event: { ...modal.event, start: modal.event.start.split("T")[0] + "T" + e.target.value } })}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">終了</label>
                <input
                  type="date"
                  value={modal.event.end?.split("T")[0] || ""}
                  onChange={(e) => setModal({ ...modal, event: { ...modal.event, end: e.target.value + "T" + (modal.event.end?.split("T")[1] || "10:00") } })}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
                {!modal.event.allDay && (
                  <input
                    type="time"
                    value={modal.event.end?.split("T")[1] || "10:00"}
                    onChange={(e) => setModal({ ...modal, event: { ...modal.event, end: modal.event.end.split("T")[0] + "T" + e.target.value } })}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1"
                  />
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-gray-700">優先度</label>
              <select
                value={modal.event.priority || "medium"}
                onChange={(e) => setModal({ ...modal, event: { ...modal.event, priority: e.target.value } })}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p === "high" ? "高" : p === "medium" ? "中" : "低"}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-gray-700">ステータス</label>
              <select
                value={modal.event.status || "active"}
                onChange={(e) => setModal({ ...modal, event: { ...modal.event, status: e.target.value, color: STATUS_COLOR_MAP[e.target.value] } })}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === "active" ? "進行中" : "完了"}</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => handleSave({ ...modal.event, end: modal.event.realEnd || modal.event.end })}
                      className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700">
                {modal.isNew ? "追加" : "保存"}
              </button>
              {!modal.isNew && (
                <button onClick={handleDelete} className="bg-red-500 text-white px-5 py-2 rounded-md hover:bg-red-600">
                  削除
                </button>
              )}
              <button onClick={closeModal} className="px-5 py-2 rounded-md border border-gray-300 hover:bg-gray-100">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
