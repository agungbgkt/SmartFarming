import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LayoutGrid, Smartphone, History, Bell, Settings, LogOut } from 'lucide-react';
import { logout } from "../services/auth";
import { ProtectedRoute, GuestRoute } from "./outeGuards";
import { disconnectPusher } from "../services/realtime";

// Menu
const menuItems = [
    { key: 'dashboard', path:"/dashboard", icon: LayoutGrid },
    { key: 'device', path:"/device", icon: Smartphone },
    { key: 'history', path: "/history", icon: History },
    { key: 'notifications', path: "/notifications", icon: Bell },
    { key: 'settings', path: "/settings", icon: Settings, adminOnly: true },
];

export default function Sidebar(){
    const [visible, setVisible] = useState(false);
    const timerRef = useRef(null); // "kotak penyimpanan" yang nggak bikin re-render kalau isinya diganti.
    const navigate = useNavigate();
    const location = useLocation(); // ngasih tau URL yang lagi aktif sekarang (location.pathname).

    function startHideTimer(){
        clearTimeout(timerRef.current); // tiap kali startHideTimer() dipanggil ulang (misal user klik hamburger lagi sebelum 8 detik abis), timer lama dibatalkin dulu, biar nggak numpuk 2 timer yang jalan bersamaan.
        timerRef.current = setTimeout(() => setVisible(false), 8000);
    }

    useEffect(() => {
        startHideTimer();
        return () => clearTimeout(timerRef.current);
    }, []);

    function handleShow(){
        setVisible(!visible);
        if (!visible){startHideTimer();}
    }

    function handleMenuClick(path){
        navigate(path); // avigate(path) dipanggil di handleMenuClick, plus startHideTimer() — supaya abis pindah halaman, timer auto-hide tetap jalan normal (reset dari 0), bukan malah keganggu.
        // setHideTimer();
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const visibleMenu = menuItems.filter((item) => !item.adminOnly || user.role === 'admin');

    async function handleLogout() {
        try { // logout() di services/auth.js menghapus localStorage hanya kalau request-nya berhasil. Kalau token sudah mati, request gagal dan penghapusan dilewati. finally memastikan user selalu keluar.
            await logout();
        } catch {
            // token mungkin sudah tidak berlaku di server, tetap lanjut keluar.
        } finally {
            disconnectPusher();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    }

    return (
        <>
            <button 
                onClick={handleShow} 
                className="fixed top-2 left-4 z-50 text-gray-600 bg-transparent rounded-lg p-2 shadow cursor-pointer">
                {visible ? <X size={30} /> : <Menu size={30} />}
            </button>
            <aside className={`fixed top-0 left-0 h-screen w-20 bg-transparant flex flex-col items-center pt-25 pb-6 gap-6 transition-transform duration-300 z-40 ${visible ? "translate-x-0" : "-translate-x-full"}`}>
                {visibleMenu.map(({ key, path, icon: Icon}) => (
                    <div 
                        key={key}
                        onClick={() => handleMenuClick(path)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors ${location.pathname === path ? "bg-teal-500 text-white" : "bg-white text-gray-400"}`}
                    >
                        <Icon size={25} />
                    </div>
                ))}

                <button 
                    onClick={handleLogout}
                    title="Keluar"
                    className="mt-auto w-15 h-15 rounded-full bg-white flex items-center justify-center text-red-500 cursor-pointer"
                >
                    <LogOut size={25} />
                </button>
            </aside>
        </>
    )
}