import { useState, useEffect } from 'react';
import { getCoopList } from '../services/coop';
import  Sidebar  from '../components/Sidebar';
import { Bell } from 'lucide-react';
import { getMonitoring } from '../services/monitoring';
import MonitoringChart from '../components/monitoringCard';
import MonitoringSummary from '../components/MonitoringSummary';

export default function Dashboard(){
    const [coopList, setCoopList] = useState([]);
    const [monitoringData, setMonitoringData] = useState([]); // state tambahan supaya dashboard tidak melakukan banyak request. cukup 1 kali request ke monitoring data bisa digunakan untuk 2 component

    useEffect(() => {
        getCoopList().then(setCoopList); // cara React "menjalankan sesuatu" setelah komponen pertama kali muncul di layar.
    }, []); // Array kosong [] di akhir artinya "cuma jalankan sekali.

    useEffect(() => {
        if (!coopList[0]?.id) return;

        getMonitoring(coopList[0].id, 'today')
            .then(setMonitoringData);
    }, [coopList]);

    const user = JSON.parse(localStorage.getItem('user') || '{}'); // ambil data user yang disimpan waktu login, || '{}' jaga-jaga kalau somehow kosong (biar nggak error pas di-parse).
    
    return (
        <div className="min-h-screen bg-gray-200 flex">
            {/* Sidebar */}
            <Sidebar />

            <div className="flex-1">
                {/* Topbar */}
                <header className="bg-white flex justify-between items-center px-6 py-3">
                    <button className="text-gray-500"></button>
                    <div className="flex items-center gap-3">
                        {/* Notification */}
                        <button className="relative p-2 text-gray-500 hover:text-gray-700 cursor-pointer">
                            <Bell size={22} />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        {/* Profile Logo */}
                        <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold overflow-hidden cursor-pointer">
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        {/* User Information */}
                        <div className="text-right">
                            <p className="font-semibold text-xl">{user.name || "User"}</p>
                            <p className="text-sm text-gray-400">{user.role || "User"}</p>
                        </div>
                    </div>
                </header>
                
                <main className="p-6 space-y-4 ml-25 mr-25">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    {/* Card Grafik - Placeholder dulu */}
                    <MonitoringChart 
                        coopId={coopList[0]?.id}
                        coopName={coopList[0]?.name}
                    />
                    {/* 3 Card sejajar - Placeholder */}
                    <MonitoringSummary coopList={coopList}/>

                    {/* 2 Card Bawah */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 shadow">Notifikasi Saat Ini</div>
                        <div className="bg-white rounded-xl p-4 shadow">Data Greenhouse</div>
                    </div>
                </main>
            </div>
        </div>
    )
}