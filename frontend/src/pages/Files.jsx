import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Files = () => {
  const navigate = useNavigate();

  // 仮データ
  const [files] = useState([
    { id: 1, name: "要件定義書.pdf", uploader: "すだち", date: "2025-11-05", size: "1.2MB" },
    { id: 2, name: "設計図.png", uploader: "田中", date: "2025-11-06", size: "2.8MB" },
    { id: 3, name: "進捗報告.docx", uploader: "佐藤", date: "2025-11-07", size: "800KB" },
  ]);

  // 拡張子に応じた画像アイコン
  const getFileIcon = (name) => {
    if (name.endsWith(".pdf")) return "/images/files/pdf.png";
    if (name.endsWith(".png") || name.endsWith(".jpg")) return "/images/files/images.png";
    if (name.endsWith(".docx")) return "/images/files/word.png";
    return "/images/files/file.png";
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">共有ファイル</h1>
        <button
          onClick={() => navigate("fileUpload.jsx")}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition-all duration-200 flex items-center"
        >
          <i className="fa-solid fa-upload mr-2"></i>
          アップロード
        </button>
      </div>

      {/* File Cards */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition-all duration-200 border border-gray-100 flex flex-col justify-between"
          >
            {/* 上部：画像アイコンとファイル名 */}
            <div className="flex items-center gap-4 mb-4">
              <img
                src={getFileIcon(file.name)}
                alt="file icon"
                className="w-12 h-12 object-contain"
              />
              <div>
                <p className="font-semibold text-lg text-gray-800 truncate w-48">{file.name}</p>
                <p className="text-sm text-gray-500">{file.size}</p>
              </div>
            </div>

            {/* 中央：アップロード者と日付 */}
            <div className="flex justify-between items-center text-gray-600 text-sm mb-4">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-user text-gray-500"></i>
                <span>{file.uploader}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-calendar-alt text-gray-500"></i>
                <span>{file.date}</span>
              </div>
            </div>

            {/* 下部：操作ボタン */}
            <div className="flex justify-end gap-3 mt-auto">
              <button className="text-blue-600 hover:text-blue-800 transition flex items-center">
                <i className="fa-solid fa-download mr-1"></i>ダウンロード
              </button>
              <button className="text-red-500 hover:text-red-700 transition flex items-center">
                <i className="fa-solid fa-trash mr-1"></i>削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Files;