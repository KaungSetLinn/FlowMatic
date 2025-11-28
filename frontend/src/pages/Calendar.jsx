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
  const PRIORITY_OPTIONS = ["high", "medium", "low"];
  const STATUS_OPTIONS = ["active", "completed"];
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState({ open: false, event: null, isNew: false });
  const [currentDate, setCurrentDate] = useState("2025-10-01");
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");

  // ---------------------------
  // 初回レンダリング時にタスク読み込み
  // ---------------------------
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

  // カレンダーサイズ調整
  useEffect(() => {
    const timer = setTimeout(() => {
      if (calendarRef.current) calendarRef.current.getApi().updateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // ---------------------------
  // 通知
  // ---------------------------
  const addNotification = (text) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text }]);

    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      3000
    );
  };

  // ---------------------------
  // 保存
  // ---------------------------
  const saveEvents = (newEvents, actionText) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
    setEvents(newEvents);
    addNotification(actionText);
  };

  // ---------------------------
  // モーダル
  // ---------------------------
  const openModal = (event = null, isNew = false) =>
    setModal({ open: true, event, isNew });

  const closeModal = () =>
    setModal({ open: false, event: null, isNew: false });

  const handleSave = (evt) => {
    const newEvent = {
      ...evt,
      color: STATUS_COLOR_MAP[evt.status] || "#3b82f6",
    };

    const updatedEvents = modal.isNew
      ? [...events, newEvent]
      : events.map((e) => (e.id === newEvent.id ? newEvent : e));

    saveEvents(
      updatedEvents,
      modal.isNew ? "イベントを追加しました 📝" : "イベントを保存しました 💾"
    );

    closeModal();
  };

  const handleDelete = () => {
    if (!window.confirm("本当に削除しますか？")) return;

    saveEvents(
      events.filter((e) => e.id !== modal.event.id),
      "イベントが削除されました 🗑️"
    );

    closeModal();
  };

  // ---------------------------
  // 日付フォーマット
  // ---------------------------
  const formatDateJP = (date) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // ---------------------------
  // カレンダー移動
  // ---------------------------
  const goPrev = () => {
    const api = calendarRef.current.getApi();
    api.prev();
    setCurrentDate(api.getDate().toISOString());
  };

  const goNext = () => {
    const api = calendarRef.current.getApi();
    api.next();
    setCurrentDate(api.getDate().toISOString());
  };

  const goToday = () => {
    const api = calendarRef.current.getApi();
    api.today();
    setCurrentDate(api.getDate().toISOString());
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen bg-gray-50 py-8 relative flex gap-6">
      {/* カスタムスタイル */}
      <style>
        {`
          .today-circle {
            background-color: white !important;
            border: 3px solid #3b82f6 !important;
            border-radius: 50% !important;
            box-sizing: border-box !important;
          }
          .fc-event,
          .fc-event:hover,
          .fc-event.fc-event-draggable {
            background-color: inherit !important;
            border-color: inherit !important;
            color: inherit !important;
          }
        `}
      </style>

      {/* ---------------------------------
          サイドパネル
      --------------------------------- */}
      <div className="w-64 bg-white rounded-xl shadow-md p-4 flex-shrink-0">
        <h2 className="text-lg font-semibold mb-4">タスク一覧</h2>

        {/* フィルタ */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: "すべて", value: "all" },
            { label: "🟡 進行中", value: "active" },
            { label: "🟢 完了", value: "completed" },
            { label: "🔴 締め切り間近", value: "urgent" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-2 py-1 rounded-full text-sm ${
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
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
                const diffDays = Math.ceil(
                  (due - today) / (1000 * 60 * 60 * 24)
                );
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
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: e.color }}
                  ></span>

                  <div>
                    <p
                      className={`text-sm font-medium ${
                        e.status === "completed"
                          ? "line-through text-gray-400"
                          : ""
                      }`}
                    >
                      {e.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {e.start.split("T")[0]}
                    </p>
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
                  {e.priority === "high"
                    ? "高"
                    : e.priority === "medium"
                    ? "中"
                    : "低"}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* ---------------------------------
          カレンダー本体
      --------------------------------- */}
      <div className="flex-1 bg-white rounded-xl shadow-md p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          locale="en"
          firstDay={0}
          headerToolbar={{
            left: "title",
            center: "",
            right: "prev next today",
          }}
          selectable
          editable
          events={events.map((e) => ({
            ...e,
            backgroundColor: STATUS_COLOR_MAP[e.status] || "#3b82f6",
            borderColor: "transparent",
            textColor: "#fff",
            display: "block",
          }))}
          eventDisplay="block"
          dayCellClassNames={(arg) =>
            arg.isToday ? ["today-circle"] : []
          }
          eventContent={(arg) => (
            <div
              className={`whitespace-normal text-sm font-semibold ${
                arg.event.extendedProps.status === "completed"
                  ? "line-through"
                  : ""
              }`}
              style={{
                backgroundColor: arg.event.backgroundColor,
                color: arg.event.textColor,
                borderRadius: "4px",
                padding: "1px 3px",
              }}
            >
              {arg.event.title}
            </div>
          )}
          select={(info) => {
            const allDay = info.allDay;
            const startStr =
              formatDateJP(info.start) + (allDay ? "T00:00" : "T09:00");
            const endStr =
              formatDateJP(info.end) + (allDay ? "T00:00" : "T10:00");

            openModal(
              {
                id: String(Date.now()),
                title: "",
                start: startStr,
                end: endStr,
                color: "#3b82f6",
                allDay,
              },
              true
            );
          }}
          eventClick={(info) =>
            openModal(events.find((e) => e.id === info.event.id))
          }
          height="auto"
          contentHeight="auto"
        />
      </div>

      {/* ---------------------------------
          通知
      --------------------------------- */}
      <div className="fixed top-5 right-5 space-y-2 z-[2000]">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg animate-slide-in"
          >
            {n.text}
          </div>
        ))}
      </div>

      
      
    </div>
  );
};

export default Calendar;
