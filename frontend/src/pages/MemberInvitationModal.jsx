import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

const MemberInvitationModal = () => {
  // 状態管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [role, setRole] = useState('member');
  const [message, setMessage] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // 参照
  const modalRef = useRef(null);
  const debounceRef = useRef(null);

  // モーダルを開く
  const openModal = () => {
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    // 状態をリセット
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setRole('member');
    setMessage('');
    setSearchError('');
  };

  useEffect(() => {
    getUsers();
  }, []);

  const getUsers = async () => {
    try {
      const res = await api.get("/api/users/");

      console.log(res.data)

      const users = res.data;

      setUsers(users);

      // setSearchResults(
      //   res.data.filter(u => !selectedUsers.find(s => s.id === u.id))
      // );
    } catch (error) {
      console.error("ユーザー取得エラー:", error);
      setSearchError("ユーザーを取得できませんでした。");
    }
  };

  // 検索処理（デバウンス付き）
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    
    // if (searchQuery.trim().length < 2) {
    //   setSearchResults([]);
    //   setSearchError('2文字以上入力してください');
    //   return;
    // }
    
    setSearchError('');
    
    // デバウンス処理
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      ).filter(user => !selectedUsers.find(selected => selected.id === user.id));
      
      setSearchResults(filteredUsers);
    }, 300);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, selectedUsers]);

  // ユーザーを選択
  const selectUser = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // ユーザーを削除
  const removeUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };

  // 招待を送信
  const sendInvitation = () => {
    if (selectedUsers.length === 0) return;
    
    // ここでAPI呼び出しをシミュレート
    console.log('招待を送信:', {
      users: selectedUsers,
      role,
      message
    });
    
    // 成功トーストを表示
    setShowSuccessToast(true);
    
    // 3秒後にトーストを非表示
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
    
    // モーダルを閉じる
    closeModal();
  };

  // 外側をクリックしてモーダルを閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };
    
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center p-4">
      {/* メインボタン */}
      <button
        onClick={openModal}
        className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer
        px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        <i className="fas fa-user-plus mr-2"></i>
        メンバーを招待
      </button>

      {/* モーダル背景 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 transition-opacity duration-300 flex items-center justify-center p-4">
          {/* モーダルコンテナ */}
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-transform duration-300 scale-100 opacity-100"
          >
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-800">メンバー招待</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* モーダルボディ */}
            <div className="p-6 space-y-4">
              {/* ユーザー名検索 */}
              <div>
                <label className="block text-md font-semibold text-gray-700 mb-2">
                  ユーザー名またはメールで検索
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ユーザー名を入力..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <i className="fas fa-search"></i>
                  </div>
                </div>
                {searchError && (
                  <p className="text-red-500 text-md mt-1">{searchError}</p>
                )}
              </div>

              {/* 検索結果 */}
              {searchResults.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-2">一致するユーザー</h4>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {searchResults.map(user => (
                      <div
                        key={user.id}
                        onClick={() => selectUser(user)}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center">
                          {user.profile_picture ? (
                            <img
                            src={user.profile_picture}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover mr-3"
                          />
                          ) : (
                            <i className="fa-solid fa-user text-gray-400 text-3xl ml-2.5 mr-4"></i>
                          )}
                          
                          <div>
                            <div className="font-semibold text-gray-900">{user.username}</div>
                            <div className="text-md text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 選択されたユーザー */}
              {selectedUsers.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-2">選択されたユーザー</h4>
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg min-h-12">
                    {selectedUsers.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1"
                      >
                        {user.profile_picture ? (
                            <img
                            src={user.profile_picture}
                            alt={user.username}
                            className="w-6 h-6 rounded-full object-cover mr-3"
                          />
                          ) : (
                            <i className="fa-solid fa-user text-gray-400 text-xl ml-2.5 mr-4"></i>
                          )}
                        <span className="text-md mr-1 font-bold">{user.username}</span>
                        <button
                          type="button"
                          onClick={() => removeUser(user.id)}
                          className="text-blue-600 hover:text-blue-800 ml-1 cursor-pointer"
                        >
                          <i className="fas fa-times-circle"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 役割選択 */}
              <div>
                <label className="block text-md font-semibold text-gray-700 mb-2">権限</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="member">メンバー</option>
                  <option value="admin">管理者</option>
                  <option value="viewer">閲覧者</option>
                  <option value="editor">編集者</option>
                </select>
              </div>

              {/* カスタムメッセージ */}
              <div>
                <label className="block text-md font-semibold text-gray-700 mb-2">
                  カスタムメッセージ (任意)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="メッセージを追加..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                ></textarea>
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-white cursor-pointer hover:bg-red-600 
                rounded-lg bg-red-500 font-semibold transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={sendInvitation}
                disabled={selectedUsers.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer
                font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                招待を送信
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 成功トースト */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 flex items-center">
          <i className="fas fa-check-circle mr-2"></i>
          <span>招待を送信しました！</span>
        </div>
      )}
    </div>
  );
};

export default MemberInvitationModal;