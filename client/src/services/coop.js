import api from './api';

export async function getCoopList() {
    const response = await api.get('/coop');
    return response.data;
}

export async function updateCoop(id, data){
    const response = await api.put(`/coop/${id}`, data);
    return response.data;
}

export async function createCoop(data) {
    const response = await api.post('/coop', data);
    return response.data;
}

export async function deleteCoop(id) {
    await api.delete(`/coop/${id}`);
}