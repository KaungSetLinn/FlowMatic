import React, { useState, useRef, useEffect } from "react";
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
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString());
  const [notifications, setNotifications] = useState([]);
  const [locale, setLocale] = useState(jaLocale);

  // ✅ 通知表示
  const addNotification = (text) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      3000
    );
  };

  // ✅ イベント保存
  const saveEvents = (newEvents, actionText) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
    setEvents(newEvents);
    addNotification(actionText);
  };

  // ✅ モーダル制御
  const openModal = (event = null, isNew = false) =>
    setModal({ open: true, event, isNew });
  const closeModal = () => setModal({ open: false, event: null, isNew: false });

  // ✅ イベント保存処理
  const handleSave = (evt) => {
    if (!evt.title || !evt.title.trim()) return alert("タイトルを入力してください");
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

  // ✅ 削除
  const handleDelete = () => {
    if (!window.confirm("本当に削除しますか？")) return;
    saveEvents(
      events.filter((e) => e.id !== modal.event.id),
      "イベントが削除されました"
    );
    closeModal();
  };

  // ✅ 曜日スタイル
  const renderDayNumber = (arg) => arg.date.getDate().toString();
  const getDayClass = (day) =>
    day === 0 ? "fc-day-sun" : day === 6 ? "fc-day-sat" : "fc-day-week";
  const getDayColor = (day) =>
    day === 0 ? "red" : day === 6 ? "blue" : "black";

  // ✅ 日付フォーマット
  const formatDateJP = (date) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // ✅ ナビゲーション
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
    <div
      style={{
        width: "100vw",
        height: "100vh",
        padding: "0 15px",
        boxSizing: "border-box",
        backgroundColor: "#f9f9f9",
        position: "relative",
      }}
    >
      <style>{`
        .fc-toolbar { margin-bottom: 8px !important; }
        .fc { padding-top: 2px !important; }
        .fc-button { display: none !important; }
        .fc-toolbar-title { font-size: 35px !important; font-weight: bold; }
        .fc-day-sun .fc-daygrid-day-number { color: red !important; }
        .fc-day-sat .fc-daygrid-day-number { color: blue !important; }
        .fc-day-week .fc-daygrid-day-number { color: black !important; }
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame {
          background-color: #ffffff !important;
          border: 2px solid #2563eb !important;
          border-radius: 12px !important;
          box-sizing: border-box;
        }
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          color: #000000 !important;
          font-weight: bold;
        }
        .notification-container {
          position: fixed;
          top: 10px;
          right: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 2000;
        }
        .notification {
          background-color: #2563eb;
          color: #fff;
          padding: 10px 16px;
          border-radius: 6px;
          min-width: 200px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transform: translateX(120%);
          animation: slideIn 0.5s forwards, fadeOut 0.5s forwards 2.5s;
        }
        @keyframes slideIn {
          from { transform: translateX(120%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      {/* 月選択バー */}
      <div
        style={{
          position: "absolute",
          top: "18px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "12px",
          zIndex: 1000,
          alignItems: "center",
        }}
      >
        <button
          onClick={goPrev}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          ＜
        </button>
        <span style={{ fontWeight: "bold", fontSize: "18px" }}>
          {new Intl.DateTimeFormat(
            locale === jaLocale ? "ja-JP" : "en-US",
            { year: "numeric", month: "long" }
          ).format(new Date(currentDate))}
        </span>
        <button
          onClick={goNext}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          ＞
        </button>
        <button
          onClick={goToday}
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            border: "1px solid #2563eb",
            backgroundColor: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            height: "32px",
          }}
        >
          today
        </button>
      </div>

      {/* 言語切替 */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          display: "flex",
          gap: "6px",
          zIndex: 2001,
        }}
      >
        <button
          onClick={() => setLocale(jaLocale)}
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            border:
              locale === jaLocale ? "2px solid #2563eb" : "1px solid #ccc",
            backgroundColor: locale === jaLocale ? "#2563eb" : "#fff",
            color: locale === jaLocale ? "#fff" : "#000",
            cursor: "pointer",
          }}
        >
          日本語
        </button>
        <button
          onClick={() => setLocale("en")}
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            border: locale === "en" ? "2px solid #2563eb" : "1px solid #ccc",
            backgroundColor: locale === "en" ? "#2563eb" : "#fff",
            color: locale === "en" ? "#fff" : "#000",
            cursor: "pointer",
          }}
        >
          English
        </button>
      </div>

      {/* FullCalendar */}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
        locale={locale}
        headerToolbar={{ left: "title", center: "", right: "" }}
        initialDate={currentDate}
        navLinks
        editable
        selectable
        allDaySlot={false}
        events={events.map((e) => ({
          ...e,
          backgroundColor: e.color,
          borderColor: e.color,
          textColor: "#fff",
          displayEventTime: !e.allDay,
        }))}
        eventContent={(arg) => (
          <div style={{ whiteSpace: "normal" }}>
            {!arg.event.allDay && (
              <span style={{ marginRight: "4px", fontWeight: "bold" }}>
                {arg.timeText}
              </span>
            )}
            <span>{arg.event.title}</span>
          </div>
        )}
        select={(info) => {
          const allDay = info.allDay;
          const startStr = formatDateJP(info.start) + (allDay ? "T00:00" : "T09:00");
          const modalEndStr = allDay
            ? formatDateJP(new Date(info.end.getTime() - 24 * 60 * 60 * 1000)) + "T00:00"
            : formatDateJP(info.end) + "T10:00";
          openModal(
            {
              id: String(Date.now()),
              title: "",
              start: startStr,
              end: modalEndStr,
              color: "#3b82f6",
              allDay,
              realEnd: allDay ? info.end.toISOString() : modalEndStr,
            },
            true
          );
        }}
        eventClick={(info) =>
          openModal(events.find((e) => e.id === info.event.id))
        }
        height="100%"
        dayCellContent={renderDayNumber}
        dayCellClassNames={(arg) => [getDayClass(arg.date.getDay())]}
        dayHeaderContent={(arg) => (
          <span style={{ color: getDayColor(arg.date.getDay()) }}>
            {arg.text}
          </span>
        )}
        datesSet={(info) => setCurrentDate(info.view.currentStart.toISOString())}
      />

      {/* 通知 */}
      <div className="notification-container">
        {notifications.map((n) => (
          <div key={n.id} className="notification">
            {n.text}
          </div>
        ))}
      </div>

      {/* モーダル */}
      {modal.open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px",
            boxSizing: "border-box",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "25px",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "95vh",
              overflowY: "auto",
              boxSizing: "border-box",
              textAlign: "center",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>
              {modal.isNew ? "新しいイベント" : "イベント編集・削除"}
            </h3>
            <input
              type="text"
              placeholder="タイトル"
              value={modal.event.title}
              onChange={(e) =>
                setModal({
                  ...modal,
                  event: { ...modal.event, title: e.target.value },
                })
              }
              style={{
                width: "80%",
                padding: "12px",
                marginBottom: "15px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />

            <div style={{ width: "80%", margin: "0 auto 10px" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
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
                終日
              </label>
            </div>

            {/* 開始日時 */}
            <div style={{ width: "80%", margin: "0 auto 10px" }}>
              <label>開始日</label>
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
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "4px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
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
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                  }}
                />
              )}
            </div>

            {/* 終了日時 */}
            <div style={{ width: "80%", margin: "0 auto 10px" }}>
              <label>終了日</label>
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
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "4px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
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
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                  }}
                />
              )}
            </div>

            {/* 色選択 */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "15px",
              }}
            >
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setModal({ ...modal, event: { ...modal.event, color } })
                  }
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "50%",
                    backgroundColor: color,
                    border:
                      modal.event.color === color
                        ? "3px solid black"
                        : "1px solid #ccc",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>

            {/* ボタン群 */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() =>
                  handleSave({ ...modal.event, end: modal.event.realEnd || modal.event.end })
                }
                style={{
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  padding: "12px 22px",
                  borderRadius: "6px",
                  border: "none",
                }}
              >
                {modal.isNew ? "追加" : "保存"}
              </button>
              {!modal.isNew && (
                <button
                  onClick={handleDelete}
                  style={{
                    backgroundColor: "#ff4d4d",
                    color: "#fff",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    border: "none",
                  }}
                >
                  削除
                </button>
              )}
              <button
                onClick={closeModal}
                style={{
                  padding: "10px 18px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
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
