import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { ACCESS_TOKEN, CURRENT_USER, REFRESH_TOKEN } from '../constants';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { setIsAuthorized, setUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [passwordVisible, setPasswordVisible] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const route = "/api/token/";

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }

        localStorage.clear();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post(route, { email, password });

            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            localStorage.setItem(CURRENT_USER, JSON.stringify(res.data.user))

            setIsAuthorized(true);
            setUser(res.data.user);

            navigate("/");
        } 
        catch (error) {
            alert(error.response?.data ? JSON.stringify(error.response.data) : error);
        } 
        finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div class="bg-gray-50">
            <div class="min-h-screen flex items-center justify-center px-4">
                <div class="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                    <div class="bg-blue-600 py-6 text-white">
                        <h1 class="text-4xl font-bold mb-3 text-center">FlowMatic</h1>
                        <p class="text-lg text-center font-semibold">プロジェクトを管理するにはログインしてください</p>
                    </div>
                    
                    <div class="p-10">
                        <form class="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label class="block text-md font-bold text-gray-700 mb-3">メールアドレス</label>
                                <div class="relative">
                                    <span class="absolute inset-y-0 left-0 flex items-center pl-4">
                                        <i class="fa-solid fa-envelope text-gray-400 text-lg"></i>
                                    </span>
                                    <input 
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required 
                                        placeholder='example@gmail.com'
                                        class="pl-12 w-full px-4 py-2 rounded-lg 
                                        border border-gray-300"
                                        ref={inputRef}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-md font-bold text-gray-700 mb-3">パスワード</label>
                                <div class="relative mb-3">
                                    <span class="absolute inset-y-0 left-0 flex items-center pl-4">
                                        <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 
                                            01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" 
                                            clipRule="evenodd"></path>
                                        </svg>
                                    </span>
                                    <input 
                                        type={passwordVisible ? "text" : "password"} 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required 
                                        placeholder='6文字以上'
                                        class="pl-12 w-full px-4 py-2 rounded-lg border border-gray-300" 
                                    />
                                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button 
                                            type="button" 
                                            class="text-gray-400 hover:text-gray-500 
                                            cursor-pointer focus:outline-none"
                                            onClick={e => setPasswordVisible(prev => !prev)}
                                        >
                                            {passwordVisible ? (
                                                <i class="fa-solid fa-eye-slash text-lg"></i>
                                            ) : (
                                                <i class="fa-solid fa-eye text-lg"></i>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <Link to="#" class="text-md font-bold text-blue-600 hover:underline">
                                    パスワードを忘れた？
                                </Link>
                            </div>
                            
                            <button type="submit" class="w-full bg-blue-600 text-lg text-white py-2.5 px-4 
                            rounded-lg font-extrabold hover:scale-105 cursor-pointer
                            transition ease-in-out duration-300 shadow-md">
                                ログイン
                            </button>
                        </form>
                        
                        <p class="mt-6 text-center text-md font-semibold">
                            アカウントをお持ちではありませんか？
                            <Link to="/register" class="ml-2 font-semibold text-blue-600 
                            underline hover:text-primary-500">
                                新規登録へ
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;