import api from './api';

export async function getAllDevices() {
    const response = await api.get('/devices');
    return response.data;
}