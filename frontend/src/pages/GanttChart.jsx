import { useState, useEffect } from "react";
import { FrappeGantt } from "frappe-gantt-react";
import "frappe-gantt-react/node_modules/frappe-gantt/src/gantt.scss";
import "../styles/gantt-custom.css";
import { CURRENT_PROJECT_ID } from "../constants";
import { getTasks } from "../services/TaskService";
import { useProject } from "../context/ProjectContext";

export default function GanttChart() {
  const { currentProject } = useProject();
  const currentProjectId = localStorage.getItem(CURRENT_PROJECT_ID);
  const [viewMode, setViewMode] = useState("Day");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [currentProject?.project_id]);

  useEffect(() => {
    console.log(tasks)
  }, [tasks])

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      setAnimate(false); // Reset animation while loading new tasks

      const response = await getTasks(currentProjectId);
      const transformedTasks = transformTasksForGantt(response);
      setTasks(transformedTasks);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);

      // Trigger animation AFTER a small delay
      setTimeout(() => setAnimate(true), 100);
    }
  };

  const transformTasksForGantt = (apiTasks) => {
    // Handle both single task object and array of tasks
    const taskArray = Array.isArray(apiTasks) ? apiTasks : [apiTasks];

    return taskArray.map((task) => {
      // Calculate progress based on status
      const progressMap = {
        completed: 100,
        in_progress: 50,
        todo: 0,
      };

      // Use deadline as end date, calculate start date (7 days before as default)
      const endDate = new Date(task.deadline);
      const startDate = new Date(task.start_date);
      // startDate.setDate(startDate.getDate() - 7); // Default 7-day duration

      return {
        id: task.task_id,
        name: task.name,
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
        progress: progressMap[task.status] || 0,
        custom_class: task.priority === "high" ? "bar-milestone" : "",
      };
    });
  };

  const handleRefresh = () => {
    fetchTasks();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-semibold">タイムライン</h1>
      </div>

      {/* 設定パネル */}
      <div className="bg-white w-xs p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <label className="font-bold text-xl">表示モード：</label>
          <select
            className="border rounded px-3 py-2 text-lg"
            onChange={(e) => setViewMode(e.target.value)}
            value={viewMode}
          >
            {/* <option value="Quarter Day">6時間単位</option>
            <option value="Half Day">12時間単位</option> */}
            <option value="Day">日単位</option>
            <option value="Week">週単位</option>
            <option value="Month">月単位</option>
          </select>
        </div>
      </div>

      {/* カラー凡例 */}
      <div className="pb-6 flex flex-col items-center">
        <div className="flex gap-10 font-bold">
          <div className="flex items-center gap-3">
            <div className="w-8 h-4 bg-[#4285f4] rounded"></div>
            <span className="text-lg">タスク全体</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-4 bg-[#0f4a9d] rounded opacity-80"></div>
            <span className="text-lg">完了した進捗</span>
          </div>
        </div>
      </div>

      {/* ガントチャート表示エリア */}
      <div className="bg-white p-4 rounded shadow-md">
        {loading ? (
          <div className="bg-gray-100 text-gray-600 p-10 text-center rounded">
            <h1 className="text-2xl font-semibold">読み込み中...</h1>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-10 text-center rounded">
            <h1 className="text-2xl font-semibold">エラーが発生しました</h1>
            <p className="text-base mt-2">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              再試行
            </button>
          </div>
        ) : tasks.length > 0 ? (
          <FrappeGantt
            tasks={tasks}
            viewMode={viewMode}
            onClick={(task) => console.log("クリック:", task)}
            onDateChange={(task, start, end) =>
              console.log("日付変更:", task, start, end)
            }
            onProgressChange={(task, progress) =>
              console.log("進捗変更:", task, progress)
            }
            onTasksChange={(newTasks) => console.log("変更:", newTasks)}
          />
        ) : (
          <div className="bg-gray-100 text-gray-600 p-10 text-center rounded">
            <h1 className="text-2xl font-semibold">データがありません</h1>
            <h3 className="text-base mt-2">タスクを追加してください。</h3>
          </div>
        )}
      </div>
    </div>
  );
}
