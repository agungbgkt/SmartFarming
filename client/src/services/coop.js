import api from './api';

export async function getCoopList() {
    const response = await api.get('/coop');
    return response.data;
}