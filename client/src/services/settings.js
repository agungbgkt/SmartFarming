import api from './api';

export async function getSystemSettings() {
    const response = await api.get('/settings/system');
    return response.data;
}

export async function updateSystemSettings(data) {
    const response = await api.put('/settings/system', data);
    return response.data;
}

export async function updateTelegramRecipient(id, data) {
    const response = await api.put(`/telegram-recipients/${id}`, data);
    return response.data;
}

export async function sendTestNotification() {
    const response = await api.post('/telegram-recipients/test');
    return response.data;
}