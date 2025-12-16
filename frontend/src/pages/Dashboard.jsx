import { useState, useEffect } from "react";

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalProjects: 5,
    activeTasks: 18,
    completedTasks: 42,
    unreadMessages: 3,
    upcomingMeetings: 2,
  });

  const cards = [
    {
      key: "projects",
      title: "プロジェクト",
      label: "進行中",
      value: summary.totalProjects,
      hint: "👉 プロジェクトを見る",
      gradient: "from-blue-500 to-blue-600",
      icon: "fa-project-diagram",
    },
    {
      key: "tasks",
      title: "今日のタスク",
      label: "やること",
      value: summary.activeTasks,
      hint: "👉 タスクを確認",
      gradient: "from-yellow-400 to-yellow-500",
      icon: "fa-list",
    },
    {
      key: "completed",
      title: "完了したタスク",
      label: "達成!",
      value: summary.completedTasks,
      hint: "🎉 よく頑張りました!",
      gradient: "from-green-500 to-green-600",
      icon: "fa-circle-check",
    },
    {
      key: "messages",
      title: "メッセージ",
      value: summary.unreadMessages,
      hint: "👉 メッセージを開く",
      gradient: "from-purple-500 to-purple-600",
      icon: "fa-message",
      badge:
        summary.unreadMessages > 0 ? (
          <span className="bg-red-500 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
            新着!
          </span>
        ) : null,
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
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-2xl shadow-lg">
              <p className="text-sm opacity-90 mb-1">あなたの達成率</p>
              <p className="text-4xl font-bold">{completionRate}%</p>
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

              <h3 className="text-xl font-bold mb-1">{card.title}</h3>
              <p className="text-4xl font-bold mb-2">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border-2 border-purple-100">
          <div className="flex items-center mb-6">
            <i className="fa-solid fa-bullseye text-3xl text-purple-600 mr-3"></i>
            <h2 className="text-2xl font-bold text-gray-800">今週の進捗状況</h2>
          </div>

          <div className="space-y-5">
            {/* Overall Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-700">
                  全体の進捗
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  {completionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-6 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                  style={{ width: `${completionRate}%` }}
                >
                  <span className="text-white text-xs font-bold">
                    {completionRate >= 20 && "🚀"}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">
                    📱 Webアプリ開発
                  </span>
                  <span className="text-lg font-bold text-blue-600">75%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: "75%" }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">あと5タスクで完了!</p>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">
                    🎨 デザイン課題
                  </span>
                  <span className="text-lg font-bold text-green-600">90%</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: "90%" }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">もうすぐ完成です!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-3xl shadow-sm p-6 border-2 border-orange-100">
            <div className="flex items-center mb-5">
              <i className="fa-solid fa-chart-line text-3xl text-orange-600 mr-3"></i>
              <h2 className="text-2xl font-bold text-gray-800">最近の活動</h2>
            </div>

            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-2 border-transparent hover:border-orange-200"
                >
                  <div className="text-3xl flex-shrink-0">{activity.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-medium leading-relaxed">
                      {activity.text}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <i className="fa-solid fa-clock text-xs mr-1"></i>
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-white rounded-3xl shadow-sm p-6 border-2 border-green-100">
            <div className="flex items-center mb-5">
              <i className="fa-solid fa-calendar-days text-3xl text-green-600 mr-3"></i>
              <h2 className="text-2xl font-bold text-gray-800">今週の予定</h2>
            </div>

            <div className="space-y-4">
              {/* Meeting 1 */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-2xl border-2 border-blue-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      📋 UI設計ミーティング
                    </h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span className="font-semibold">10月14日（月）</span>
                      </p>
                      <p className="flex items-center">
                        <span className="mr-2">⏰</span>
                        <span>10:00〜11:30</span>
                      </p>
                      <p className="flex items-center">
                        <span className="mr-2">👥</span>
                        <span>5人参加予定</span>
                      </p>
                    </div>
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                  詳細を見る
                </button>
              </div>

              {/* Meeting 2 */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-2xl border-2 border-purple-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      👨‍💼 クライアントレビュー
                    </h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span className="font-semibold">10月16日（水）</span>
                      </p>
                      <p className="flex items-center">
                        <span className="mr-2">⏰</span>
                        <span>14:00〜15:00</span>
                      </p>
                      <p className="flex items-center">
                        <span className="mr-2">👥</span>
                        <span>8人参加予定</span>
                      </p>
                    </div>
                  </div>
                </div>
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition">
                  詳細を見る
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Footer */}
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-3xl shadow-lg p-6 md:p-8 text-white text-center">
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
    </div>
  );
};

export default Dashboard;
