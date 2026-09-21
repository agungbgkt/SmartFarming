import api from './api';

export async function login(email, password) {
    const response = await api.post('/login', {email, password}); // async function + await nunggu hasil panggilan api sebelum lanjut ke baris berikutnya tanpa bikin halaman freeze.
    return response.data;
}

export async function register(name, email, password){
    const response = await api.post('/register', {name, email, password});
    return response.data; // response.data — axios ngebungkus hasil response dalam objek yang lebih besar (isinya status, headers, dll).
}

export async function logout(){
    await api.post('/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}