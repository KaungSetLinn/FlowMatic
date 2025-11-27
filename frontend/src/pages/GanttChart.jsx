import { useState } from "react";
import { FrappeGantt } from "frappe-gantt-react";
import "frappe-gantt-react/node_modules/frappe-gantt/src/gantt.scss";
import "../styles/gantt-custom.css";

export default function GanttChart() {
  const [viewMode, setViewMode] = useState("Day");

  const tasks = [
    {
      id: "Task 1",
      name: "プロジェクト計画",
      start: "2025-11-18",
      end: "2025-11-22",
      progress: 100,
      custom_class: "bar-milestone",
    },
    {
      id: "Task 2",
      name: "要件定義・分析",
      start: "2025-11-20",
      end: "2025-11-29",
      progress: 100,
    },
    {
      id: "Task 3",
      name: "デザイン設計",
      start: "2025-11-25",
      end: "2025-12-08",
      progress: 60,
    },
    {
      id: "Task 4",
      name: "UIモックアップ作成",
      start: "2025-11-28",
      end: "2025-12-10",
      progress: 40,
    },
    {
      id: "Task 5",
      name: "デザインレビュー",
      start: "2025-12-10",
      end: "2025-12-12",
      progress: 0,
      custom_class: "bar-milestone",
    },
    {
      id: "Task 6",
      name: "フロントエンド開発",
      start: "2025-12-05",
      end: "2025-12-25",
      progress: 20,
    },
    {
      id: "Task 7",
      name: "バックエンド開発",
      start: "2025-12-08",
      end: "2026-01-05",
      progress: 15,
    },
    {
      id: "Task 8",
      name: "API統合",
      start: "2025-12-20",
      end: "2026-01-08",
      progress: 0,
    },
    {
      id: "Task 9",
      name: "テスト・QA",
      start: "2025-12-28",
      end: "2026-01-10",
      progress: 0,
    },
    {
      id: "Task 10",
      name: "最終レビュー",
      start: "2026-01-08",
      end: "2026-01-12",
      progress: 0,
      custom_class: "bar-milestone",
    },
    {
      id: "Task 11",
      name: "リリース",
      start: "2026-01-12",
      end: "2026-01-16",
      progress: 0,
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-4xl font-semibold mb-6">タイムライン</h1>

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
      <div className="pt-6 flex flex-col items-center">
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
      <div className="mt-6 bg-white p-4 rounded shadow-md">
        {tasks.length > 0 ? (
          <FrappeGantt
            /* customPopupHTML={(task) =>
              `<div style="padding:10px;">
                <strong>${task.name}</strong><br>
                🗓 ${task.start} ~ ${task.end}<br>
                📌 進捗: ${task.progress}%
              </div>`
            } */
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
