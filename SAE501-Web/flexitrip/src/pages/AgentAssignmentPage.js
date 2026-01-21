import React, { useState, useEffect } from 'react';
import './AgentAssignmentPage.css';

const AgentAssignmentPage = () => {
  const [statistics, setStatistics] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [activeMissions, setActiveMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview'); // overview, agents, missions
  const [monitoringResults, setMonitoringResults] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  useEffect(() => {
    loadStatistics();
    loadAvailableAgents();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/intelligent-assignment/statistics?period=today`);
      const data = await response.json();
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAgents = async () => {
    try {
      // For demo purposes, we'll use a mock user_id. In production, use actual user data
      const response = await fetch(`${API_URL}/api/intelligent-assignment/available-agents?user_id=1`);
      const data = await response.json();
      if (data.success) {
        setAvailableAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    }
  };

  const handleMonitorMissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/intelligent-assignment/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setMonitoringResults(data.monitoring);
        // Reload statistics after monitoring
        await loadStatistics();
        alert(`✅ Surveillance terminée:\n- ${data.monitoring.priority_changed} priorités changées\n- ${data.monitoring.reassignments} réassignations`);
      }
    } catch (error) {
      console.error('Erreur monitoring:', error);
      alert('❌ Erreur lors de la surveillance des missions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      available: 'status-badge status-available',
      busy: 'status-badge status-busy',
      on_mission: 'status-badge status-on-mission',
      break: 'status-badge status-break',
      off_duty: 'status-badge status-off-duty'
    };
    return statusClasses[status] || 'status-badge';
  };

  const getStatusLabel = (status) => {
    const labels = {
      available: '✅ Disponible',
      busy: '🟡 Occupé',
      on_mission: '🔴 En mission',
      break: '⏸️ Pause',
      off_duty: '🚫 Hors service'
    };
    return labels[status] || status;
  };

  if (loading && !statistics) {
    return (
      <div className="agent-assignment-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-assignment-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>🤖 Système d'Assignation Intelligente</h1>
          <p className="subtitle">Gestion automatique des agents PMR avec IA</p>
        </div>
        <button 
          className="btn-monitor" 
          onClick={handleMonitorMissions}
          disabled={loading}
        >
          🔍 Surveiller les Missions
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          📊 Vue d'ensemble
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'agents' ? 'active' : ''}`}
          onClick={() => setSelectedTab('agents')}
        >
          👥 Agents Disponibles
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'algorithm' ? 'active' : ''}`}
          onClick={() => setSelectedTab('algorithm')}
        >
          🧠 Algorithme IA
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {selectedTab === 'overview' && statistics && (
          <div className="overview-section">
            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card stat-card-primary">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>{statistics.missions?.total || 0}</h3>
                  <p>Missions Totales</p>
                </div>
              </div>

              <div className="stat-card stat-card-success">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>{statistics.missions?.assigned || 0}</h3>
                  <p>Assignées</p>
                </div>
              </div>

              <div className="stat-card stat-card-warning">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <h3>{statistics.missions?.critical || 0}</h3>
                  <p>Critiques</p>
                </div>
              </div>

              <div className="stat-card stat-card-info">
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <h3>{statistics.missions?.reassigned || 0}</h3>
                  <p>Réassignées</p>
                </div>
              </div>

              <div className="stat-card stat-card-accent">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>{statistics.agents?.available || 0}</h3>
                  <p>Agents Disponibles</p>
                </div>
              </div>

              <div className="stat-card stat-card-secondary">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>{statistics.missions?.assignment_rate || 0}%</h3>
                  <p>Taux d'Assignation</p>
                </div>
              </div>
            </div>

            {/* Monitoring Results */}
            {monitoringResults && (
              <div className="monitoring-results">
                <h3>📊 Résultats de la Surveillance</h3>
                <div className="results-grid">
                  <div className="result-item">
                    <span className="result-label">Missions surveillées:</span>
                    <span className="result-value">{monitoringResults.total}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Priorités changées:</span>
                    <span className="result-value highlight">{monitoringResults.priority_changed}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Actions requises:</span>
                    <span className="result-value highlight">{monitoringResults.actions_required}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Réassignations:</span>
                    <span className="result-value highlight">{monitoringResults.reassignments}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="features-section">
              <h2>🎯 Fonctionnalités Principales</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🎯</div>
                  <h3>Assignation Automatique</h3>
                  <p>Algorithme de scoring multi-critères pour assigner automatiquement le meilleur agent disponible.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h3>Priorisation Dynamique</h3>
                  <p>Réévaluation en temps réel des priorités basée sur les incidents et retards.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔄</div>
                  <h3>Réassignation Intelligente</h3>
                  <p>Changement automatique d'agent en cas de situation critique.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3>Monitoring Continu</h3>
                  <p>Surveillance des missions actives avec alertes automatiques.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {selectedTab === 'agents' && (
          <div className="agents-section">
            <h2>👥 Agents Disponibles ({availableAgents.length})</h2>
            {availableAgents.length === 0 ? (
              <div className="empty-state">
                <p>Aucun agent disponible pour le moment</p>
              </div>
            ) : (
              <div className="agents-grid">
                {availableAgents.slice(0, 10).map((agentData, index) => (
                  <div key={index} className="agent-card">
                    <div className="agent-header">
                      <div className="agent-avatar">👤</div>
                      <div className="agent-info">
                        <h3>{agentData.agent.name}</h3>
                        <p className="agent-company">{agentData.agent.entreprise}</p>
                      </div>
                      <span className={getStatusBadgeClass(agentData.agent.status)}>
                        {getStatusLabel(agentData.agent.status)}
                      </span>
                    </div>
                    <div className="agent-details">
                      <div className="detail-row">
                        <span className="detail-label">📞 Téléphone:</span>
                        <span className="detail-value">{agentData.agent.phone}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">📧 Email:</span>
                        <span className="detail-value">{agentData.agent.email}</span>
                      </div>
                    </div>
                    {agentData.score && (
                      <div className="agent-score">
                        <div className="score-header">
                          <span>Score IA</span>
                          <span className="score-total">{agentData.score.totalScore.toFixed(1)}/100</span>
                        </div>
                        <div className="score-breakdown">
                          <div className="score-item">
                            <span>Disponibilité:</span>
                            <span>{agentData.score.breakdown.availability.toFixed(0)}</span>
                          </div>
                          <div className="score-item">
                            <span>Compétences:</span>
                            <span>{agentData.score.breakdown.skills.toFixed(0)}</span>
                          </div>
                          <div className="score-item">
                            <span>Proximité:</span>
                            <span>{agentData.score.breakdown.proximity.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Algorithm Tab */}
        {selectedTab === 'algorithm' && (
          <div className="algorithm-section">
            <h2>🧠 Algorithme d'Assignation Intelligente</h2>
            
            <div className="algorithm-content">
              <div className="algorithm-card">
                <h3>📊 Formule de Scoring</h3>
                <div className="formula-box">
                  <p className="formula">
                    Score Total = (Disponibilité × 30%) + (Compétences × 25%) + (Proximité × 25%) + (Charge × 15%) + (Priorité PMR × 5%)
                  </p>
                </div>
              </div>

              <div className="criteria-grid">
                <div className="criteria-card">
                  <div className="criteria-icon">✅</div>
                  <h4>Disponibilité (30%)</h4>
                  <ul>
                    <li>Statut de l'agent</li>
                    <li>Charge de travail actuelle</li>
                    <li>Missions en cours</li>
                    <li>Capacité restante</li>
                  </ul>
                </div>

                <div className="criteria-card">
                  <div className="criteria-icon">🎓</div>
                  <h4>Compétences (25%)</h4>
                  <ul>
                    <li>Types de handicaps</li>
                    <li>Certifications</li>
                    <li>Niveau d'expérience</li>
                    <li>Modes de transport</li>
                  </ul>
                </div>

                <div className="criteria-card">
                  <div className="criteria-icon">📍</div>
                  <h4>Proximité (25%)</h4>
                  <ul>
                    <li>Distance GPS (Haversine)</li>
                    <li>Temps de déplacement</li>
                    <li>Localisation actuelle</li>
                    <li>Point de mission</li>
                  </ul>
                </div>

                <div className="criteria-card">
                  <div className="criteria-icon">⚖️</div>
                  <h4>Charge de Travail (15%)</h4>
                  <ul>
                    <li>Missions en cours</li>
                    <li>Total du jour</li>
                    <li>Temps de repos</li>
                    <li>Capacité maximale</li>
                  </ul>
                </div>

                <div className="criteria-card">
                  <div className="criteria-icon">⚠️</div>
                  <h4>Priorité PMR (5%)</h4>
                  <ul>
                    <li>Niveau de dépendance</li>
                    <li>Urgence du trajet</li>
                    <li>Correspondances critiques</li>
                    <li>Contraintes médicales</li>
                  </ul>
                </div>
              </div>

              <div className="priorities-section">
                <h3>🚦 Niveaux de Priorité</h3>
                <div className="priorities-flow">
                  <div className="priority-badge priority-low">LOW</div>
                  <span className="arrow">→</span>
                  <div className="priority-badge priority-normal">NORMAL</div>
                  <span className="arrow">→</span>
                  <div className="priority-badge priority-high">HIGH</div>
                  <span className="arrow">→</span>
                  <div className="priority-badge priority-urgent">URGENT</div>
                  <span className="arrow">→</span>
                  <div className="priority-badge priority-critical">CRITICAL</div>
                </div>
              </div>

              <div className="reassignment-section">
                <h3>🔄 Déclencheurs de Réassignation</h3>
                <div className="triggers-grid">
                  <div className="trigger-item">
                    <span className="trigger-icon">🚫</span>
                    <span>Agent indisponible</span>
                  </div>
                  <div className="trigger-item">
                    <span className="trigger-icon">⏰</span>
                    <span>Retard critique (&gt;60min)</span>
                  </div>
                  <div className="trigger-item">
                    <span className="trigger-icon">🔌</span>
                    <span>Risque correspondance (&lt;15min)</span>
                  </div>
                  <div className="trigger-item">
                    <span className="trigger-icon">⚡</span>
                    <span>Incident bloquant</span>
                  </div>
                  <div className="trigger-item">
                    <span className="trigger-icon">⬆️</span>
                    <span>Escalade requise</span>
                  </div>
                  <div className="trigger-item">
                    <span className="trigger-icon">✨</span>
                    <span>Meilleur agent disponible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentAssignmentPage;
