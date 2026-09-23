import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LayoutGrid, Smartphone, History, Bell, Settings } from 'lucide-react';

// Menu
const menuItems = [
    { key: 'dashboard', path:"/dashboard", icon: LayoutGrid },
    { key: 'device', path:"/device", icon: Smartphone },
    { key: 'history', path: "/history", icon: History },
    { key: 'notifications', path: "/notifications", icon: Bell },
    { key: 'settings', path: "/settings", icon: Settings },
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
        setHideTimer();
    }

    return (
        <>
            <button 
                onClick={handleShow} 
                className="fixed top-2 left-4 z-50 text-gray-600 bg-transparent rounded-lg p-2 shadow cursor-pointer">
                {visible ? <X size={30} /> : <Menu size={30} />}
            </button>
            <aside className={`fixed top-0 left-0 h-full w-16 bg-transparent flex flex-col items-center mt-25 gap-6 transition-transform duration-300 z-40 ${visible ? "translate-x-0" : "-translate-x-full"}`}>
                {menuItems.map(({ key, path, icon: Icon}) => (
                    <div 
                        key={key}
                        onClick={() => handleMenuClick(path)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors ${location.pathname === path ? "bg-teal-500 text-white" : "bg-white text-gray-400"}`}
                    >
                        <Icon size={25} />
                    </div>
                ))}
            </aside>
        </>
    )
}