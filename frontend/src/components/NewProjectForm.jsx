import { faCircleXmark, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MobileDateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../services/UserService";

export default function NewProjectForm() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [availableMembers, setAvailableMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: dayjs().toISOString(),
    deadline: "",
    status: "planning",
    members: [],
  });

  const statusOptions = [
    { value: "planning", label: "計画中" },
    { value: "in_progress", label: "進行中" },
    { value: "completed", label: "完了" },
  ];

  const filteredMembers = useMemo(() => {
    const excludedIds = new Set(formData.members);

    const unselectedMembers = availableMembers.filter(
      (member) => !excludedIds.has(member.id)
    );

    if (!searchQuery.trim()) return unselectedMembers;

    const query = searchQuery.toLowerCase();
    return unselectedMembers.filter(
      (member) =>
        member.username.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
    );
  }, [searchQuery, availableMembers, formData.members]);

  useEffect(() => {
    inputRef.current?.focus();

    const fetchUsers = async () => {
      try {
        const users = await getUsers();
        console.log(users);
        setAvailableMembers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, members: selectedOptions }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = {
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      deadline: formData.deadline,
      status: formData.status,
      members: formData.members,
    };

    console.log("送信データ:", submitData);
  };

  const handleDateChange = (name, newValue) => {
    setFormData((prev) => ({
      ...prev,
      [name]: newValue ? newValue.toISOString() : "",
    }));
  };

  return (
    <div className="flex flex-col items-center max-w-full md:max-w-5xl mx-auto justify-center min-h-screen p-4 sm:p-6 lg:p-8 relative">
      <div className="w-full mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 hover:cursor-pointer
                rounded-lg text-xl transition duration-200 shadow w-auto"
        >
          ← 戻る
        </button>
      </div>

      <div className="w-full p-6 md:p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6 text-center">
          新規プロジェクト作成
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* タイトル */}
          <div>
            <label htmlFor="title" className="block text-xl font-bold mb-3">
              タイトル
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              ref={inputRef}
              required
              className="w-full px-3 py-2 border border-gray-300 text-xl rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="プロジェクトの名称を入力"
            />
          </div>

          {/* 説明 */}
          <div>
            <label htmlFor="description" className="block text-xl font-bold mb-3">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 text-xl rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="プロジェクトの目的や概要を入力"
            />
          </div>

          {/* 開始日 */}
          <div>
            <label htmlFor="startDate" className="block text-xl font-bold mb-3">
              開始日
            </label>
            <MobileDateTimePicker
              label="開始日を設定してください"
              value={formData.startDate ? dayjs(formData.startDate) : null}
              onChange={(newValue) => handleDateChange("startDate", newValue)}
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

          {/* 締切 */}
          <div>
            <label htmlFor="deadline" className="block text-xl font-bold mb-3">
              締切日
            </label>
            <MobileDateTimePicker
              label="締切日を設定してください"
              value={formData.deadline ? dayjs(formData.deadline) : null}
              onChange={(newValue) => handleDateChange("deadline", newValue)}
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

          {/* ステータス */}
          <div>
            <label htmlFor="status" className="block text-xl font-bold mb-3">
              ステータス
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 text-xl rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* メンバー選択（frontend version kept!) */}
          <div>
            <label className="block text-xl font-bold mb-3">メンバー</label>

            {/* Search box */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="メンバー名で検索して追加..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Search results */}
            {searchQuery && filteredMembers.length > 0 && (
              <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden shadow-lg">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600">
                    検索結果 ({filteredMembers.length}件)
                  </h3>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredMembers
                    .filter((member) => !formData.members.includes(member.id))
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            members: [...prev.members, member.id],
                          }));
                          setSearchQuery("");
                        }}
                      >
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {member.username.charAt(0)}
                          </div>
                          <span className="text-lg font-bold ml-2">
                            {member.username}
                          </span>
                          <span className="text-sm font-bold text-gray-500 ml-4">
                            {member.email}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData((prev) => ({
                              ...prev,
                              members: [...prev.members, member.id],
                            }));
                            setSearchQuery("");
                          }}
                          className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* No results */}
            {searchQuery && filteredMembers.length === 0 && (
              <div className="mb-4 p-4 text-center font-bold text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-xl mb-1">メンバーが見つかりません</div>
                <div className="text-lg">検索条件を変えてお試しください</div>
              </div>
            )}

            {/* Selected members */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-700">
                  選択されたメンバー 『{formData.members.length} 名』
                </h3>
                {formData.members.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, members: [] }));
                    }}
                    className="text-lg text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded transition-colors cursor-pointer"
                  >
                    すべてクリア
                  </button>
                )}
              </div>

              {formData.members.length > 0 ? (
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-gray-200 rounded-lg bg-gray-50">
                  {formData.members.map((memberId) => {
                    const member = availableMembers.find(
                      (m) => m.id === memberId
                    );
                    return member ? (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-300 shadow-sm"
                      >
                        {member.profile_picture ? (
                          <img
                            src={member.profile_picture}
                            alt={member.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                            {member.username.charAt(0)}
                          </div>
                        )}

                        <span className="text-lg font-bold">
                          {member.username}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              members: prev.members.filter(
                                (id) => id !== member.id
                              ),
                            }));
                          }}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <FontAwesomeIcon icon={faCircleXmark} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="min-h-[60px] p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                  <p className="text-gray-500 text-lg">
                    メンバーが選択されていません
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 送信 */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-2xl text-white font-bold rounded-md cursor-pointer hover:scale-[1.05] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
            >
              プロジェクトを作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
