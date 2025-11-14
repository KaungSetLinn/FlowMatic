import React, { useState, useRef } from 'react';

const AccountSettings = () => {
    const [edit, setEdit] = useState(false);

    const [userData, setUserData] = useState({
        username: '山田太郎',
        email: 'taro.yamada@example.com',
        bio: '5年以上の経験を持つプロジェクトマネージャー。クロスファンクショナルチームを率いて成功するソフトウェアプロジェクトを提供してきました。',
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80'
    });
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [notification, setNotification] = useState({
        show: false,
        message: '',
        type: ''
    });
    
    const fileInputRef = useRef(null);
    const defaultProfilePic = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80";

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
        ...prev,
        [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
        ...prev,
        [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setEdit(false);
        showNotification('プロファイルが正常に更新されました！', 'success');
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
        showNotification('新しいパスワードが一致しません', 'error');
        return;
        }
        showNotification('パスワードが正常に更新されました！', 'success');
        setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
        });
    };

    const handlePictureChange = (e) => {
        if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            setUserData(prev => ({
            ...prev,
            profileImage: e.target.result
            }));
            showNotification('プロフィール画像が更新されました', 'success');
        };
        reader.readAsDataURL(e.target.files[0]);
        }
    };

    const removeProfilePicture = () => {
        setUserData(prev => ({
        ...prev,
        profileImage: defaultProfilePic
        }));
        showNotification('プロフィール画像が削除されました', 'info');
    };

    const showNotification = (message, type) => {
        setNotification({
        show: true,
        message,
        type
        });
        
        setTimeout(() => {
        setNotification({
            show: false,
            message: '',
            type: ''
        });
        }, 3000);
    };

    // 画像クリックでファイル選択ダイアログを開く
    const handleImageClick = () => {
        fileInputRef.current.click();
        console.log("画像がクリックされました");
    };

    return (
        <div className="flex-1 p-8">
            {notification.show && (
                <div className={`fixed top-4 right-4 px-4 py-3 rounded-md shadow-md text-white font-medium transform transition-all duration-300 z-50 ${
                notification.type === 'success' ? 'bg-green-600' : 
                notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                }`}>
                {notification.message}
                </div>
            )}
            
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">アカウント設定</h2>
                <div className="flex items-center space-x-4">
                    <span className="text-gray-700">{userData.username}</span>
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {userData.username.split(' ').map(name => name[0]).join('')}
                    </div>
                </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className='flex'>
                        <h3 className="flex-1 text-xl font-semibold text-gray-800 mb-6">プロフィール情報</h3>
                        <span className='flex-1 text-right'>
                            {!edit && (
                                <button 
                                    type='button' 
                                    className='px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white
                                    font-bold rounded-lg cursor-pointer'
                                    onClick={() => setEdit(true)}
                                    >
                                    編集
                                </button>
                            )}
                        </span>
                    </div>
                
                    <div className="flex flex-col md:flex-row items-center mb-8">
                        <div className="relative mb-4 md:mb-0 md:mr-8">
                        {/* クリック可能なコンテナ - ここにクリックイベントを追加 */}
                        <div 
                            className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden cursor-pointer relative"
                            onClick={handleImageClick}
                        >
                            <img 
                            id="profile-image" 
                            src={userData.profileImage} 
                            alt="プロフィール" 
                            className="w-full h-full object-cover"
                            />
                            {/* ホバー時に表示されるオーバーレイ */}
                            <div className="absolute inset-0 rounded-full flex items-center justify-center transition-all duration-300">
                            <div className="text-white text-center duration-300">
                                <i className="fas fa-camera mb-1 block text-xl"></i>
                                <span className="ml-1 font-bold">変更</span>
                            </div>
                            </div>
                        </div>
                        {/* 非表示のファイル入力 */}
                        <input 
                            type="file" 
                            id="upload-photo" 
                            className="hidden" 
                            accept="image/*" 
                            ref={fileInputRef}
                            onChange={handlePictureChange}
                        />
                        </div>
                        
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-gray-800">{userData.username}</h2>
                            <p className="text-gray-600">{userData.email}</p>
                            <p className="text-sm text-gray-500 mt-2">2023年1月加入</p>
                        
                            <div className="mt-4 flex justify-center md:justify-start space-x-4">
                                <button 
                                onClick={() => fileInputRef.current.click()} 
                                className="text-blue-600 hover:text-blue-800 text-md font-bold cursor-pointer"
                                >
                                画像を変更
                                </button>
                                <button 
                                onClick={removeProfilePicture} 
                                className="text-red-600 hover:text-red-800 text-md font-bold cursor-pointer"
                                >
                                画像を削除
                                </button>
                            </div>
                        </div>
                    </div>
                
                    {edit && (
                        <div className="border-t border-gray-200 pt-6">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                        ユーザー名
                                    </label>
                                    <input 
                                        type="text" 
                                        id="username" 
                                        name="username"
                                        value={userData.username} 
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    </div>
                                    <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        メールアドレス
                                    </label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email"
                                        value={userData.email} 
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md 
                                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled
                                    />
                                    </div>
                                </div>
                                
                                <div className="mb-6">
                                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                                    自己紹介
                                    </label>
                                    <textarea 
                                    id="bio" 
                                    name="bio"
                                    rows="3" 
                                    value={userData.bio} 
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    ></textarea>
                                </div>
                                
                                <div className="flex justify-end space-x-4">
                                    <button 
                                    type="button" 
                                    onClick={() => {
                                        setUserData({
                                        ...userData,
                                        username: '山田太郎',
                                        email: 'taro.yamada@example.com',
                                        bio: '5年以上の経験を持つプロジェクトマネージャー。クロスファンクショナルチームを率いて成功するソフトウェアプロジェクトを提供してきました。'
                                        });

                                        setEdit(false);
                                    }} 
                                    className="px-5 py-2 border border-gray-300 rounded-md font-bold
                                    hover:bg-gray-100 cursor-pointer"
                                    >
                                    キャンセル
                                    </button>

                                    <button 
                                    type="submit" 
                                    className="px-5 py-2 bg-green-600 text-white rounded-md font-bold
                                    hover:bg-green-700 cursor-pointer"
                                    >
                                    変更を保存
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">セキュリティ設定</h3>
                
                <div className="border-t border-gray-200 pt-4">
                    <form onSubmit={handlePasswordSubmit}>
                    <div className="mb-6">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">パスワードの変更</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-3">
                                現在のパスワード
                                </label>
                                <input 
                                type="password" 
                                id="current-password" 
                                name="currentPassword"
                                value={passwordData.currentPassword} 
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-3">
                                新しいパスワード
                                </label>
                                <input 
                                type="password" 
                                id="new-password" 
                                name="newPassword"
                                value={passwordData.newPassword} 
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-3">
                                新しいパスワード（確認）
                                </label>
                                <input 
                                type="password" 
                                id="confirm-password" 
                                name="confirmPassword"
                                value={passwordData.confirmPassword} 
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                        <button 
                            type="submit" 
                            className="px-5 py-2 bg-green-600 text-white rounded-md font-bold
                                    hover:bg-green-700 cursor-pointer"
                        >
                            パスワードを更新
                        </button>
                        </div>
                    </div>
                    </form>
                </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;