import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Deals from './pages/Deals';
import Invoices from './pages/Invoices';
import Team from './pages/Team';
import { CRMProvider } from './context/CRMContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CRMProvider>
            <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/deals" element={<Deals />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
            </Router>
        </CRMProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;