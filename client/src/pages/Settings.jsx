import { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import { Bell, ChevronDown, Search, Settings as SettingsIcon, Thermometer, Link2, User, Smartphone} from 'lucide-react';
import { getSystemSettings, updateSystemSettings } from '../services/settings';
import { getCoopList, updateCoop } from '../services/coop';
import { getAllDevices } from '../services/device';

export default function Settings(){
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [settings, setSettings] = useState(null);
    const [devices, setDevices] = useState([]);
    const [openSection, setOpenSection] = useState('sistem');

    useEffect(() => {
        getSystemSettings().then(setSettings);
        getAllDevices().then(setDevices);
    }, []);

    const onlineCount = devices.filter((d) => d.is_online).length;

    function toggleSection(key){ // toggleSection(key) pakai ternary openSection === key ? null : key — kalau yang diklik adalah bagian yang SEDANG terbuka, tutup (null); kalau bagian lain, ganti jadi itu.
        setOpenSection(openSection === key ? null : key);
    }

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
                    <h1 className="text-3xl font-bold">Pengaturan</h1>

                    <div className="grid grid-cols-4 gap-4">
                        <StatusCard 
                            icon={<SettingsIcon size={18} />}
                            label="Sistem"
                            status="Aktif"
                            sub={settings ? `Zona waktu: ${settings.timezone} | Interval laporan: ${settings.report_interval_minutes} menit` : ''}
                        />
                        <StatusCard 
                            icon={<Link2 size={18} />}
                            label="Telegram"
                            status="Terhubung"
                            sub="Bot aktif dan siap mengirim pesan"
                        />
                        <StatusCard 
                            icon={<Smartphone size={18} />}
                            label="Perangkat"
                            status={`${devices.length} Perangkat`}
                            sub={`${onlineCount} Online | ${devices.length - onlineCount} Offline`}
                        />
                        <StatusCard 
                            icon={<Thermometer size={18} />}
                            label="Monitoring"
                            status={settings?.monitoring_mode ? 'Berjalan' : 'Berhenti'}
                            sub={settings?.last_monitoring_at ? `Data terakhir: ${new Date(settings.last_monitoring_at).toLocaleString('id-ID')}` : '-'}
                        />
                    </div>
                    <div className="">
                        <AccordionItem 
                        icon={<SettingsIcon size={18} />}
                        title="Sistem"
                        desc="Konfigurasi dasar sistem Smart Farming."
                        isOpen={openSection === 'sistem'}
                        onToggle={() => toggleSection('sistem')}
                    >
                        {settings && <SystemForm settings={settings} onSaved={setSettings} />}
                    </AccordionItem>
                    </div>
                    

                    <AccordionItem 
                        icon={<Thermometer size={18} />}
                        title="Sensor"
                        desc="Atur batas normal suhu dan kelembapan pada setiap kandang."
                        isOpen={openSection === 'sensor'}
                        onToggle={() => toggleSection('sensor')}
                    >
                        <SensorForm />
                    </AccordionItem>

                    <AccordionItem 
                        icon={<Bell size={18} />}
                        title="Notifikasi"
                        desc="Konfigurasi pengiriman notifikasi melalui Telegram."
                        isOpen={openSection === 'notifikasi'}
                        onToggle={() => toggleSection('notifikasi')}
                    >
                        <p className="text-sm text-gray-400">Segera Hadir</p>
                    </AccordionItem>

                    <AccordionItem 
                        icon={<Link2 size={18} />}
                        title="Integrasi"
                        desc="Kelola koneksi layanan eksternal seperti Telegram."
                        isOpen={openSection === 'integrasi'}
                        onToggle={() => toggleSection('integrasi')}
                    >
                        <p className="text-sm text-gray-400">Segera Hadir</p>
                    </AccordionItem>

                    <AccordionItem 
                        icon={<User size={18} />}
                        title="Akun"
                        desc="Kelola informasi akun admin dan keamanan."
                        isOpen={openSection === 'akun'}
                        onToggle={() => toggleSection('akun')}
                    >
                        <p className="text-sm text-gray-400">Segera Hadir</p>
                    </AccordionItem>
                </main>
            </div>
        </div>
    );
}

function StatusCard({ icon, label, status, sub}){
    return (
        <div className="bg-white rounded-xl p-4 shadow flex gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-green-600 text-sm font-medium">● {status}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </div>
        </div>
    );
}

