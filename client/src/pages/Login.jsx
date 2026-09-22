import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { User, KeyRound, Phone, Eye, EyeOff, Mail } from 'lucide-react';
import { FaFacebookF } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

export default function Login(){
    const [email, setEmail] = useState(''); // useState — cara React "mengingat" nilai yang bisa berubah.
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // false = password tersembunyi, true = password terlihat.
    const [isSignUp, setIsSignUp] = useState(false); // false = login, true = sign up
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault(); // mencegah perilaku default form HTML (yang biasanya reload halaman waktu di-submit)
        setError('');
        setLoading(true);
        
        try { // try/catch/finally — coba jalankan login(...); kalau gagal masuk ke catch buat nampilin pesan error; finally selalu jalan di akhir (baik sukses maupun gagal) buat matiin status loading.
            const data = await login(email, password);
            localStorage.setItem('token', data.token); // nyimpen token di penyimpanan browser yang permanen. anti "diambil" otomatis sama interceptors di services/api.js
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/dashboard'); // dari react-router-dom, buat pindah halaman tanpa reload browser.
        } catch (err){
            setError('Email atau password salah.')
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden"></div>
            {/* Card */}
            <div className="relative w-[900px] h-[500px] bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Form Login */}
                <div className={`absolute right-0 top-0 w-1/2 h-full flex flex-col items-center justify-center px-12 transition-opacity duration-600 ${isSignUp ? "opacity-0" : "opacity-100"}`}>
                    <h1 className="text-xl font-bold text-teal-600 mb-8">Masuk dengan akun yang sudah ada</h1>
                    {/* Social Login */}
                    <div className="flex items-center gap-2 mb-6">
                        {/* Phone */}
                        <button type="button" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 cursor-pointer hover:scale-110 transition">
                            <Phone size={15}/>
                        </button>
                        {/* Facebook */}
                        <button type="button" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-blue-600 cursor-pointer  hover:scale-110 transition">
                            <FaFacebookF size={15}/>
                        </button>
                        {/* Google */}
                        <button type="button" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 cursor-pointer  hover:scale-110 transition">
                            <FcGoogle size={16}/>
                        </button>
                    </div>
                    {error && (<p className="text-red-500 text-sm mb-4">{error}</p>)}
                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="w-[325px] space-y-4">
                        {/* Email */}
                        <div className="relative">
                            <User size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="email" 
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-100 border-0 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-teal-500"
                                required
                            />
                        </div>
                        {/* Password */}
                        <div className="relative">
                            <KeyRound size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-100 border-0 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-teal-500"
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">
                                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>
                        {/* Lupa Password */}
                        <div className="flex justify-center">
                            <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-gray-500 hover:text-teal-600 cursor-pointer transition">
                                Lupa password?
                            </button>
                        </div>
                        {/* Button */}
                        <div className="flex justify-center pt-3">
                            <button type="submit" disabled={loading} className="bg-teal-500 px-8 py-2 rounded-full font-semibold hover:bg-teal-600 text-white cursor-pointer transition disabled:opacity-50">
                                {loading ? "Memproses..." : "MASUK"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Form Sign Up */}
                <div className={`absolute left-0 top-0 w-1/2 h-full flex flex-col items-center justify-center px-12 transition-opacity duration-500 ${isSignUp ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                    <h1 className="text-xl font-bold text-teal-600 mb-8">Buat akun baru</h1>
                    {/* Social Login */}
                    <div className="flex items-center gap-2 mb-6">
                        {/* Phone */}
                        <button type="button" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 cursor-pointer hover:scale-110 transition">
                            <Phone size={15}/>
                        </button>
                        {/* Facebook */}
                        <button type="button" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-blue-600 cursor-pointer  hover:scale-110 transition">
                            <FaFacebookF size={15}/>
                        </button>
                        {/* Google */}
                        <button type="button" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 cursor-pointer  hover:scale-110 transition">
                            <FcGoogle size={16}/>
                        </button>
                    </div>
                    {/* Sign Up Form */}
                    <form onSubmit={(e) => e.preventDefault()} className="w-[325px] space-y-3">
                        {/* Nama */}
                        <div className="relative">
                            <User size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></User>
                            <input 
                                type="text"
                                placeholder="Name"
                                className="w-full bg-gray-100 border-0 rounded-lg pl-10 pr-4 py-3 focus:ring-teal-500"
                                required 
                            />
                        </div>
                        {/* Email */}
                        <div className="relative">
                            <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></Mail>
                            <input 
                                type="email"
                                placeholder="Email"
                                className="w-full bg-gray-100 border-0 rounded-lg pl-10 pr-4 py-3 focus:ring-teal-500"
                                required 
                            />
                        </div>
                        {/* Password */}
                        <div className="relative">
                            <KeyRound size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></KeyRound>
                            <input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-100 border-0 rounded-lg pl-10 pr-4 py-3 focus:ring-teal-500" 
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">
                                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>
                        <div className="flex justify-center pt-2">
                            <button type="button" disabled={loading} className="border-2 border-teal-500 bg-teal-500 px-8 py-2 rounded-full font-semibold hover:bg-teal-600 hover:border-teal-600 text-white transition disabled:opacity-50 cursor-pointer">DAFTAR</button>
                        </div>
                    </form>
                </div>
                {/* Panel Hijau */}
                <div className={`absolute left-0 top-0 w-1/2 h-full bg-teal-500 text-white flex flex-col items-center justify-center px-12 z-20 transition-transform duration-700 ease-in-out ${isSignUp ? "translate-x-full" : "translate-x-0"}`}>
                    {!isSignUp ? (
                        <>
                            <h2 className="text-2xl font-bold mb-4 text-center">Buat akun baru</h2>
                            <p className="text-center text-sm mb-8 max-w-[280px]">
                                Untuk terhubung dengan kami, silakan daftar menggunakan informasi pribadi anda
                            </p>
                            <button type="button" onClick={() => setIsSignUp(true)} className="border-2 border-white px-8 py-2 rounded-full font-semibold hover:bg-white hover:text-teal-500 transition cursor-pointer">
                                DAFTAR
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold mb-4 text-center">
                               Selamat Datang Kembali! 
                            </h2>
                            <p className="text-center text-sm mb-8 max-w-[280px]">
                                Untuk tetap terhubung dengan kami, silakan masuk menggunakan informasi pribadi anda
                            </p>
                            <button type="button" onClick={() => setIsSignUp(false)} className="border-2 border-white px-8 py-2 rounded-full font-semibold hover:bg-white hover:text-teal-500 transition cursor-pointer">
                                MASUK
                            </button>
                        </>
                    )}
                </div>
            </div>
            
        </div>
    );
}