import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getMonitoring } from "../services/monitoring";

const RANGE_OPTIONS = [
    { value: 'today', label: 'Hari ini'},
    { value: '7days', label: '7 hari terakhir'},
    { value: '30days', label: '1 bulan terakhir'},
];

export default function MonitoringChart({ coopId, coopName }){
    const [data, setData] = useState([]);
    const [range, setRange] = useState('today');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!coopId) return;
        setLoading(true);
        getMonitoring(coopId, range)
            .then((result) => {
                const formatted = result.map((item) => ({
                    ...item,
                    jam: new Date(item.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'}),
                }));
                setData(formatted);
            })
            .finally(() => setLoading(false));
    }, [coopId, range]);

    return (
        <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="font-semibold">Grafik Suhu & Kelembapan</p>
                    <p className="text-sm text-gray-400">{coopName ?? "Memuat..."}</p>
                </div>

                <select value={range} onChange={(e) => setRange(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
                    {RANGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center text-gray-300">Memuat data...</div>
            ) : data.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-300">Belum ada data.</div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="jam" fontSize={12} />
                        <YAxis yAxisId="left" fontSize={12}/>
                        <YAxis yAxisId="right" orientation="right" fontSize={12}/>
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="temperature" name="Suhu (°C)" stroke="#f59e0b" dot={false}/>
                        <Line yAxisId="right" type="monotone" dataKey="humidity" name="Kelembapan (%)" stroke="#3b82f6" dot={false}/>
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}