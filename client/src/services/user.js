import api from "./api";

export async function getUsers() {
    const response = await api.get('/users');
    return response.data;
}

export async function updateUserRole(id, role) {
    const response = await api.put(`/users/${id}/role`, {role});
    return response.data;
}

export async function resetUserPassword(id, password) {
    const response = await api.put(`/users/${id}/password`, {password});
    return response.data;
}