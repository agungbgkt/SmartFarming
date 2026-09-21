import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { login } from './services/auth';

function Dashboard(){
  return (
    <h1 className="p-8 text-2xl">Dashboard (Sementara)</h1>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/dashboard" element={<Dashboard />}></Route>
        <Route path="/" element={<Navigate to="/login" />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
