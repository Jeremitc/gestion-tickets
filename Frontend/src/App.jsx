import React from 'react';

import { Routes, Route } from 'react-router-dom';
// import routes
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import Settings from './pages/Settings';
import TicketList from './pages/TicketList';
import NotFound from './pages/NotFound';
import Knowledgebase from './pages/Knowledgebase';
import VirtualAssistent from './pages/VirtualAsistent';
import ProtectedRoute from './components/protected/ProtectedRoute';
import './styles/global.css';

function App() {
  return (
    <Routes>
      {/* Rutas Publicas */}
      <Route path="/" element={<Login />} />

      {/* Rutas Privadas */}

      <Route element={<ProtectedRoute />}>

      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/CreateTicket" element={<CreateTicket />} />
      <Route path="/Settings" element={<Settings />} />
      <Route path="/VirtualAssistent" element={<VirtualAssistent />} />
      <Route path="/VirtualAssistent/chat/:conversationId" element={<VirtualAssistent />} />
      <Route path="/Knowledgebase" element={<Knowledgebase />} />
      <Route path="/TicketList" element={<TicketList />} />
      <Route path="*" element={<NotFound />} />
      </Route>
      {/* Ruta no encontrada */}
    </Routes>
  );
}

export default App;
