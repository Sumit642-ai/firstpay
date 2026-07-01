import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminReport from './pages/AdminReport';
import ApproverReport from './pages/ApproverReport';
import Templates from './pages/Templates';
import UserManagement from './pages/UserManagement';
import FreezeDate from './pages/FreezeDate';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<Layout />}>
            <Route path="/home" element={<Dashboard />} />
            <Route path="/admin-report" element={<AdminReport />} />
            <Route path="/approver" element={<ApproverReport />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/freeze-dates" element={<FreezeDate />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
