import { useState, useEffect, useRef } from "react";
import { Menu, X, LayoutGrid, Smartphone, History, Bell, Settings } from 'lucide-react';

export default function Sidebar(){
    const [visible, setVisible] = useState(false);
    const timerRef = useRef(null); // "kotak penyimpanan" yang nggak bikin re-render kalau isinya diganti.

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

    return (
        <>
            <button 
                onClick={handleShow} 
                className="fixed top-2 left-4 z-50 text-gray-600 bg-transparent rounded-lg p-2 shadow cursor-pointer">
                {visible ? <X size={30} /> : <Menu size={30} />}
            </button>
            <aside className={`fixed top-0 left-0 h-full w-16 bg-transparent flex flex-col items-center py-16 gap-6 transition-transform duration-300 z-40 ${visible ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="w-15 h-15 bg-teal-500 rounded-full flex items-center justify-center mt-5 text-white cursor-pointer">
                    <LayoutGrid size={25} />
                </div>
                <div className="w-15 h-15 bg-white rounded-full flex items-center justify-center text-gray-400 cursor-pointer">
                    <Smartphone size={25} />
                </div>
                <div className="w-15 h-15 bg-white rounded-full flex items-center justify-center text-gray-400 cursor-pointer">
                    <History size={25} />
                </div>
                <div className="w-15 h-15 bg-white rounded-full flex items-center justify-center text-gray-400 cursor-pointer">
                    <Bell size={25} />
                </div>
                <div className="w-15 h-15 bg-white rounded-full flex items-center justify-center text-gray-400 cursor-pointer">
                    <Settings size={25} />
                </div>
            </aside>
        </>
    )
}