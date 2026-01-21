/**
 * VoyageHistory
 * Page historique voyages utilisateur
 * /user/voyages
 */

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import VoyageCard from './VoyageCard';
import VoyageQRModal from './VoyageQRModal';
import './VoyageHistory.css';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

const VoyageHistory = () => {
  const { user } = useContext(AuthContext);

  const [voyages, setVoyages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'completed', 'cancelled'

  // Modal QR
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedVoyage, setSelectedVoyage] = useState(null);

  /**
   * Récupérer historique voyages
   */
  const normalizeLocation = (loc) => {
    if (!loc) return 'N/A';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      return loc.ville || loc.gare || loc.name || JSON.stringify(loc);
    }
    return String(loc);
  };

  const normalizeEtapes = (etapes = []) => {
    return etapes.map((e) => {
      const data = e.etape_data || {};
      return {
        type: e.type || e.transport || data.type,
        compagnie: data.compagnie,
        adresse_1: data.adresse_1 || e.start_station_snapshot?.name,
        adresse_2: data.adresse_2 || e.end_station_snapshot?.name,
        id: data.id
      };
    });
  };

  const normalizeVoyage = (v) => {
    const id = v.id_voyage || v.voyage_id || v.id;
    return {
      id,
      voyage_id: id,
      id_voyage: id,
      depart: normalizeLocation(v.depart || v.lieu_depart || v.Lieu_depart || v.start_station_snapshot),
      arrivee: normalizeLocation(v.arrivee || v.lieu_arrivee || v.Lieu_arrivee || v.end_station_snapshot),
      date_debut: v.date_debut || v.Date_depart,
      date_fin: v.date_fin || v.Date_arrivee,
      prix_total: v.prix_total,
      status: v.status || v.statut,
      etapes: normalizeEtapes(v.etapes),
      reservations: v.reservations || [],
      raw: v,
    };
  };

  const fetchVoyages = async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/voyages/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          user_id: user.user_id,
          status: filter === 'all' ? null : filter
        }
      });

      if (response.data.success) {
        const normalized = (response.data.voyages || []).map(normalizeVoyage);
        setVoyages(normalized);
      }

    } catch (err) {
      console.error('❌ Erreur fetch voyages:', err);
      setError('Impossible de charger les voyages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoyages();
  }, [user, filter]);

  /**
   * Ouvrir modal QR
   */
  const handleOpenQR = (voyage) => {
    setSelectedVoyage(voyage);
    setQrModalOpen(true);
  };

  /**
   * Annuler check-in
   */
  const handleCancelCheckin = async (reservationId) => {
    if (!window.confirm('Annuler le check-in ? Le boarding pass sera supprimé.')) {
      return;
    }

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/voyages/cancel-checkin/${reservationId}`,
        { user_id: user.user_id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.success) {
        alert('✅ Check-in annulé avec succès');
        fetchVoyages(); // Refresh
      }

    } catch (err) {
      console.error('❌ Erreur annulation check-in:', err);
      alert('❌ Erreur lors de l\'annulation');
    }
  };

  /**
   * Supprimer voyage
   */
  const handleDeleteVoyage = async (voyageId) => {
    if (!window.confirm('⚠️ ATTENTION : Supprimer définitivement ce voyage et toutes ses réservations ?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/voyages/${voyageId}`,
        {
          data: { user_id: user.user_id },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        alert('✅ Voyage supprimé');
        fetchVoyages(); // Refresh
      }

    } catch (err) {
      console.error('❌ Erreur suppression voyage:', err);
      alert('❌ Erreur lors de la suppression');
    }
  };

  // Statistiques
  const stats = {
    total: voyages.length,
    confirmed: voyages.filter(v => v.status === 'confirmed').length,
    completed: voyages.filter(v => v.status === 'completed').length,
    cancelled: voyages.filter(v => v.status === 'cancelled').length,
    pending: voyages.filter(v => v.status === 'pending').length
  };

  return (
    <div className="voyage-history-container">
      <div className="voyage-history-header">
        <h1>✈️ Mes Voyages</h1>
        <p className="subtitle">Gérez vos voyages passés et à venir</p>
      </div>

      {/* Stats */}
      <div className="voyage-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <span className="stat-value">{stats.confirmed}</span>
            <span className="stat-label">Confirmés</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Terminés</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">En attente</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="voyage-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tous
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          En attente
        </button>
        <button
          className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
          onClick={() => setFilter('confirmed')}
        >
          Confirmés
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Terminés
        </button>
        <button
          className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Annulés
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement de vos voyages...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchVoyages} className="retry-btn">
            Réessayer
          </button>
        </div>
      )}

      {/* Voyages List */}
      {!loading && !error && (
        <>
          {voyages.length === 0 ? (
            <div className="no-voyages">
              <span className="no-voyage-icon">✈️</span>
              <h3>Aucun voyage</h3>
              <p>
                {filter === 'all'
                  ? 'Vous n\'avez pas encore de voyages.'
                  : `Aucun voyage ${filter === 'pending' ? 'en attente' : filter}.`}
              </p>
              <a href="/search" className="btn-primary">
                Planifier un voyage
              </a>
            </div>
          ) : (
            <div className="voyages-grid">
              {voyages.map(voyage => (
                <VoyageCard
                  key={voyage.voyage_id}
                  voyage={voyage}
                  onOpenQR={handleOpenQR}
                  onCancelCheckin={handleCancelCheckin}
                  onDeleteVoyage={handleDeleteVoyage}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* QR Modal */}
      {qrModalOpen && selectedVoyage && (
        <VoyageQRModal
          voyage={selectedVoyage}
          onClose={() => {
            setQrModalOpen(false);
            setSelectedVoyage(null);
          }}
        />
      )}
    </div>
  );
};

export default VoyageHistory;
