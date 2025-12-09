import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import jaLocale from "@fullcalendar/core/locales/ja";

const Calendar = () => {
  const STORAGE_KEY = "calendar_events";
  const COLOR_OPTIONS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b"];
  const calendarRef = useRef(null);
  const [events, setEvents] = useState(
    () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  );
  const [modal, setModal] = useState({ open: false, event: null, isNew: false });
  const [currentDate, setCurrentDate] = useState("2025-10-01");
  const [notifications, setNotifications] = useState([]);
  const [locale, setLocale] = useState(jaLocale);

  const addNotification = (text) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      3000
    );
  };

  const saveEvents = (newEvents, actionText) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
    setEvents(newEvents);
    addNotification(actionText);
  };

  const openModal = (event = null, isNew = false) =>
    setModal({ open: true, event, isNew });
  const closeModal = () => setModal({ open: false, event: null, isNew: false });

  const handleSave = (evt) => {
    if (!evt.title?.trim()) return alert("タイトルを入力してください");
    const newEvent = { ...evt };
    const updatedEvents = modal.isNew
      ? [...events, newEvent]
      : events.map((e) => (e.id === newEvent.id ? newEvent : e));
    saveEvents(
      updatedEvents,
      modal.isNew ? "イベントが追加されました ✅" : "イベントが更新されました ✅"
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

  const formatDateJP = (date) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const goPrev = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.prev();
    setCurrentDate(calendarApi.getDate().toISOString());
  };
  const goNext = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.next();
    setCurrentDate(calendarApi.getDate().toISOString());
  };
  const goToday = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.today();
    setCurrentDate(calendarApi.getDate().toISOString());
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen bg-gray-50 py-8 relative">
      {/* Toolbar */}
      <div className="flex justify-center items-center gap-4 mb-6">
        <button
          onClick={goPrev}
          className="px-4 py-2 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-100"
        >
          ＜
        </button>
        <button
          onClick={goNext}
          className="px-4 py-2 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-100"
        >
          ＞
        </button>
        <button
          onClick={goToday}
          className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700"
        >
          今日
        </button>

        {/* Locale Switch */}
        <div className="ml-6 flex gap-2">
          <button
            onClick={() => setLocale(jaLocale)}
            className={`px-3 py-1 rounded-md border ${
              locale === jaLocale
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-gray-300 hover:bg-gray-100"
            }`}
          >
            日本語
          </button>
          <button
            onClick={() => setLocale("en")}
            className={`px-3 py-1 rounded-md border ${
              locale === "en"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-gray-300 hover:bg-gray-100"
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          locale={locale}
          headerToolbar={{ left: "title", center: "", right: "" }}
          initialDate={currentDate}
          selectable
          editable
          events={events.map((e) => ({
            ...e,
            backgroundColor: e.color,
            borderColor: e.color,
            textColor: "#fff",
          }))}
          eventContent={(arg) => (
            <div className="whitespace-normal text-sm">
              {!arg.event.allDay && (
                <span className="font-bold mr-1">{arg.timeText}</span>
              )}
              <span>{arg.event.title}</span>
            </div>
          )}
          select={(info) => {
            const allDay = info.allDay;
            const startStr = formatDateJP(info.start) + (allDay ? "T00:00" : "T09:00");
            const modalEndStr = allDay
              ? formatDateJP(new Date(info.end.getTime() - 86400000)) + "T00:00"
              : formatDateJP(info.end) + "T10:00";
            openModal(
              {
                id: String(Date.now()),
                title: "",
                start: startStr,
                end: modalEndStr,
                color: "#3b82f6",
                allDay,
              },
              true
            );
          }}
          eventClick={(info) =>
            openModal(events.find((e) => e.id === info.event.id))
          }
          height="80vh"
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
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[1000]">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-fade-in">
            <h3 className="text-xl font-semibold mb-5 text-gray-800">
              {modal.isNew ? "📝 新しいイベント" : "✏️ イベント編集"}
            </h3>

            <input
              type="text"
              placeholder="タイトルを入力..."
              value={modal.event.title}
              onChange={(e) =>
                setModal({
                  ...modal,
                  event: { ...modal.event, title: e.target.value },
                })
              }
              className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:ring-2 focus:ring-blue-400"
            />

            <label className="flex items-center gap-2 mb-3 font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={modal.event.allDay || false}
                onChange={(e) =>
                  setModal({
                    ...modal,
                    event: { ...modal.event, allDay: e.target.checked },
                  })
                }
              />
              終日イベント
            </label>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">開始</label>
                <input
                  type="date"
                  value={modal.event.start?.split("T")[0] || ""}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      event: {
                        ...modal.event,
                        start:
                          e.target.value +
                          "T" +
                          (modal.event.start?.split("T")[1] || "09:00"),
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-md p-2"
                />
                {!modal.event.allDay && (
                  <input
                    type="time"
                    value={modal.event.start?.split("T")[1] || "09:00"}
                    onChange={(e) =>
                      setModal({
                        ...modal,
                        event: {
                          ...modal.event,
                          start:
                            modal.event.start.split("T")[0] + "T" + e.target.value,
                        },
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-2 mt-1"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">終了</label>
                <input
                  type="date"
                  value={modal.event.end?.split("T")[0] || ""}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      event: {
                        ...modal.event,
                        end:
                          e.target.value +
                          "T" +
                          (modal.event.end?.split("T")[1] || "10:00"),
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-md p-2"
                />
                {!modal.event.allDay && (
                  <input
                    type="time"
                    value={modal.event.end?.split("T")[1] || "10:00"}
                    onChange={(e) =>
                      setModal({
                        ...modal,
                        event: {
                          ...modal.event,
                          end:
                            modal.event.end.split("T")[0] + "T" + e.target.value,
                        },
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-2 mt-1"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-center gap-3 mb-5">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setModal({ ...modal, event: { ...modal.event, color } })
                  }
                  className={`w-9 h-9 rounded-full border-2 ${
                    modal.event.color === color
                      ? "border-black scale-110"
                      : "border-gray-300"
                  } transition-transform`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  handleSave({
                    ...modal.event,
                    end: modal.event.realEnd || modal.event.end,
                  })
                }
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
              >
                {modal.isNew ? "追加" : "保存"}
              </button>
              {!modal.isNew && (
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white px-5 py-2 rounded-md hover:bg-red-600"
                >
                  削除
                </button>
              )}
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
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
