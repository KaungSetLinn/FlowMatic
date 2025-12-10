// Calendar.jsx
import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faListUl,
  faPlayCircle,
  faCheckCircle,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { getTasks } from "../services/TaskService";
import { useProject } from "../context/ProjectContext";

const STATUS_COLOR_MAP = {
  active: "#f59e0b",
  completed: "#22c55e",
  urgent: "#ef4444",
};

// Map API status to Calendar status
const mapStatusToCalendar = (apiStatus) => {
  const statusMap = {
    done: "completed",
    testing: "completed",
    in_review: "active",
    in_progress: "active",
    pending: "active",
    todo: "active",
  };
  return statusMap[apiStatus] || "active";
};

// Map API task to Calendar task format
const mapTaskToCalendarFormat = (apiTask) => {
  return {
    id: apiTask.task_id,
    title: apiTask.name,
    dueDate: apiTask.deadline,
    status: mapStatusToCalendar(apiTask.status),
    priority: apiTask.priority,
    description: apiTask.description,
    startDate: apiTask.start_date,
    assignedUsers: apiTask.assigned_user_ids,
    parentTasks: apiTask.parent_tasks,
  };
};

const Calendar = () => {
  const STORAGE_KEY = "calendar_events";
  const calendarRef = useRef(null);
  const { currentProject } = useProject();
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    open: false,
    event: null,
    isNew: false,
  });
  const [modalAnimating, setModalAnimating] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortType, setSortType] = useState("dueDate");
  const [showDetail, setShowDetail] = useState(false);

  // Fetch tasks from API using TaskService
  const fetchTasks = async () => {
    if (!currentProject?.project_id) return;

    try {
      setLoading(true);
      const fetchedTasks = await getTasks(currentProject.project_id);
      const mappedTasks = fetchedTasks.map(mapTaskToCalendarFormat);
      setTasks(mappedTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      addNotification("タスクの取得に失敗しました ⚠️");
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks when currentProject changes
  useEffect(() => {
    fetchTasks();
  }, [currentProject?.project_id]);

  // Merge tasks with manually created events
  useEffect(() => {
    // Load manual events from localStorage (exclude task source)
    let stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    stored = stored.filter((e) => e.source !== "task");

    // Convert tasks to calendar events
    const taskEvents = tasks.map((task) => {
      const date = new Date(task.dueDate);
      const start = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      return {
        id: `task-${task.id}`,
        title: task.title,
        start,
        end: start,
        allDay: true,
        status: task.status,
        priority: task.priority,
        color: STATUS_COLOR_MAP[task.status] || "#3b82f6",
        source: "task",
      };
    });

    const mergedEvents = [...stored, ...taskEvents];
    setEvents(mergedEvents);
  }, [tasks]);

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
    setTimeout(() => calendarRef.current?.getApi().updateSize(), 500);
  }, []);

  const addNotification = (text) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      3000
    );
  };

  const saveEvents = (newEvents, msg) => {
    const userEvents = newEvents.filter((e) => e.source !== "task");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userEvents));
    setEvents(newEvents);
    addNotification(msg);
  };

  const handleSave = (evt) => {
    if (evt.allDay) {
      evt.start = evt.start.split("T")[0];
      evt.end = evt.end.split("T")[0];
    }
    const newEvent = {
      ...evt,
      color: STATUS_COLOR_MAP[evt.status] || "#3b82f6",
    };
    saveEvents(
      modal.isNew
        ? [...events, newEvent]
        : events.map((e) => (e.id === newEvent.id ? newEvent : e)),
      modal.isNew ? "イベントを追加しました 📝" : "イベントを保存しました 💾"
    );
    closeModal();
  };

  const handleDelete = () => {
    if (window.confirm("本当に削除しますか?")) {
      saveEvents(
        events.filter((e) => e.id !== modal.event.id),
        "イベントが削除されました 🗑️"
      );
      closeModal();
    }
  };

  const openModal = (event = null, isNew = false) => {
    setModalAnimating(true);
    setModal({ open: true, event, isNew });
    requestAnimationFrame(() => setModalReady(true));
  };

  const closeModal = () => {
    setModalReady(false);
    setModal((prev) => ({ ...prev, open: false }));
    setTimeout(() => setModalAnimating(false), 300);
  };

  const formatDateJP = (date) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const filters = [
    { type: "all", label: "すべて", icon: faListUl, color: "blue" },
    { type: "active", label: "進行中", icon: faPlayCircle, color: "yellow" },
    { type: "completed", label: "完了", icon: faCheckCircle, color: "green" },
    {
      type: "high",
      label: "締め切り近い",
      icon: faExclamationCircle,
      color: "red",
    },
  ];

  const updateEvent = (field, value) =>
    setModal((p) => ({ ...p, event: { ...p.event, [field]: value } }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-gray-50 py-8 relative flex flex-row-reverse gap-6">
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
        .modal-overlay{opacity:0;backdrop-filter:blur(0px);background:rgba(0,0,0,0);transition:0.2s;}
        .modal-overlay.show{opacity:1;backdrop-filter:blur(4px);background:rgba(0,0,0,0.3);}
        .modal-content{opacity:0;transform:scale(0.95);transition:0.2s;}
        .modal-content.show{opacity:1;transform:scale(1);}
        .fc .fc-daygrid-day.fc-day-today { background-color: #dff3ff !important; }
      `}</style>

      {/* サイドパネル */}
      <div className="w-80 bg-white rounded-xl shadow-md p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">タスク一覧</h2>
          <button
            onClick={fetchTasks}
            className="text-blue-600 cursor-pointer hover:text-blue-700 text-xl"
            title="再読み込み"
          >
            🔄
          </button>
        </div>
        <select
          className="w-full border rounded p-2 mb-3"
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
        >
          <option value="dueDate">期限が早い順</option>
          <option value="priority">優先度順(高 → 低)</option>
          <option value="status">ステータス順</option>
        </select>
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.map((f) => {
            const isActive = filter === f.type;
            const colorClasses = {
              blue: isActive
                ? "bg-blue-600 text-white"
                : "bg-white border border-blue-300 text-blue-600 hover:bg-blue-50",
              yellow: isActive
                ? "bg-yellow-500 text-white"
                : "bg-white border border-yellow-300 text-yellow-600 hover:bg-yellow-50",
              green: isActive
                ? "bg-green-600 text-white"
                : "bg-white border border-green-300 text-green-600 hover:bg-green-50",
              red: isActive
                ? "bg-red-600 text-white"
                : "bg-white border border-red-300 text-red-600 hover:bg-red-50",
            }[f.color];
            return (
              <button
                key={f.type}
                onClick={() => setFilter(f.type)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${colorClasses}`}
              >
                <FontAwesomeIcon icon={f.icon} /> {f.label}
              </button>
            );
          })}
        </div>
        <div className="space-y-2 max-h-[80vh] overflow-y-auto">
          {events
            .filter((e) =>
              filter === "all"
                ? true
                : filter === "high"
                ? new Date(e.start) - new Date() <= 3 * 24 * 60 * 60 * 1000
                : e.status === filter
            )
            .sort(sortFunctions[sortType])
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
                      className={`text-lg font-bold ${
                        e.status === "completed"
                          ? "line-through text-gray-400"
                          : ""
                      }`}
                    >
                      {e.title}
                    </p>
                    <p className="text-sm text-gray-700">
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

      {/* カレンダー */}
      <div className="flex-1 bg-white rounded-xl shadow-md p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          locale="ja"
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
            backgroundColor: e.color,
            borderColor: "transparent",
            textColor: "#fff",
          }))}
          eventDisplay="block"
          dayCellContent={(arg) => {
            const d = arg.date.getDay();
            return (
              <div
                className="text-sm font-medium"
                style={{
                  color: d === 0 ? "#ef4444" : d === 6 ? "#3b82f6" : "#374151",
                }}
              >
                {arg.date.getDate()}
              </div>
            );
          }}
          eventContent={(arg) => (
            <div
              className={`whitespace-normal text-sm font-semibold ${
                arg.event.extendedProps?.status === "completed"
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
            const start = allDay
              ? formatDateJP(info.start)
              : formatDateJP(info.start) + "T09:00";
            const end = allDay
              ? formatDateJP(info.end)
              : formatDateJP(info.end) + "T10:00";
            openModal(
              {
                id: crypto.randomUUID(),
                title: "",
                start,
                end,
                color: "#3b82f6",
                allDay,
                priority: "medium",
                status: "active",
              },
              true
            );
          }}
          height="auto"
          contentHeight="auto"
          eventDrop={(info) => {
            const updated = events.map((e) =>
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
        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg animate-slide-in"
          >
            {n.text}
          </div>
        ))}
      </div>

      {/* モーダル */}
      {modal.open || modalAnimating ? (
        <div
          className={`modal-overlay fixed inset-0 flex justify-center items-center z-[3000] ${
            modalReady ? "show" : ""
          }`}
          onClick={closeModal}
        >
          <div
            className={`modal-content bg-white rounded-xl p-6 w-[420px] shadow-lg max-h-[85vh] overflow-y-auto ${
              modalReady ? "show" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              {modal.isNew ? "📝 新規イベント" : "✏️ イベント編集"}
            </h3>

            {/* 基本情報 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="text-sm text-gray-600">タイトル</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={modal.event.title}
                  onChange={(e) => updateEvent("title", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">開始日</label>
                <input
                  type={modal.event.allDay ? "date" : "datetime-local"}
                  className="w-full p-2 border rounded"
                  value={modal.event.start}
                  onChange={(e) => updateEvent("start", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">終了日</label>
                <input
                  type={modal.event.allDay ? "date" : "datetime-local"}
                  className="w-full p-2 border rounded"
                  value={modal.event.end}
                  onChange={(e) => updateEvent("end", e.target.value)}
                />
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modal.event.allDay || false}
                  onChange={(e) => {
                    const isAllDay = e.target.checked;
                    setModal((p) => ({
                      ...p,
                      event: {
                        ...p.event,
                        allDay: isAllDay,
                        start: isAllDay
                          ? p.event.start.split("T")[0]
                          : formatDateJP(new Date(p.event.start)) + "T09:00",
                        end: isAllDay
                          ? p.event.end.split("T")[0]
                          : formatDateJP(new Date(p.event.end)) + "T10:00",
                      },
                    }));
                  }}
                />
                <label className="text-sm text-gray-700">終日イベント</label>
              </div>
            </div>

            {/* ステータス */}
            <div className="mb-4">
              <label className="text-sm text-gray-600">ステータス</label>
              <select
                className="w-full p-2 border rounded"
                value={modal.event.status || "active"}
                onChange={(e) => updateEvent("status", e.target.value)}
              >
                <option value="active">進行中</option>
                <option value="completed">完了</option>
              </select>
            </div>

            {/* 詳細設定 */}
            <div className="mb-4">
              <button
                className="text-blue-600 font-medium underline"
                onClick={() => setShowDetail((s) => !s)}
              >
                {showDetail ? "▲ 詳細を隠す" : "▼ 詳細設定"}
              </button>

              {showDetail && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">優先度</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={modal.event.priority || "medium"}
                      onChange={(e) => updateEvent("priority", e.target.value)}
                    >
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm text-gray-600">コメント</label>
                    <textarea
                      className="w-full p-2 border rounded"
                      rows={3}
                      value={modal.event.comment || ""}
                      onChange={(e) => updateEvent("comment", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ボタン */}
            <div className="mt-5 flex justify-between items-center">
              {!modal.isNew && (
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-500 text-white rounded"
                >
                  削除
                </button>
              )}

              <div className="flex ml-auto gap-3">
                <button
                  onClick={closeModal}
                  className="px-3 py-1.5 bg-gray-300 rounded"
                >
                  キャンセル
                </button>

                <button
                  onClick={() => {
                    if (!modal.event.title.trim()) {
                      addNotification("タイトルは必須です");
                      return;
                    }
                    if (
                      new Date(modal.event.end) < new Date(modal.event.start)
                    ) {
                      addNotification("終了日は開始日より後に設定してください");
                      return;
                    }

                    const evt = { ...modal.event };
                    handleSave(evt);
                  }}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Calendar;
