import { useState, useEffect } from "react";
import { useProject } from "../context/ProjectContext";
import { getTasks } from "../services/TaskService";
import { useAuth } from "../context/AuthContext";
import { getEvents } from "../services/EventService";
import { formatDateJP, formatUTC } from "../utils/dateUtils";
import CreateMemoModal from "./CreateMemoModal";

const Dashboard = () => {
  const { user } = useAuth();

  const { projects, currentProject } = useProject();

  const [events, setEvents] = useState([]);

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);

  const [projectMemos, setProjectMemos] = useState([
    {
      id: 1,
      content: "API仕様変更あり\nタスク作成前に必ず確認してください。",
      author: "山田",
      created_at: "2026-01-13T10:00:00",
      color: "yellow",
      is_pinned: false,
    },
    {
      id: 2,
      content: "金曜 18:00 に本番デプロイ予定です。",
      author: "管理者",
      created_at: "2026-01-12T18:30:00",
      color: "blue",
      is_pinned: false,
    },
    {
      id: 3,
      content: "WebSocket 実装は来週対応予定。",
      author: "佐藤",
      created_at: "2026-01-11T09:15:00",
      color: "green",
      is_pinned: true,
    },
  ]);

  const [editingMemo, setEditingMemo] = useState(null);

  const memoColors = {
    yellow: "bg-yellow-100 border-yellow-300",
    blue: "bg-blue-100 border-blue-300",
    green: "bg-green-100 border-green-300",
  };

  const [summary, setSummary] = useState({
    progress: 0,
    activeTasks: 0,
    completedTasks: 0,
    membersCount: 0,
  });

  const toDate = (iso) => new Date(iso);

  const fetchTasks = async () => {
    try {
      const tasks = await getTasks(currentProject.project_id);

      setTasks(tasks);
      console.log(tasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyTasksCount = () => {
    try {
      setLoading(true);

      const myActiveTasks = tasks.filter(
        (task) =>
          task.status !== "done" &&
          task.users.some((u) => u.user_id === user.id)
      ).length;

      setSummary((prev) => ({
        ...prev,
        activeTasks: myActiveTasks,
      }));
    } finally {
      setLoading(false);
    }
  };

  const loadClearedTasksCount = () => {
    try {
      setLoading(true);

      const clearedTasks = tasks.filter(
        (task) => task.status === "done"
      ).length;

      setSummary((prev) => ({
        ...prev,
        completedTasks: clearedTasks,
      }));
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = () => {
    if (!currentProject) return;

    setSummary((prev) => ({
      ...prev,
      progress: currentProject.progress ?? 0,
    }));
  };

  const loadMemberCount = () => {
    if (!currentProject?.members) return;

    setSummary((prev) => ({
      ...prev,
      membersCount: currentProject.members.length,
    }));
  };

  const fetchEvents = async () => {
    try {
      const events = await getEvents(currentProject.project_id);

      console.log(events);

      setEvents(events);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const getThisWeekEvents = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // start of today

    const end = new Date(now);
    end.setDate(end.getDate() + 7); // 7 days from today

    return events
      .filter((event) => {
        const start = new Date(event.start_date);
        return start >= now && start < end;
      })
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  };

  const handleAddMemo = () => {
    setIsMemoModalOpen(true);
  };

  const handleSubmitMemo = async ({ id, content, color }) => {
    await new Promise((r) => setTimeout(r, 400)); // demo delay

    setProjectMemos((prev) => {
      // EDIT
      if (id) {
        return prev.map((m) => (m.id === id ? { ...m, content, color } : m));
      }

      // CREATE
      return [
        {
          id: Date.now(),
          content,
          color,
          author: user.username,
          created_at: new Date().toISOString(),
          is_pinned: false,
        },
        ...prev,
      ];
    });

    setEditingMemo(null);
  };

  const handleTogglePin = (id) => {
    setProjectMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_pinned: !m.is_pinned } : m))
    );
  };

  const handleEditMemo = (memo) => {
    setEditingMemo(memo);
    setIsMemoModalOpen(true);
  };

  const handleDeleteMemo = (id) => {
    if (!window.confirm("このメモを削除しますか？")) return;

    setProjectMemos((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    if (!currentProject) return;

    loadProgress();
    loadMemberCount();
    fetchTasks();
    fetchEvents();
  }, [currentProject]);

  useEffect(() => {
    loadMyTasksCount();

    loadClearedTasksCount();
  }, [tasks]);

  const cards = [
    {
      key: "progress",
      title: "進捗率",
      label: "達成率",
      value: `${summary.progress}%`,
      hint: "📈 詳細を見る",
      gradient: "from-indigo-500 via-indigo-700 to-indigo-800",
      icon: "fa-chart-line",
    },
    {
      key: "tasks",
      title: "マイタスク",
      label: "やること",
      value: summary.activeTasks,
      hint: "👉 タスクを確認",
      gradient: "from-yellow-400 via-yellow-600 to-yellow-700",
      icon: "fa-list",
    },
    {
      key: "completed",
      title: "完了したタスク",
      label: "達成!",
      value: summary.completedTasks,
      hint: "🎉 よく頑張りました!",
      gradient: "from-green-500 to-green-700 to-green-800",
      icon: "fa-circle-check",
    },
    {
      key: "members",
      title: "参加メンバー数",
      label: "チーム",
      value: summary.membersCount,
      hint: "👥 メンバーを見る",
      gradient: "from-cyan-500 via-cyan-700 to-cyan-800",
      icon: "fa-users",
    },
  ];

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      text: "プロジェクト『Webアプリ開発』に新しいタスクを追加しました",
      time: "2時間前",
      icon: "📝",
    },
    {
      id: 2,
      text: "山田さんが『デザインレビュー』を完了しました",
      time: "5時間前",
      icon: "✅",
    },
    {
      id: 3,
      text: "新しいチャットメッセージが届いています",
      time: "昨日",
      icon: "💬",
    },
  ]);

  const completionRate = Math.round(
    (summary.completedTasks / (summary.completedTasks + summary.activeTasks)) *
      100
  );

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border-2 border-blue-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                おかえりなさい! 👋
              </h1>
              <p className="text-gray-600 text-lg">
                今日も一緒に頑張りましょう!
              </p>
            </div>
          </div>
        </div>

        {/* Big Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.key}
              className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-3">
                <i className={`fa-solid ${card.icon} text-4xl`}></i>
                {card.badge ||
                  (card.label && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-lg font-bold">
                      {card.label}
                    </span>
                  ))}
              </div>

              <h3 className="text-2xl font-bold mb-1">{card.title}</h3>
              <p className="text-4xl font-bold mb-2">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Memo (Demo) */}
          <div className="bg-white rounded-3xl shadow-sm p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center">
                <i className="fa-solid fa-note-sticky text-3xl text-blue-600 mr-3"></i>
                <h2 className="text-2xl font-bold text-gray-800">
                  📌 プロジェクトメモ
                </h2>
              </div>

              <button
                onClick={handleAddMemo}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
                text-white px-4 py-2 rounded-xl transition shadow-sm cursor-pointer text-lg font-semibold"
              >
                <i className="fa-solid fa-plus"></i>
                メモ追加
              </button>
            </div>

            <div className="space-y-4 lg:max-h-[380px] max-h-[460px] overflow-y-auto pr-1">
              {projectMemos.length === 0 && (
                <p className="text-gray-500">メモはまだありません</p>
              )}

              {[...projectMemos]
                .sort((a, b) => {
                  if (a.is_pinned !== b.is_pinned) {
                    return b.is_pinned - a.is_pinned;
                  }
                  return new Date(b.created_at) - new Date(a.created_at);
                })
                .map((memo) => (
                  <div
                    key={memo.id}
                    className={`relative p-4 rounded-2xl border-2 shadow-sm
    ${memoColors[memo.color]}
  `}
                  >
                    {/* Action buttons */}
                    <div className="absolute top-3 right-3 flex md:gap-4 gap-2 text-lg">
                      {/* Pin */}
                      <button
                        onClick={() => handleTogglePin(memo.id)}
                        className={`transition cursor-pointer
        ${
          memo.is_pinned
            ? "text-blue-600 hover:text-blue-700"
            : "text-gray-400 hover:text-gray-600"
        }
      `}
                        title="ピン留め"
                      >
                        <i className="fa-solid fa-thumbtack"></i>
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleEditMemo(memo)}
                        className="text-gray-400 hover:text-green-600 transition cursor-pointer"
                        title="編集"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteMemo(memo.id)}
                        className="text-gray-400 hover:text-red-600 transition cursor-pointer"
                        title="削除"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>

                    {/* Content */}
                    <p className="text-gray-800 text-lg font-bold whitespace-pre-wrap pr-16">
                      {memo.content}
                    </p>

                    {/* Footer */}
                    <div className="flex justify-between text-lg font-bold text-gray-500 mt-3">
                      <span>✍ {memo.author}</span>
                      <span>{formatDateJP(new Date(memo.created_at))}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-white rounded-3xl shadow-sm p-6 border-2 border-green-100">
            <div className="flex items-center mb-5">
              <i className="fa-solid fa-calendar-days text-3xl text-blue-700 mr-3"></i>
              <h2 className="text-2xl font-bold text-gray-800">
                直近7日間の予定
              </h2>
            </div>

            <div className="space-y-4">
              {getThisWeekEvents().length === 0 && (
                <p className="text-gray-500">今週の予定はありません</p>
              )}

              {getThisWeekEvents().map((event) => (
                <div
                  key={event.event_id}
                  className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-2xl border-2 border-blue-300 hover:shadow-md transition-all cursor-default"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      📅 {event.title}
                    </h3>

                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="flex items-center">
                        <span className="mr-2">📆</span>
                        <span className="font-semibold">
                          {formatDateJP(toDate(event.start_date))}
                        </span>
                      </p>

                      {!event.is_all_day && (
                        <p className="flex items-center">
                          <span className="mr-2">⏰</span>
                          <span>
                            {formatUTC(event.start_date)} 〜{" "}
                            {formatUTC(event.end_date)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                    詳細を見る
                  </button> */}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Motivational Footer */}
        <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border-2 border-purple-100">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            今日もお疲れ様でした! 🎉
          </h2>
          <p className="text-lg opacity-90 mb-4">
            あなたは素晴らしい進歩を遂げています。明日も一緒に頑張りましょう!
          </p>
          <div className="flex justify-center space-x-4 text-4xl">
            <span>💪</span>
            <span>✨</span>
            <span>🚀</span>
            <span>🌟</span>
          </div>
        </div>
      </div>

      <CreateMemoModal
        isOpen={isMemoModalOpen}
        onClose={() => {
          setIsMemoModalOpen(false);
          setEditingMemo(null);
        }}
        onSubmit={handleSubmitMemo}
        initialMemo={editingMemo}
      />
    </div>
  );
};

export default Dashboard;
