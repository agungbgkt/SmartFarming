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

api.interceptors.response.use(
    (response) => response,
    (error) => { // error.response?.status === 401 && localStorage.getItem('token'): hanya bereaksi kalau user memang pernah punya token.
        if (error.response?.status === 401 && localStorage.getItem('token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error); // Promise.reject(error) tetap dikembalikan supaya catch di pemanggil (misalnya form Login) tetap berjalan.
    }
);

export default api;