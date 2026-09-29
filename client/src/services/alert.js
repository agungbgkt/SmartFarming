import api from './api';

export async function getAlerts(filters = {}) {
    const params = new URLSearchParams(filters).toString(); // new URLSearchParams(filters).toString() — cara ringkas mengubah objek jadi query string. { status: 'failed', coop_id: '' } otomatis jadi "status=failed&coop_id=".
    const response = await api.get(`/alerts?${params}`); // Filter yang nilainya string kosong tetap terkirim (filled() di backend yang menyaringnya).
    return response.data;
}

export async function getAlertStats() {
    const response = await api.get('/alerts/stats');
    return response.data;
}