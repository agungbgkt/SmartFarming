import { useState, useEffect } from "react";
import { getMonitoring } from "../services/monitoring";

export default function MonitoringSummary({coopList = []}){
    const [activeIndex, setActiveIndex] = useState(0);
    const [latestData, setLatestData] = useState(null);

    const activeCoop = coopList[activeIndex];

    // Rotasi otomatis
    useEffect(() => { // satu ngurus kapan pindah index (jalan sekali, setInterval-nya nggak perlu dibuat ulang tiap ganti kandang),
        if (coopList.length <= 1) return; // 1 kandang aja, nggak perlu rotasi.

        const interval = setInterval(() => { // beda dari setTimeout (jalan sekali abis delay), setInterval berulang terus tiap 12 detik, cocok buat "gantian terus-menerus" (bukan cuma sekali ganti).
            setActiveIndex((prev) => (prev + 1) % coopList.length); // setActiveIndex((prev) => (prev + 1) % coopList.length) — (prev + 1) % panjang_array itu trik umum buat bikin angka muter balik ke 0 begitu udah sampai ujung. | (prev) => prev + 1 ngambil nilai terbaru tiap kali dipanggil, bukan nilai "beku" dari awal.
        }, 12000);

        return () => clearInterval(interval);
    }, [coopList.length]);

    // Ambil data terbaru tiap kali kandang aktif berubah.
    useEffect(() => { // ngurus fetch data (jalan ulang tiap activeCoop.id berubah).
        if (!activeCoop?.id) return;

        getMonitoring(activeCoop.id, 'today').then((result) => {
            setLatestData(result.length > 0 ? result[result.length - 1] : null);
        });
    }, [activeCoop?.id]);
    return(
        <div className="grid grid-cols-3 gap-4 h-[150px]">
            {/* Perangkat Terhubung */}
            <div className="bg-white rounded-xl p-4 shadow">
                <p className="text-sm text-gray-400">
                    Perangkat Terhubung
                </p>
                <p className="text-3xl font-bold text-center p-6 mt-2">
                    {activeCoop?.devices?.length ?? '-'}
                </p>
            </div>
            {/* Suhu */}
            <div className="bg-white rounded-xl p-4 shadow">
                <p className="text-sm text-gray-400">
                    Suhu {activeCoop?.name ?? ''}
                </p>
                <p className="text-3xl font-bold text-center p-6 mt-2">
                    {latestData ? `${latestData.temperature} °C` : "-"}
                </p>
            </div>
            {/* Kelembapan */}
            <div className="bg-white rounded-xl p-4 shadow">
                <p className="text-sm text-gray-400">
                    Kelembapan {activeCoop?.name ?? ''}
                </p>
                <p className="text-3xl font-bold text-center p-6 mt-2">
                    {latestData ? `${latestData.humidity} %` : "-"}
                </p>
            </div>
        </div>
    )
}