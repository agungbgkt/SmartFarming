import Sidebar from "../components/Sidebar";
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getAllDevices } from "../services/device";

export default function Device(){
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllDevices()
            .then(setDevices)
            .finally(() => setLoading(false));
    }, []);

    const totalCount = devices.length;
    const onlineCount = devices.filter((d) => d.is_online).length; // bikin array baru isinya cuma yang memenuhi syarat (is_online true), .length ngitung berapa banyak.
    const offlineCount = totalCount - onlineCount; // offline dihitung dengan pengurangan.

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
                    <h1 className="text-3xl font-bold">Perangkat</h1>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-4 shadow">
                            <p className="text-sm text-gray-400">Total Perangkat Terhubung</p>
                            <p className="text-2xl font-bold mt-2">{totalCount}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow">
                            <p className="text-sm text-gray-400">Total Perangkat Online</p>
                            <p className="text-2xl font-bold mt-2">{onlineCount}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow">
                            <p className="text-sm text-gray-400">Total Perangkat Offline</p>
                            <p className="text-2xl font-bold mt-2">{offlineCount}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow">
                        <p className="font-semibold">Daftar Perangkat</p>
                        <p className="text-sm text-gray-400 mb-3">Daftar perangkat terhubung</p>

                        {loading ? (
                            <p className="text-gray-400 text-sm">Memuat...</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-400 border-b items-center justify-center">
                                        <th className="py-2">Perangkat</th>
                                        <th>Kode</th>
                                        <th>Lokasi</th>
                                        <th>Status</th>
                                        <th>Suhu</th>
                                        <th>Kelembapan</th>
                                        <th>Terakhir Data Terkirim</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {devices.map((device) => (
                                        <tr key={device.id} className="border-b last:border-0">
                                            <td className="py-2">{device.device_code}</td>
                                            <td>{device.device_code}</td>
                                            <td>{device.coop_name}</td>
                                            <td>
                                                <span className={`inline-flex items-center gap-1 ${device.is_online ? "text-green-600" : "text-red-500"}`}>
                                                    <span className={`w-2 h-2 rounded-full ${device.is_online ? "bg-green-500" : "bg-red-500"}`}></span>
                                                    <span>{device.is_online ? "Online" : "Offline"}</span>
                                                </span>
                                            </td>
                                            <td>{device.temperature ? `${device.temperature}°C` : "-"}</td> {/* device yang belum pernah kirim data (offline dari awal, Monitoring kandangnya kosong) bakal dapet null dari backend */}
                                            <td>{device.humidity ? `${device.humidity}%` : "-"}</td>
                                            <td>{device.recorded_at ? formatRelativeTime(device.recorded_at) : "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

function formatRelativeTime(dateString){ // buat ubah timestamp jadi teks relatif ("5 menit yang lalu"), ditulis manual pakai matematika tanggal biasa (Date.now() - new Date(...).getTime() = selisih milidetik, dibagi 60000 buat dapetin menit) — bisa juga pakai library kayak dayjs.
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    const diffHour = Math.floor(diffMin / 60);
    return `${diffHour} jam yang lalu`;
}