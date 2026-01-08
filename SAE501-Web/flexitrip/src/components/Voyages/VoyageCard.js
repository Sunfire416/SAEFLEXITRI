/**
 * VoyageCard
 * Carte voyage individuelle
 */

import React, { useState } from 'react';
import './VoyageCard.css';

const VoyageCard = ({ voyage, onOpenQR, onCancelCheckin, onDeleteVoyage }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'En attente', color: '#f59e0b', icon: '⏳' },
      confirmed: { label: 'Confirmé', color: '#3b82f6', icon: '✅' },
      completed: { label: 'Terminé', color: '#10b981', icon: '🎯' },
      cancelled: { label: 'Annulé', color: '#ef4444', icon: '❌' }
    };
    return badges[status] || badges.pending;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransportIcon = (type) => {
    const icons = {
      train: '🚄',
      avion: '✈️',
      bus: '🚌',
      taxi: '🚕'
    };
    return icons[type] || '🚆';
  };

  const statusBadge = getStatusBadge(voyage.status);
  const hasReservations = voyage.reservations && voyage.reservations.length > 0;
  const hasBoardingPass = hasReservations && voyage.reservations.some(r => r.boarding_pass);

  return (
    <div className={`voyage-card ${voyage.status}`}>
      {/* Header */}
      <div className="voyage-card-header">
        <div className="voyage-status-badge" style={{ background: statusBadge.color }}>
          {statusBadge.icon} {statusBadge.label}
        </div>
        <div className="voyage-price">
          {voyage.prix_total ? `${voyage.prix_total}€` : 'N/A'}
        </div>
      </div>

      {/* Route */}
      <div className="voyage-route">
        <div className="route-point">
          <div className="route-dot start"></div>
          <div className="route-location">
            <span className="location-name">{voyage.depart || voyage.Lieu_depart}</span>
            <span className="location-time">
              {formatDate(voyage.date_debut || voyage.Date_depart)}
            </span>
          </div>
        </div>

        <div className="route-line">
          {voyage.etapes && voyage.etapes.length > 0 && (
            <span className="route-stops">
              {voyage.etapes.length} étape{voyage.etapes.length > 1 ? 's' : ''}
            </span>
          )}
          {voyage.Type_Transport && (
            <span className="transport-badge">
              {getTransportIcon(voyage.Type_Transport)} {voyage.Type_Transport}
            </span>
          )}
        </div>

        <div className="route-point">
          <div className="route-dot end"></div>
          <div className="route-location">
            <span className="location-name">{voyage.arrivee || voyage.Lieu_arrivee}</span>
            <span className="location-time">
              {formatDate(voyage.date_fin || voyage.Date_arrivee)}
            </span>
          </div>
        </div>
      </div>

      {/* Etapes (si expanded) */}
      {expanded && voyage.etapes && voyage.etapes.length > 0 && (
        <div className="voyage-etapes">
          <h4>📍 Étapes du voyage</h4>
          {voyage.etapes.map((etape, index) => (
            <div key={index} className="etape-item">
              <span className="etape-icon">{getTransportIcon(etape.type)}</span>
              <div className="etape-details">
                <strong>{etape.compagnie || etape.type}</strong>
                <span>{etape.adresse_1} → {etape.adresse_2}</span>
                {etape.id && <span className="etape-id">{etape.id}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reservations (si expanded) */}
      {expanded && hasReservations && (
        <div className="voyage-reservations">
          <h4>🎫 Réservations</h4>
          {voyage.reservations.map((resa, index) => (
            <div key={index} className="reservation-item">
              <div className="resa-info">
                <span className="resa-num">{resa.num_reza}</span>
                <span className={`resa-status ${resa.ticket_status}`}>
                  {resa.ticket_status}
                </span>
                {resa.assistance_PMR === 'Oui' && (
                  <span className="resa-pmr">♿ PMR</span>
                )}
              </div>
              {resa.boarding_pass && (
                <div className="boarding-pass-info">
                  ✅ Boarding pass : Porte {resa.boarding_pass.gate}, Siège {resa.boarding_pass.seat}
                  {resa.boarding_pass.status === 'issued' && (
                    <button
                      className="cancel-checkin-btn"
                      onClick={() => onCancelCheckin(resa.reservation_id)}
                    >
                      ❌ Annuler check-in
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="voyage-card-actions">
        <button
          className="btn-expand"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▲ Réduire' : '▼ Détails'}
        </button>

        <button
          className="btn-qr"
          onClick={() => onOpenQR(voyage)}
          disabled={voyage.status === 'cancelled'}
        >
          📱 QR Code
        </button>

        {voyage.status !== 'cancelled' && voyage.status !== 'completed' && (
          <button
            className="btn-delete"
            onClick={() => onDeleteVoyage(voyage.voyage_id)}
          >
            🗑️ Supprimer
          </button>
        )}
      </div>
    </div>
  );
};

export default VoyageCard;
