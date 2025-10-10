import { Outlet } from "react-router-dom";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { setIsAuthorized } = useAuth();

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthorized(false);
    window.location.href = "/login";
  };

  const menuItems = [
    {
      to: "/",
      icon: "fas fa-tachometer-alt",
      label: "ダッシュボード",
    },
    {
      to: "/project",
      icon: "fas fa-project-diagram",
      label: "プロジェクト",
    },
    { to: "/task", icon: "fas fa-tasks", label: "タスク" },
    { to: "/chat", icon: "fas fa-comments", label: "チャット" },
    {
      to: "/calendar",
      icon: "fas fa-calendar-alt",
      label: "カレンダー",
    },
  ];

  return (
    <div className="flex bg-gray-100 min-h-screen font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-blue-800 text-white flex flex-col transition-transform duration-300 z-40 ${
          sidebarOpen ? "" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 text-4xl font-bold border-b border-blue-700">
          FlowMatic
        </div>

        <ul className="flex-1 p-4 space-y-3">
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 p-2 rounded-lg font-bold hover:cursor-pointer
                text-xl hover:bg-blue-700  ${
                    isActive ? "bg-blue-500" : ""
                  }`
                }
              >
                <i className={item.icon}></i>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          onClick={handleLogout}
          className="m-4 p-2 bg-red-600 hover:bg-red-700 hover:cursor-pointer
          text-lg font-bold rounded-lg text-white"
        >
          ログアウト
        </button>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        {/* <header className="bg-white shadow p-4 flex items-center justify-between">
          <button
            className="md:hidden p-2 rounded bg-gray-200"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="text-xl font-bold">タスク管理システム</h1>
        </header> */}

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
