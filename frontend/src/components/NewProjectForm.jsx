import { MobileDateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NewProjectForm() {
  const navigate = useNavigate();

  const inputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: dayjs().toISOString(), // default to now
    deadline: "",
    status: "planning",
    members: [],
  });

  const statusOptions = [
    { value: "planning", label: "計画中" },
    { value: "in_progress", label: "進行中" },
    { value: "completed", label: "完了" },
  ];

  // 仮のメンバーデータ（実際はAPIから取得）
  const availableMembers = [
    { id: "uuid-1", name: "山田 太郎" },
    { id: "uuid-2", name: "佐藤 花子" },
    { id: "uuid-3", name: "鈴木 一郎" },
    { id: "uuid-4", name: "田中 美咲" },
  ];

  useEffect(() => {
    inputRef.current?.focus();
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMemberChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({
      ...prev,
      members: selectedOptions,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // API送信用データの作成
    const submitData = {
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      deadline: formData.deadline,
      status: formData.status,
      members: formData.members,
      // progressはサーバー側で自動的に0が設定される
    };

    console.log("送信データ:", submitData);
    // ここでAPIリクエストを送信
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return dateString.slice(0, 16); // YYYY-MM-DDThh:mm 形式に変換
  };

  const handleDateChange = (name, newValue) => {
    setFormData((prev) => ({
      ...prev,
      [name]: newValue ? newValue.toISOString() : "",
    }));
  };

  return (
    <div className="flex flex-col items-center max-w-full md:max-w-5xl mx-auto justify-center min-h-screen p-4 sm:p-6 lg:p-8 relative">
      {/* Back Button */}
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
          {/* タイトル入力 */}
          <div>
            <label htmlFor="title" className="block text-xl font-bold  mb-3">
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

          {/* 説明入力 */}
          <div>
            <label
              htmlFor="description"
              className="block text-xl font-bold  mb-3"
            >
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
            <label
              htmlFor="startDate"
              className="block text-xl font-bold  mb-3"
            >
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

          {/* 締切日 */}
          <div>
            <label htmlFor="deadline" className="block text-xl font-bold  mb-3">
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

          {/* ステータス選択 */}
          <div>
            <label htmlFor="status" className="block text-xl font-bold  mb-3">
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

          {/* メンバー選択 */}
          <div>
            <label htmlFor="members" className="block text-xl font-bold  mb-3">
              メンバー
            </label>
            <select
              id="members"
              name="members"
              multiple
              value={formData.members}
              onChange={handleMemberChange}
              className="w-full px-3 py-2 border border-gray-300 text-xl rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
            >
              {availableMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xl text-gray-500">
              {formData.members.length}人のメンバーが選択されています
            </p>
          </div>

          {/* 送信ボタン */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              プロジェクトを作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
