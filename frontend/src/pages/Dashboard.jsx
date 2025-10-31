import { useState, useEffect } from "react";

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalProjects: 5,
    activeTasks: 18,
    completedTasks: 42,
    unreadMessages: 3,
    upcomingMeetings: 2,
  });

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, text: "プロジェクト『Webアプリ開発』に新しいタスクを追加しました", time: "2時間前" },
    { id: 2, text: "山田さんが『デザインレビュー』を完了しました", time: "5時間前" },
    { id: 3, text: "新しいチャットメッセージが届いています", time: "昨日" },
  ]);

  useEffect(() => {
    // Fetch dashboard data here (e.g., from API)
    // setSummary(...); setRecentActivities(...);
  }, []);

  return (
    <div className="space-y-8 p-2 md:p-4">
      {/* Page Title */}
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-800">
        ダッシュボード
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Projects */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-semibold">プロジェクト数</p>
              <h2 className="text-3xl font-bold text-blue-700 mt-1">{summary.totalProjects}</h2>
            </div>
            <i className="fa-solid fa-diagram-project text-3xl text-blue-600"></i>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-semibold">進行中のタスク</p>
              <h2 className="text-3xl font-bold text-yellow-600 mt-1">{summary.activeTasks}</h2>
            </div>
            <i className="fa-solid fa-list-check text-3xl text-yellow-500"></i>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-semibold">完了タスク</p>
              <h2 className="text-3xl font-bold text-green-600 mt-1">{summary.completedTasks}</h2>
            </div>
            <i className="fa-solid fa-circle-check text-3xl text-green-500"></i>
          </div>
        </div>

        {/* Unread Messages */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-semibold">未読メッセージ</p>
              <h2 className="text-3xl font-bold text-red-600 mt-1">{summary.unreadMessages}</h2>
            </div>
            <i className="fa-solid fa-envelope text-3xl text-red-500"></i>
          </div>
        </div>
      </div>

      {/* Recent Activities & Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2 border-gray-200">
            最近のアクティビティ
          </h2>
          <ul className="divide-y divide-gray-100">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="py-3 flex items-start space-x-3">
                <i className="fa-solid fa-circle text-blue-500 text-xs mt-1"></i>
                <div>
                  <p className="text-gray-800 font-medium">{activity.text}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2 border-gray-200">
            近日のミーティング
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <div>
                <p className="font-semibold text-gray-800">UI設計ミーティング</p>
                <p className="text-sm text-gray-600">10月14日（月）10:00〜</p>
              </div>
              <i className="fa-solid fa-calendar-day text-blue-600 text-2xl"></i>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <div>
                <p className="font-semibold text-gray-800">クライアントレビュー</p>
                <p className="text-sm text-gray-600">10月16日（水）14:00〜</p>
              </div>
              <i className="fa-solid fa-calendar-check text-blue-600 text-2xl"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
