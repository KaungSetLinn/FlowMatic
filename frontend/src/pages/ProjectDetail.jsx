import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendar,
  faUsers,
  faUserPlus,
  faTrash,
  faSave,
  faTimes,
  faCheckCircle,
  faPlayCircle,
  faListUl,
  faPause,
  faClipboardCheck,
  faVial,
  faEnvelope,
  faCrown,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import MemberInvitationModal from "./MemberInvitationModal";
import { useNavigate, useParams } from "react-router-dom";
import { useProject } from "../context/ProjectContext";
import { MobileDateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { updateProject } from "../services/ProjectService";
import { resolveImageUrl } from "../utils/resolveImageUrl";
dayjs.extend(utc);

const ProjectDetail = () => {
  const { projects, updateProjectInContext } = useProject();
  const navigate = useNavigate();
  const { projectId } = useParams();

  // Initialize with proper default values
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    start_date: "",
    deadline: "",
    progress: 0,
    status: "planning",
    members: [],
    project_id: "",
  });

  const normalizeProject = (project) => ({
    ...project,
    members: (project.members || []).map((m) => ({
      ...m,
      user_id: Number(m.user_id),
      profile_picture: resolveImageUrl(m.profile_picture),
    })),
  });

  useEffect(() => {
    const filteredProjects = projects.filter((p) => p.project_id === projectId);

    // Get the first matching project (if it exists)
    if (filteredProjects.length > 0) {
      const project = filteredProjects[0];

      console.log(project);

      // todo: update project context as well
      setProjectData(normalizeProject(project));
    }
  }, [projects, projectId]);

  const invitationModalRef = useRef(null);

  const statusOptions = [
    { value: "planning", label: "計画中", icon: faListUl, color: "amber" },
    {
      value: "in_progress",
      label: "進行中",
      icon: faPlayCircle,
      color: "blue",
    },
    { value: "completed", label: "完了", icon: faCheckCircle, color: "green" },
  ];

  const handleInputChange = (field, value) => {
    setProjectData({ ...projectData, [field]: value });
  };

  const handleRemoveMember = (memberId) => {
    setProjectData({
      ...projectData,
      members: projectData.members.filter((m) => m.user_id !== memberId),
    });
  };

  const handleSave = async () => {
    try {
      const payload = buildUpdatePayload(projectData);

      const updatedProject = await updateProject(
        projectData.project_id,
        payload
      );

      const normalized = normalizeProject(updatedProject);

      // ✅ update local page state
      setProjectData(normalized);

      // ✅ update ProjectContext state
      updateProjectInContext(normalized);

      alert("プロジェクトを更新しました！");

      navigate("/project");
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    }
  };

  const buildUpdatePayload = (projectData) => ({
    title: projectData.title,
    description: projectData.description,
    start_date: projectData.start_date || null,
    deadline: projectData.deadline || null,
    progress: projectData.progress,
    status: projectData.status,
    members: projectData.members.map((m) => m.user_id), // ✅ only IDs
  });

  const openInvitationModal = () => {
    if (invitationModalRef.current) {
      invitationModalRef.current.openModal();
    }
  };

  // Add loading state check
  if (!projectData.project_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 hover:cursor-pointer
                rounded-lg text-xl transition duration-200 shadow w-auto"
        >
          ← 戻る
        </button>
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900">
              プロジェクト編集
            </h1>
            <p className="text-xl text-gray-600 mt-1">
              プロジェクトの詳細とメンバーを管理
            </p>
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faSave} />
            保存
          </button>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-6">
          {/* Project Title */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              プロジェクト名
            </label>
            <input
              type="text"
              value={projectData.title || ""}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="プロジェクト名を入力"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              説明
            </label>
            <textarea
              value={projectData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows="4"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="プロジェクトの説明を入力"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              ステータス
            </label>
            <select
              value={projectData.status || "planning"}
              onChange={(e) => handleInputChange("status", e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date and Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                開始日
              </label>
              <MobileDateTimePicker
                label="開始日を設定してください"
                value={
                  projectData.start_date
                    ? dayjs.utc(projectData.start_date)
                    : null
                }
                onChange={(newValue) => {
                  if (newValue && newValue.isValid()) {
                    handleInputChange(
                      "start_date",
                      newValue.utc().toISOString()
                    );
                  } else {
                    handleInputChange("start_date", "");
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    className:
                      "w-full px-3 py-2 border border-gray-300 text-xl rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  },
                }}
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                期限
              </label>
              <MobileDateTimePicker
                label="締切日を設定してください"
                value={
                  projectData.deadline ? dayjs.utc(projectData.deadline) : null
                }
                onChange={(newValue) => {
                  if (newValue && newValue.isValid()) {
                    handleInputChange("deadline", newValue.utc().toISOString());
                  } else {
                    handleInputChange("deadline", "");
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    className:
                      "w-full px-3 py-2 border border-gray-300 text-xl rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  },
                }}
              />
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              進捗状況: {projectData.progress || 0}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={projectData.progress || 0}
              onChange={(e) =>
                handleInputChange("progress", parseInt(e.target.value))
              }
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  projectData.progress === 100
                    ? "bg-gradient-to-r from-green-500 to-green-600"
                    : "bg-gradient-to-r from-blue-500 to-blue-600"
                }`}
                style={{ width: `${projectData.progress || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
              メンバー管理
              <span className="text-lg font-normal text-gray-500">
                ({projectData.members?.length || 0}人)
              </span>
            </h2>
            <button
              onClick={openInvitationModal}
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 cursor-pointer text-white text-lg font-bold rounded-xl shadow-md hover:shadow-lg hover:from-green-700 hover:to-green-800 transition-all flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faUserPlus} />
              メンバーを招待
            </button>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {projectData.members && projectData.members.length > 0 ? (
              projectData.members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    {member.profile_picture ? (
                      <img
                        src={member.profile_picture}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {member.name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg text-gray-900">
                          {member.name}
                        </p>
                        {member.role === "owner" && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={faCrown}
                              className="text-xs"
                            />
                            オーナー
                          </span>
                        )}
                        {member.role === "admin" && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                            管理者
                          </span>
                        )}
                        {member.pending && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                            招待中
                          </span>
                        )}
                      </div>
                      {member.email && (
                        <p className="text-base text-gray-600 flex items-center gap-2">
                          <FontAwesomeIcon
                            icon={faEnvelope}
                            className="text-xs"
                          />
                          {member.email}
                        </p>
                      )}
                    </div>
                  </div>
                  {member.role !== "owner" && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-lg" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                メンバーがいません
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Member Invitation Modal */}
      <MemberInvitationModal
        ref={invitationModalRef}
        projectId={projectData.project_id}
        existingMembers={projectData.members}
        onInvitationSuccess={(users, role) => {
          // Update members list when invitation succeeds
          const newMembers = users.map((user) => ({
            user_id: user.id,
            name: user.username,
            email: user.email,
            profile_picture: resolveImageUrl(user.profile_picture),
            role: role,
            pending: true,
          }));
          setProjectData({
            ...projectData,
            members: [...projectData.members, ...newMembers],
          });
        }}
      />
    </div>
  );
};

export default ProjectDetail;
