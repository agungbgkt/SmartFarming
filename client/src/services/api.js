import axios from 'axios';

const api = axios.create({ // bikin 1 "instance" axios dengan pengaturan default.
    baseURL: 'http://127.0.0.1:8000/api', // bikin semua request otomatis kirim header itu.
    headers: {
        Accept: 'application/json',
    },
});

api.interceptors.request.use((config) => { // jalan sebelum tiap request dikirim. Isinya: ambil token yang tersimpan di localStorage, kalau ada, otomatis tempelin ke header Authorization.
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;