function AccordionItem({ icon, title, desc, isOpen, onToggle, children}){
    return (
        <div className="bg-white rounded-xl shadow overflow-hidden">
            <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left cursor-pointer">
                <div className="flex items-center gap-3">
                    <span className="text-gray-400">{icon}</span>
                    <div>
                        <p className="font-semibold">{title}</p>
                        <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                </div>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && <div className="px-4 pb-4 border-t pt-4">{children}</div>}
        </div>
    );
}

function SystemForm({ settings, onSaved}){
    const [timezone, setTimezone] = useState(settings.timezone);
    const [interval, setInterval] = useState(settings.report_interval_minutes);
    const [monitoringMode, setMonitoringMode] = useState(settings.monitoring_mode);
    const [saving, setSaving] = useState(false);

    async function handleSave(){
        setSaving(true);

     try {
        const updated = await updateSystemSettings({
            timezone,
            report_interval_minutes: interval,
            monitoring_mode: monitoringMode,
        });
        onSaved({ ...settings, ...updated });
    } finally {
        setSaving(false);
    }
}

return (
    <div className="grid grid-cols-3 gap-4 items-end">
        <div>
            <label className="text-sm font-medium block mb-1">Zona Waktu</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className='w-full border rounded-lg px-3 py-2'>
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
            </select>
        </div>
        <div>
            <label className="text-sm font-medium block mb-1">Interval Laporan</label>
            <select value={interval} onChange={(e) => setInterval(e.target.value)} className='w-full border rounded-lg px-3 py-2'>
                <option value={15}>15 menit</option>
                <option value={30}>30 menit</option>
                <option value={60}>60 menit</option>
            </select>
        </div>
        <div>
            <label className="text-sm font-medium block mb-1">Mode Monitoring</label>
            <button 
                onClick={() => setMonitoringMode(!monitoringMode)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${monitoringMode ? 'bg-teal-500' : 'bg-gray-300'}`}
            >
                <span className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${monitoringMode ? 'translate-x-6' : 'translate-x-0.5'}`}></span>
            </button>
        </div>
        <div className="col-span-3 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="bg-teal-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 cursor-pointer">
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
        </div>
    </div>
);
}

function SensorForm(){
    const [coopList, setCoopList] = useState([]);
    const [selectedCoopId, setSelectedCoopId] = useState('');
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getCoopList().then((result) => {
            setCoopList(result);
            if (result.length > 0) setSelectedCoopId(result[0].id);
        });
    }, []);

    useEffect(() => {
        const coop = coopList.find((c) => c.id === selectedCoopId);
        if (coop){
            setForm({
                temperature_min: coop.temperature_min,
                temperature_max: coop.temperature_max,
                humidity_min: coop.humidity_min,
                humidity_max: coop.humidity_max,
            });
        }
    }, [selectedCoopId, coopList]);

    async function handleSave() {
        setSaving(true);
        try {
            await updateCoop(selectedCoopId, form);
        } finally {
            setSaving(false);
        }
    }

    if (!form) return <p className="text-sm text-gray-400">Memuat...</p>

    return (
        <div className="space-y-4">
            <div className="max-w-xs">
                <label className="text-sm font-medium block mb-1">Kandang</label>
                <select value={selectedCoopId} onChange={(e) => setSelectedCoopId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                    {coopList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                    <label className="text-sm font-medium block mb-1">Suhu Minimum (°C)</label>
                    <input type="number" value={form.temperature_min} onChange={(e) => setForm({ ...form, temperature_min: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                    <label className="text-sm font-medium block mb-1">Kelembapan Minimum (%)</label>
                    <input type="number" value={form.humidity_min} onChange={(e) => setForm({ ...form, humidity_min: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                    <label className="text-sm font-medium block mb-1">Suhu Maximum (°C)</label>
                    <input type="number" value={form.temperature_max} onChange={(e) => setForm({ ...form, temperature_max: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                    <label className="text-sm font-medium block mb-1">Kelembapan Maximum (%)</label>
                    <input type="number" value={form.humidity_max} onChange={(e) => setForm({ ...form, humidity_max: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving} className="bg-teal-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 cursor-pointer">
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>
        </div>
    );
}