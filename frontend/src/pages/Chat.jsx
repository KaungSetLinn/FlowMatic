import { useState, useRef, useEffect } from "react";

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
    { id: 101, user: "山田太郎", text: "おはようございます！今日の進捗確認MTGは何時からでしたか？", time: "09:00", self: false },
    { id: 102, user: "自分", text: "おはよう！11時からだよ。その前にタスク終わらせておくね。", time: "09:05", self: true },
    { id: 103, user: "田中次郎", text: "山田さん、タスクは全て完了しました！", time: "10:20", self: false },
    { id: 104, user: "自分", text: "ありがとう！資料は共有済み。確認よろしく！", time: "10:30", self: true },
  ],
  2: [],
  3: [],
};

export default function Chat() {
  const [chats] = useState(INITIAL_CHATS);
  const [allMessages, setAllMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [selectedChat, setSelectedChat] = useState(1);
  const [messageInput, setMessageInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [lastDeleted, setLastDeleted] = useState(null);

  const [isComposing, setIsComposing] = useState(false); // ← IMEフラグ

  const messagesEndRef = useRef(null);
  const currentMessages = allMessages[selectedChat] || [];
  const currentChat = chats.find(c => c.id === selectedChat);

  // -----------------------------------------------
  // 自動スクロール
  // -----------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // -----------------------------------------------
  // LocalStorage 保存
  // -----------------------------------------------
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(allMessages));
  }, [allMessages]);

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
  };

  // -----------------------------------------------
  // 編集開始
  // -----------------------------------------------
  const startEditing = msg => {
    setEditingId(msg.id);
    setEditingText(msg.text);
    setOpenMenuId(null);
  };

  // 編集保存
  const saveEdit = () => {
    setAllMessages(prev => ({
      ...prev,
      [selectedChat]: prev[selectedChat].map(m =>
        m.id === editingId ? { ...m, text: editingText } : m
      ),
    }));
    setEditingId(null);
    setEditingText("");
  };

  // -----------------------------------------------
  // メッセージ削除（Undo対応）
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
    setReplyTo(msg);
    setOpenMenuId(null);
  };

  // -----------------------------------------------
  // リアクション
  // -----------------------------------------------
  const toggleReaction = (msg, emoji) => {
    setAllMessages(prev => ({
      ...prev,
      [selectedChat]: prev[selectedChat].map(m => {
        if (m.id !== msg.id) return m;

        const reactions = { ...(m.reactions || {}) };
        if (!reactions[emoji]) reactions[emoji] = [];

        if (reactions[emoji].includes("自分")) {
          reactions[emoji] = reactions[emoji].filter(u => u !== "自分");
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji].push("自分");
        }

        return { ...m, reactions };
      }),
    }));

    setOpenMenuId(null);
  };

  // -----------------------------------------------
  // メッセージリンクコピー
  // -----------------------------------------------
  const copyMessageLink = msg => {
    const link = `${window.location.origin}${window.location.pathname}#chat-${selectedChat}-msg-${msg.id}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    } else {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setOpenMenuId(null);
  };

  // メニュー開閉
  const toggleMenu = id => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // -----------------------------------------------
  // 描画
  // -----------------------------------------------
  return (
    <div className="flex w-full bg-white mb-4">

      {/* 左側（ルーム一覧） */}
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

      {/* 右側（チャット画面） */}
      <div className="w-2/3 h-full grid">
        <div className="p-4 border-b bg-gray-100">
          <h2 className="text-3xl font-bold">{currentChat?.name}</h2>
        </div>

        {/* Undo 表示 */}
        {lastDeleted && (
          <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 flex justify-between items-center">
            <p className="text-sm">メッセージを削除しました。</p>
            <button onClick={undoDelete} className="px-3 py-1 bg-white border rounded">元に戻す</button>
          </div>
        )}

        {/* メッセージ一覧 */}
        <div className="overflow-y-auto p-4 space-y-4 bg-white h-[350px]">
          {currentMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.self ? "justify-end" : "justify-start"}`}>
              <div className="flex items-start gap-3">

                {/* アバター */}
                {!msg.self && (
                  <div className="w-10 h-10 mr-2 rounded-full bg-gray-300 flex items-center justify-center font-bold">
                    {msg.user[0]}
                  </div>
                )}

                {/* 吹き出し全体 */}
                <div className="relative max-w-lg group">

                  {/* ３点メニュー 左上（常に hover で表示） */}
                  <div className="absolute -left-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleMenu(msg.id)} className="px-2 py-1 rounded hover:bg-gray-200">⋮</button>

                    {openMenuId === msg.id && (
                      <div className="absolute left-0 mt-6 w-40 bg-white border rounded shadow-md z-10">
                        <button onClick={() => startEditing(msg)} className="block w-full text-left px-4 py-2 hover:bg-gray-100">編集</button>
                        <button onClick={() => deleteMessage(msg.id)} className="block w-full text-left px-4 py-2 hover:bg-gray-100">削除</button>
                        <button onClick={() => handleReply(msg)} className="block w-full text-left px-4 py-2 hover:bg-gray-100">リプライ</button>
                        <button onClick={() => toggleReaction(msg, "👍")} className="block w-full text-left px-4 py-2 hover:bg-gray-100">👍 リアクション</button>
                        <button onClick={() => toggleReaction(msg, "❤️")} className="block w-full text-left px-4 py-2 hover:bg-gray-100">❤️ リアクション</button>
                        <button onClick={() => copyMessageLink(msg)} className="block w-full text-left px-4 py-2 hover:bg-gray-100">リンクをコピー</button>
                      </div>
                    )}
                  </div>

                  {/* リプライ引用表示 */}
                  {msg.replyTo && (
                    <div className="text-sm text-gray-500 bg-gray-100 border-l-4 border-blue-400 p-2 rounded mb-1">
                      引用: {msg.replyTo.text.slice(0, 30)}{msg.replyTo.text.length > 30 ? "..." : ""}
                    </div>
                  )}

                  {/* 編集モード */}
                  {editingId === msg.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        className="w-full p-2 rounded bg-white border text-black"
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <button onClick={saveEdit} className="px-3 py-1 bg-blue-600 text-white rounded">保存</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-300 rounded">キャンセル</button>
                      </div>
                    </div>
                  ) : (
                    <div className="pl-6">
                      {!msg.self && <p className="text-xl font-semibold text-gray-700 mb-1">{msg.user}</p>}

                      <div
                        className={`px-4 py-2 rounded-2xl shadow text-base whitespace-pre-wrap ${
                          msg.self
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* リアクション */}
                      {Object.keys(msg.reactions || {}).length > 0 && (
                        <div className="flex gap-2 mt-1">
                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                            <div key={emoji} className="px-2 py-1 bg-gray-200 rounded-full text-sm">
                              {emoji} {users.length}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className={`text-sm text-gray-400 mt-1 ${msg.self ? "text-right" : "text-left"}`}>
                        {msg.time}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力欄 */}
        <div className="p-4 border-t bg-white flex items-center gap-3">
          {replyTo && (
            <div className="p-2 bg-gray-100 border-l-4 border-blue-400 rounded text-sm w-full">
              引用返信: {replyTo.text.slice(0, 50)}
              <button onClick={() => setReplyTo(null)} className="ml-3 text-red-500">×</button>
            </div>
          )}

          <textarea
            rows={2}
            className="flex-grow p-3 border rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="メッセージを入力..."
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={e => {
              if (isComposing) return; // ← 変換中は送信しない
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />

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