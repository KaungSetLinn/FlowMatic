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
import { MobileDateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { 
  createEvent, 
  updateEvent as updateEventApi, 
  getEvents 
} from "../services/EventService";
import { formatDateJP, formatUTC } from "../utils/dateUtils";
import utc from "dayjs/plugin/utc";
import ProjectRequired from "../components/ProjectRequired";
dayjs.extend(utc);

// ========== Constants ==========
const STORAGE_KEY = "calendar_events";

const STATUS_COLOR_MAP = {
  active: "#f59e0b",
  completed: "#22c55e",
  urgent: "#ef4444",
};

const FILTERS = [
  { type: "all", label: "すべて", icon: faListUl, color: "blue" },
  { type: "active", label: "進行中", icon: faPlayCircle, color: "yellow" },
  { type: "completed", label: "完了", icon: faCheckCircle, color: "green" },
  {
    type: "high",
    label: "締切近い",
    icon: faExclamationCircle,
    color: "red",
  },
];

const formatToISO = (dateStr, isAllDay) => {
  if (isAllDay) {
    return `${dateStr}T00:00:00Z`;
  } else {
    if (dateStr.includes("Z")) {
      return dateStr;
    }
    return `${dateStr}:00Z`;
  }
};

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

const mapTaskToCalendarFormat = (apiTask) => ({
  id: apiTask.task_id,
  title: apiTask.name,
  dueDate: apiTask.deadline,
  status: mapStatusToCalendar(apiTask.status),
  priority: apiTask.priority,
  description: apiTask.description,
  startDate: apiTask.start_date,
  assignedUsers: apiTask.assigned_user_ids,
  parentTasks: apiTask.parent_tasks,
});

const isDeadlineNear = (dueDate) => {
  if (!dueDate) return false;
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = (due - now) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
};

const getFilterColorClasses = (color, isActive) => {
  const colorMap = {
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
  };
  return colorMap[color];
};

const mapColorToApi = (hexColor) => {
  const colorMap = {
    "#ef4444": "red",
    "#3b82f6": "blue",
    "#22c55e": "green",
    "#f59e0b": "orange",
  };
  return colorMap[hexColor] || "blue";
};

const mapApiColorToHex = (apiColor) => {
  const colorMap = {
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
    orange: "#f59e0b",
  };
  return colorMap[apiColor] || "#3b82f6";
};

// ========== Main Component ==========
const Calendar = () => {
  const calendarRef = useRef(null);
  const { projects, currentProject } = useProject();

  // State
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    open: false,
    event: null,
    isNew: false,
  });
  const [modalReady, setModalReady] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortType, setSortType] = useState("dueDate");
  const [showDetail, setShowDetail] = useState(false);

  // Sort functions
  const sortFunctions = {
    dueDate: (a, b) => new Date(a.dueDate || a.start) - new Date(b.dueDate || b.start),
    priority: (a, b) =>
      (({ high: 1, medium: 2, low: 3 }[a.priority] || 2) -
      ({ high: 1, medium: 2, low: 3 }[b.priority] || 2)),
  };

  // ========== Effects ==========
  useEffect(() => {
    setTimeout(() => calendarRef.current?.getApi().updateSize(), 500);
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchEvents();
  }, [currentProject?.project_id]);

  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const userEvents = storedEvents.filter((e) => e.source !== "task");

    const taskEvents = tasks.map((task) => {
      // FIX: Keep original ISO format dates from API, don't reformat
      const startDate = task.startDate || task.dueDate;
      const endDate = task.dueDate;

      return {
        id: `task-${task.id}`,
        title: task.title,
        start: startDate || new Date().toISOString(), // Keep ISO format
        end: endDate || startDate || new Date().toISOString(), // Keep ISO format
        allDay: false,
        status: task.status,
        priority: task.priority,
        color: STATUS_COLOR_MAP[task.status] || "#3b82f6",
        source: "task",
        description: task.description,
        dueDate: task.dueDate, // FIX: Keep dueDate for sidebar display
        startDate: task.startDate, // Keep original startDate
      };
    });

    setEvents([...userEvents, ...taskEvents]);
  }, [tasks]);

  // ========== Handlers ==========
  const fetchTasks = async () => {
    if (!currentProject?.project_id) {
      setTasks([]);
      setLoading(false);
      return;
    }

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

  const fetchEvents = async () => {
    if (!currentProject?.project_id) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      const apiEvents = await getEvents(currentProject.project_id);

      const mappedEvents = apiEvents.map((evt) => ({
        id: evt.event_id,
        title: evt.title,
        start: evt.start_date,
        end: evt.end_date,
        allDay: evt.is_all_day,
        color: mapApiColorToHex(evt.color),
        status: "active",
        priority: "medium",
        source: "user",
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedEvents));
    } catch (error) {
      console.error("Failed to fetch events:", error);
      addNotification("イベントの取得に失敗しました ⚠️");
    }
  };

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

  const handleSave = async () => {
    if (!modal.event.title.trim()) {
      alert("タイトルは必須です");
      return;
    }
    
    // FIX: Proper date comparison that allows same day with different times
    const startDateTime = new Date(modal.event.start);
    const endDateTime = new Date(modal.event.end);
    
    if (endDateTime <= startDateTime) {
      addNotification("終了日時は開始日時より後に設定してください");
      return;
    }

    // FIX: Prevent editing task events
    if (modal.event.source === "task") {
      addNotification("タスクイベントは編集できません ⚠️");
      return;
    }

    const evt = { ...modal.event };

    // Normalize dates based on allDay flag
    if (evt.allDay) {
      evt.start = evt.start.split("T")[0];
      evt.end = evt.end.split("T")[0];
    }

    try {
      if (modal.isNew) {
        const requestData = {
          title: evt.title,
          is_all_day: evt.allDay,
          start_date: formatToISO(evt.start, evt.allDay),
          end_date: formatToISO(evt.end, evt.allDay),
          color: mapColorToApi(evt.color),
        };

        const apiResponse = await createEvent(
          currentProject.project_id,
          requestData
        );

        const newEvent = {
          id: apiResponse.event_id,
          title: apiResponse.title,
          start: apiResponse.start_date,
          end: apiResponse.end_date,
          allDay: apiResponse.is_all_day,
          color: mapApiColorToHex(apiResponse.color),
          status: evt.status || "active",
          priority: evt.priority || "medium",
          comment: evt.comment || "",
          source: "user",
        };

        const updatedEvents = [...events, newEvent];
        saveEvents(updatedEvents, "イベントを追加しました 📅");
      } else {
        const requestData = {
          title: evt.title,
          is_all_day: evt.allDay,
          start_date: formatToISO(evt.start, evt.allDay),
          end_date: formatToISO(evt.end, evt.allDay),
          color: mapColorToApi(evt.color),
        };

        await updateEventApi(currentProject.project_id, evt.id, requestData);

        // FIX: Simplified color handling
        const updatedEvent = {
          ...evt,
          color: evt.color, // Already in hex format
          source: "user",
        };

        const updatedEvents = events.map((e) =>
          e.id === updatedEvent.id ? updatedEvent : e
        );
        saveEvents(updatedEvents, "イベントを保存しました 💾");
      }

      closeModal();
    } catch (error) {
      console.error("Failed to save event:", error);
      console.error("Error details:", error.response?.data);
      addNotification("イベントの保存に失敗しました ⚠️");
    }
  };

  const handleDelete = async () => {
    // FIX: Prevent deleting task events
    if (modal.event.source === "task") {
      addNotification("タスクイベントは削除できません ⚠️");
      return;
    }

    if (window.confirm("本当に削除しますか?")) {
      try {

        saveEvents(
          events.filter((e) => e.id !== modal.event.id),
          "イベントが削除されました 🗑️"
        );
        closeModal();
      } catch (error) {
        console.error("Failed to delete event:", error);
        addNotification("イベントの削除に失敗しました ⚠️");
      }
    }
  };

  const openModal = (event = null, isNew = false) => {
    // FIX: Convert task event to proper format for modal
    let modalEvent = event;
    if (event && event.source === "task") {
      modalEvent = {
        ...event,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
      };
    }
    setModal({ open: true, event: modalEvent, isNew });
    requestAnimationFrame(() => setModalReady(true));
  };

  // FIX: Separate function for opening task details (read-only view)
  const openTaskDetail = (task) => {
    const taskEvent = events.find(e => e.id === `task-${task.id}`);
    if (taskEvent) {
      // Task dates are already in ISO format from API, no need to reformat
      openModal(taskEvent, false);
    }
  };

  const closeModal = () => {
    setModalReady(false);
    setModal((prev) => ({ ...prev, open: false }));
    setTimeout(() => setShowDetail(false), 300);
  };

  const updateEvent = (field, value) => {
    setModal((p) => ({ ...p, event: { ...p.event, [field]: value } }));
  };

  // FIX: Handle event drag-and-drop with API persistence
  const handleEventDrop = async (info) => {
    const droppedEvent = events.find((e) => e.id === info.event.id);
    
    // Prevent dragging task events
    if (droppedEvent?.source === "task") {
      info.revert();
      addNotification("タスクイベントは移動できません ⚠️");
      return;
    }

    try {
      const requestData = {
        title: droppedEvent.title,
        is_all_day: droppedEvent.allDay,
        start_date: formatToISO(info.event.startStr, droppedEvent.allDay),
        end_date: formatToISO(info.event.endStr, droppedEvent.allDay),
        color: mapColorToApi(droppedEvent.color),
      };

      await updateEventApi(currentProject.project_id, droppedEvent.id, requestData);

      const updated = events.map((e) =>
        e.id === info.event.id
          ? { ...e, start: info.event.startStr, end: info.event.endStr }
          : e
      );
      saveEvents(updated, "イベントを移動しました 🔄");
    } catch (error) {
      console.error("Failed to move event:", error);
      info.revert();
      addNotification("イベントの移動に失敗しました ⚠️");
    }
  };

  // ========== Render ==========
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!projects || projects.length === 0 || !currentProject) {
  return (
    <ProjectRequired
      icon="📅"
      title="カレンダーを表示するプロジェクトがありません"
      description={
        <>
          カレンダーを表示するには、まずプロジェクトを作成、
          <br />
          または選択してください。
        </>
      }
    />
  );
}


  const filteredAndSortedEvents = tasks
    .filter((e) => {
      if (filter === "all") return true;
      if (filter === "high") return isDeadlineNear(e.dueDate);
      return e.status === filter;
    })
    .sort(sortFunctions[sortType]);

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-gray-50 py-8 relative flex flex-row-reverse gap-6">
      <style>{`
        .fc-event,.fc-event:hover,.fc-event.fc-event-draggable { background:inherit !important;color:inherit !important; }
        .fc .fc-today-button { background:#3b82f6 !important;color:white !important;border:none !important;font-weight:bold !important;}
        .fc .fc-today-button:hover{background:#2563eb !important;}
        .fc .fc-prev-button,.fc .fc-next-button{background:#3b82f6;color:white;border:none;}
        .fc .fc-prev-button:hover,.fc .fc-next-button:hover{background:#2563eb;}
        .fc .fc-toolbar-title{font-weight:bold !important;font-size:2rem;}
        .fc .fc-col-header-cell-cushion{font-weight:bold;}
        .fc .fc-col-header-cell.fc-day-sat .fc-col-header-cell-cushion{color:#3b82f6;}
        .fc .fc-col-header-cell.fc-day-sun .fc-col-header-cell-cushion{color:#ef4444;}
        .fc .fc-daygrid-day.fc-day-today { background-color: #dff3ff !important; }
        .modal-overlay{opacity:0;backdrop-filter:blur(0px);background:rgba(0,0,0,0);transition:0.2s;}
        .modal-overlay.show{opacity:1;backdrop-filter:blur(4px);background:rgba(0,0,0,0.3);}
        .modal-content{opacity:0;transform:scale(0.95);transition:0.2s;}
        .modal-content.show{opacity:1;transform:scale(1);}
        .MuiModal-root { z-index: 3500 !important; }
        .MuiDialog-root { z-index: 3500 !important; }
        .MuiPopper-root { z-index: 3500 !important; }
      `}</style>

      {/* Sidebar */}
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
        </select>

        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f.type}
              onClick={() => setFilter(f.type)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer text-sm font-bold ${getFilterColorClasses(
                f.color,
                filter === f.type
              )}`}
            >
              <FontAwesomeIcon icon={f.icon} /> {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[80vh] overflow-y-auto">
          {filteredAndSortedEvents.map((e) => (
            <div
              key={e.id}
              className="p-2 rounded-md cursor-pointer flex items-center justify-between hover:bg-gray-100 transition"
              onClick={() => openTaskDetail(e)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR_MAP[e.status] }}
                />
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
                    {e.dueDate ? formatUTC(e.dueDate) : "期限なし"}
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

      {/* Calendar */}
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
            const allDay = false;
            const start = formatDateJP(info.start) + "T09:00";
            const end = formatDateJP(info.start) + "T10:00";
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
                source: "user", // FIX: Explicitly set source
              },
              true
            );
          }}
          eventClick={(info) => {
            const event = events.find((e) => e.id === info.event.id);
            if (event) {
              openModal(event);
            }
          }}
          eventDrop={handleEventDrop} // FIX: Use new handler
          height="auto"
          contentHeight="auto"
        />
      </div>

      {/* Notifications */}
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

      {/* Modal */}
      {modal.open && (
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
              {modal.event?.source === "task" 
                ? "📋 タスク詳細" 
                : modal.isNew 
                ? "📅 新規イベント" 
                : "✏️ イベント編集"}
            </h3>

            {/* FIX: Show task warning */}
            {modal.event?.source === "task" && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded mb-3 text-sm">
                ℹ️ タスク情報は参照のみです。編集するには、タスク管理画面をご利用ください。
              </div>
            )}

            {modalReady && modal.event && (
              <div className="text-xs text-gray-500 mb-3">
                {modal.event.source === "task" ? (
                  // For tasks, show start date and due date labels
                  <>
                    <div>開始: {modal.event.start ? formatUTC(modal.event.start) : "未設定"}</div>
                    <div>期限: {modal.event.end ? formatUTC(modal.event.end) : "未設定"}</div>
                  </>
                ) : (
                  // For events, show range
                  modal.event.allDay
                    ? `${modal.event.start} 〜 ${modal.event.end}`
                    : `${formatUTC(modal.event.start)} 〜 ${formatUTC(modal.event.end)}`
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm text-gray-600 block mb-1">
                タイトル
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={modal.event.title}
                onChange={(e) => updateEvent("title", e.target.value)}
                disabled={modal.event?.source === "task"} // FIX: Disable for tasks
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  開始日
                </label>
                <MobileDateTimePicker
                  value={
                    modal.event.start ? dayjs.utc(modal.event.start) : null
                  }
                  onChange={(newValue) =>
                    newValue &&
                    updateEvent(
                      "start",
                      newValue.format(
                        modal.event.allDay ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm"
                      )
                    )
                  }
                  maxDate={
                    modal.event.end ? dayjs.utc(modal.event.end) : undefined
                  }
                  disabled={modal.event?.source === "task"} // FIX: Disable for tasks
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  終了日
                </label>
                <MobileDateTimePicker
                  value={modal.event.end ? dayjs.utc(modal.event.end) : null}
                  onChange={(newValue) =>
                    newValue &&
                    updateEvent(
                      "end",
                      newValue.format(
                        modal.event.allDay ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm"
                      )
                    )
                  }
                  minDate={
                    modal.event.start ? dayjs(modal.event.start) : undefined
                  }
                  disabled={modal.event?.source === "task"} // FIX: Disable for tasks
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                id="allDayCheckbox"
                type="checkbox"
                checked={modal.event.allDay || false}
                disabled={modal.event?.source === "task"} // FIX: Disable for tasks
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
              <label
                htmlFor="allDayCheckbox"
                className="text-sm text-gray-700 cursor-pointer"
              >
                終日イベント
              </label>
            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-600 block mb-1">
                ステータス
              </label>
              <select
                className="w-full p-2 border rounded"
                value={modal.event.status || "active"}
                onChange={(e) => updateEvent("status", e.target.value)}
                disabled={modal.event?.source === "task"}
              >
                <option value="active">進行中</option>
                <option value="completed">完了</option>
              </select>
            </div>

            <div className="mb-4">
              <button
                className="text-blue-600 font-medium underline"
                onClick={() => setShowDetail((s) => !s)}
              >
                {showDetail ? "▲ 詳細を隠す" : "▼ 詳細設定"}
              </button>

              {showDetail && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      優先度
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={modal.event.priority || "medium"}
                      onChange={(e) => updateEvent("priority", e.target.value)}
                      disabled={modal.event?.source === "task"}
                    >
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      色
                    </label>
                    <div className="flex gap-2">
                      {["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"].map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            modal.event.color === color
                              ? "border-gray-800 scale-110"
                              : "border-gray-300"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => updateEvent("color", color)}
                          disabled={modal.event?.source === "task"}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      コメント
                    </label>
                    <textarea
                      className="w-full p-2 border rounded"
                      rows={3}
                      value={modal.event.comment || ""}
                      onChange={(e) => updateEvent("comment", e.target.value)}
                      disabled={modal.event?.source === "task"}
                    />
                  </div>

                  {modal.event?.source === "task" && modal.event.description && (
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">
                        タスク詳細
                      </label>
                      <div className="w-full p-2 border rounded bg-gray-50 text-sm text-gray-700">
                        {modal.event.description}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-between items-center">
              {!modal.isNew && modal.event?.source !== "task" && (
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              )}

              <div className="flex ml-auto gap-3">
                <button
                  onClick={closeModal}
                  className="px-3 py-1.5 bg-gray-300 rounded hover:bg-gray-400 text-lg font-bold cursor-pointer transition duration-300"
                >
                  キャンセル
                </button>
                {modal.event?.source !== "task" && (
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white text-lg font-bold cursor-pointer rounded hover:bg-blue-700"
                  >
                    保存
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;