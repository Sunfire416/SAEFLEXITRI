import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

/**
 * Dashboard Admin pour gestion des agents PMR et missions
 */
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('today');
    const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';
    const [agents, setAgents] = useState([]);
    const [missions, setMissions] = useState([]);
    const [stats, setStats] = useState({
        total_passengers: 0,
        active_missions: 0,
        completed_today: 0,
        pending_missions: 0
    });
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000); // Refresh toutes les 30s
        return () => clearInterval(interval);
    }, [selectedLocation]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch agents
            const agentsRes = await fetch(`${API_BASE_URL}/agent/all`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const agentsData = await agentsRes.json();
            setAgents(agentsData.agents || []);

            // Fetch missions du jour (simulées pour l'instant)
            const today = new Date().toISOString().split('T')[0];
            const missionsRes = await fetch(`${API_BASE_URL}/voyages/history?date=${today}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const missionsData = await missionsRes.json();
            setMissions(missionsData.voyages || []);

            // Calculer stats
            setStats({
                total_passengers: missionsData.voyages?.length || 0,
                active_missions: missionsData.voyages?.filter(m => m.status === 'in_progress').length || 0,
                completed_today: missionsData.voyages?.filter(m => m.status === 'completed').length || 0,
                pending_missions: missionsData.voyages?.filter(m => m.status === 'pending').length || 0
            });

        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const reassignAgent = async (missionId, newAgentId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/assistance/reassign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    mission_id: missionId,
                    new_agent_id: newAgentId
                })
            });

            if (response.ok) {
                alert('✅ Agent réassigné avec succès');
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Erreur réassignation:', error);
            alert('❌ Erreur lors de la réassignation');
        }
    };

    const getAgentStatus = (agent) => {
        const activeMissions = missions.filter(m =>
            m.assigned_agent_id === agent.agent_id &&
            m.status === 'in_progress'
        );

        if (activeMissions.length === 0) return { status: 'available', label: 'Disponible', color: 'green' };
        if (activeMissions.length <= 2) return { status: 'busy', label: 'Occupé', color: 'orange' };
        return { status: 'overloaded', label: 'Surchargé', color: 'red' };
    };

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <h1>📊 Dashboard Admin PMR</h1>
                <div className="header-actions">
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="location-filter"
                    >
                        <option value="all">Toutes les localisations</option>
                        <option value="paris">Paris</option>
                        <option value="lyon">Lyon</option>
                        <option value="marseille">Marseille</option>
                        <option value="toulouse">Toulouse</option>
                    </select>
                    <button className="btn-refresh" onClick={fetchDashboardData}>
                        🔄 Actualiser
                    </button>
                </div>
            </header>

            {/* Stats cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total_passengers}</div>
                        <div className="stat-label">Passagers PMR aujourd'hui</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.active_missions}</div>
                        <div className="stat-label">Missions en cours</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.completed_today}</div>
                        <div className="stat-label">Missions complétées</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.pending_missions}</div>
                        <div className="stat-label">En attente</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="dashboard-tabs">
                <button
                    className={`tab ${activeTab === 'today' ? 'active' : ''}`}
                    onClick={() => setActiveTab('today')}
                >
                    📅 Aujourd'hui
                </button>
                <button
                    className={`tab ${activeTab === 'agents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('agents')}
                >
                    👮 Agents
                </button>
                <button
                    className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveTab('timeline')}
                >
                    ⏰ Timeline
                </button>
            </div>

            {/* Content */}
            <div className="dashboard-content">
                {loading ? (
                    <div className="loading">Chargement...</div>
                ) : (
                    <>
                        {activeTab === 'today' && (
                            <MissionsList
                                missions={missions}
                                agents={agents}
                                onReassign={reassignAgent}
                            />
                        )}

                        {activeTab === 'agents' && (
                            <AgentsList
                                agents={agents}
                                getAgentStatus={getAgentStatus}
                            />
                        )}

                        {activeTab === 'timeline' && (
                            <Timeline missions={missions} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Component: Liste des missions
const MissionsList = ({ missions, agents, onReassign }) => {
    if (missions.length === 0) {
        return <div className="empty-state">Aucune mission aujourd'hui</div>;
    }

    return (
        <div className="missions-list">
            {missions.map(mission => (
                <div key={mission.id} className={`mission-card status-${mission.status}`}>
                    <div className="mission-header">
                        <h3>{mission.passenger_name || 'Passager PMR'}</h3>
                        <span className={`status-badge ${mission.status}`}>
                            {formatStatus(mission.status)}
                        </span>
                    </div>

                    <div className="mission-details">
                        <div className="detail-row">
                            <span className="icon">📍</span>
                            <span>{mission.departure} → {mission.arrival}</span>
                        </div>
                        <div className="detail-row">
                            <span className="icon">🕐</span>
                            <span>{formatTime(mission.departure_time)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="icon">🚆</span>
                            <span>{mission.transport_mode || 'Multimodal'}</span>
                        </div>
                    </div>

                    <div className="mission-agent">
                        <span className="agent-label">Agent assigné:</span>
                        <select
                            value={mission.assigned_agent_id || ''}
                            onChange={(e) => onReassign(mission.id, e.target.value)}
                            className="agent-select"
                        >
                            <option value="">Non assigné</option>
                            {agents.map(agent => (
                                <option key={agent.agent_id} value={agent.agent_id}>
                                    {agent.name} - {agent.specialite}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mission-actions">
                        <button className="btn-small btn-details">Détails</button>
                        <button className="btn-small btn-contact">Contacter</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Component: Liste des agents
const AgentsList = ({ agents, getAgentStatus }) => {
    return (
        <div className="agents-grid">
            {agents.map(agent => {
                const status = getAgentStatus(agent);
                return (
                    <div key={agent.agent_id} className="agent-card">
                        <div className="agent-avatar">
                            {agent.name.charAt(0)}
                        </div>
                        <div className="agent-info">
                            <h4>{agent.name}</h4>
                            <p className="agent-specialite">{agent.specialite}</p>
                            <p className="agent-location">📍 {agent.localisation}</p>
                            <p className="agent-phone">📞 {agent.telephone}</p>
                        </div>
                        <div className={`agent-status ${status.color}`}>
                            <span className="status-dot"></span>
                            {status.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Component: Timeline
const Timeline = ({ missions }) => {
    const sortedMissions = [...missions].sort((a, b) =>
        new Date(a.departure_time) - new Date(b.departure_time)
    );

    return (
        <div className="timeline">
            {sortedMissions.map((mission, index) => (
                <div key={mission.id} className="timeline-item">
                    <div className="timeline-time">
                        {formatTime(mission.departure_time)}
                    </div>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                        <h4>{mission.passenger_name}</h4>
                        <p>{mission.departure} → {mission.arrival}</p>
                        <span className="timeline-agent">{mission.assigned_agent_name || 'Non assigné'}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Helpers
function formatStatus(status) {
    const map = {
        'pending': '⏳ En attente',
        'in_progress': '🔄 En cours',
        'completed': '✅ Terminée',
        'cancelled': '❌ Annulée'
    };
    return map[status] || status;
}

function formatTime(dateString) {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default AdminDashboard;
