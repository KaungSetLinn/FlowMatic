import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react';
import api from '../api';

function Register() {
    
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const route = "/api/user/register/";

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        // Clean up the object URL when component unmounts or when profile picture changes
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file type and size
            if (!file.type.startsWith('image/')) {
                alert('画像ファイルを選択してください');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('ファイルサイズは5MB以下にしてください');
                return;
            }

            setProfilePicture(file);
            
            // Create preview URL
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleRemovePicture = () => {
        setProfilePicture(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Basic validation
        if (password !== confirmPassword) {
            alert('パスワードが一致しません');
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('confirm_password', confirmPassword);
            
            if (profilePicture) {
                formData.append('profile_picture', profilePicture);
            }

            const res = await api.post(route, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log(res.data);
            setShowSuccess(true);
        } 
        catch (error) {
            alert(error.response?.data ? JSON.stringify(error.response.data) : error);
        } 
        finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowSuccess(false);
        navigate("/login");
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="bg-gray-50">
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-blue-600 py-5 text-white">
                        <h1 className="text-4xl font-bold mb-4 text-center">FlowMatic</h1>
                        <p className="text-lg text-center font-semibold">アカウントを作成してください</p>
                    </div>
                    
                    <div className="px-10 py-6">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Profile Picture Upload */}
                            <div>
                                <label className="block text-md font-bold text-gray-700 mb-3">プロフィール画像</label>
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-gray-300 
                                                        flex items-center justify-center overflow-hidden cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}>
                                            {previewUrl ? (
                                                <img 
                                                    src={previewUrl} 
                                                    alt="Profile preview" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <i className="fa-solid fa-user text-gray-400 text-2xl"></i>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <input 
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                            id="profile-picture"
                                        />
                                        <label 
                                            htmlFor="profile-picture"
                                            className="cursor-pointer bg-blue-100 text-blue-700 px-4 py-2 
                                                    rounded-lg text-sm font-semibold hover:bg-blue-200 
                                                    transition duration-200 inline-block"
                                        >
                                            画像を選択
                                        </label>
                                        {previewUrl && (
                                            <button
                                                type="button"
                                                onClick={handleRemovePicture}
                                                className="ml-2 bg-red-600 text-white text-sm font-semibold 
                                                px-4 py-2 hover:bg-red-700 cursor-pointer rounded-lg"
                                            >
                                                削除
                                            </button>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            JPEG, PNG (最大5MB)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-md font-bold text-gray-700 mb-3">ユーザー名</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                        <i className="fa-solid fa-user text-gray-400 text-lg"></i>
                                    </span>
                                    <input 
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        required 
                                        placeholder='電子太郎'
                                        className="pl-12 w-full px-4 py-2 rounded-lg 
                                        border border-gray-300"
                                        ref={inputRef}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-md font-bold text-gray-700 mb-3">メールアドレス</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                        <i className="fa-solid fa-envelope text-gray-400 text-lg"></i>
                                    </span>
                                    <input 
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required 
                                        placeholder='example@gmail.com'
                                        className="pl-12 w-full px-4 py-2 rounded-lg 
                                        border border-gray-300"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-md font-bold text-gray-700 mb-3">パスワード</label>
                                <div className="relative mb-3">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                        <i className="fa-solid fa-lock text-gray-400 text-lg"></i>
                                    </span>
                                    <input 
                                        type={passwordVisible ? "text" : "password"} 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required 
                                        placeholder='6文字以上'
                                        className="pl-12 w-full px-4 py-2 rounded-lg border border-gray-300" 
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button 
                                            type="button" 
                                            className="text-gray-400 hover:text-gray-500 
                                            cursor-pointer focus:outline-none"
                                            onClick={e => setPasswordVisible(prev => !prev)}
                                        >
                                        {passwordVisible ? (
                                            <i className="fa-solid fa-eye-slash text-lg"></i>
                                        ) : (
                                            <i className="fa-solid fa-eye text-lg"></i>
                                        )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-md font-bold text-gray-700 mb-3">パスワード確認</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                        <i className="fa-solid fa-lock text-gray-400 text-lg"></i>
                                    </span>
                                    <input 
                                        type={confirmPasswordVisible ? "text" : "password"} 
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required 
                                        placeholder='パスワードを再入力'
                                        className="pl-12 w-full px-4 py-2 rounded-lg border border-gray-300" 
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button 
                                            type="button" 
                                            className="text-gray-400 hover:text-gray-500 
                                            cursor-pointer focus:outline-none"
                                            onClick={e => setConfirmPasswordVisible(prev => !prev)}
                                        >
                                        {confirmPasswordVisible ? (
                                            <i className="fa-solid fa-eye-slash text-lg"></i>
                                        ) : (
                                            <i className="fa-solid fa-eye text-lg"></i>
                                        )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <button type="submit" className="w-full bg-blue-600 text-lg text-white py-2.5 px-4 
                            rounded-lg font-extrabold hover:scale-105 cursor-pointer
                            transition ease-in-out duration-300 shadow-md">
                                新規登録
                            </button>
                        </form>
                        
                        <p className="mt-6 text-center text-md font-semibold">
                            すでにアカウントをお持ちですか？
                            <Link to="/login" className="ml-2 font-semibold text-blue-600 
                            underline hover:text-primary-500">
                                ログインへ
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div 
                    className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-start justify-center"
                    onClick={handleCloseModal}
                >
                    <div 
                        className="bg-white rounded-xl shadow-lg p-4 max-w-sm w-full text-center mt-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between md:p-3 border-b rounded-t 
                        dark:border-gray-600 border-gray-200">
                        <h3 className="text-3xl font-semibold text-gray-900 dark:text-white">
                            新規登録完了
                        </h3>
                        <button 
                            type="button" 
                            className="text-black bg-transparent hover:bg-gray-200 
                            hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto 
                            inline-flex justify-center items-center 
                            dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer" 
                            onClick={handleCloseModal}
                        >
                            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                                </svg>
                            <span className="sr-only">Close modal</span>
                            </button>
                        </div>

                        <div className="p-4 md:p-5 space-y-4">
                            <img src="/images/SuccessIcon.png" alt="Success Icon" className="w-12 h-12 mx-auto mb-4" />
                            <p className='text-lg'>新規登録は完了しました。</p>
                        </div>
                        <button 
                        onClick={handleCloseModal} 
                        className="bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer font-semibold"
                        >
                        はい
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Register;