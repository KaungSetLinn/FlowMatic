import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faCommentDots,
  faExclamationCircle,
  faListUl,
  faMinusCircle,
  faPen,
  faPlayCircle,
  faPlusCircle,
  faTrash,
  faUser,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useProject } from "../context/ProjectContext";
import { getTasks } from "../services/TaskService";
import { CURRENT_PROJECT_ID } from "../constants";
import { useAuth } from "../context/AuthContext";
import { createComment } from "../services/CommentService";

const Task = () => {
  const { user } = useAuth();
  const { currentProject } = useProject();
  const currentProjectId = localStorage.getItem(CURRENT_PROJECT_ID);

  // For testing
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("my_tasks");

  const [activeTaskId, setActiveTaskId] = useState(null);
  const [newComments, setNewComments] = useState({});

  const [openCommentsTaskId, setOpenCommentsTaskId] = useState(null);

  const addComment = async (projectId, taskId) => {
    const commentText = newComments[taskId] || "";

    if (!commentText.trim()) {
      alert("コメント内容を入力してください");
      return;
    }

    try {
      const user_id = user.id;

      const body = {
        user_id,
        content: commentText,
      };

      // Call API
      const savedComment = await createComment(projectId, taskId, body);

      // Update UI
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                comments: [...task.comments, savedComment],
              }
            : task
        )
      );

      // Clear only this task's comment
      setNewComments((prev) => ({
        ...prev,
        [taskId]: "",
      }));

      setActiveTaskId(null);
      alert("新しいコメントを追加しました。");
    } catch (err) {
      console.error(err);
      alert("⚠ コメントの送信に失敗しました。");
    }
  };

  const isActiveStatus = (status) =>
    ["todo", "pending", "in_progress", "in_review", "testing"].includes(status);

  useEffect(() => {
    return () => {
      // Clear the comment when the active task changes
      if (activeTaskId) {
        setNewComments((prev) => ({
          ...prev,
          [activeTaskId]: "",
        }));
      }
    };
  }, [activeTaskId]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await getTasks(currentProjectId);

        console.log("Response: ", response);

        // Normalize API → UI format
        const normalized = response.map((task) => ({
          id: task.task_id, // map to id field used in UI
          title: task.name, // your UI uses title
          description: task.description,
          dueDate: task.deadline,
          priority: task.priority,
          status: task.status,
          assignedUsers: task.users,
          parentTasks: task.parent_tasks,
          comments: task.comments || [], // default empty array
        }));

        setTasks(normalized);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [currentProjectId]);

  const isDeadlineNear = (dueDate) => {
    if (!dueDate) return false;

    const now = new Date();
    const due = new Date(dueDate);

    const diffDays = (due - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7; // ⬅ consistent rule
  };

  // ✅ Check if task is assigned to current user
  const isMyTask = (task) => {
    if (!user || !user.id || !task.assignedUsers) return false;

    return task.assignedUsers.some((assignedUser) => assignedUser.user_id === user.id);
  };

  // ✅ Dynamic filter logic
  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;

    if (filter === "high") {
      return isDeadlineNear(task.dueDate);
    }

    if (filter === "active") {
      return [
        "todo",
        "pending",
        "in_progress",
        "in_review",
        "testing",
      ].includes(task.status);
    }

    if (filter === "done") {
      return task.status === "done";
    }

    if (filter === "my_tasks") {
      return isMyTask(task);
    }

    return false;
  });

  const toggleTaskStatus = (taskId) => {
    setTasks((tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "done" ? "in_progress" : "done",
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

  const formatDateTime = (isoString) => {
    if (!isoString) return "-";

    const date = new Date(isoString);

    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}/${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  if (loading)
    return <div className="p-6 text-gray-600">タスクの読み込み中...</div>;

  return (
    <div className="mx-auto md:p-6 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-8 py-6 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold tracking-wide">タスク管理</h1>
        <Link to="/task/new">
          <button
            className="flex items-center bg-white text-blue-700 font-semibold text-xl px-4 py-3 hover:cursor-pointer
          gap-3 rounded-xl shadow hover:bg-blue-50 transition-all"
          >
            <FontAwesomeIcon icon={faPlusCircle} />
            新規タスク
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard 
          title="マイタスク" 
          value={tasks.filter((t) => isMyTask(t)).length}
          color="indigo" 
        />
        <StatCard title="すべてのタスク" value={tasks.length} color="blue" />
        <StatCard
          title="進行中"
          value={tasks.filter((t) => isActiveStatus(t.status)).length}
          color="yellow"
        />
        <StatCard
          title="完了"
          value={tasks.filter((t) => t.status === "done").length}
          color="green"
        />
        <StatCard
          title="締め切り近い"
          value={tasks.filter((t) => isDeadlineNear(t.dueDate)).length}
          color="red"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-4">
        {[
          { type: "my_tasks", label: "マイタスク", icon: faUserCheck, color: "indigo" },
          { type: "all", label: "すべて", icon: faListUl, color: "blue" },
          {
            type: "active",
            label: "進行中",
            icon: faPlayCircle,
            color: "yellow",
          },
          {
            type: "done",
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
            indigo: isActive
              ? "bg-indigo-600 text-white"
              : "bg-white border border-indigo-300 text-indigo-600 hover:bg-indigo-50",
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
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xl font-bold transition-all duration-300 hover:cursor-pointer shadow-sm ${
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
          <div className="text-center py-16 font-bold">
            <p className="text-gray-500 text-lg">タスクがありません</p>
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
                      task.status === "done"
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-green-500"
                    }`}
                  >
                    {task.status === "done" && (
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

                  <div className="flex-1 space-y-5">
                    <div className="flex items-center gap-3">
                      <h3
                        className={`text-2xl font-bold ${
                          task.status === "done"
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

                    <p className="font-semibold text-gray-500 text-lg">
                      {task.description}
                    </p>

                    <div className="flex items-center font-bold gap-4 text-gray-700 text-lg">
                      <span>
                        期限:{" "}
                        <span className="text-gray-700">
                          {formatDateTime(task.dueDate)}
                        </span>
                      </span>

                      <span
                        className={`px-2 py-1 rounded-full ${
                          task.status === "done"
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-700 border border-blue-300"
                            : task.status === "in_review"
                            ? "bg-purple-100 text-purple-700 border border-purple-300"
                            : task.status === "testing"
                            ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                            : "bg-gray-100 text-gray-700 border border-gray-300"
                        }`}
                      >
                        {task.status === "done"
                          ? "完了"
                          : task.status === "in_progress"
                          ? "進行中"
                          : task.status === "in_review"
                          ? "レビュー中"
                          : task.status === "testing"
                          ? "テスト中"
                          : task.status === "pending"
                          ? "保留中"
                          : "未着手"}
                      </span>
                    </div>

                    {task.assignedUsers && task.assignedUsers.length > 0 && (
                      <div className="flex items-center gap-2 text-lg font-bold">
                        <span className="text-gray-600">担当者:</span>
                        <div className="flex gap-2 flex-wrap">
                          {task.assignedUsers.map((user) => (
                            <span
                              key={user.user_id}
                              className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full flex items-center gap-1"
                            >
                              <FontAwesomeIcon icon={faUser} />
                              {user.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments Section */}
                    <div className="flex flex-wrap items-center gap-4">
                      {task.comments && task.comments.length > 0 && (
                        <button
                          onClick={() =>
                            setOpenCommentsTaskId(
                              openCommentsTaskId === task.id ? null : task.id
                            )
                          }
                          className="flex items-center gap-2 text-blue-600 text-lg font-bold hover:text-blue-800 hover:underline hover:cursor-pointer transition-transform duration-200 hover:translate-x-1"
                        >
                          <FontAwesomeIcon icon={faCommentDots} />
                          {openCommentsTaskId === task.id
                            ? `${task.comments.length} コメント ▲`
                            : `${task.comments.length} コメント ▼`}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setActiveTaskId(
                            activeTaskId === task.id ? null : task.id
                          )
                        }
                        className={`flex items-center gap-2 px-4 py-2 text-lg font-extrabold rounded-xl shadow-md hover:cursor-pointer
    ${
      activeTaskId === task.id
        ? "bg-gray-500 hover:bg-gray-600 text-white"
        : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
    }`}
                      >
                        <FontAwesomeIcon
                          icon={
                            activeTaskId === task.id
                              ? faMinusCircle
                              : faPlusCircle
                          }
                          className="text-white text-xl"
                        />
                        {activeTaskId === task.id
                          ? "コメントを閉じる"
                          : "コメント追加"}
                      </button>
                    </div>

                    {openCommentsTaskId === task.id && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in slide-in-from-top duration-200">
                        {task.comments.length > 0 ? (
                          <div className="space-y-3">
                            {task.comments.map((comment) => (
                              <div
                                key={comment.comment_id}
                                className="bg-white px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Avatar with initials */}
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                                    {comment.name.charAt(0).toUpperCase()}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    {/* Author and timestamp */}
                                    <div className="flex items-baseline gap-4 mb-1">
                                      <span className="font-semibold text-gray-900 text-lg">
                                        {comment.name}
                                      </span>
                                      {comment.created_at && (
                                        <span className="text-xs text-gray-700">
                                          {formatDateTime(comment.created_at)}
                                        </span>
                                      )}
                                    </div>

                                    {/* Comment content */}
                                    <p className="text-gray-700 text-lg leading-relaxed break-words">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <p className="text-base">
                              No comments yet. Be the first to comment!
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show input when active */}
                    {activeTaskId === task.id && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={newComments[task.id] || ""}
                          onChange={(e) =>
                            setNewComments((prev) => ({
                              ...prev,
                              [task.id]: e.target.value,
                            }))
                          }
                          placeholder="コメントを入力..."
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                          onClick={() => addComment(currentProjectId, task.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all cursor-pointer"
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
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
  }[color];

  return (
    <div
      className={`flex flex-col gap-3 justify-center px-8 py-6 border rounded-2xl shadow-sm ${colorClasses}`}
    >
      <p className="text-2xl font-semibold">{title}</p>
      <p className="text-4xl font-extrabold mt-1">{value}</p>
    </div>
  );
};

export default Task;
