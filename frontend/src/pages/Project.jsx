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
  faEye,
  faPenToSquare,
  faUsers,
  faCalendar,
  faTasks,
  faChartLine,
  faPause,
  faClipboardCheck,
  faVial
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useProject } from "../context/ProjectContext";
import { formatUTC } from "../utils/dateUtils";

const Project = () => {
  const { projects } = useProject();

  console.log(projects)

  // Status mapping from English to Japanese
  const statusMap = {
    planning: "計画中",
    in_progress: "進行中",
    completed: "完了",
  };

  // Get Japanese label for status
  const getStatusLabel = (status) => {
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "in_progress":
      case "進行中":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "completed":
      case "完了":
        return "text-green-700 bg-green-50 border-green-200";
      case "todo":
      case "未着手":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "pending":
      case "保留":
        return "text-orange-700 bg-orange-50 border-orange-200";
      case "in_review":
      case "レビュー待ち":
        return "text-purple-700 bg-purple-50 border-purple-200";
      case "testing":
      case "テスト中":
        return "text-cyan-700 bg-cyan-50 border-cyan-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "in_progress":
      case "進行中":
        return faPlayCircle;
      case "completed":
      case "完了":
        return faCheckCircle;
      case "todo":
      case "未着手":
        return faListUl;
      case "pending":
      case "保留":
        return faPause;
      case "in_review":
      case "レビュー待ち":
        return faClipboardCheck;
      case "testing":
      case "テスト中":
        return faVial;
      default:
        return faExclamationCircle;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              プロジェクト一覧
            </h1>
            <p className="text-xl text-gray-600">チーム全体のプロジェクトを管理</p>
          </div>

          <Link to="/project/new">
            <button className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-2xl font-bold rounded-xl cursor-pointer shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-3 group">
              <FontAwesomeIcon icon={faCirclePlus} className="group-hover:rotate-90 transition-transform duration-200" />
              新規プロジェクト
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-bold text-2xl mb-1">総プロジェクト</p>
                <h2 className="text-5xl font-bold text-gray-900 mt-2">
                  {projects.length}
                </h2>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl group-hover:bg-blue-100 transition-colors">
                <FontAwesomeIcon icon={faTasks} className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-bold text-2xl mb-1">進行中</p>
                <h2 className="text-5xl font-bold text-blue-700 mt-2">
                  {projects.filter((p) => p.status === "in_progress" || p.status === "進行中").length}
                </h2>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl group-hover:bg-blue-100 transition-colors">
                <FontAwesomeIcon icon={faPlayCircle} className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-bold text-2xl mb-1">完了済み</p>
                <h2 className="text-5xl font-bold text-green-600 mt-2">
                  {projects.filter((p) => p.status === "completed" || p.status === "完了").length}
                </h2>
              </div>
              <div className="bg-green-50 p-4 rounded-xl group-hover:bg-green-100 transition-colors">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Project List */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
            <h2 className="text-3xl font-bold text-white flex items-center gap-4">
              <FontAwesomeIcon icon={faChartLine} className="text-blue-600 bg-white p-2 rounded-2xl" />
              プロジェクト詳細
            </h2>
          </div>

          {/* TABLE (PC & tablet) */}
          <div className="overflow-x-auto hidden lg:block">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-left font-semibold text-gray-700 text-lg">プロジェクト名</th>
                  <th className="p-4 text-left font-semibold text-gray-700 text-lg">進捗</th>
                  <th className="p-4 text-left font-semibold text-gray-700 text-lg">ステータス</th>
                  <th className="p-4 text-left font-semibold text-gray-700 text-lg">メンバー</th>
                  <th className="p-4 text-left font-semibold text-gray-700 text-lg">期限</th>
                  <th className="p-4 text-center font-semibold text-gray-700 text-lg">操作</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => (
                  <tr
                    key={project.project_id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex flex-col gap-4">
                        <p className="font-bold text-xl text-gray-900">{project.title}</p>
                        <p className="text-lg text-gray-600 line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="w-32">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                              project.progress === 100
                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                : "bg-gradient-to-r from-blue-500 to-blue-600"
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mt-1.5">
                          {project.progress}%
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 w-24 px-1.5 py-2 rounded-2xl text-lg font-semibold border ${getStatusColor(project.status)}`}>
                        <FontAwesomeIcon icon={getStatusIcon(project.status)} className="text-lg" />
                        {getStatusLabel(project.status)}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUsers} className="text-gray-400 text-lg" />
                        <span className="text-lg text-gray-700">
                          {project.members.map((m) => m.name).join("、")}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendar} className="text-gray-400 text-lg" />
                        <span className="text-lg text-gray-700">
                          {formatUTC(project.deadline)}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {/* <button className="p-2 text-blue-600 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors">
                          <FontAwesomeIcon icon={faEye} />
                        </button> */}
                        <Link to={`/project/${project.project_id}/edit`}>
                          <button className="p-2 text-amber-600 hover:bg-amber-50 cursor-pointer rounded-lg transition-colors">
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </button>
                        </Link>
                        <button className="p-2 text-red-600 hover:bg-red-50 cursor-pointer rounded-lg transition-colors">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARD (Tablet & Smartphone) */}
          <div className="block lg:hidden p-4 space-y-4">
            {projects.map((project) => (
              <div
                key={project.project_id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-xl text-gray-900 flex-1 pr-2">
                    {project.title}
                  </h3>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border shrink-0 ${getStatusColor(project.status)}`}>
                    <FontAwesomeIcon icon={getStatusIcon(project.status)} className="text-sm" />
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-lg text-gray-600 mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-600">進捗状況</p>
                    <p className="text-sm font-bold text-gray-900">{project.progress}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        project.progress === 100
                          ? "bg-gradient-to-r from-green-500 to-green-600"
                          : "bg-gradient-to-r from-blue-500 to-blue-600"
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <FontAwesomeIcon icon={faUsers} />
                      メンバー
                    </p>
                    <p className="text-lg font-medium text-gray-900">
                      {project.members.map((m) => m.name).join("、")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <FontAwesomeIcon icon={faCalendar} />
                      期限
                    </p>
                    <p className="text-lg font-medium text-gray-900">
                      {formatUTC(project.deadline)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                  {/* <button className="px-4 py-2 text-blue-600 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors text-sm font-bold flex items-center gap-2">
                    <FontAwesomeIcon icon={faEye} />
                    表示
                  </button> */}
                  <Link to={`/project/${project.project_id}/edit`}>
                    <button className="px-4 py-2 text-amber-600 cursor-pointer hover:bg-amber-50 rounded-lg transition-colors text-sm font-bold flex items-center gap-2">
                      <FontAwesomeIcon icon={faPenToSquare} />
                      編集
                    </button>
                  </Link>
                  <button className="px-4 py-2 text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors text-sm font-bold flex items-center gap-2">
                    <FontAwesomeIcon icon={faTrash} />
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;