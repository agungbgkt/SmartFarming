import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getMonitoring } from "../services/monitoring";
import useChannelEvent from "../hooks/useChannelEvent";
import { ChevronLeft, ChevronRight } from "lucide-react";

const RANGE_OPTIONS = [
    { value: 'today', label: 'Hari ini'},
    { value: '7days', label: '7 hari terakhir'},
    { value: '30days', label: '1 bulan terakhir'},
];

export default function MonitoringChart({ coopId, coopName, coopIndex, totalCoops, onPrevious, onNext }){ // pakai props — komponen ini nggak nyari data kandang sendiri, tapi nerima dari komponen induk
    const [data, setData] = useState([]);
    const [range, setRange] = useState('today');
    const [loading, setLoading] = useState(true);

    useEffect(() => { // 2 dependency: kandangId dan range. Artinya useEffect ini bakal jalan ulang setiap kali salah satu dari dua nilai itu berubah — pas user ganti dropdown filter, atau pas geser ke kandang lain (nanti), data otomatis di-fetch ulang sesuai pilihan terbaru.
        if (!coopId) return; // jaga-jaga, waktu Dashboard pertama kali render, kandangId mungkin masih undefined.
        setLoading(true);
        getMonitoring(coopId, range)
            .then((result) => {
                const formatted = result.map((item) => ({ // data mentah dari API isinya recorded_at. Recharts butuh label sumbu-X yang pendek dan gampang dibaca. jam, hasil new Date(...).toLocaleTimeString(...) yang format-in ke jam:menit. {...item, jam: ...} itu spread — salin semua properti lama, tambah satu properti baru.
                    ...item,
                    jam: new Date(item.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'}),
                }));
                setData(formatted);
            })
            .finally(() => setLoading(false));
    }, [coopId, range]);

    useChannelEvent(
        coopId ? `kandang.${coopId}` : null,
    'monitoring.update',
    ({ monitoring }) => { // ({ monitoring }): payload event berbentuk { monitoring: {...} } karena MonitoringUpdated punya properti publik $monitoring
        setData((prev) => { // setData((prev) => ...) (bentuk fungsi): handler ini berjalan di luar siklus render, jadi data yang “tertangkap” bisa usang. prev selalu nilai terbaru.
            if (prev.some((d) => d.recorded_at === monitoring.recorded_at)) return prev; // recorded_at: kalau request awal dan event kebetulan membawa pembacaan yang sama, titiknya tidak ganda.
            return [
                ...prev,
                {
                    temperature: monitoring.temperature,
                    humidity: monitoring.humidity,
                    recorded_at: monitoring.recorded_at,
                    jam: new Date(monitoring.recorded_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}),
                },
            ];
        });
    }
    );

    return (
        <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="font-semibold">Grafik Suhu & Kelembapan</p>
                    <p className="text-sm text-gray-400">{coopName ?? "Memuat..."}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={onPrevious}
                        disabled={totalCoops <= 1}
                        aria-label="Kandang sebelumnya"
                        className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronLeft size={18} />
                    </button>

                    <span className="text-sm text-gray-500 min-w-16 text-center">
                        {totalCoops > 0 ? `${coopIndex + 1} / ${totalCoops}` : "0 / 0"}
                    </span>

                    <button
                        onClick={onNext}
                        disabled={totalCoops <= 1}
                        aria-label="Kandang berikutnya"
                        className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                            <ChevronRight size={18} />
                    </button>

                    <select value={range} onChange={(e) => setRange(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
                        {RANGE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="w-full h-64 flex items-center justify-center text-gray-300">Memuat data...</div>
            ) : data.length === 0 ? (
                <div className="w-full h-64 flex items-center justify-center text-gray-300">Belum ada data.</div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data}>
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
    )
}