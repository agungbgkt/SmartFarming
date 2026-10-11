import { Navigate } from 'react-router-dom';

function readUser(){
    try { // try/catch di readUser: kalau isi localStorage rusak, JSON.parse melempar error dan seluruh aplikasi blank. Dengan catch, kondisi itu dianggap “belum login”.
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
}

export function ProtectedRoute({ children, adminOnly = false }){ // children: komponen yang dibungkus (<Dashboard />). Penjaga menampilkannya apa adanya kalau lolos, atau menggantinya dengan redirect kalau tidak.
    const token = localStorage.getItem('token');
    const user = readUser();

    if (!token) return <Navigate to="/login" replace />;
    if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />; // replace di <Navigate>: redirect menimpa riwayat browser, bukan menambah entri baru.

    return children;
}

export function GuestRoute({ children }){ 
    if (localStorage.getItem('token')) return <Navigate to="/dashboard" replace />;
    return children;
}