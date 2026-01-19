// Chat.jsx
import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { ACCESS_TOKEN, CURRENT_PROJECT_ID } from "../constants";
import { getChatrooms, getMessages, addReaction, removeReaction } from "../services/ChatService";
import api from "../api";
import { useProject } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
import { resolveImageUrl } from "../utils/resolveImageUrl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faSmile,
  faEllipsisVertical,
  faPenToSquare,
  faReply,
  faTrash,
  faXmark,
  faClock,
  faChevronUp,
  faRotateLeft,
  faPaperclip,
  faImage,
  faEdit,
  faTrashAlt,
  faReplyAll,
  faSmileBeam,
  faMessage,
} from "@fortawesome/free-solid-svg-icons";
import ProjectRequired from "../components/ProjectRequired";

const Chat = () => {
  const { user } = useAuth();
  const { currentProject } = useProject();
  const currentProjectId = currentProject?.project_id;

  const socketRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [allMessages, setAllMessages] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [lastDeleted, setLastDeleted] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const messagesEndRef = useRef(null);
  const currentMessages = allMessages[selectedChat] || [];
  const currentChat = chats.find((c) => c.chatroom_id === selectedChat);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages]);

  // チャットルーム一覧を読み込む
  useEffect(() => {
    const loadChatrooms = async () => {
      if (!currentProjectId) return;

      try {
        setIsLoading(true);
        const chatrooms = await getChatrooms(currentProjectId);

        console.log(chatrooms);

        const formattedChats = chatrooms.map((room) => ({
          ...room,
          id: room.chatroom_id,
          name: currentProject.title,
          lastMessage: "",
          timestamp: new Date(room.created_at).toLocaleDateString(),
        }));

        setChats(formattedChats);

        // 最初のチャットルームを自動選択
        if (formattedChats.length > 0) {
          setSelectedChat(formattedChats[0].chatroom_id);
        }
      } catch (error) {
        console.error("チャットルームの読み込みに失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatrooms();
  }, [currentProjectId]);

  // 選択されたチャットルームのメッセージを読み込む + ポーリング
  useEffect(() => {
    const loadInitialMessages = async () => {
      if (!currentProjectId || !selectedChat) return;

      try {
        const res = await getMessages(currentProjectId, selectedChat, 1, 50);

        const formatted = res.messages.map((msg) => ({
          id: msg.message_id,
          userId: msg.user_id,
          userName: msg.username || msg.name,
          profilePicture: msg.profile_picture,
          text: msg.content,
          time: new Date(msg.timestamp).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          date: new Date(msg.timestamp).toLocaleDateString("ja-JP"),
          self: msg.user_id === user.id,
          replyTo: msg.reply_to_message
            ? {
                id: msg.reply_to_message.message_id,
                userId: msg.reply_to_message.user_id,
                userName: msg.reply_to_message.name,
                text: msg.reply_to_message.content,
              }
            : null,
          reactions: msg.reactions || {},
        }));

        setAllMessages((prev) => ({
          ...prev,
          [selectedChat]: formatted,
        }));
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };

    loadInitialMessages();
  }, [currentProjectId, selectedChat]);

  useEffect(() => {
    if (!currentProjectId || !selectedChat) return;

    const token = localStorage.getItem(ACCESS_TOKEN);
    const wsUrl = `ws://localhost:8000/ws/chat/${currentProjectId}/${selectedChat}/?token=${token}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");

      socket.send(
        JSON.stringify({
          type: "join_room",
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "message") {
        const msg = data.message;

        // safety: ignore messages for other rooms
        if (msg.chatroom_id !== selectedChat) return;

        const formattedMessage = {
          id: msg.message_id,
          userId: msg.user_id,
          userName: msg.username || msg.name,
          profilePicture: msg.profile_picture,
          text: msg.content,
          time: new Date(msg.timestamp).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          date: new Date(msg.timestamp).toLocaleDateString("ja-JP"),
          self: msg.user_id === user.id,
          replyTo: msg.reply_to_message
            ? {
                id: msg.reply_to_message.message_id,
                userId: msg.reply_to_message.user_id,
                userName: msg.reply_to_message.name,
                text: msg.reply_to_message.content,
              }
            : null,
          reactions: msg.reactions || {},
        };

        setAllMessages((prev) => {
          const existing = prev[selectedChat] || [];

          // prevent duplicates
          if (existing.some((m) => m.id === formattedMessage.id)) {
            return prev;
          }

          return {
            ...prev,
            [selectedChat]: [...existing, formattedMessage],
          };
        });
      } else if (data.type === "reaction_added") {
        const { message_id, reaction } = data;

        setAllMessages((prev) => ({
          ...prev,
          [selectedChat]: prev[selectedChat].map((m) =>
            m.id === message_id
              ? {
                  ...m,
                  reactions: {
                    ...m.reactions,
                    [reaction.emoji]: [
                      ...(m.reactions[reaction.emoji] || []),
                      reaction.user_id,
                    ],
                  },
                }
              : m
          ),
        }));
      } else if (data.type === "reaction_removed") {
        const { message_id, user_id, emoji } = data;

        setAllMessages((prev) => ({
          ...prev,
          [selectedChat]: prev[selectedChat].map((m) =>
            m.id === message_id
              ? {
                  ...m,
                  reactions: {
                    ...m.reactions,
                    [emoji]: m.reactions[emoji].filter((id) => id !== user_id),
                  },
                }
              : m
          ),
        }));
      }
    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket error", err);
    };

    socket.onclose = () => {
      console.log("🔌 WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, [currentProjectId, selectedChat, user.id]);

  // メッセージ送信
  const handleSendMessage = () => {
    if (
      !messageInput.trim() ||
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const payload = {
      type: "message",
      content: messageInput,
    };

    if (replyTo) {
      payload.reply_to = replyTo.id;
    }

    socketRef.current.send(JSON.stringify(payload));

    setMessageInput("");
    setReplyTo(null);
  };

  // 編集開始 / 保存
  const startEditing = (msg) => {
    setEditingId(msg.id);
    setEditingText(msg.text);
    setOpenMenuId(null);
  };

  const saveEdit = () => {
    setAllMessages((prev) => ({
      ...prev,
      [selectedChat]: prev[selectedChat].map((m) =>
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

  // メッセージ削除(Undo対応)
  const deleteMessage = (id) => {
    const msg = currentMessages.find((m) => m.id === id);
    if (!msg) return;

    setLastDeleted({ chatId: selectedChat, msg });

    setAllMessages((prev) => ({
      ...prev,
      [selectedChat]: prev[selectedChat].filter((m) => m.id !== id),
    }));

    setOpenMenuId(null);
    setTimeout(() => setLastDeleted(null), 5000);
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    const { chatId, msg } = lastDeleted;

    setAllMessages((prev) => ({
      ...prev,
      [chatId]: [...prev[chatId], msg].sort((a, b) => a.id - b.id),
    }));

    setLastDeleted(null);
  };

  // リプライ
  const handleReply = (msg) => {
    setReplyTo(msg);
    setOpenMenuId(null);
  };

  // メッセージリンクコピー
  const copyMessageLink = (msg) => {
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

  // 追加のメッセージを読み込む(ページネーション)
  const loadMoreMessages = async () => {
    if (!currentProjectId || !selectedChat || !hasMore || isLoading) return;

    try {
      setIsLoading(true);
      const nextPage = currentPage + 1;

      const response = await api.get(
        `/api/projects/${currentProjectId}/chatrooms/${selectedChat}/messages/`,
        {
          params: {
            page: nextPage,
            per_page: 50,
          },
        }
      );

      const formattedMessages = response.data.messages.map((msg) => ({
        id: msg.message_id,
        userId: msg.user_id,
        userName: msg.name || `User ${msg.user_id}`,
        profilePicture: msg.profile_picture,
        text: msg.content,
        time: new Date(msg.timestamp).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        self: msg.user_id === user.id,
        replyTo: msg.reply_to_message
          ? {
              id: msg.reply_to_message.message_id,
              userId: msg.reply_to_message.user_id,
              userName: msg.reply_to_message.name,
              text: msg.reply_to_message.content,
            }
          : null,
        reactions: msg.reactions || {},
      }));

      setAllMessages((prev) => ({
        ...prev,
        [selectedChat]: [...formattedMessages, ...(prev[selectedChat] || [])],
      }));

      setCurrentPage(nextPage);
      setHasMore(response.data.messages.length === 50);
    } catch (error) {
      console.error("メッセージの読み込みに失敗しました:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentProjectId) {
    return (
      <ProjectRequired
        icon="💬"
        title="プロジェクトが選択されていません"
        description={
          <>
            チャット機能を利用するには、
            <br />
            まずプロジェクトを作成、または選択してください。
          </>
        }
      />
    );
  }

  return (
    <div
      className="flex w-full bg-white rounded-xl shadow-lg overflow-hidden"
      onClick={closeMenu}
      style={{ height: "calc(100vh - 100px)" }} // 親コンテナの高さを設定
    >
      {/* チャット画面 (Full Width) */}
      <div className="w-full h-full flex flex-col relative bg-gradient-to-b from-white to-gray-50">
        {/* ヘッダー */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faMessage} className="text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {currentChat?.name || "チャット"}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {currentMessages.length} 件のメッセージ
                </p>
              </div>
            </div>
            {/* <button className="p-2 hover:bg-white/10 rounded-full transition">
              <FontAwesomeIcon icon={faEllipsisVertical} className="text-lg" />
            </button> */}
          </div>
        </div>

        {/* Undo通知 */}
        {lastDeleted && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-y border-yellow-100 flex justify-between items-center shadow-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faTrash}
                  className="text-yellow-600 text-sm"
                />
              </div>
              <p className="text-sm text-yellow-800">
                メッセージを削除しました。
              </p>
            </div>
            <button
              onClick={undoDelete}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 shadow"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="text-sm" />
              元に戻す
            </button>
          </div>
        )}

        {/* メッセージ一覧 - スクロール可能エリア */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-white to-gray-50">
          {hasMore && (
            <div className="text-center sticky top-0 z-10">
              <button
                onClick={loadMoreMessages}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-100 to-white border border-gray-200 text-gray-700 rounded-full hover:from-gray-200 hover:to-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                {isLoading ? "読み込み中..." : "過去のメッセージを読み込む"}
              </button>
            </div>
          )}

          {currentMessages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <FontAwesomeIcon
                  icon={faSmile}
                  className="text-3xl text-blue-500"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                まだメッセージがありません
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                最初のメッセージを送信して会話を始めましょう！
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {currentMessages.map((msg, index) => {
                // 日付の変更をチェック
                const showDate =
                  index === 0 || msg.date !== currentMessages[index - 1].date;

                return (
                  <div key={msg.id} className="group">
                    {/* 日付セパレーター */}
                    {showDate && (
                      <div className="flex items-center justify-center my-8">
                        <div className="px-4 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded-full text-xs text-gray-600 shadow-sm">
                          <FontAwesomeIcon icon={faClock} className="mr-2" />
                          {msg.date}
                        </div>
                      </div>
                    )}

                    {/* メッセージ */}
                    <div
                      className={`flex gap-4 ${
                        msg.self ? "justify-end" : "justify-start"
                      }`}
                    >
                      {/* User icon - show on left for others */}
                      {!msg.self && (
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <img
                              src={
                                msg.profilePicture
                                  ? resolveImageUrl(msg.profilePicture)
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      msg.userName || "User"
                                    )}&background=random`
                              }
                              alt={msg.userName}
                              className="w-12 h-12 rounded-full object-cover ring-4 ring-white shadow-md"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                        </div>
                      )}

                      <div
                        className={`relative max-w-xl ${
                          msg.self ? "ml-auto" : ""
                        }`}
                      >
                        {/* User name - show above message for others */}
                        {!msg.self && (
                          <div className="text-sm font-semibold text-gray-800 mb-1.5 px-1">
                            {msg.userName || `User ${msg.user}`}
                          </div>
                        )}

                        {/* Hover Action Icons */}
                        <div
                          className={`
                            absolute -top-10 flex gap-1 bg-white rounded-full shadow-lg px-2 py-1 border border-gray-200
                            ${msg.self ? "right-0" : "left-0"}
                            opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-100 scale-95
                          `}
                        >
                          {msg.self && (
                            <IconButton
                              onClick={() => startEditing(msg)}
                              tooltip="編集"
                            >
                              <FontAwesomeIcon
                                icon={faPenToSquare}
                                className="w-4 h-4 text-gray-600"
                              />
                            </IconButton>
                          )}
                          <IconButton
                            onClick={() => handleReply(msg)}
                            tooltip="返信"
                          >
                            <FontAwesomeIcon
                              icon={faReply}
                              className="w-4 h-4 text-gray-600"
                            />
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setShowReactionPicker(true);
                              setReactionPickerMessageId(msg.id);
                            }}
                            tooltip="リアクション"
                          >
                            <FontAwesomeIcon
                              icon={faSmile}
                              className="w-4 h-4 text-gray-600"
                            />
                          </IconButton>
                          {msg.self && (
                            <IconButton
                              onClick={() => deleteMessage(msg.id)}
                              tooltip="削除"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="w-4 h-4 text-gray-600"
                              />
                            </IconButton>
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div className="flex flex-col">
                          {msg.replyTo && (
                            <div className="mb-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-blue-400 rounded-lg text-sm text-gray-600 shadow-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <FontAwesomeIcon
                                  icon={faReply}
                                  className="w-3 h-3 text-blue-500"
                                />
                                <span className="font-semibold text-xs text-gray-500">
                                  返信: {msg.replyTo.userName}
                                </span>
                              </div>
                              {msg.replyTo.text}
                            </div>
                          )}
                          {editingId === msg.id ? (
                            <div className="bg-white border-2 border-blue-300 rounded-2xl p-4 shadow-xl space-y-3 animate-in zoom-in duration-200">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full border-2 border-gray-200 p-3 rounded-xl resize-none focus:outline-none focus:border-blue-400 transition-colors"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={cancelEdit}
                                  className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:bg-gray-50 font-medium transition-all duration-200 hover:scale-105"
                                >
                                  キャンセル
                                </button>
                                <button
                                  onClick={saveEdit}
                                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                >
                                  保存
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <div
                                className={`px-5 py-3 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg ${
                                  msg.self
                                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm"
                                    : "bg-white text-gray-800 rounded-bl-sm border border-gray-200"
                                }`}
                              >
                                <p className="leading-relaxed whitespace-pre-wrap break-words">
                                  {msg.text}
                                </p>
                              </div>
                              {msg.reaction && (
                                <div className="absolute -bottom-2 right-3 bg-white border-2 border-gray-200 rounded-full px-3 py-1 text-sm shadow-lg">
                                  {msg.reaction}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Time and edited indicator */}
                          <div
                            className={`text-xs text-gray-400 mt-1.5 flex items-center gap-2 ${
                              msg.self ? "justify-end" : "justify-start"
                            }`}
                          >
                            {msg.self && <span>{msg.time}</span>}
                            {msg.edited && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                                <FontAwesomeIcon
                                  icon={faEdit}
                                  className="w-3 h-3"
                                />
                                編集済み
                              </span>
                            )}
                          </div>

                          {/* Reactions */}
                          {Object.keys(msg.reactions || {}).length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {Object.entries(msg.reactions || {}).map(
                                ([emoji, users]) => (
                                  <span
                                    key={emoji}
                                    onClick={async () => {
                                      if (users.includes(user.id)) {
                                        try {
                                          await removeReaction(
                                            currentProjectId,
                                            selectedChat,
                                            msg.id,
                                            emoji
                                          );

                                          setAllMessages((prev) => ({
                                            ...prev,
                                            [selectedChat]: prev[
                                              selectedChat
                                            ].map((m) =>
                                              m.id === msg.id
                                                ? {
                                                    ...m,
                                                    reactions: {
                                                      ...m.reactions,
                                                      [emoji]: m.reactions[
                                                        emoji
                                                      ].filter((id) => id !== user.id),
                                                    },
                                                  }
                                                : m
                                            ),
                                          }));
                                        } catch (error) {
                                          console.error(
                                            "Failed to remove reaction:",
                                            error
                                          );
                                        }
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm transition-all duration-200 cursor-pointer ${
                                      users.includes(user.id)
                                        ? "ring-2 ring-blue-400"
                                        : "hover:shadow-md hover:scale-105"
                                    }`}
                                  >
                                    <span className="text-base">{emoji}</span>
                                    <span className="font-semibold text-gray-700">
                                      {users.length}
                                    </span>
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* User icon on right for self messages */}
                      {msg.self && (
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <img
                              src={
                                msg.profilePicture
                                  ? resolveImageUrl(msg.profilePicture)
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      msg.userName || "User"
                                    )}&background=random`
                              }
                              alt="You"
                              className="w-12 h-12 rounded-full object-cover ring-4 ring-blue-200 shadow-md"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* リアクションピッカー */}
        {showReactionPicker && reactionPickerMessageId && (
          <div
            className="absolute bottom-24 right-6 z-50 shadow-2xl rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <EmojiPicker
              width={350}
              height={400}
              onEmojiClick={async (emoji) => {
                try {
                  const result = await addReaction(
                    currentProjectId,
                    selectedChat,
                    reactionPickerMessageId,
                    emoji.emoji
                  );

                  if (result) {
                    setAllMessages((prev) => ({
                      ...prev,
                      [selectedChat]: prev[selectedChat].map((m) =>
                        m.id === reactionPickerMessageId
                          ? {
                              ...m,
                              reactions: {
                                ...m.reactions,
                                [emoji.emoji]: [
                                  ...(m.reactions[emoji.emoji] || []),
                                  user.id,
                                ],
                              },
                            }
                          : m
                      ),
                    }));
                  } else {
                    // Reaction was removed (toggled)
                    setAllMessages((prev) => ({
                      ...prev,
                      [selectedChat]: prev[selectedChat].map((m) =>
                        m.id === reactionPickerMessageId
                          ? {
                              ...m,
                              reactions: {
                                ...m.reactions,
                                [emoji.emoji]: m.reactions[
                                  emoji.emoji
                                ].filter((id) => id !== user.id),
                              },
                            }
                          : m
                      ),
                    }));
                  }
                } catch (error) {
                  console.error("Failed to add reaction:", error);
                }

                setShowReactionPicker(false);
                setReactionPickerMessageId(null);
              }}
            />
          </div>
        )}

        {/* リプライプレビュー */}
        {replyTo && (
          <div className="mx-6 mb-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl shadow-sm flex items-center gap-3 flex-shrink-0">
            <div className="flex-1">
              <div className="text-xs font-semibold text-blue-700 mb-1">
                返信中: {replyTo.userName}
              </div>
              <div className="text-sm text-gray-800 line-clamp-1">
                {replyTo.text}
              </div>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/50 hover:bg-white rounded-full transition"
            >
              <FontAwesomeIcon icon={faXmark} className="text-gray-600" />
            </button>
          </div>
        )}

        {/* メッセージ入力エリア */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-white to-gray-50 flex-shrink-0">
          <div className="flex items-end gap-3 relative">
            {/* 絵文字ピッカーボタン */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200 rounded-full mb-3 transition-all shadow"
            >
              <FontAwesomeIcon
                icon={faSmile}
                className="text-xl text-yellow-600"
              />
            </button>

            {showEmojiPicker && (
              <div
                className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <EmojiPicker
                  width={350}
                  height={400}
                  onEmojiClick={(emoji) => {
                    setMessageInput((prev) => prev + emoji.emoji);
                  }}
                />
              </div>
            )}

            {/* テキスト入力 */}
            <div className="flex-grow bg-white border border-gray-300 rounded-2xl p-1 shadow-inner">
              <textarea
                rows={2}
                className="w-full p-3 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 resize-none"
                placeholder="メッセージを入力..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onKeyDown={(e) => {
                  if (isComposing) return;
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>

            {/* 送信ボタン */}
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !messageInput.trim()}
              className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-full shadow-lg hover:shadow-xl disabled:shadow transition-all duration-200"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function IconButton({ children, onClick, tooltip }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition relative group"
      title={tooltip}
    >
      {children}
    </button>
  );
}

export default Chat;
