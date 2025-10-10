import { useEffect, useState } from "react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import NewTaskForm from "./NewTaskForm";

function Home() {
    const { setIsAuthorized, user } = useAuth();
    const navigate = useNavigate();

    // サイドバー開閉
  // -------------------------------
  const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const handleLogout = () => {
        localStorage.clear();
        setIsAuthorized(false);
        navigate("/login");
    };

    useEffect(() => {
        console.log(user)
        console.log(localStorage.getItem(ACCESS_TOKEN))
        console.log(localStorage.getItem(REFRESH_TOKEN))
    }, []);

    return (
    <div className="font-sans bg-gray-100 min-h-screen flex">
      {/* サイドバー */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white flex flex-col transition-transform duration-300 z-40 ${
          sidebarOpen ? "" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 text-xl font-bold border-b border-gray-700">
          新庄剛志タスク管理
        </div>
        <ul className="flex-1 p-4 space-y-3 sidebar-menu">
          {[
            { href: "/", icon: "fas fa-tachometer-alt", label: "ダッシュボード" },
            { href: "/project", icon: "fas fa-project-diagram", label: "プロジェクト" },
            { href: "/task", icon: "fas fa-tasks", label: "タスク" },
            { href: "/chat", icon: "fas fa-comments", label: "チャット" },
            { href: "/calendar", icon: "fas fa-calendar-alt", label: "カレンダー" },
          ].map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700"
              >
                <i className={item.icon}></i> {item.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 ml-0 md:ml-64 p-8 overflow-y-auto">
        <div className="bg-white shadow rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <i className="fas fa-plus-circle text-blue-500"></i> 新規タスク作成
          </h1>

          <NewTaskForm />
        </div>
      </main>

      {/* モバイルメニューボタン */}
      <button
        className="fixed top-4 left-4 md:hidden z-50 bg-white p-2 rounded-lg shadow"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>
    </div>
  );

}

export default Home;

