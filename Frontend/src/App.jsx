import React from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
// import routes
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import Settings from './pages/Settings';
import TicketList from './pages/TicketList';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/CreateTicket" element={<CreateTicket />} />
      <Route path="/Settings" element={<Settings />} />
      <Route path="/TicketList" element={<TicketList />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
