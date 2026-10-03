import api from './api';

export async function getAllDevices() {
    const response = await api.get('/devices');
    return response.data;
}

// tambahan
export async function createDevice(data) {
    const response = await api.post('/devices', data);
    return response.data;
}

export async function updateDevice(id, data) {
    const response = await api.put(`/devices/${id}`, data);
    return response.data;
}

export async function deleteDevice(id) {
    const response = await api.delete(`/device/${id}`);
}