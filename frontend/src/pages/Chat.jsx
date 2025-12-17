import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";


// -----------------------------------------------
// 初期データ
// -----------------------------------------------
const INITIAL_CHATS = [
  { id: 1, name: "FlowMatic開発チーム", lastMessage: "最新のデモ動画を共有しました。", timestamp: "10:30" },
  { id: 2, name: "UI/UXデザイン", lastMessage: "ボタンの色について投票が必要です。", timestamp: "昨日" },
  { id: 3, name: "クライアントBリニューアル", lastMessage: "佐藤: 承認が完了しました。", timestamp: "10/30" },
];

const INITIAL_MESSAGES = {
  1: [
    { id: 101, user: "山田太郎", text: "おはようございます!今日の進捗確認MTGは何時からでしたか?", time: "09:00", self: false },
    { id: 102, user: "自分", text: "おはよう!11時からだよ。その前にタスク終わらせておくね。", time: "09:05", self: true },
    { id: 103, user: "田中次郎", text: "山田さん、タスクは全て完了しました!", time: "10:20", self: false },
    { id: 104, user: "自分", text: "ありがとう!資料は共有済み。確認よろしく!", time: "10:30", self: true },
  ],
  2: [],
  3: [],
};

export default function Chat() {
  const [chats] = useState(INITIAL_CHATS);
  const [allMessages, setAllMessages] = useState(INITIAL_MESSAGES);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const [selectedChat, setSelectedChat] = useState(1);
  const [messageInput, setMessageInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [lastDeleted, setLastDeleted] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [reactionTarget, setReactionTarget] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [revokedMessages, setRevokedMessages] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const currentMessages = allMessages[selectedChat] || [];
  const currentChat = chats.find(c => c.id === selectedChat);

  // -----------------------------------------------
  // メッセージ送信
  // -----------------------------------------------
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const newMessage = {
      id: Date.now(),
      user: "自分",
      text: messageInput,
      time,
      self: true,
      replyTo: replyTo || null,
      reactions: {},
    };

    setAllMessages(prev => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), newMessage],
    }));

    setMessageInput("");
    setReplyTo(null);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  // -----------------------------------------------
  // 編集開始 / 保存
  // -----------------------------------------------
  const startEditing = msg => {
    if (msg.revoked) return;
    setEditingId(msg.id);
    setEditingText(msg.text);
    setOpenMenuId(null);
  };

  /* 👇 ここに貼る */
  const toggleReaction = (msg, emoji) => {
    if (msg.revoked) return;
    setAllMessages(prev => ({
      ...prev,
      [selectedChat]: prev[selectedChat].map(m => {
        if (m.id !== msg.id) return m;

        const reactions = { ...(m.reactions || {}) };
        const users = reactions[emoji] || [];

        if (users.includes("自分")) {
          reactions[emoji] = users.filter(u => u !== "自分");
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          reactions[emoji] = [...users, "自分"];
        }

        return { ...m, reactions };
      })
    }));
  };

  const revokeMessage = (msg) => {
    const now = new Date();
    const revokeTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    setAllMessages(prev => ({
      ...prev,
      [selectedChat]: prev[selectedChat].map(m =>
        m.id === msg.id
          ? {
              ...m,
              revoked: true,
              revokedAt: revokeTime,
              text: "",
              reactions: {},
            }
          : m
      ),
    }));
  };

  const saveEdit = () => {
    setAllMessages(prev => ({
      ...prev,
      [selectedChat]: prev[selectedChat].map(m =>
        m.id === editingId ? { ...m, text: editingText, edited: true } : m
      ),
    }));
    setEditingId(null);
    setEditingText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  // -----------------------------------------------
  // メッセージ削除(Undo対応)
  // -----------------------------------------------
  const deleteMessage = id => {
    const msg = currentMessages.find(m => m.id === id);
    if (!msg) return;

    setLastDeleted({ chatId: selectedChat, msg });

    setAllMessages(prev => ({
      ...prev,
      [selectedChat]: prev[selectedChat].filter(m => m.id !== id),
    }));

    setOpenMenuId(null);
    setTimeout(() => setLastDeleted(null), 5000);
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    const { chatId, msg } = lastDeleted;

    setAllMessages(prev => ({
      ...prev,
      [chatId]: [...prev[chatId], msg].sort((a, b) => a.id - b.id),
    }));

    setLastDeleted(null);
  };

  // -----------------------------------------------
  // リプライ
  // -----------------------------------------------
  const handleReply = msg => {
    if (msg.revoked) return;
    setReplyTo(msg);
    setOpenMenuId(null);
  };

  // -----------------------------------------------
  // メッセージリンクコピー
  // -----------------------------------------------
  const copyMessageLink = msg => {
    const link = `${window.location.origin}${window.location.pathname}#chat-${selectedChat}-msg-${msg.id}`;
    navigator.clipboard?.writeText(link);
    setOpenMenuId(null);
  };

  const closeMenu = () => {
    setOpenMenuId(null);
    setShowReactionPicker(false);
    setReactionPickerMessageId(null);
    setShowEmojiPicker(false);
  };

  // -----------------------------------------------
  // 描画
  // -----------------------------------------------
  return (
    <div className="flex w-full bg-white mb-4" onClick={closeMenu}>

      {/* 左側(ルーム一覧) */}
      <div className="w-1/3 border-r h-full flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-3xl font-bold">ルーム一覧</h2>
        </div>
        <div className="flex-grow overflow-y-auto">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 cursor-pointer border-b ${selectedChat === chat.id ? "bg-blue-100" : "hover:bg-gray-50"}`}
            >
              <p className="font-medium text-2xl">{chat.name}</p>
              <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 右側(チャット画面) */}
      <div className="w-2/3 h-full grid relative">
        <div className="p-4 border-b bg-gray-100">
          <h2 className="text-3xl font-bold">{currentChat?.name}</h2>
        </div>

        {lastDeleted && (
          <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 flex justify-between items-center gap-3">
            <p className="text-sm truncate max-w-xs">
              「{lastDeleted.msg.text}」を削除しました
            </p>
            <button
              onClick={undoDelete}
              className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
            >
              元に戻す
            </button>
          </div>
        )}

        {/* メッセージ一覧 */}
        <div
          className="overflow-y-auto p-10 space-y-10 bg-white h-[350px] relative"
          onScroll={(e) => {
            const el = e.currentTarget;
            const isBottom =
              el.scrollHeight - el.scrollTop - el.clientHeight < 50;
            setShowScrollBottom(!isBottom);
          }}
        >
          {currentMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.self ? "justify-end" : "justify-start"}`}
            >
              {!msg.self && (
                <div className="mr-3 flex-shrink-0 flex flex-col items-center">
                  <img
                    src={msg.avatar || "/default-avatar.png"}
                    alt={`${msg.firstName} ${msg.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="mt-1 text-xs text-gray-600 max-w-[100px] truncate">
                    {msg.firstName && msg.lastName ? `${msg.firstName} ${msg.lastName}` : msg.user}
                  </span>
                </div>
              )}
              <div
                className={`relative max-w-lg group ${
                  msg.self ? "ml-auto" : ""
                }`}
              >
                {/* 上に重ねるアイコン */}
                <div
                  className={`
                    absolute -top-8 flex gap-1
                    ${msg.self ? "right-0" : "left-0"}
                    opacity-0 group-hover:opacity-100 transition
                  `}
                >
                  {msg.self && !msg.revoked && (
                    <IconButton onClick={() => startEditing(msg)}>✏️</IconButton>
                  )}

                  {!msg.revoked && (
                    <IconButton onClick={() => handleReply(msg)}>💬</IconButton>
                  )}

                  {msg.self && !msg.revoked && (
                    <IconButton
                      onClick={() => {
                        const ok = window.confirm("このメッセージを削除しますか？");
                        if (ok) {
                          deleteMessage(msg.id);
                        }
                      }}
                    >
                      🗑️
                    </IconButton>
                  )}
                </div>

                {/* 吹き出し */}
                <div className="flex flex-col">
                  {msg.replyTo && (
                    <div className="mb-2 p-2 bg-gray-200 border-l-4 border-gray-400 rounded text-xs text-gray-600">
                      引用: {msg.replyTo.text.slice(0, 50)}
                    </div>
                  )}
                  {editingId === msg.id ? (
                    <div className="bg-white border rounded-xl p-3 shadow space-y-2">
                      <textarea
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        className="w-full border p-2 rounded resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 rounded border hover:bg-gray-100"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    msg.revoked ? (
                      <div className="px-4 py-2 rounded-2xl bg-gray-300 text-gray-600 text-sm italic">
                        メッセージは送信取消されました（{msg.revokedAt}）
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-2 rounded-2xl shadow ${
                          msg.self
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-100 rounded-bl-none"
                        }`}
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {msg.text}
                      </div>
                    )
                  )}

                  {/* 時間と編集済み表示 */}
                  <div className="text-xs text-gray-500 mt-1">
                    {msg.time} {msg.edited && "(編集済み)"}
                  </div>

                  {!msg.revoked && (
                    <div className="flex gap-2 text-sm mt-1">
                      {Object.entries(msg.reactions || {}).map(([e, users]) => (
                        <button
                          key={e}
                          onClick={(e2) => {
                            e2.stopPropagation();
                            toggleReaction(msg, e);
                          }}
                          className={`px-2 py-0.5 rounded-full border text-xs flex items-center gap-1`}
                        >
                          <span>{e}</span>
                          <span>{users.length}</span>
                        </button>
                      ))}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReactionPicker(true);
                          setReactionPickerMessageId(msg.id);
                        }}
                        className="px-2 py-0.5 rounded-full border text-xs hover:bg-gray-200"
                      >
                        ＋
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {showScrollBottom && (
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="absolute bottom-40 right-6 z-40 bg-blue-600 text-white w-10 h-10 rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
          >
            ↓
          </button>
        )}

        {/* リアクションピッカー */}
        {showReactionPicker && reactionPickerMessageId && (
          <div className="absolute bottom-20 left-4 z-50" onClick={(e) => e.stopPropagation()}>
            <EmojiPicker
              onEmojiClick={(emoji) => {
                const msg = currentMessages.find(m => m.id === reactionPickerMessageId);
                if (msg) toggleReaction(msg, emoji.emoji);
                setShowReactionPicker(false);
                setReactionPickerMessageId(null);
              }}
            />
          </div>
        )}

        {replyTo && (
          <div className="mx-4 mb-2 px-3 py-2 bg-gray-100 border-l-4 border-blue-400 rounded-lg shadow-sm flex items-center gap-2">
            
            {/* 引用テキスト */}
            <div className="flex-1 text-sm text-gray-700 truncate">
              <strong>引用:</strong> {replyTo.text}
            </div>

            {/* × ボタン(右端固定) */}
            <button
              onClick={() => setReplyTo(null)}
              className="flex-shrink-0 text-red-500 hover:text-red-700 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* 入力欄(絵文字対応) */}
        <div className="p-4 border-t bg-white flex items-center gap-3 relative">

          {/* 絵文字ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker(!showEmojiPicker);
            }}
            className="text-2xl"
          >
            😊
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-16 left-4 z-50" onClick={(e) => e.stopPropagation()}>
              <EmojiPicker
                onEmojiClick={(emoji) => {
                  setMessageInput(prev => prev + emoji.emoji);
                }}
              />
            </div>
          )}

          {/* メッセージ入力 */}
          <textarea
            rows={2}
            className="flex-grow p-3 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="メッセージを入力..."
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={e => {
              if (isComposing) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />

          {/* 送信 */}
          <button
            onClick={handleSendMessage}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}

function IconButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200"
    >
      {children}
    </button>
  );
} 