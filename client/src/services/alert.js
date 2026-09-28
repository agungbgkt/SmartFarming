import api from './api';

export async function getAlerts(limit = 20) {
    const response = await api.get(`/alerts?limit=${limit}`);
    return response.data;
}