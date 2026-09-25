import { useState, useEffect} from 'react';
import { Send } from 'lucide-react';
import { getAlerts } from '../services/alert';

export default function AlertList(){
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        getAlerts(5).then(setAlerts);
    }, []);

    return (
        <div className="bg-white rounded-xl p-4 shadow">
            <p className="font-semibold">Notifikasi Saat Ini</p>

            {alerts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center p-8">Belum ada notifikasi.</p>
            ) : (
                <div className="space-y-2">
                    {alerts.length.map((alert) => (
                        <div key={alert.id} className="border rounded-lg p-3 flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <Send size={14} className="text-blue-500"/>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium">{alert.message}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${alert.type === 'normal' ? 'Normal' : 'Darurat'}`}></span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {alert.is_sent ? 'Terkirim via Telegram,' : 'Belum terkirim,'}
                                    {new Date(alert.sent_at ?? alert.created_at).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}