import Sidebar from "../components/Sidebar";
import { useState, useEffect } from 'react';
import { Bell, ChevronDown, Search } from 'lucide-react';
import { getAlerts, getAlertStats } from "../services/alert";
import { getCoopList } from "../services/coop";

const TYPE_LABELS = { // TYPE_LABELS sebagai lookup object, daripada 5 percabangan untuk menentukan teks dan warna badge, cukup satu objek yang "ditanya" langsung pakai TYPE_LABELS[alert.type].
    normal: { text: 'Normal', className: 'text-green-600', dot: 'bg-green-500'},
    high_temperature: { text: '▲ Suhu', className: 'text-orange-600'},
    low_temperature: { text: '▼ Suhu', className: 'text-orange-600'},
    high_humidity: { text: '▲ Kelembapan', className: 'text-blue-600'},
    low_humidity: { text: '▼ Kelembapan', className: 'text-blue-600'},
}

export default function Notifications(){
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [stats, setStats] = useState(null);
    const [coopList, setCoopList] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const [statusFilter, setStatusFilter] = useState('');
    const [conditionFilter, setConditionFilter] = useState('');
    const [coopFilter, setCoopFilter] = useState('');
    const [rangeFilter, setRangeFilter] = useState('');

    useEffect(() => { // (dependency []) untuk data yang tidak berubah karena filter (statistik total, daftar kandang untuk dropdown).
        getAlertStats().then(setStats);
        getCoopList().then(setCoopList);
    }, []);

    useEffect(() => { // bergantung ke 4 filter, jadi otomatis fetch ulang setiap salah satu dropdown diganti.
        getAlerts({
            status: statusFilter,
            condition: conditionFilter,
            coop_id: coopFilter,
            range: rangeFilter,
            limit: 50,
        }).then(setAlerts);
    }, [statusFilter, conditionFilter, coopFilter, rangeFilter]);

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
                    <h1 className="text-3xl font-bold">Notifikasi</h1>

                    <div className="bg-white rounded-xl p-6 shadow space-y-4">
                        <div>
                            <p className="font-semibold">Notifikasi</p>
                            <p className="text-sm text-gray-400">Pantau status pengiriman dan peringatan sistem melalui Telegram.</p>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            <StatsCard label="Total Pesan" value={stats?.total ?? '-'} sub="Semua Pesan" />
                            <StatsCard label="Terkirim" value={stats?.sent ?? '-'} sub={stats ? `${stats.sent_percentage}% berhasil terkirim` : ''} />
                            <StatsCard label="Pesan Normal"  value={stats?.normal ?? '-'} sub="Data sensor normal" />
                            <StatsCard label="Pesan Peringatan" value={stats?.warning ?? '-'} sub="Data sensor tidak normal" />
                        </div>

                        <div>
                            <p className="font-semibold mb-2">Riwayat Pengiriman</p>
                            <div className="flex items-center gap-3 mb-3">
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
                                    <option value="">Status pengiriman</option>
                                    <option value="success">Berhasil</option>
                                    <option value="failed">Gagal</option>
                                </select>

                                <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
                                    <option value="">Kondisi Data Sensor</option>
                                    <option value="normal">Normal</option>
                                    <option value="temperature">Suhu</option>
                                    <option value="humidity">Kelembapan</option>
                                </select>

                                <select value={coopFilter} onChange={(e) => setCoopFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
                                    <option value="">Perangkat</option>
                                    {coopList.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>

                                <select value={rangeFilter} onChange={(e) => setRangeFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
                                    <option value="">Semua waktu</option>
                                    <option value="today">Hari ini</option>
                                    <option value="7days">7 hari terakhir</option>
                                    <option value="30days">1 bulan terakhir</option>
                                </select>
                            </div>

                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-400 border-b">
                                        <th className="py-2">Waktu</th>
                                        <th>Perangkat</th>
                                        <th>Jenis</th>
                                        <th>Suhu</th>
                                        <th>Kelembapan</th>
                                        <th>Kondisi</th>
                                        <th>Terkirim</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alerts.map((alert) => {
                                        const condition = TYPE_LABELS[alert.type] ?? { text: alert.type, className: 'text-gray-500'}; // ?? { text: alert.type, ... } sebagai fallback. Kalau ada type yang belum terdaftar di TYPE_LABELS (data lama atau tipe baru yang belum dipetakan), tabel tetap menampilkan teksnya apa adanya daripada kosong atau error.
                                        return (
                                            <tr key={alert.id} className="border-b last:border-0">
                                                <td className="py-2">{new Date(alert.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})}</td>
                                                {/* alert.chicken_coop?.name, bukan alert.chickenCoop?.name. Ini bagian yang gampang salah tapi penting: nama function relationship di Laravel (chickenCoop(), camelCase) berubah jadi snake_case (chicken_coop) begitu dikonversi ke JSON. Laravel melakukan ini otomatis untuk semua relasi yang di-load lewat with(...). */}
                                                <td>{alert.type === 'normal' ? 'Laporan' : 'Peringatan'}</td>
                                                <td>{alert.chicken_coop?.name}</td> 
                                                <td>{alert.temperature ? `${alert.temperature}°C` : '-'}</td>
                                                <td>{alert.humidity ? `${alert.humidity}%` : '-'}</td>
                                                <td className={condition.className}>{condition.text}</td>
                                                <td className={alert.is_sent ? 'text-green-600' : 'text-red-500'}>{alert.is_sent ? 'Success' : 'Failed'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {alerts.length === 0 && (
                                <p className="text-center text-gray-400 py-600">Tidak ada notifikasi</p>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function StatsCard({ label, value, sub }){
    return (
        <div className="bg-teal-500 text-white rounded-xl p-4 text-center">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold my-1">{value}</p>
            <p className="text-xs opacity-80">{sub}</p>
        </div>
    )
}