export default function MonitoringSummary({data = []}){
    const latestData = data.length > 0
        ? data[data.length - 1]
        : null

    return(
        <div className="grid grid-cols-3 gap-4">
            {/* Perangkat Terhubung */}
            <div className="bg-white rounded-xl p-4 shadow">
                <p className="text-sm text-gray-400">
                    Perangkat Terhubung
                </p>
                <p className="text-2xl font-bold text-center mt-2">
                    1
                </p>
            </div>
            {/* Suhu */}
            <div className="bg-white rounded-xl p-4 shadow">
                <p className="text-sm text-gray-400">
                    Suhu Kandang
                </p>
                <p className="text-2xl font-bold text-center mt-2">
                    {latestData ? `${latestData.temperature} °C` : "-"}
                </p>
            </div>
            {/* Kelembapan */}
            <div className="bg-white rounded-xl p-4 shadow">
                <p className="text-sm text-gray-400">
                    Kelembapan Kandang
                </p>
                <p className="text-2xl font-bold text-center mt-2">
                    {latestData ? `${latestData.humidity} %` : "-"}
                </p>
            </div>
        </div>
    )
}