import { useState, useEffect } from "react";

const CreateMemoModal = ({ isOpen, onClose, onSubmit, initialMemo = null }) => {
  const [content, setContent] = useState("");
  const [color, setColor] = useState("blue");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialMemo) {
      setContent(initialMemo.content);
      setColor(initialMemo.color);
    } else {
      setContent("");
      setColor("blue");
    }
  }, [initialMemo, isOpen]);

  /* ---------------- ESC key close ---------------- */
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setLoading(true);
      await onSubmit({
        id: initialMemo?.id,
        content,
        color,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Backdrop click close ---------------- */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scaleIn">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer
             disabled:opacity-40 transition"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
        <h3 className="text-2xl font-bold mb-4">
          {initialMemo ? "✏️ メモを編集" : "📌 新しいメモ"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content */}
          <textarea
            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-yellow-400"
            rows={4}
            placeholder="メモ内容を入力..."
            value={content}
            disabled={loading}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* Color */}
          <div>
            <p className="text-sm font-bold mb-2">色</p>
            <div className="flex gap-3">
              {["blue", "yellow", "green"].map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  disabled={loading}
                  className={`w-8 h-8 rounded-full border-2 transition
                    ${color === c ? "ring-3 ring-offset-2 ring-blue-600" : ""}
                    ${
                      c === "yellow"
                        ? "bg-yellow-300"
                        : c === "blue"
                        ? "bg-blue-300"
                        : "bg-green-300"
                    }
                  `}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border font-bold cursor-pointer hover:bg-gray-100 disabled:opacity-50"
            >
              キャンセル
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
              text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {initialMemo ? "更新" : "作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMemoModal;
