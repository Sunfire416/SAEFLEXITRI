import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AgentDashboard.css';

const AgentDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [missions, setMissions] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [stats, setStats] = useState({
        totalMissions: 0,
        completedToday: 0,
        activeIncidents: 0,
        pendingAssistance: 0
    });
    const [loading, setLoading] = useState(true);
    const [selectedMission, setSelectedMission] = useState(null);

    useEffect(() => {
        // Vérifier que l'utilisateur est bien un agent
        if (user?.role !== 'agent' && user?.role !== 'admin') {
            alert('⛔ Accès réservé aux agents PMR');
            navigate('/');
            return;
        }

        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
            const token = localStorage.getItem('token');

            // Récupérer les missions (réservations nécessitant assistance)
            const missionsResponse = await axios.get(
                `${API_URL}/api/assistance/pending`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMissions(missionsResponse.data.assistances || []);

            // Récupérer les incidents actifs
            const incidentsResponse = await axios.get(
                `${API_URL}/api/incidents/active`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIncidents(incidentsResponse.data.incidents || []);

            // Calculer les stats
            setStats({
                totalMissions: missionsResponse.data.assistances?.length || 0,
                completedToday: 0, // TODO: filtrer par date
                activeIncidents: incidentsResponse.data.incidents?.length || 0,
                pendingAssistance: missionsResponse.data.assistances?.filter(m => m.status === 'pending').length || 0
            });
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            // Ne pas bloquer si les endpoints ne sont pas encore implémentés
            setMissions([]);
            setIncidents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStartMission = async (mission) => {
        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
            const token = localStorage.getItem('token');

            await axios.put(
                `${API_URL}/api/assistance/${mission._id}`,
                { 
                    status: 'in_progress',
                    agentId: user.user_id 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('✅ Mission démarrée');
            fetchDashboardData();
        } catch (error) {
            console.error('Erreur:', error);
            alert('❌ Erreur lors du démarrage de la mission');
        }
    };

    const handleCompleteMission = async (mission) => {
        const report = prompt('Compte-rendu de la mission:');
        if (!report) return;

        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
            const token = localStorage.getItem('token');

            await axios.put(
                `${API_URL}/api/assistance/${mission._id}`,
                { 
                    status: 'completed',
                    report 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('✅ Mission terminée');
            fetchDashboardData();
        } catch (error) {
            console.error('Erreur:', error);
            alert('❌ Erreur lors de la finalisation');
        }
    };

    const createIncidentReport = () => {
        const type = prompt('Type d\'incident (delay, cancellation, equipment_failure, accessibility_issue, other):');
        if (!type) return;

        const title = prompt('Titre de l\'incident:');
        if (!title) return;

        const description = prompt('Description détaillée:');
        if (!description) return;

        const severity = prompt('Gravité (low, medium, high, critical):');
        if (!severity) return;

        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
        const token = localStorage.getItem('token');

        axios.post(
            `${API_URL}/api/incidents`,
            {
                type,
                title,
                description,
                severity,
                transportType: 'multimodal',
                route: { departure: 'Non spécifié', arrival: 'Non spécifié' }
            },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(() => {
            alert('✅ Incident signalé');
            fetchDashboardData();
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('❌ Erreur lors du signalement');
        });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('fr-FR');
    };

    const getSeverityBadge = (severity) => {
        const colors = {
            low: '#27ae60',
            medium: '#f39c12',
            high: '#e67e22',
            critical: '#e74c3c'
        };
        return (
            <span 
                className="severity-badge" 
                style={{ backgroundColor: colors[severity] || '#95a5a6' }}
            >
                {severity}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="agent-dashboard">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Chargement du dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="agent-dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>👨‍✈️ Dashboard Agent PMR</h1>
                    <p className="agent-name">Connecté: {user?.name || 'Agent'}</p>
                </div>
                <button onClick={fetchDashboardData} className="refresh-btn">
                    🔄 Actualiser
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <span className="stat-icon">📋</span>
                    <div>
                        <p className="stat-value">{stats.totalMissions}</p>
                        <p className="stat-label">Missions totales</p>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">✅</span>
                    <div>
                        <p className="stat-value">{stats.completedToday}</p>
                        <p className="stat-label">Complétées aujourd'hui</p>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">⚠️</span>
                    <div>
                        <p className="stat-value">{stats.activeIncidents}</p>
                        <p className="stat-label">Incidents actifs</p>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">⏳</span>
                    <div>
                        <p className="stat-value">{stats.pendingAssistance}</p>
                        <p className="stat-label">En attente</p>
                    </div>
                </div>
            </div>

            {/* Actions Rapides */}
            <div className="quick-actions">
                <h2>Actions rapides</h2>
                <div className="actions-grid">
                    <button onClick={createIncidentReport} className="action-card">
                        📝 Signaler un incident
                    </button>
                    <button onClick={() => alert('Fonctionnalité à venir')} className="action-card">
                        🚨 Demande urgente
                    </button>
                    <button onClick={() => alert('Fonctionnalité à venir')} className="action-card">
                        📊 Voir statistiques
                    </button>
                    <button onClick={() => alert('Fonctionnalité à venir')} className="action-card">
                        📞 Contacter équipe
                    </button>
                </div>
            </div>

            {/* Missions */}
            <div className="missions-section">
                <h2>🎯 Missions en cours</h2>
                {missions.length === 0 ? (
                    <div className="empty-state">
                        <p>📭 Aucune mission en attente</p>
                    </div>
                ) : (
                    <div className="missions-list">
                        {missions.map((mission, index) => (
                            <div key={mission._id || index} className="mission-card">
                                <div className="mission-header">
                                    <h3>Mission #{index + 1}</h3>
                                    <span className={`status-badge ${mission.status}`}>
                                        {mission.status}
                                    </span>
                                </div>
                                <div className="mission-details">
                                    <p><strong>Type:</strong> {mission.type || 'Assistance PMR'}</p>
                                    <p><strong>Passager:</strong> User {mission.userId}</p>
                                    <p><strong>Date:</strong> {formatDate(mission.createdAt || new Date())}</p>
                                </div>
                                <div className="mission-actions">
                                    {mission.status === 'pending' && (
                                        <button 
                                            onClick={() => handleStartMission(mission)}
                                            className="start-btn"
                                        >
                                            ▶️ Démarrer
                                        </button>
                                    )}
                                    {mission.status === 'in_progress' && (
                                        <button 
                                            onClick={() => handleCompleteMission(mission)}
                                            className="complete-btn"
                                        >
                                            ✅ Terminer
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Incidents */}
            <div className="incidents-section">
                <h2>⚠️ Incidents actifs</h2>
                {incidents.length === 0 ? (
                    <div className="empty-state">
                        <p>✅ Aucun incident en cours</p>
                    </div>
                ) : (
                    <div className="incidents-list">
                        {incidents.map(incident => (
                            <div key={incident._id} className="incident-card">
                                <div className="incident-header">
                                    <h3>{incident.title}</h3>
                                    {getSeverityBadge(incident.severity)}
                                </div>
                                <p className="incident-description">{incident.description}</p>
                                <div className="incident-meta">
                                    <span>📍 {incident.route?.departure} → {incident.route?.arrival}</span>
                                    <span>🕐 {formatDate(incident.reportedAt)}</span>
                                    <span>👥 {incident.affectedUsers?.length || 0} personnes affectées</span>
                                </div>
                                {incident.estimatedDelay > 0 && (
                                    <div className="delay-info">
                                        ⏱️ Retard estimé: {incident.estimatedDelay} minutes
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentDashboard;
