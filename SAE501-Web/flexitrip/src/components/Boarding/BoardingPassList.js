import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../../context/AuthContext';
import './BoardingPassList.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

const BoardingPassList = () => {
  const { user } = useContext(AuthContext);
  const [boardingPasses, setBoardingPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBoardingPasses();
  }, [user]);

  const fetchBoardingPasses = async () => {
    if (!user?.user_id) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Récupérer d'abord les réservations de l'utilisateur
      const voyagesResponse = await axios.get(
        `${API_BASE_URL}/voyages/history`,
        {
          params: { user_id: user.user_id }
        }
      );

      if (!voyagesResponse.data.success) {
        throw new Error('Erreur récupération voyages');
      }

      // Pour chaque réservation, récupérer le boarding pass s'il existe
      const reservations = voyagesResponse.data.voyages.flatMap(
        voyage => voyage.reservations || []
      );

      const boardingPassPromises = reservations.map(async (reservation) => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/boarding/pass/${reservation.reservation_id}`
          );
          return response.data.success ? response.data.boarding_pass : null;
        } catch (err) {
          // Si 404, pas de boarding pass pour cette réservation
          if (err.response?.status === 404) {
            return null;
          }
          throw err;
        }
      });

      const passes = await Promise.all(boardingPassPromises);
      const validPasses = passes.filter(pass => pass !== null);

      console.log('✅ Boarding passes récupérés:', validPasses);
      validPasses.forEach(pass => {
        console.log(`  📋 Pass ID: ${pass.pass_id} | Réservation: ${pass.reservation_id} | Vol/Train: ${pass.flight_train_number}`);
      });

      setBoardingPasses(validPasses);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur fetch boarding passes:', err);
      setError('Erreur lors du chargement des boarding passes');
    } finally {
      setLoading(false);
    }
  };

  const generateQRData = (boardingPass) => {
    return JSON.stringify({
      type: 'BOARDING_PASS',
      pass_id: boardingPass.pass_id,
      reservation_id: boardingPass.reservation_id,
      user_id: boardingPass.user_id,
      flight_train: boardingPass.flight_train_number,
      gate: boardingPass.gate,
      seat: boardingPass.seat,
      boarding_time: boardingPass.boarding_time,
      issued_at: boardingPass.issued_at
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'issued':
        return '✅';
      case 'boarded':
        return '🛫';
      case 'cancelled':
        return '❌';
      case 'expired':
        return '⏰';
      default:
        return '📋';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'issued':
        return 'Émis';
      case 'boarded':
        return 'Embarqué';
      case 'cancelled':
        return 'Annulé';
      case 'expired':
        return 'Expiré';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="boarding-pass-list-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Chargement de vos boarding passes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="boarding-pass-list-container">
        <div className="error-message">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={fetchBoardingPasses} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (boardingPasses.length === 0) {
    return (
      <div className="boarding-pass-list-container">
        <div className="empty-state">
          <span className="empty-icon">🎫</span>
          <h2>Aucun boarding pass</h2>
          <p>Vous n'avez pas encore de boarding pass émis.</p>
          <p>Effectuez un check-in pour obtenir votre boarding pass.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="boarding-pass-list-container">
      <h1 className="page-title">
        <span className="title-icon">🎫</span>
        Mes Boarding Passes
      </h1>

      <div className="boarding-passes-grid">
        {boardingPasses.map((pass) => (
          <div key={pass.pass_id} className={`boarding-pass-card status-${pass.status}`}>
            <div className="boarding-pass-header">
              <div className="pass-status">
                <span className="status-icon">{getStatusIcon(pass.status)}</span>
                <span className="status-label">{getStatusLabel(pass.status)}</span>
              </div>
              <div className="pass-id">Pass #{pass.pass_id}</div>
            </div>

            <div className="boarding-pass-body">
              <div className="flight-info">
                <div className="flight-number">
                  <span className="label">Vol/Train</span>
                  <span className="value">{pass.flight_train_number}</span>
                </div>

                <div className="gate-seat-row">
                  <div className="gate-info">
                    <span className="label">Porte</span>
                    <span className="value">{pass.gate || 'N/A'}</span>
                  </div>
                  <div className="seat-info">
                    <span className="label">Place</span>
                    <span className="value">{pass.seat || 'N/A'}</span>
                  </div>
                </div>

                <div className="boarding-time">
                  <span className="label">Embarquement</span>
                  <span className="value">
                    {formatDate(pass.boarding_time)} à {formatTime(pass.boarding_time)}
                  </span>
                </div>

                {pass.pmr_assistance && (
                  <div className="pmr-badges">
                    {pass.pmr_assistance && (
                      <span className="badge badge-pmr">♿ Assistance PMR</span>
                    )}
                    {pass.pmr_priority && (
                      <span className="badge badge-priority">⭐ Embarquement prioritaire</span>
                    )}
                    {pass.wheelchair_required && (
                      <span className="badge badge-wheelchair">🦽 Fauteuil roulant</span>
                    )}
                  </div>
                )}
              </div>

              <div className="qr-code-section">
                <div className="pass-id-badge">
                  <span className="pass-id-label">Pass ID</span>
                  <span className="pass-id-number">{pass.pass_id}</span>
                </div>
                <QRCodeSVG
                  value={generateQRData(pass)}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
                <p className="qr-instruction">
                  Présentez ce QR code à la porte d'embarquement
                </p>
                <p className="qr-instruction-alt">
                  Ou entrez le Pass ID <strong>{pass.pass_id}</strong> sur la borne
                </p>
              </div>
            </div>

            <div className="boarding-pass-footer">
              <div className="issued-info">
                <span className="label">Émis le</span>
                <span className="value">
                  {formatDate(pass.issued_at)} à {formatTime(pass.issued_at)}
                </span>
              </div>
              {pass.boarded_at && (
                <div className="boarded-info">
                  <span className="label">Embarqué le</span>
                  <span className="value">
                    {formatDate(pass.boarded_at)} à {formatTime(pass.boarded_at)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardingPassList;
