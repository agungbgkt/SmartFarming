import api from './api';

export async function getMonitoring(coopId, range = 'today') {
    const response = await api.get(`/coop/${coopId}/monitorings?range=${range}`);
    return response.data;
}

export async function getMonitoringByDate(coopId, date) {
    const response = await api.get(`/coop/${coopId}/monitorings/date?=${date}`);
    return response.data;
}

export async function getMonitoringStats(coopId, date) {
    const response = await api.get(`/coop/${coopId}/monitorings/stats?date=${date}`);
    return response.data;
}