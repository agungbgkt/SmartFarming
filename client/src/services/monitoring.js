import api from './api';

export async function getMonitoring(coopId, range = 'today') {
    const response = await api.get(`/coop/${coopId}/monitorings?range=${range}`);
    return response.data;
}