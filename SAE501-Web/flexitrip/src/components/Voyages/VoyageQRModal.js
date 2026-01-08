/**
 * VoyageQRModal
 * Modal génération et affichage QR voyage
 */

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './VoyageQRModal.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

const VoyageQRModal = ({ voyage, onClose }) => {
  const { user } = useContext(AuthContext);
  
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Générer QR code
   */
  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${API_BASE_URL}/voyages/${voyage.voyage_id}/qr`,
          {
            params: { user_id: user.user_id }
          }
        );

        if (response.data.success) {
          setQrData(response.data);
        }

      } catch (err) {
        console.error('❌ Erreur génération QR:', err);
        setError('Impossible de générer le QR code');
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [voyage, user]);

  /**
   * Télécharger QR
   */
  const handleDownload = () => {
    if (!qrData?.qr_data_url) return;

    const link = document.createElement('a');
    link.href = qrData.qr_data_url;
    link.download = `FlexiTrip-Voyage-${voyage.id_voyage}-QR.png`;
    link.click();
  };

  /**
   * Copier données QR
   */
  const handleCopyData = () => {
    if (!qrData?.qr_payload) return;

    navigator.clipboard.writeText(JSON.stringify(qrData.qr_payload, null, 2));
    alert('✅ Données QR copiées !');
  };

  /**
   * Imprimer QR
   */
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="voyage-qr-modal-overlay" onClick={onClose}>
      <div className="voyage-qr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="modal-header">
          <h2>📱 QR Code Voyage</h2>
          <p className="voyage-route-summary">
            {voyage.depart} → {voyage.arrivee}
          </p>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-qr">
              <div className="spinner"></div>
              <p>Génération du QR code...</p>
            </div>
          )}

          {error && (
            <div className="error-qr">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {qrData && !loading && !error && (
            <>
              {/* QR Code Image */}
              <div className="qr-code-display">
                <img
                  src={qrData.qr_data_url}
                  alt="QR Code Voyage"
                  className="qr-code-image"
                />
              </div>

              {/* Voyage Info */}
              <div className="voyage-qr-info">
                <div className="info-row">
                  <span className="info-label">Voyage ID :</span>
                  <span className="info-value">{voyage.id_voyage}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Départ :</span>
                  <span className="info-value">{voyage.depart}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Arrivée :</span>
                  <span className="info-value">{voyage.arrivee}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date départ :</span>
                  <span className="info-value">
                    {new Date(voyage.date_debut).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {qrData.qr_payload?.train_vol && (
                  <div className="info-row">
                    <span className="info-label">Train/Vol :</span>
                    <span className="info-value">{qrData.qr_payload.train_vol}</span>
                  </div>
                )}
                {qrData.qr_payload?.assistance_PMR && (
                  <div className="info-row">
                    <span className="info-label">PMR :</span>
                    <span className="info-value pmr">♿ Assistance activée</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="qr-actions">
                <button className="qr-action-btn download" onClick={handleDownload}>
                  💾 Télécharger
                </button>
                <button className="qr-action-btn print" onClick={handlePrint}>
                  🖨️ Imprimer
                </button>
                <button className="qr-action-btn copy" onClick={handleCopyData}>
                  📋 Copier données
                </button>
              </div>

              {/* Instructions */}
              <div className="qr-instructions">
                <h4>ℹ️ Comment utiliser ce QR code ?</h4>
                <ul>
                  <li>Présentez ce QR code aux agents de contrôle</li>
                  <li>Utilisez-le pour un accès rapide à votre voyage</li>
                  <li>Gardez-le sur votre téléphone ou imprimez-le</li>
                  <li>En cas de problème, contactez le support FlexiTrip</li>
                </ul>
              </div>

              {/* Generated At */}
              <div className="qr-metadata">
                <small>
                  Généré le {new Date(qrData.generated_at).toLocaleString('fr-FR')}
                </small>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoyageQRModal;
