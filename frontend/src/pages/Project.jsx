import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faCirclePlus,
  faCommentDots,
  faExclamationCircle,
  faListUl,
  faPen,
  faPlayCircle,
  faPlusCircle,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const Project = () => {
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "FlowMatic開発",
      description: "チームコラボレーションとタスク管理機能を統合した社内システム。",
      status: "進行中",
      progress: 75,
      members: ["山田", "田中", "佐藤"],
      deadline: "2025-11-10",
    },
    {
      id: 2,
      name: "モバイルアプリ設計",
      description: "スマートフォン向けUI/UX改善プロジェクト。",
      status: "計画中",
      progress: 10,
      members: ["鈴木", "川口"],
      deadline: "2025-12-05",
    },
    {
      id: 3,
      name: "クライアントB向けWebリニューアル",
      description: "既存サイトの全面リデザインとCMS移行。",
      status: "完了",
      progress: 100,
      members: ["山田", "岡田", "森"],
      deadline: "2025-09-28",
    },
  ]);

  useEffect(() => {
    // TODO: Replace with API fetch (e.g. axios.get("/api/projects"))
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "進行中":
        return "text-blue-600 bg-blue-100";
      case "完了":
        return "text-green-600 bg-green-100";
      case "計画中":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-8 w-full mx-auto p-2 md:p-4">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-800">プロジェクト一覧</h1>
        
        <Link to="/project/new">
        <button className="px-4 py-3 bg-blue-600 text-white font-bold text-xl rounded-lg shadow hover:cursor-pointer hover:bg-blue-700 transition">
          <FontAwesomeIcon icon={faCirclePlus} className="mr-3" />
          新規プロジェクト
        </button>
        </Link>
      </div>

      {/* Project Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow hover:shadow-md transition">
          <p className="text-gray-500 font-semibold">総プロジェクト</p>
          <h2 className="text-3xl font-bold text-blue-700 mt-1">{projects.length}</h2>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow hover:shadow-md transition">
          <p className="text-gray-500 font-semibold">進行中</p>
          <h2 className="text-3xl font-bold text-yellow-600 mt-1">
            {projects.filter((p) => p.status === "進行中").length}
          </h2>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow hover:shadow-md transition">
          <p className="text-gray-500 font-semibold">完了済み</p>
          <h2 className="text-3xl font-bold text-green-600 mt-1">
            {projects.filter((p) => p.status === "完了").length}
          </h2>
        </div>
      </div>

      {/* Project List */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2">
          プロジェクト詳細
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-blue-50 text-gray-700 text-left">
                <th className="p-3 font-semibold">プロジェクト名</th>
                <th className="p-3 font-semibold">進捗</th>
                <th className="p-3 font-semibold">ステータス</th>
                <th className="p-3 font-semibold">メンバー</th>
                <th className="p-3 font-semibold">期限</th>
                <th className="p-3 font-semibold text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-3">
                    <p className="font-bold text-gray-800">{project.name}</p>
                    <p className="text-sm text-gray-500">
                      {project.description}
                    </p>
                  </td>

                  {/* Progress Bar */}
                  <td className="p-3">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          project.progress === 100
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {project.progress}%
                    </p>
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </td>

                  {/* Members */}
                  <td className="p-3 text-gray-700">
                    {project.members.join("、")}
                  </td>

                  {/* Deadline */}
                  <td className="p-3 text-gray-600">{project.deadline}</td>

                  {/* Actions */}
                  <td className="p-3 text-center space-x-3">
                    <button className="text-blue-600 hover:text-blue-800 transition">
                      <i className="fa-solid fa-eye"></i>
                    </button>
                    <button className="text-yellow-600 hover:text-yellow-800 transition">
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button className="text-red-600 hover:text-red-800 transition">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}

              {projects.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center text-gray-500 py-6 font-medium"
                  >
                    プロジェクトがまだ登録されていません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Project;
