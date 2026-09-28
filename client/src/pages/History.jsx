import Sidebar from "../components/Sidebar";
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getAllDevices } from "../services/device";
import { getMonitoringStats, getMonitoringByDate } from "../services/monitoring";

function todayISO(){ // bikin default tanggal (format YYYY-MM-DD.
    return new Date().toISOString().split('T')[0];
}

export default function History(){
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [date, setDate] = useState(todayISO());
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        getAllDevices().then((result) => {
            setDevices(result);
            if(result.length > 0) setSelectedDeviceId(result[0].id);
        });
    }, []);

    const selectedDevice = devices.find((d) => d.id === selectedDeviceId); // dari dropdown, user milih device, tapi endpoint monitoring butuh kandang_id. Baris ini "nerjemahin" device yang dipilih jadi kandang terkaitnya (selectedDevice.kandang_id).

    useEffect(() => {
        if(!selectedDevice?._chicken__coop_id) return;

        getMonitoringStats(selectedDevice._chicken__coop_id, date).then(setStats);
        getMonitoringByDate(selectedDevice._chicken__coop_id, date).then((result) => {
            setChartData(result.map((item) => ({
                ...item,
                jam: new Date(item.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            })));
        });
    }, [selectedDevice?._chicken__coop_id, date]);

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
                
                <main className="p-6 space-y-4 pl-24">
                    <h1 className="text-3xl font-bold">Riwayat Data</h1>

                    <div className="bg-white p-6 rounded-xl shadow-xl space-y-4">
                        <div className="bg-white py-4">
                            <p className="font-semibold">Monitoring riwayat data</p>
                            <p className="text-sm text-gray-400">Melihat dan menganalisisa riwayat data dari sensor</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 max-w-xl">
                            <div>
                                <label className="text-sm font-medium block mb-1">Perangkat</label>
                                <select 
                                    value={selectedDeviceId}
                                    onChange={(e) => setSelectedDeviceId(e.currentTarget.value)}
                                    className="w-full border rounded-lg px-3 py-2 cursor-pointer"
                                >
                                    {devices.map((d) => (
                                        <option key={d.id} value={d.id}>{d.device_code} - {d.coop_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Tanggal</label>
                                <input 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 cursor-pointer"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            <StatCard label="Rata-rata Suhu" value={stats ? `${stats.avg_temperature}°C` : '-'} />
                            <StatCard label="Rata-rata Kelembapan" value={stats ? `${stats.avg_humidity}%` : '-'} />
                            <StatCard label="Suhu Tertinggi" value={stats ? `${stats.max_temperature}°C` : '-'} />
                            <StatCard label="Kelembapan Tertinggi" value={stats ? `${stats.max_humidity}%` : '-'} />
                            <StatCard label="Catatan Data" value={stats ? `${stats.count} Data` : '-'} />
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="font-semibold">Grafik Suhu & Kelembapan</p>
                            <p className="text-sm text-gray-400">{selectedDevice?.coop_name ?? ''}</p>

                            {chartData.length === 0 ? (
                                <div className="h-64 flex items-center justify-center text-gray-300">Belum ada data.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="jam" fontSize={12} />
                                        <YAxis yAxisId="left" fontSize={12}/> {/* bikin grafik punya 2 sumbu-Y berbeda */}
                                        <YAxis yAxisId="right" orientation="right" fontSize={12}/>
                                        <Tooltip />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey="temperature" name="Suhu (°C)" stroke="#f59e0b" dot={false}/>
                                        <Line yAxisId="right" type="monotone" dataKey="humidity" name="Kelembapan (%)" stroke="#3b82f6" dot={false}/> {/* dot={false} — matiin titik bundar di tiap data point pada garis, biar grafiknya lebih bersih */}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function StatCard({ label, value }){
    return (
        <div className="bg-teal-500 text-white rounded-xl p-3 text-center">
            <p className="text-xs font-medium">{label}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
        </div>
    );
}