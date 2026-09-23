import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Device from './pages/Device';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/dashboard" element={<Dashboard />}></Route>
        <Route path="/device" element={<Device />}></Route>
        <Route path="/history" element={<History />}></Route>
        <Route path="/notifications" element={<Notifications />}></Route>
        <Route path="/settings" element={<Settings />}></Route>
        <Route path="/" element={<Navigate to="/login" />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
