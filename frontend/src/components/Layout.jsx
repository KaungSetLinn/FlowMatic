import { Outlet, NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { CURRENT_USER } from "../constants";
import { useAuth } from "../context/AuthContext";
import { useProject } from "../context/ProjectContext";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, setIsAuthorized } = useAuth();
  const [username, setUsername] = useState("");

  const { projects, currentProject, handleProjectChange, loading } = useProject();

  if (loading) return <div className="p-6 text-gray-600">Loading projects...</div>;

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthorized(false);
    window.location.href = "/login";
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const userString = localStorage.getItem(CURRENT_USER);

    if (userString) {
      const user = JSON.parse(userString);
      setUsername(user.username);
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuItems = [
    { to: "/", icon: "fas fa-tachometer-alt", label: "ダッシュボード" },
    { to: "/project", icon: "fas fa-project-diagram", label: "プロジェクト" },
    { to: "/task", icon: "fas fa-tasks", label: "タスク" },
    { to: "/files", icon: "fas fa-file", label: "共有ファイル" },
    { to: "/chat", icon: "fas fa-comments", label: "チャット" },
    { to: "/calendar", icon: "fas fa-calendar-alt", label: "カレンダー" },
    { to: "/account", icon: "fas fa-gear", label: "アカウント設定" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white flex flex-col shadow-xl z-40 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 hidden md:block text-3xl font-extrabold tracking-wide border-b border-blue-700">
          FlowMatic
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"} // ✅ only exact match for Dashboard
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-6 p-3 rounded-lg text-xl font-bold transition-all duration-200 hover:bg-blue-700 hover:translate-x-1 ${
                  isActive ? "bg-blue-600 shadow-inner" : "text-blue-100"
                }`
              }
            >
              <i className={`${item.icon} text-xl`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="m-4 mt-auto p-3 bg-red-600 hover:bg-red-700 text-white text-lg hover:cursor-pointer
          font-semibold rounded-lg shadow-md transition-all duration-200"
        >
          <i className="fa-solid fa-right-from-bracket mr-2"></i>
          ログアウト
        </button>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
        {/* Mobile Header (Blue Bar) */}
        <header className="bg-blue-800 text-white flex items-center justify-between p-4 shadow-md md:hidden sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded hover:bg-blue-700 hover:cursor-pointer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="fas fa-bars text-2xl"></i>
            </button>
            <h1 className="text-2xl font-bold tracking-wide">FlowMatic</h1>
          </div>
          <div>
            <i className="fa-solid fa-bell text-3xl mr-2"></i>
          </div>
        </header>

        {/* Header visible on both desktop and mobile */}
        <header className="bg-white shadow-sm flex items-center p-4 sticky top-14 md:top-0 z-30">
          {/* On mobile, this sits below blue bar (top-14), on desktop it's top-0 */}
          <span className="text-lg font-bold">現在のプロジェクト：</span>
          <select
            value={currentProject?.id || ""}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-lg bg-white hover:cursor-pointer"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
