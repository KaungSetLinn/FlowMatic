import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faList, 
  faTh, 
  faUpload, 
  faFilePdf, 
  faFileImage, 
  faFileWord, 
  faFileExcel, 
  faFile,
  faDownload,
  faTrash,
  faSortUp,
  faSortDown
} from "@fortawesome/free-solid-svg-icons";

const Files = () => {
  // ✅ 表示モード切り替え
  const [viewMode, setViewMode] = useState("list");

  // ✅ ソート設定
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  // ✅ 仮データ
  const [files, setFiles] = useState([
    { id: 1, name: "要件定義書.pdf", uploader: "すだち", date: "2025-11-05", size: "1.2MB" },
    { id: 2, name: "設計図.png", uploader: "田中", date: "2025-11-06", size: "2.8MB" },
    { id: 3, name: "進捗報告.docx", uploader: "佐藤", date: "2025-11-07", size: "800KB" },
  ]);

  // ✅ 削除処理
  const handleDelete = (id) => {
    if (!window.confirm("このファイルを削除してもいい?")) return;
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // ✅ 拡張子に応じた画像アイコン
  const getFileIcon = (name) => {
    if (name.endsWith(".pdf")) return "/images/files/pdf.png";
    if (name.endsWith(".png") || name.endsWith(".jpg")) return "/images/files/images.png";
    if (name.endsWith(".docx")) return "/images/files/word.png";
    return "/images/files/file.png";
  };

  // ✅ ファイルタイプに応じたFontAwesomeアイコンとカラー
  const getFileIconData = (name) => {
    if (name.endsWith(".pdf")) return { icon: faFilePdf, color: "text-red-500" };
    if (name.endsWith(".png") || name.endsWith(".jpg")) return { icon: faFileImage, color: "text-blue-500" };
    if (name.endsWith(".docx")) return { icon: faFileWord, color: "text-blue-600" };
    if (name.endsWith(".xlsx")) return { icon: faFileExcel, color: "text-green-600" };
    return { icon: faFile, color: "text-gray-500" };
  };

  // ✅ ソート処理
  const handleSort = (key) => {
    if (sortKey === key) {
      // 同じ列をクリックした場合は昇順/降順を切り替え
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // 新しい列の場合は昇順から開始
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // ✅ サイズを数値に変換(ソート用)
  const parseSize = (sizeStr) => {
    const num = parseFloat(sizeStr);
    if (sizeStr.includes("MB")) return num * 1024;
    if (sizeStr.includes("GB")) return num * 1024 * 1024;
    return num; // KB
  };

  // ✅ ソート済みファイルリスト
  const sortedFiles = [...files].sort((a, b) => {
    if (!sortKey) return 0;

    let aVal, bVal;

    if (sortKey === "size") {
      aVal = parseSize(a.size);
      bVal = parseSize(b.size);
    } else {
      aVal = a[sortKey];
      bVal = b[sortKey];
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      {/* ✅ ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">共有ファイル</h1>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* ✅ 表示切替(グループ化) */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md font-bold text-base sm:text-xl transition-all flex items-center justify-center gap-2
                ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              title="リスト表示"
            >
              <FontAwesomeIcon icon={faList} />
              <span className="hidden sm:inline">リスト</span>
            </button>

            <button
              onClick={() => setViewMode("card")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md font-bold text-base sm:text-xl transition-all flex items-center justify-center gap-2
                ${
                  viewMode === "card"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              title="カード表示"
            >
              <FontAwesomeIcon icon={faTh} />
              <span className="hidden sm:inline">カード</span>
            </button>
          </div>

          {/* ✅ アップロード(強調) */}
          <button
            onClick={() => alert("アップロード画面へ遷移")}
            className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 transition-all duration-300
            text-white rounded-lg font-bold text-base sm:text-xl cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faUpload} />
            <span>アップロード</span>
          </button>
        </div>
      </div>

      {/* =========================
          ✅ リスト(テーブル)表示 - Responsive Table
      ========================= */}
      {viewMode === "list" && (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          {/* Scrollable container for mobile */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
              <thead className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
                <tr>
                  <th 
                    onClick={() => handleSort("name")}
                    className="p-3 md:p-4 text-left font-bold text-lg md:text-xl lg:text-2xl cursor-pointer hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      ファイル名
                      {sortKey === "name" && (
                        <FontAwesomeIcon icon={sortOrder === "asc" ? faSortUp : faSortDown} />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("uploader")}
                    className="p-3 md:p-4 text-left font-bold text-lg md:text-xl lg:text-2xl cursor-pointer hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      投稿者
                      {sortKey === "uploader" && (
                        <FontAwesomeIcon icon={sortOrder === "asc" ? faSortUp : faSortDown} />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("date")}
                    className="p-3 md:p-4 text-left font-bold text-lg md:text-xl lg:text-2xl cursor-pointer hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      日付
                      {sortKey === "date" && (
                        <FontAwesomeIcon icon={sortOrder === "asc" ? faSortUp : faSortDown} />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("size")}
                    className="p-3 md:p-4 text-right font-bold text-lg md:text-xl lg:text-2xl cursor-pointer hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-2">
                      サイズ
                      {sortKey === "size" && (
                        <FontAwesomeIcon icon={sortOrder === "asc" ? faSortUp : faSortDown} />
                      )}
                    </div>
                  </th>
                  <th className="p-3 md:p-4 text-center font-bold text-lg md:text-xl lg:text-2xl whitespace-nowrap">操作</th>
                </tr>
              </thead>

              <tbody>
                {sortedFiles.map(file => {
                  const fileIconData = getFileIconData(file.name);
                  return (
                    <tr key={file.id} className="border-b border-gray-100">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FontAwesomeIcon 
                            icon={fileIconData.icon} 
                            className={`${fileIconData.color} text-xl lg:text-2xl`} 
                          />
                          <span className="font-bold text-gray-800 text-base lg:text-xl">{file.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-700 text-base lg:text-xl">{file.uploader}</td>
                      <td className="p-4 font-bold text-gray-700 text-base lg:text-xl">{file.date}</td>
                      <td className="p-4 text-right font-bold text-base lg:text-xl text-gray-600">{file.size}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            className="px-2 lg:px-3 py-1.5 text-blue-600 hover:text-blue-800 underline rounded-md transition-colors flex items-center gap-1.5 text-base lg:text-xl font-bold cursor-pointer"
                            title="ダウンロード"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                            <span className="hidden lg:inline">ダウンロード</span>
                          </button>
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="px-2 lg:px-3 py-1.5 text-red-600 hover:text-red-700 rounded-md transition-colors flex items-center gap-1.5 text-base lg:text-xl font-bold cursor-pointer"
                            title="削除"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            <span className="hidden lg:inline">削除</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

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
        </div>
      )}

      {/* =========================
          ✅ カード表示
      ========================= */}
      {viewMode === "card" && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {files.map(file => (
            <div
              key={file.id}
              className="bg-white p-4 sm:p-5 rounded-xl shadow hover:shadow-lg transition-all border flex flex-col justify-between"
            >
              {/* 上:アイコン+ファイル名 */}
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <img
                  src={getFileIcon(file.name)}
                  alt="file icon"
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base sm:text-xl text-gray-800 break-words">
                    {file.name}
                  </p>
                  <p className="text-sm sm:text-lg text-gray-500">{file.size}</p>
                </div>
              </div>

              {/* 中:投稿者・日付 */}
              <div className="flex justify-between text-sm sm:text-xl text-gray-600 mb-3 sm:mb-4">
                <span>👤 {file.uploader}</span>
                <span>📅 {file.date}</span>
              </div>

              {/* 下:操作 */}
              <div className="flex justify-end gap-2 mt-auto">
                <button 
                  className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 sm:bg-transparent hover:underline cursor-pointer rounded-lg sm:rounded-md transition-colors flex items-center justify-center gap-1.5 text-sm sm:text-xl font-bold"
                  title="ダウンロード"
                >
                  <FontAwesomeIcon icon={faDownload} />
                  <span>ダウンロード</span>
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-red-600 hover:text-red-700 bg-red-50 sm:bg-transparent cursor-pointer rounded-lg sm:rounded-md transition-colors flex items-center justify-center gap-1.5 text-sm sm:text-xl font-bold"
                  title="削除"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span>削除</span>
                </button>
              </div>
            </div>
          ))}

          {files.length === 0 && (
            <p className="text-center text-gray-500 col-span-full py-8">
              ファイルがありません
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default Files;