import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

export default function Login(){
    const [email, setEmail] = useState(''); // useState — cara React "mengingat" nilai yang bisa berubah.
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [SignUp, setSignUp] = useState(false); // false karena saat halaman Login pertama kali dibuka, kita ingin berada pada kondisi Login, bukan Sign Up.
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
                {/* Panel Hijau */}
                <div className="absolute left-0 top-0 w-1/2 h-full bg-teal-500 flex flex-col items-center justify-center text-white px-12">
                    <h2 className="text-2xl font-bold mb-4">Selamat Datang Kembali!</h2>
                    <p className="text-center text-sm mb-8">
                        Untuk terhubung dengan kami, silakan daftar menggunakan informasi pribadi anda
                    </p>
                    <button 
                        type="button" 
                        onClick={() => setSignUp(true)}
                        className="border-2 border-white px-8 py-2 rounded-full font-semibold hover:bg-white hover:text-teal-500 cursor-pointer transition">
                            DAFTAR
                    </button>
                </div>

                {/* Form Login */}
                <div className="absolute right-0 top-0 w-1/2 h-full flex flex-col justify-center px-12">
                    <h1 className="text-2xl font-bold text-teal-600 mb-8">Masuk akun yang sudah ada</h1>
                    {error && (<p className="text-red-500 text-sm mb-4">{error}</p>)}
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <input 
                            type="email" 
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500"
                            required
                        />
                    </form>
                </div>
            </div>
            
        </div>
    );
}