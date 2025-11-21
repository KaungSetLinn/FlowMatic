import { useState, useRef, useEffect } from "react";

// ----------------------------------------------------
// 💡 外部定数として初期データのみ定義
// ----------------------------------------------------
const INITIAL_CHATS = [
  { id: 1, name: "FlowMatic開発チーム", lastMessage: "最新のデモ動画を共有しました。", timestamp: "10:30" },
  { id: 2, name: "UI/UXデザイン", lastMessage: "ボタンの色について投票が必要です。", timestamp: "昨日" },
  { id: 3, name: "クライアントBリニューアル", lastMessage: "佐藤: 承認が完了しました。", timestamp: "10/30" },
  { id: 4, name: "全社アナウンス", lastMessage: "セキュリティアップデート実施", timestamp: "10/25" },
  { id: 5, name: "経費精算グループ", lastMessage: "今月の締め切りは明日です。", timestamp: "10/24" },
  { id: 6, name: "新入社員オンボーディング", lastMessage: "歓迎会の日程について。", timestamp: "10/23" },
  { id: 7, name: "Q4戦略会議", lastMessage: "アジェンダを更新しました。", timestamp: "10/22" },
  { id: 8, name: "営業部共有", lastMessage: "来週のウェビナー参加者リスト", timestamp: "10/21" },
  { id: 9, name: "プライベート", lastMessage: "週末の予定は？", timestamp: "10/20" },
];

const INITIAL_MESSAGES = {
  1: [ // ルームID: 1
    { id: 101, user: "山田太郎", text: "おはようございます！今日の進捗確認MTGは何時からでしたか？", time: "09:00", self: false },
    { id: 102, user: "自分", text: "おはよう！11時からだよ。その前に今日のタスクを終わらせておくね。", time: "09:05", self: true },
    { id: 103, user: "田中次郎", text: "山田さん、タスクは全て完了しました！", time: "10:20", self: false },
    { id: 104, user: "自分", text: "ありがとう！資料はもう共有したよ。確認よろしく！", time: "10:30", self: true },
  ],
  2: [ // ルームID: 2
    { id: 201, user: "鈴木一郎", text: "プロトタイプv1.5をアップロードしました。", time: "15:00", self: false },
    { id: 202, user: "自分", text: "確認します！ボタンのサイズ感を調整するタスクでしたね。", time: "15:05", self: true },
  ],
  3: [ // ルームID: 3
    { id: 301, user: "佐藤", text: "承認が完了しました。次はコーディングフェーズに入ります。", time: "10/30", self: false },
    { id: 302, user: "自分", text: "了解です！スケジュール通りですね。", time: "10/30", self: true },
  ],
  4: [], // ルームID: 4
  5: [], // ルームID: 5
  6: [], // ルームID: 6
  7: [], // ルームID: 7
  8: [], // ルームID: 8
  9: [], // ルームID: 9
};


