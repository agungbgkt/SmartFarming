import api from './api';

export async function getCoopList() {
    const response = await api.get('/coop');
    return response.data;
}

export async function updateCoop(id, data){
    const response = await api.put(`/coop/${id}`, data);
    return response.data;
}