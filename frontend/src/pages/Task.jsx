import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faCommentDots,
  faExclamationCircle,
  faListUl,
  faPen,
  faPlayCircle,
  faPlusCircle,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

const Task = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");

  const [activeTaskId, setActiveTaskId] = useState(null);
  const [newComment, setNewComment] = useState("");

  const addComment = (taskId) => {
    if (!newComment.trim()) return;

    setTasks((tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              comments: [
                ...(task.comments || []),
                { id: Date.now(), text: newComment },
              ],
            }
          : task
      )
    );

    setNewComment("");
    setActiveTaskId(null);

    alert("新しいコメントを追加しました。");
  };

  useEffect(() => {
    const mockTasks = [
      {
        id: 1,
        title: "プロジェクト計画書を作成",
        description: "Q4のプロジェクト計画書を完成させる",
        status: "active",
        dueDate: "2025-10-25",
        priority: "high",
        comments: [
          { id: 1, text: "レビュー依頼を忘れずに！" },
          { id: 2, text: "締め切り前に共有しましょう。" },
        ],
      },
      {
        id: 2,
        title: "チームミーティング",
        description: "週次チームミーティングの準備と議題整理",
        status: "completed",
        dueDate: "2025-10-10",
        priority: "medium",
        comments: [],
      },
      {
        id: 3,
        title: "コードレビュー",
        description: "新機能のプルリクエストをレビューしてコメント",
        status: "active",
        dueDate: "2025-10-20",
        priority: "high",
        comments: [{ id: 1, text: "フロント部分の修正が必要です。" }],
      },
      {
        id: 4,
        title: "資料整理",
        description: "共有ドライブの資料を整理・権限設定を確認",
        status: "active",
        dueDate: "2025-10-30",
        priority: "low",
        comments: [],
      },
      {
        id: 5,
        title: "バグ修正",
        description: "報告されたUIバグを修正する",
        status: "completed",
        dueDate: "2025-10-15",
        priority: "medium",
        comments: [{ id: 1, text: "再発防止のためテスト追加。" }],
      },
    ];
    setTasks(mockTasks);
  }, []);

  // ✅ Dynamic filter logic
  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "high") {
      const now = new Date();
      const due = new Date(task.dueDate);
      const diffDays = (due - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 3; // due within 3 days
    }
    return task.status === filter;
  });

  const toggleTaskStatus = (taskId) => {
    setTasks((tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "active" ? "completed" : "active",
            }
          : task
      )
    );
  };

  const deleteTask = (taskId) => {
    setTasks((tasks) => tasks.filter((t) => t.id !== taskId));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("ja-JP");

  const openComments = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    alert(`${task.comments.length}件のコメントがあります`);
  };

  return (
    <div className="max-w-6xl mx-auto md:p-6 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold tracking-wide">タスク管理</h1>
        <Link to="/task/new">
          <button
            className="flex items-center bg-white text-blue-700 font-semibold text-lg px-4 py-3 hover:cursor-pointer
          gap-3 rounded-xl shadow hover:bg-blue-50 transition-all"
          >
            <FontAwesomeIcon icon={faPlusCircle} />
            新規タスク
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="すべてのタスク" value={tasks.length} color="blue" />
        <StatCard
          title="進行中"
          value={tasks.filter((t) => t.status === "active").length}
          color="yellow"
        />
        <StatCard
          title="完了"
          value={tasks.filter((t) => t.status === "completed").length}
          color="green"
        />
        <StatCard
          title="締め切り近い"
          value={tasks.filter((t) => t.priority === "high").length}
          color="red"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-4">
        {[
          { type: "all", label: "すべて", icon: faListUl, color: "blue" },
          {
            type: "active",
            label: "進行中",
            icon: faPlayCircle,
            color: "yellow",
          },
          {
            type: "completed",
            label: "完了",
            icon: faCheckCircle,
            color: "green",
          },
          {
            type: "high",
            label: "締め切り近い",
            icon: faExclamationCircle,
            color: "red",
          },
        ].map(({ type, label, icon, color }) => {
          const isActive = filter === type;

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
          }[color];

          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-lg font-medium transition-all duration-300 hover:cursor-pointer shadow-sm ${
                isActive ? "scale-105 shadow-md" : ""
              } ${colorClasses}`}
            >
              <FontAwesomeIcon icon={icon} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg font-medium">
              タスクがありません
            </p>
            <p className="text-gray-400 mt-2">
              新しいタスクを作成してみましょう。
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-6 hover:bg-gray-50 transition-all duration-200 flex items-start justify-between group"
              >
                <div className="flex items-start gap-4 flex-1">
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center hover:cursor-pointer transition-all ${
                      task.status === "completed"
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-green-500"
                    }`}
                  >
                    {task.status === "completed" && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <h3
                        className={`text-2xl font-bold ${
                          task.status === "completed"
                            ? "text-gray-400 line-through"
                            : "text-gray-800"
                        }`}
                      >
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xl font-bold rounded-full border ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority === "high"
                          ? "高"
                          : task.priority === "medium"
                          ? "中"
                          : "低"}
                      </span>
                    </div>
                    <p className="font-bold text-lg">{task.description}</p>

                    <div className="flex items-center font-bold gap-4 text-gray-700 text-lg">
                      <span>
                        期限:{" "}
                        <span className="text-gray-700">
                          {formatDate(task.dueDate)}
                        </span>
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-blue-100 text-blue-700 border border-blue-300"
                        }`}
                      >
                        {task.status === "completed" ? "完了" : "進行中"}
                      </span>
                    </div>

                    {/* Comments Section */}
                    <div className="flex flex-wrap items-center gap-4">
                      {task.comments && task.comments.length > 0 && (
                        <button
                          onClick={() => openComments(task.id)}
                          className="flex items-center gap-2 text-blue-600 text-lg font-bold hover:text-blue-800 hover:underline hover:cursor-pointer transition-transform duration-200 hover:translate-x-1"
                        >
                          <FontAwesomeIcon icon={faCommentDots} />
                          {task.comments.length} コメント ＞＞
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setActiveTaskId(
                            activeTaskId === task.id ? null : task.id
                          )
                        }
                        className="flex items-center gap-2 px-4 py-2 text-lg font-extrabold text-white hover:cursor-pointer
                        bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-md hover:from-blue-600 
                        hover:to-indigo-600 hover:shadow-lg transition-all duration-200"
                      >
                        <FontAwesomeIcon
                          icon={faPlusCircle}
                          className="text-white text-xl"
                        />
                        コメント追加
                      </button>
                    </div>

                    {/* Show input when active */}
                    {activeTaskId === task.id && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="コメントを入力..."
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                          onClick={() => addComment(task.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all"
                        >
                          投稿
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 ml-4">
                  <button
                    className="flex items-center gap-2 px-4 py-2 font-bold text-lg bg-yellow-400 hover:bg-yellow-500 rounded-lg hover:cursor-pointer"
                    title="編集"
                  >
                    <FontAwesomeIcon icon={faPen} />
                    編集
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="flex items-center gap-2 px-4 py-2 font-bold text-lg text-white bg-red-500 hover:bg-red-600 rounded-lg hover:cursor-pointer"
                    title="削除"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
  }[color];

  return (
    <div
      className={`flex flex-col justify-center px-8 py-6 border rounded-2xl shadow-sm ${colorClasses}`}
    >
      <p className="text-xl font-semibold">{title}</p>
      <p className="text-3xl font-extrabold mt-1">{value}</p>
    </div>
  );
};

export default Task;