const Chat = () => {
  // 💡 チャットルームとメッセージの状態管理
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [allMessages, setAllMessages] = useState(INITIAL_MESSAGES);
  
  const [selectedChat, setSelectedChat] = useState(INITIAL_CHATS[0].id);
  const [messageInput, setMessageInput] = useState("");
  
  // メッセージ表示エリアのスクロール参照
  const messagesEndRef = useRef(null);

  // 選択中のルームIDに対応するメッセージリストとルーム情報を取得
  const currentMessages = allMessages[selectedChat] || [];
  const currentChat = chats.find(chat => chat.id === selectedChat);

  // メッセージ送信時に最下部に自動スクロールする関数
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // currentMessagesが更新されるたびにスクロールを実行
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);


  const handleSendMessage = () => {
    if (messageInput.trim() === "") return;
    
    // 現在時刻をフォーマット
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // 新しいメッセージオブジェクト
    const newMessage = {
      // 暫定ID (実際はFirestoreなどで自動生成)
      id: Math.max(...currentMessages.map(m => m.id), 0) + 1, 
      user: "自分", 
      text: messageInput.trim(), 
      time: currentTime, 
      self: true 
    };
    
    // 1. メッセージリストを更新し、画面に新しいメッセージを表示
    setAllMessages(prevMessages => ({
      ...prevMessages,
      [selectedChat]: [...prevMessages[selectedChat], newMessage],
    }));

    // 2. ルーム一覧の最終メッセージとタイムスタンプを更新
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === selectedChat) {
        return {
          ...chat,
          lastMessage: newMessage.text,
          timestamp: currentTime,
        };
      }
      return chat;
    }));
    
    // 3. 入力欄をクリア
    setMessageInput("");
  };

  return (
    // h-screen でビューポートの高さに固定し、メイン画面全体のスクロールを防止
    <div className="flex w-full h-screen overflow-hidden bg-white font-inter p-0 m-0"> 

    {/* ルーム一覧（左側） */}
    <div className="flex-shrink-0 flex flex-col w-full sm:w-1/3 h-full border-r border-gray-200">

      {/* ヘッダー：スクロールしない */}
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-800">ルーム一覧</h2>
      </div>

      {/* ルームリスト：ここだけスクロール */}
      <div className="flex-grow overflow-y-auto">
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => setSelectedChat(chat.id)}
            className={`p-4 cursor-pointer transition ${
              selectedChat === chat.id
                ? "bg-blue-100 border-l-4 border-blue-600 font-bold"
                : "hover:bg-gray-50"
            }`}
          >
            <p className="text-gray-800">{chat.name}</p>
            <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
            <span className="text-xs text-gray-400 float-right">{chat.timestamp}</span>
          </div>
        ))}
      </div>

    </div>

      {/* 2. 右側: メインチャットエリア */}
      {/* 💡 修正1: h-full を追加し、親の h-screen の高さを確実に継承 */}
      <div className={`flex-col w-full h-full ${selectedChat ? 'flex' : 'hidden'} sm:w-2/3 sm:flex`}> 
        
        {/* ヘッダー */}
        <div className="p-4 border-b bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">{currentChat ? currentChat.name : "チャットルームを選択"}</h2>
        </div>
        
        {/* メッセージ表示エリア */}
        {/* 💡 修正2: h-full を追加し、flex-grow の計算基準を明確化 */}
        <div className="flex-grow h-full min-h-0 p-4 overflow-y-auto space-y-4 bg-gray-50">
          {currentMessages.length > 0 ? (
              currentMessages.map((msg) => (
              <div
                  key={msg.id}
                  className={`flex ${msg.self ? "justify-end" : "justify-start"}`}
              >
                  <div
                  className={`max-w-xs sm:max-w-sm lg:max-w-md p-3 rounded-xl shadow-md ${
                      msg.self
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-200 text-gray-800"
                  }`}
                  >
                  {!msg.self && <p className="text-xs font-semibold mb-1 opacity-80">{msg.user}</p>}
                  <p className="text-sm">{msg.text}</p>
                  <span className={`text-xs mt-1 block text-right ${msg.self ? "text-blue-200" : "text-gray-500"}`}>{msg.time}</span>
                  </div>
              </div>
              ))
          ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                  <p>このルームにはまだメッセージがありません。</p>
              </div>
          )}
          <div ref={messagesEndRef} /> {/* スクロールターゲット */}
        </div>
        
        {/* 3. メッセージ入力フォーム */}
        <div className="p-4 border-t bg-white flex items-center flex-shrink-0">
          <input
            type="text"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="メッセージを入力..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={!currentChat} // ルームが選択されていない場合は無効化
          />
          <button
            onClick={handleSendMessage}
            className="ml-3 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
            disabled={!messageInput.trim() || !currentChat} // メッセージがない、またはルームが選択されていない場合は無効化
          >
            {/* 紙飛行機アイコン */}
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;