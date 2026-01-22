/**
 * VoyageCard
 * Carte voyage individuelle
 */

import React, { useState } from 'react';
import './VoyageCard.css';

const VoyageCard = ({ voyage, bagagesByReservationId = {}, onOpenQR, onCancelCheckin, onDeleteVoyage }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'À venir', color: '#f59e0b', icon: '⏳' },
      en_cours: { label: 'En cours', color: '#3b82f6', icon: '🚀' },
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

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).replace(':', 'h');
  };

  const getTransportIcon = (type) => {
    const icons = {
      train: '🚄',
      avion: '✈️',
      bus: '🚌',
      taxi: '🚕',
      tram: '🚊',
      metro: '🚇',
      walking: '🚶',
      WALKING: '🚶',
      TRANSIT: '🚇',
      HEAVY_RAIL: '🚄',
      METRO_RAIL: '🚇',
      SUBWAY: '🚇',
      TRAM: '🚊',
      BUS: '🚌',
      RAIL: '🚆'
    };
    return icons[type] || icons[type?.toUpperCase()] || '🚆';
  };

  const statusBadge = getStatusBadge(voyage.status);
  const hasReservations = voyage.reservations && voyage.reservations.length > 0;
  const hasBoardingPass = hasReservations && voyage.reservations.some(r => r.boarding_pass);

  const bagageStatusLabel = (status) => {
    const labels = {
      created: 'Créé',
      tagged: 'Tag généré',
      dropped: 'Déposé',
      in_transit: 'En transit',
      loaded: 'Chargé',
      arrived: 'Arrivé',
      delivered: 'Livré',
      exception: 'Incident'
    };
    return labels[status] || status || '—';
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('fr-FR');
  };

  const reservationIds = hasReservations ? voyage.reservations.map(r => String(r.reservation_id)) : [];
  const bagageCount = reservationIds.reduce((sum, id) => sum + ((bagagesByReservationId[id] || []).length), 0);
  // Utiliser les heures réelles des segments si disponibles
  const firstSegment = voyage.etapes && voyage.etapes.length > 0 ? voyage.etapes[0] : null;
  const lastSegment = voyage.etapes && voyage.etapes.length > 0 ? voyage.etapes[voyage.etapes.length - 1] : null;
  
  const departureTime = firstSegment?.departure_time || voyage.date_debut || voyage.Date_depart;
  const arrivalTime = lastSegment?.arrival_time || voyage.date_fin || voyage.Date_arrivee;

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

      {/* Booking Reference */}
      {(voyage.booking_reference || (voyage.reservations && voyage.reservations[0]?.booking_reference)) && (
        <div className="voyage-booking-ref">
          📋 Référence : <strong>{voyage.booking_reference || voyage.reservations[0].booking_reference}</strong>
        </div>
      )}

      {/* Route */}
      <div className="voyage-route">
        <div className="route-point">
          <div className="route-dot start"></div>
          <div className="route-location">
            <span className="location-name">{voyage.depart}</span>
            <span className="location-time">
              {formatDate(departureTime)}
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
              {formatDate(arrivalTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Bagages (résumé) */}
      {bagageCount > 0 && (
        <div className="voyage-bagages-summary">
          🧳 {bagageCount} bagage{bagageCount > 1 ? 's' : ''}
        </div>
      )}

      {/* Etapes (si expanded) */}
      {expanded && voyage.etapes && voyage.etapes.length > 0 && (
        <div className="voyage-etapes">
          <h4>📍 Itinéraire détaillé</h4>
          <div className="itinerary-timeline">
            {voyage.etapes.map((etape, index) => {
              const hasEnrichedData = etape.line || etape.departure_station || etape.departure_time;
              
              return (
                <div key={index} className="segment-timeline-item">
                  <div className="segment-timeline-marker">
                    <div className="timeline-icon">{getTransportIcon(etape.type || etape.vehicle_type)}</div>
                    {index < voyage.etapes.length - 1 && <div className="timeline-connector"></div>}
                  </div>
                  
                  <div className="segment-content">
                    {/* Transport info */}
                    <div className="segment-header">
                      {hasEnrichedData ? (
                        <>
                          {etape.line && (
                            <span className="segment-line-badge">
                              {etape.line}
                            </span>
                          )}
                          <span className="segment-operator">
                            {etape.compagnie || etape.type || 'Transport'}
                          </span>
                        </>
                      ) : (
                        <span className="segment-operator-fallback">
                          {getTransportIcon(etape.type)} {etape.compagnie || etape.type || 'Transport'}
                        </span>
                      )}
                    </div>

                    {/* Departure */}
                    {hasEnrichedData && etape.departure_station ? (
                      <div className="segment-station departure">
                        <span className="station-time">{formatTime(etape.departure_time)}</span>
                        <span className="station-name">📍 {etape.departure_station}</span>
                      </div>
                    ) : (
                      <div className="segment-station-fallback">
                        <span className="station-name">📍 {etape.adresse_1}</span>
                      </div>
                    )}

                    {/* Duration and accessibility */}
                    {hasEnrichedData && (
                      <div className="segment-details">
                        {etape.duration_minutes && (
                          <span className="segment-duration">
                            ⏱️ {etape.duration_minutes} min
                          </span>
                        )}
                        {etape.accessible === false && (
                          <span className="segment-warning">
                            ⚠️ Accessibilité limitée
                          </span>
                        )}
                      </div>
                    )}

                    {/* Arrival */}
                    {hasEnrichedData && etape.arrival_station ? (
                      <div className="segment-station arrival">
                        <span className="station-time">{formatTime(etape.arrival_time)}</span>
                        <span className="station-name">📍 {etape.arrival_station}</span>
                      </div>
                    ) : (
                      <div className="segment-station-fallback">
                        <span className="station-name">📍 {etape.adresse_2}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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

              {/* Bagages liés à la réservation */}
              {(() => {
                const bagages = bagagesByReservationId[String(resa.reservation_id)] || [];
                if (bagages.length === 0) return null;
                return (
                  <div className="bagages-section">
                    <div className="bagages-title">
                      🧳 Bagages ({bagages.length})
                    </div>
                    <div className="bagages-list">
                      {bagages.map((b) => (
                        <div key={b.bagage_id} className="bagage-item">
                          <div className="bagage-main">
                            <div className="bagage-line">
                              <strong>#{b.bagage_id}</strong>
                              <span className="bagage-dot">•</span>
                              <span>{b.bagage_type}</span>
                              <span className="bagage-dot">•</span>
                              <span className={`bagage-status ${b.status || ''}`}>{bagageStatusLabel(b.status)}</span>
                            </div>
                            <div className="bagage-sub">
                              {b.last_location ? <span>📍 {b.last_location}</span> : <span>📍 —</span>}
                              {b.last_event_at ? <span className="bagage-sep">|</span> : null}
                              {b.last_event_at ? <span>🕒 {formatDateTime(b.last_event_at)}</span> : null}
                            </div>
                          </div>
                          <div className="bagage-actions">
                            <button
                              type="button"
                              className="btn-bagage-view"
                              onClick={() => {
                                window.location.href = `/user/bagages/${b.bagage_id}`;
                              }}
                            >
                              Voir tracking
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
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

        {/* Bouton Suivi PMR si assistance activée */}
        {voyage.reservations?.some(r => r.assistance_PMR === 'Oui') && (
          <button
            className="btn-suivi-pmr"
            onClick={() => window.location.href = `/suivi-prise-en-charge/${voyage.reservations.find(r => r.assistance_PMR === 'Oui')?.reservation_id}`}
          >
            ♿ Suivi PMR
          </button>
        )}

        {voyage.status !== 'cancelled' && voyage.status !== 'completed' && (
          <button
            className="btn-delete"
            onClick={() => onDeleteVoyage(voyage.id_voyage)}
          >
            🗑️ Supprimer
          </button>
        )}
      </div>
    </div>
  );
};

export default VoyageCard;
