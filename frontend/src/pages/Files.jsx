import { useEffect, useState } from "react";
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
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { useProject } from "../context/ProjectContext";
import {
  deleteProjectFile,
  downloadProjectFile,
  getProjectFiles,
  uploadProjectFile,
} from "../services/FileService";
import { resolveImageUrl } from "../utils/resolveImageUrl";
import { useAuth } from "../context/AuthContext";

const Files = () => {
  const { user } = useAuth();
  // ✅ 表示モード切り替え
  const [viewMode, setViewMode] = useState("list");

  // ✅ ソート設定
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const { currentProject } = useProject();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadFiles = async () => {
    const files = await getProjectFiles(currentProject.project_id);

    console.log(files);
    setFiles(files);
  };

  useEffect(() => {
    loadFiles();
  }, [currentProject.project_id]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    await uploadProjectFile(currentProject.project_id, { file });

    // then refresh file list
    loadFiles();
  };

  const handleDownload = async (file) => {
    try {
      await downloadProjectFile(file.url, file.name);
    } catch (error) {
      console.error("Download failed:", error);
      alert("ファイルのダウンロードに失敗しました");
    }
  };

  // ✅ 削除処理
  const handleDelete = async (file) => {
    if (!window.confirm(`${file.name} を削除してもいいですか?`)) return;

    try {
      await deleteProjectFile(currentProject.project_id, file.id);
      // Refresh file list
      await loadFiles();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("ファイルの削除に失敗しました");
    }
  };

  const isImageFile = (name) => {
    const imageExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".bmp",
      ".webp",
      ".svg",
    ];
    return imageExtensions.some((ext) => name.toLowerCase().endsWith(ext));
  };

  // ✅ ファイルタイプに応じたFontAwesomeアイコンとカラー
  const getFileIconData = (name) => {
    if (name.endsWith(".pdf"))
      return { icon: faFilePdf, color: "text-red-500" };
    if (isImageFile(name)) return { icon: faFileImage, color: "text-blue-500" };
    if (name.endsWith(".docx"))
      return { icon: faFileWord, color: "text-blue-600" };
    if (name.endsWith(".xlsx"))
      return { icon: faFileExcel, color: "text-green-600" };
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
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">
          共有ファイル
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* ✅ 表示切替(グループ化) */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md cursor-pointer font-bold text-base sm:text-xl transition-all flex items-center justify-center gap-2
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
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md cursor-pointer font-bold text-base sm:text-xl transition-all flex items-center justify-center gap-2
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
          <input
            type="file"
            className="hidden"
            id="fileUpload"
            onChange={handleUpload}
          />
          <label
            htmlFor="fileUpload"
            className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 transition-all duration-300
            text-white rounded-lg font-bold text-base sm:text-xl cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faUpload} />
            <span>アップロード</span>
          </label>
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
                        <FontAwesomeIcon
                          icon={sortOrder === "asc" ? faSortUp : faSortDown}
                        />
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
                        <FontAwesomeIcon
                          icon={sortOrder === "asc" ? faSortUp : faSortDown}
                        />
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
                        <FontAwesomeIcon
                          icon={sortOrder === "asc" ? faSortUp : faSortDown}
                        />
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
                        <FontAwesomeIcon
                          icon={sortOrder === "asc" ? faSortUp : faSortDown}
                        />
                      )}
                    </div>
                  </th>
                  <th className="p-3 md:p-4 text-center font-bold text-lg md:text-xl lg:text-2xl whitespace-nowrap">
                    操作
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedFiles.map((file) => {
                  const fileIconData = getFileIconData(file.name);
                  return (
                    <tr key={file.id} className="border-b border-gray-100">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FontAwesomeIcon
                            icon={fileIconData.icon}
                            className={`${fileIconData.color} text-xl lg:text-2xl`}
                          />
                          <span
                            onClick={() => handleDownload(file)}
                            className="font-bold text-blue-800 underline cursor-pointer text-base lg:text-xl"
                          >
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-700 text-base lg:text-xl">
                        <div className="flex items-center gap-2">
                          {file.uploader?.profile_picture ? (
                            <img
                              src={resolveImageUrl(
                                file.uploader.profile_picture
                              )}
                              alt="profile"
                              className="w-8 h-8 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                              {file.uploader.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{file.uploader?.username}</span>
                        </div>
                      </td>

                      <td className="p-4 font-bold text-gray-700 text-base lg:text-xl">
                        {file.date}
                      </td>
                      <td className="p-4 text-right font-bold text-base lg:text-xl text-gray-600">
                        {file.size}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleDownload(file)}
                            className="px-2 lg:px-3 py-1.5 text-blue-600 hover:text-blue-800 underline rounded-md transition-colors flex items-center gap-1.5 text-base lg:text-xl font-bold cursor-pointer"
                            title="ダウンロード"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                            <span className="hidden lg:inline">
                              ダウンロード
                            </span>
                          </button>
                          {file.uploader?.id === user.id && (
                            <button
                              onClick={() => handleDelete(file)}
                              className="px-2 lg:px-3 py-1.5 text-red-600 hover:text-red-700 rounded-md transition-colors flex items-center gap-1.5 text-base lg:text-xl font-bold cursor-pointer"
                              title="削除"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              <span className="hidden lg:inline">削除</span>
                            </button>
                          )}
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
          {files.map((file) => {
            const fileIconData = getFileIconData(file.name);
            const isImage = isImageFile(file.name);

            return (
              <div
                key={file.id}
                className="bg-white p-4 sm:p-5 rounded-xl shadow hover:shadow-lg transition-all border flex flex-col justify-between"
              >
                {/* Top: Icon/Image + File name */}
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center">
                    {isImage && file.url ? (
                      <img
                        src={resolveImageUrl(file.url)}
                        alt={file.name}
                        className="w-full h-full object-cover rounded border border-gray-200"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={fileIconData.icon}
                        className={`${
                          fileIconData.color
                        } text-3xl sm:text-4xl ${
                          isImage && file.url ? "hidden" : ""
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      onClick={() => handleDownload(file)}
                      className="font-bold text-base sm:text-xl text-blue-800 underline cursor-pointer break-words"
                    >
                      {file.name}
                    </p>
                    <p className="text-sm sm:text-lg text-gray-500">
                      {file.size}
                    </p>
                  </div>
                </div>

                {/* Middle: Uploader & Date */}
                <div className="flex justify-between text-sm sm:text-xl font-bold text-gray-700 mb-3 sm:mb-4">
                  <span className="flex items-center gap-2">
                    {file.uploader?.profile_picture ? (
                      <img
                        src={resolveImageUrl(file.uploader.profile_picture)}
                        className="w-8 h-8 rounded-full object-cover border"
                        alt="profile"
                      />
                    ) : (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                        {file.uploader.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {file.uploader?.username}
                  </span>

                  <span>📅 {file.date}</span>
                </div>

                {/* Bottom: Actions */}
                <div className="flex justify-end gap-2 mt-auto">
                  <button
                    onClick={() => handleDownload(file)}
                    className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 sm:bg-transparent underline cursor-pointer rounded-lg sm:rounded-md transition-colors flex items-center justify-center gap-1.5 text-sm sm:text-xl font-bold"
                    title="ダウンロード"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    <span>ダウンロード</span>
                  </button>
                  {file.uploader?.id === user.id && (
                    <button
                      onClick={() => handleDelete(file)}
                      className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-red-600 hover:text-red-700 bg-red-50 sm:bg-transparent cursor-pointer rounded-lg sm:rounded-md transition-colors flex items-center justify-center gap-1.5 text-sm sm:text-xl font-bold"
                      title="削除"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>削除</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

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
