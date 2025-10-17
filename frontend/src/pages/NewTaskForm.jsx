import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext";

export default function NewTaskForm() {
  const { currentProject } = useProject();

  const [projectId, setProjectId] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("to_do");
  const [assignees, setAssignees] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });

  const inputRef = useRef(null);
  const navigate = useNavigate();

  const allAssignees = [
    { id: "john_doe", label: "ジョン・ドウ" },
    { id: "jane_smith", label: "ジェーン・スミス" },
    { id: "peter_jones", label: "ピーター・ジョーンズ" },
    { id: "alice_brown", label: "アリス・ブラウン" },
  ];

  const sampleTasks = [
    { id: "task_1", name: "要件定義" },
    { id: "task_2", name: "設計" },
    { id: "task_3", name: "開発" },
    { id: "task_4", name: "テスト" },
    { id: "task_5", name: "リリース" },
  ];

  const dependencyTypes = [
    { id: "fts", label: "完了→開始 (FtS)" },
    { id: "ftf", label: "完了→完了 (FtF)" },
    { id: "sts", label: "開始→開始 (StS)" },
    { id: "stf", label: "開始→完了 (StF)" },
  ];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // console.log(currentProject.id);
    setProjectId(currentProject.id);
  }, [currentProject]);

  const handleAssigneeChange = (id) => {
    setAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleAddDependency = () => {
    setDependencies([...dependencies, { taskId: "", type: "fts" }]);
  };

  const handleRemoveDependency = (index) => {
    setDependencies(dependencies.filter((_, i) => i !== index));
  };

  const handleDependencyChange = (index, field, value) => {
    const updated = [...dependencies];
    updated[index][field] = value;
    setDependencies(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!projectId)
      return showMessage("プロジェクトを選択してください。", "error");
    if (!newTaskName.trim())
      return showMessage("タスク名を入力してください。", "error");
    if (!dueDate) return showMessage("期限日を選択してください。", "error");
    if (assignees.length === 0)
      return showMessage("担当者を1人以上選択してください。", "error");

    const task = {
      projectId,
      newTaskName,
      description,
      dueDate,
      priority,
      status,
      assignees,
      dependencies,
    };

    console.log("✅ 新しいタスクデータ:", task);
    showMessage(`タスク「${newTaskName}」が正常に作成されました！`, "success");

    setNewTaskName("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setStatus("to_do");
    setAssignees([]);
    setDependencies([]);
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 relative">
      {/* Back Button */}
      <div className="w-full max-w-2xl mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 hover:cursor-pointer
                    rounded-lg text-xl transition duration-200 shadow w-auto"
        >
          ← 戻る
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          新しいタスクの作成
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Task Name */}
          <div>
            <label className="block text-gray-700 text-lg font-semibold mb-2">
              タスク名
            </label>
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              ref={inputRef}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg"
              placeholder="タスク名を入力してください"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 text-lg font-semibold mb-2">
              説明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg resize-y"
              placeholder="タスクの詳細を入力してください"
            />
          </div>

          {/* Due Date + Assignees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-gray-700 text-lg font-semibold mb-2">
                期限日
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-lg font-semibold mb-2">
                担当者
              </label>
              <div className="max-h-[110px] overflow-y-auto border border-gray-300 rounded-lg p-2">
                {allAssignees.map((a) => (
                  <label
                    key={a.id}
                    htmlFor={`assignee_${a.id}`}
                    className="flex items-center py-1 text-lg text-gray-700"
                  >
                    <input
                      id={`assignee_${a.id}`}
                      type="checkbox"
                      checked={assignees.includes(a.id)}
                      onChange={() => handleAssigneeChange(a.id)}
                      className="mr-2"
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-gray-700 text-lg font-semibold mb-2">
                優先度
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg bg-white"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-lg font-semibold mb-2">
                ステータス
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg bg-white"
              >
                <option value="to_do">未着手</option>
                <option value="pending">保留</option>
                <option value="in_progress">進行中</option>
                <option value="in_review">レビュー待ち</option>
                <option value="testing">テスト中</option>
              </select>
            </div>
          </div>

          {/* Dependencies Section */}
          <div className="border-t border-gray-200 pt-5">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-gray-700 text-lg font-semibold">
                タスク間の関係
              </label>
              <button
                type="button"
                onClick={handleAddDependency}
                className="bg-blue-600 text-white hover:bg-blue-700 hover:cursor-pointer
                font-semibold py-2 px-3 rounded-lg text-lg"
              >
                追加 <i className="fa-solid fa-plus ml-1"></i>
              </button>
            </div>

            {dependencies.length === 0 ? (
              <p className="text-gray-500 text-lg italic mb-4">
                このタスクと関係のある他のタスクを追加できます（任意）
              </p>
            ) : (
              dependencies.map((dep, i) => {
                const relatedTask = sampleTasks.find(
                  (t) => t.id === dep.taskId
                );
                return (
                  <div
                    key={i}
                    className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-blue-700 font-bold text-lg">
                        関係 {i + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(i)}
                        className="text-red-500 font-semibold text-lg hover:cursor-pointer hover:text-red-600"
                      >
                        削除
                      </button>
                    </div>

                    {/* Select Existing Task & Relation Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-700 text-lg font-semibold mb-1">
                          関連する既存タスク
                        </label>
                        <select
                          value={dep.taskId}
                          onChange={(e) =>
                            handleDependencyChange(i, "taskId", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-lg bg-white"
                        >
                          <option value="">タスクを選択</option>
                          {sampleTasks.map((task) => (
                            <option key={task.id} value={task.id}>
                              {task.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 text-lg font-semibold mb-1">
                          関係の種類
                        </label>
                        <select
                          value={dep.type}
                          onChange={(e) =>
                            handleDependencyChange(i, "type", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-lg bg-white"
                        >
                          {dependencyTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Relation Preview */}
                    <div className="mt-3 text-lg text-gray-700 flex items-center justify-center gap-2">
                      {relatedTask && newTaskName && (
                        <span>
                          <span className="font-semibold text-green-700">
                            {relatedTask.name}
                          </span>
                          {dep.type === "fts" && " が完了後に "}
                          {dep.type === "ftf" && " が完了後に "}
                          {dep.type === "sts" && " が開始後に "}
                          {dep.type === "stf" && " が開始後に "}
                          <span className="font-semibold text-blue-700">
                            {newTaskName}
                          </span>
                          {dep.type === "fts" && " を開始"}
                          {dep.type === "ftf" && " を完了"}
                          {dep.type === "sts" && " を開始"}
                          {dep.type === "stf" && " を完了"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-extrabold text-lg py-3 rounded-lg 
            hover:cursor-pointer hover:bg-blue-700 transition duration-300 transform hover:scale-105"
          >
            タスクを作成
          </button>
        </form>

        {/* Message */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-lg text-lg text-center ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
