import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Files = () => {
  const navigate = useNavigate();

  // ✅ 表示モード切り替え
  const [viewMode, setViewMode] = useState("list");

  // ✅ 仮データ
  const [files, setFiles] = useState([
    { id: 1, name: "要件定義書.pdf", uploader: "すだち", date: "2025-11-05", size: "1.2MB" },
    { id: 2, name: "設計図.png", uploader: "田中", date: "2025-11-06", size: "2.8MB" },
    { id: 3, name: "進捗報告.docx", uploader: "佐藤", date: "2025-11-07", size: "800KB" },
  ]);

  // ✅ 削除処理
  const handleDelete = (id) => {
    if (!window.confirm("このファイルを削除してもいい？")) return;
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // ✅ 拡張子に応じた画像アイコン
  const getFileIcon = (name) => {
    if (name.endsWith(".pdf")) return "/images/files/pdf.png";
    if (name.endsWith(".png") || name.endsWith(".jpg")) return "/images/files/images.png";
    if (name.endsWith(".docx")) return "/images/files/word.png";
    return "/images/files/file.png";
  };

  return (
    <div className="p-6 space-y-6">

      {/* ✅ ヘッダー */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">共有ファイル</h1>

        <div className="flex gap-3">
          {/* ✅ リスト表示ボタン */}
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg font-semibold border transition
              ${
                viewMode === "list"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
          >
            リスト表示
          </button>

          {/* ✅ カード表示ボタン */}
          <button
            onClick={() => setViewMode("card")}
            className={`px-4 py-2 rounded-lg font-semibold border transition
              ${
                viewMode === "card"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
          >
            カード表示
          </button>

          {/* ✅ アップロード */}
          <button
            onClick={() => navigate("/file-upload")}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow"
          >
            アップロード
          </button>
        </div>
      </div>

      {/* =========================
          ✅ リスト（テーブル）表示
      ========================= */}
      {viewMode === "list" && (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 text-left">ファイル名</th>
                <th className="p-3 text-left">投稿者</th>
                <th className="p-3 text-left">日付</th>
                <th className="p-3 text-left">サイズ</th>
                <th className="p-3 text-center">操作</th>
              </tr>
            </thead>

            <tbody>
              {files.map(file => (
                <tr key={file.id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3">{file.name}</td>
                  <td className="p-3">{file.uploader}</td>
                  <td className="p-3">{file.date}</td>
                  <td className="p-3">{file.size}</td>
                  <td className="p-3 text-center space-x-4">
                    <button className="text-blue-600 hover:underline">
                      ダウンロード
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-red-500 hover:underline"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}

              {files.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">
                    ファイルがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================
          ✅ カード表示
      ========================= */}
      {viewMode === "card" && (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
          {files.map(file => (
            <div
              key={file.id}
              className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition-all border flex flex-col justify-between"
            >
              {/* 上：アイコン＋ファイル名 */}
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={getFileIcon(file.name)}
                  alt="file icon"
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <p className="font-semibold text-lg text-gray-800 truncate w-48">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">{file.size}</p>
                </div>
              </div>

              {/* 中：投稿者・日付 */}
              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>👤 {file.uploader}</span>
                <span>📅 {file.date}</span>
              </div>

              {/* 下：操作 */}
              <div className="flex justify-end gap-3 mt-auto">
                <button className="text-blue-600 hover:underline">
                  ダウンロード
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-red-500 hover:underline"
                >
                  削除
                </button>
              </div>
            </div>
          ))}

          {files.length === 0 && (
            <p className="text-center text-gray-500 col-span-full">
              ファイルがありません
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default Files;