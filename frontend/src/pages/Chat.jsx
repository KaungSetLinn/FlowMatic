import { useState, useRef, useEffect } from "react";

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

const Chat = () => {
  const [chats] = useState(INITIAL_CHATS);
  const [allMessages, setAllMessages] = useState(INITIAL_MESSAGES);
  const [selectedChat, setSelectedChat] = useState(1);
  const [messageInput, setMessageInput] = useState("");

  const messagesEndRef = useRef(null);

  const currentMessages = allMessages[selectedChat] || [];
  const currentChat = chats.find(c => c.id === selectedChat);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const newMessage = {
      id: Date.now(),
      user: "自分",
      text: messageInput,
      time: currentTime,
      self: true,
    };

    setAllMessages(prev => ({
      ...prev,
      [selectedChat]: [...prev[selectedChat], newMessage],
    }));

    setMessageInput("");
  };

  return (
    <div className="flex w-full bg-white mb-31">

      {/* 左側（ルーム一覧） */}
      <div className="w-1/3 border-r h-full flex flex-col">

        {/* タイトル */}
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-3xl font-bold">ルーム一覧</h2>
        </div>

        {/* ルーム一覧（独立スクロール） */}
        <div className="flex-grow overflow-y-auto">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 cursor-pointer border-b ${
                selectedChat === chat.id ? "bg-blue-100" : "hover:bg-gray-50"
              }`}
            >
              <p className="font-medium text-2xl">{chat.name}</p>
              <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 右側（チャット画面） */}
      <div className="w-2/3 h-full grid ">

        {/* 上：タイトルバー */}
        <div className="p-4 border-b bg-gray-100">
          <h2 className="text-3xl font-bold">{currentChat?.name}</h2>
        </div>

        {/* 中：メッセージ一覧（高さ固定・独立スクロール） */}
        <div className="overflow-y-auto p-4 space-y-4 bg-white h-[350px]">

          {currentMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start ${
                msg.self ? "justify-end" : "justify-start"
              }`}
            >
              {/* 相手アイコン */}
              {!msg.self && (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold">
                  {msg.user[0]}
                </div>
              )}

              {/* メッセージ本文（吹き出し） */}
              <div className="max-w-lg">
                {!msg.self && (
                  <p className="text-xl font-semibold text-gray-700 mb-1">
                    {msg.user}
                  </p>
                )}

                <div
                  className={`px-4 py-2 rounded-2xl shadow text-base leading-relaxed whitespace-pre-wrap ${
                    msg.self
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>

                <p
                  className={`text-sm text-gray-400 mt-1 ${
                    msg.self ? "text-right" : "text-left"
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* 下：入力フォーム */}
        <div className="p-4 border-t bg-white flex items-center gap-3 mb-4">
          <textarea
            rows={2}
            className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="メッセージを入力..."
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => {
              // Enterのみ → 送信
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();   // 改行を防ぐ
                handleSendMessage();
              }
              // Shift + Enter → 何もしない（＝通常の改行）
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
};

export default Chat;