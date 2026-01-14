import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { changeUserPassword, updateUserProfile } from "../services/UserService";
import { CURRENT_USER } from "../constants";

const AccountSettings = () => {
  const { user, setUser } = useAuth();
  // console.log(user);
  const [edit, setEdit] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);

  const [userData, setUserData] = useState({
    id: null,
    username: "",
    email: "",
    profile_picture: null,
    date_joined: null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  useEffect(() => {
    setUserData({
      id: user.id,
      username: user.username,
      email: user.email,
      profile_picture: user.profile_picture,
      date_joined: user.date_joined,
    });
  }, [user]);

  const fileInputRef = useRef(null);

  const formatJoinedDateJP = (isoString) => {
    if (!isoString) return "";

    const date = new Date(isoString);

    return `${date.getFullYear()}年${date.getMonth() + 1}月加入`;
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Only update the username
      const updateData = { username: userData.username };

      const updatedUser = await updateUserProfile(updateData); // no profile_picture here
      setUser(updatedUser);
      localStorage.setItem(CURRENT_USER, JSON.stringify(updatedUser));

      showNotification("ユーザー名が正常に更新されました！", "success");
      setEdit(false);
    } catch (error) {
      console.error(error);
      showNotification("ユーザー名の更新に失敗しました", "error");
    }
  };

  const handlePasswordSubmit = async () => {
    if (passwordLoading) return; // prevent double click

    // Frontend validations
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      showNotification("すべてのフィールドを入力してください", "error");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showNotification(
        "新しいパスワードは6文字以上で入力してください",
        "error"
      );
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification("新しいパスワードが一致しません", "error");
      return;
    }

    try {
      setPasswordLoading(true);

      await changeUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      showNotification("パスワードが正常に更新されました！", "success");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPassword({
        current: false,
        new: false,
        confirm: false,
      });
    } catch (error) {
      console.error(error);
      const data = error.response?.data;

      if (data?.current_password) {
        showNotification(data.current_password.join(", "), "error");
      } else if (data?.new_password) {
        showNotification(data.new_password.join(", "), "error");
      } else if (data?.confirm_password) {
        showNotification(data.confirm_password.join(", "), "error");
      } else if (typeof data === "string") {
        showNotification(data, "error");
      } else {
        showNotification("パスワード更新に失敗しました", "error");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePictureChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.onload = async (event) => {
        // Update local state for preview
        setUserData((prev) => ({
          ...prev,
          profile_picture: file,
          profile_preview: event.target.result,
        }));

        // Upload immediately
        try {
          const updatedUser = await updateUserProfile({
            username: userData.username, // keep current username
            profile_picture: file,
          });

          setUser(updatedUser);
          localStorage.setItem(CURRENT_USER, JSON.stringify(updatedUser));
          showNotification("プロフィール画像が更新されました！", "success");
        } catch (error) {
          console.error(error);
          showNotification("プロフィール画像の更新に失敗しました", "error");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = async () => {
    try {
      setUserData((prev) => ({
        ...prev,
        profile_picture: null,
        profile_preview: null,
      }));

      // Send PATCH with profile_picture null to backend
      const updatedUser = await updateUserProfile({
        username: userData.username,
        profile_picture: null,
      });
      setUser(updatedUser);

      showNotification("プロフィール画像が削除されました", "info");
    } catch (error) {
      console.error(error);
      showNotification("画像削除に失敗しました", "error");
    }
  };

  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type,
    });

    setTimeout(() => {
      setNotification({
        show: false,
        message: "",
        type: "",
      });
    }, 3000);
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4">
        {notification.show && (
          <div
            className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-bold z-50 ${
              notification.type === "success"
                ? "bg-green-500"
                : notification.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-800">アカウント設定</h1>
            <p className="text-gray-600 mt-3 text-lg">
              プロフィールとセキュリティの管理
            </p>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                プロフィール
              </h2>
              {!edit ? (
                <button
                  onClick={() => setEdit(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-lg font-bold"
                >
                  編集
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Reset userData to original user
                      setUserData({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        profile_picture: user.profile_picture,
                        date_joined: user.date_joined,
                      });
                      setEdit(false);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-bold flex items-center gap-2"
                  >
                    <i className="fas fa-times"></i>
                    キャンセル
                  </button>

                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer font-bold flex items-center gap-2"
                  >
                    <i className="fas fa-check"></i>
                    保存
                  </button>
                </div>
              )}
            </div>

            {/* Profile Picture */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {userData.profile_picture ? (
                    <img
                      src={userData.profile_preview || userData.profile_picture}
                      alt="プロフィール"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <i className="fas fa-user text-gray-500 text-4xl"></i>
                  )}
                </div>
                <button
                  onClick={handleImageClick}
                  className="absolute inset-0 w-24 h-24 rounded-full group-hover:bg-opacity-40 transition-all flex items-center justify-center cursor-pointer"
                >
                  {userData.profile_picture && (
                    <i className="fas fa-camera text-white text-2xl"></i>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePictureChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div>
                <div className="flex gap-4 text-lg font-bold">
                  <button
                    onClick={handleImageClick}
                    className="text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    {userData.profile_picture ? "画像を変更" : "画像を選択"}
                  </button>
                  {userData.profile_picture && (
                    <button
                      onClick={removeProfilePicture}
                      className="text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      画像を削除
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-lg font-bold text-gray-700 mb-2">
                  <i className="fas fa-user"></i>
                  ユーザー名
                </label>
                {edit ? (
                  <input
                    type="text"
                    name="username"
                    value={userData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl"
                  />
                ) : (
                  <p className="text-gray-900 text-xl px-4 py-2">
                    {userData.username}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-lg font-bold text-gray-700 mb-2">
                  <i className="fas fa-envelope"></i>
                  メールアドレス
                </label>
                <p className="text-gray-900 text-xl px-4 py-2 bg-gray-50 rounded-lg">
                  {userData.email}
                </p>
                <p className="text-xs text-gray-500 mt-1 px-4">
                  メールアドレスは変更できません
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-lg font-bold text-gray-700 mb-2">
                  <i className="fas fa-calendar"></i>
                  登録日
                </label>
                <p className="text-gray-900 text-xl px-4 py-2">
                  {formatJoinedDateJP(userData.date_joined)}
                </p>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <i className="fas fa-lock"></i>
              セキュリティ
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  現在のパスワード
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg
               focus:ring-2 focus:ring-blue-500 focus:border-transparent
               disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-500
               hover:text-gray-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    <i
                      className={`fas ${
                        showPassword.current ? "fa-eye-slash" : "fa-eye"
                      }`}
                    ></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  新しいパスワード（6文字以上）
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg
               focus:ring-2 focus:ring-blue-500 focus:border-transparent
               disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-500
               hover:text-gray-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    <i
                      className={`fas ${
                        showPassword.new ? "fa-eye-slash" : "fa-eye"
                      }`}
                    ></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  新しいパスワード（確認）
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg
               focus:ring-2 focus:ring-blue-500 focus:border-transparent
               disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-500
               hover:text-gray-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    <i
                      className={`fas ${
                        showPassword.confirm ? "fa-eye-slash" : "fa-eye"
                      }`}
                    ></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handlePasswordSubmit}
                disabled={passwordLoading}
                className={`px-6 py-2 rounded-lg text-lg font-bold transition-colors
    ${
      passwordLoading
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
    }`}
              >
                {passwordLoading ? "更新中..." : "パスワードを更新"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountSettings;
