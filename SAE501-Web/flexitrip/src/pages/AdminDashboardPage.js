import React from 'react';
import AdminDashboard from '../components/Admin/AdminDashboard';
import './AdminDashboardPage.css';

/**
 * Page wrapper pour le dashboard administrateur
 */
const AdminDashboardPage = () => {
    return (
        <div className="admin-dashboard-page">
            <div className="page-header">
                <h1>Dashboard Administrateur</h1>
                <p>Gestion des assistances PMR en temps réel</p>
            </div>
            
            <AdminDashboard />
        </div>
    );
};

export default AdminDashboardPage;
