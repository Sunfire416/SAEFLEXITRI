/**
 * BoardingGate - Interface porte embarquement
 * 
 * Fonctionnalités :
 * - Scanner QR boarding pass
 * - Vérification faciale (optionnelle)
 * - Validation embarquement
 * - Affichage statut temps réel
 */

import React, { useState } from 'react';
import axios from 'axios';
import WebcamCapture from '../shared/WebcamCapture';
import './BoardingGate.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

const BoardingGate = () => {
  const [gateNumber, setGateNumber] = useState('');
  const [qrData, setQrData] = useState('');
  const [livePhoto, setLivePhoto] = useState(null);
  const [verificationMode, setVerificationMode] = useState('qr_only'); // 'qr_only' ou 'qr_face'
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [boardingResult, setBoardingResult] = useState(null);

  // Scanner QR
  const handleQRScan = (e) => {
    setQrData(e.target.value);
  };

  // Upload QR image
  const handleQRFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulation
    const mockBoardingQR = JSON.stringify({
      type: 'BOARDING_PASS',
      pass_id: 1,
      reservation_id: 3,
      user_id: 4,
      flight_train: 'TGV6201',
      gate: 'A12',
      seat: '15A',
      boarding_time: new Date().toISOString(),
      pmr: true
    });

    setQrData(mockBoardingQR);
    console.log('📷 QR boarding pass scanné');
  };

  // Capture photo
  const handlePhotoCapture = (imageBase64) => {
    setLivePhoto(imageBase64);
  };

  // Valider embarquement
  const handleValidateBoarding = async () => {
    if (!qrData || !gateNumber) {
      setError('QR code et numéro de porte requis');
      return;
    }

    if (verificationMode === 'qr_face' && !livePhoto) {
      setError('Photo faciale requise en mode vérification complète');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 🆕 Détecter si c'est un QR JSON ou juste un pass_id
      let qrPayload = qrData;
      
      if (!qrData.startsWith('{')) {
        // Si c'est juste un numéro (pass_id), créer le JSON
        console.log('🔍 Pass ID détecté, conversion en QR JSON...');
        qrPayload = JSON.stringify({
          type: 'BOARDING_PASS',
          pass_id: parseInt(qrData)
        });
      }

      const boardingData = {
        qr_data: qrPayload,
        live_photo: verificationMode === 'qr_face' ? livePhoto : undefined,
        gate: gateNumber
      };

      console.log('📤 Validation embarquement...');

      const response = await axios.post(
        `${API_BASE_URL}/boarding/validate`,
        boardingData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Embarquement validé:', response.data);

      setBoardingResult(response.data);

      // Auto-reset après 5 secondes
      setTimeout(() => {
        reset();
      }, 5000);

    } catch (err) {
      console.error('❌ Erreur validation boarding:', err);
      setError(
        err.response?.data?.error || 
        'Erreur lors de la validation'
      );
    } finally {
      setLoading(false);
    }
  };

  // Scan rapide (QR uniquement)
  const handleQuickScan = async () => {
    if (!qrData || !gateNumber) {
      setError('QR code et porte requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 🆕 Détecter si c'est un QR JSON ou juste un pass_id
      let qrPayload = qrData;
      
      if (!qrData.startsWith('{')) {
        // Si c'est juste un numéro (pass_id), créer le JSON
        console.log('🔍 Pass ID détecté, conversion en QR JSON...');
        qrPayload = JSON.stringify({
          type: 'BOARDING_PASS',
          pass_id: parseInt(qrData)
        });
      }

      const response = await axios.post(
        `${API_BASE_URL}/boarding/scan-gate`,
        {
          qr_data: qrPayload,
          gate: gateNumber
        }
      );

      console.log('✅ QR scanné:', response.data);

      setBoardingResult({
        success: true,
        message: 'QR scanné avec succès',
        boarding_pass: response.data,
        access_granted: true
      });

      setTimeout(() => reset(), 3000);

    } catch (err) {
      console.error('❌ Erreur scan rapide:', err);
      setError(err.response?.data?.error || 'Erreur scan');
    } finally {
      setLoading(false);
    }
  };

  // Reset
  const reset = () => {
    setQrData('');
    setLivePhoto(null);
    setBoardingResult(null);
    setError(null);
  };

  return (
    <div className="boarding-gate-container">
      <div className="gate-header">
        <h1>🚪 Porte d'Embarquement</h1>
        
        <div className="gate-number-input">
          <label>Numéro de porte :</label>
          <input
            type="text"
            value={gateNumber}
            onChange={(e) => setGateNumber(e.target.value.toUpperCase())}
            placeholder="Ex: A12"
            className="gate-input"
          />
        </div>

        <div className="verification-mode-selector">
          <button
            className={`mode-btn-gate ${verificationMode === 'qr_only' ? 'active' : ''}`}
            onClick={() => setVerificationMode('qr_only')}
          >
            ⚡ QR uniquement
          </button>
          <button
            className={`mode-btn-gate ${verificationMode === 'qr_face' ? 'active' : ''}`}
            onClick={() => setVerificationMode('qr_face')}
          >
            🔒 QR + Visage
          </button>
        </div>
      </div>

      <div className="gate-content">
        {!boardingResult ? (
          <>
            {/* Section QR */}
            <div className="gate-section">
              <h2>📱 Scanner Boarding Pass</h2>

              <div className="qr-scan-area">
                <textarea
                  value={qrData}
                  onChange={handleQRScan}
                  placeholder='Coller QR data JSON ou scanner...'
                  rows={4}
                  className="qr-textarea"
                />

                <div className="qr-upload-btn-group">
                  <label className="upload-btn-gate">
                    📷 Upload QR
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQRFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {qrData && (
                  <div className="qr-detected">
                    ✅ QR Boarding Pass détecté
                  </div>
                )}
              </div>
            </div>

            {/* Section Vérification faciale (si mode qr_face) */}
            {verificationMode === 'qr_face' && qrData && (
              <div className="gate-section">
                <h2>📸 Vérification Faciale</h2>

                {!livePhoto ? (
                  <WebcamCapture
                    mode="photo"
                    label="Capturer visage"
                    onCapture={handlePhotoCapture}
                  />
                ) : (
                  <div className="face-preview">
                    <img src={livePhoto} alt="Face" />
                    <button onClick={() => setLivePhoto(null)} className="btn-retake-gate">
                      🔄 Reprendre
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="gate-error">
                ⚠️ {error}
              </div>
            )}

            {/* Actions */}
            <div className="gate-actions">
              {verificationMode === 'qr_only' && (
                <button
                  onClick={handleQuickScan}
                  className="btn-quick-scan"
                  disabled={!qrData || !gateNumber || loading}
                >
                  {loading ? '⏳ Scan...' : '⚡ Scan Rapide'}
                </button>
              )}

              {verificationMode === 'qr_face' && (
                <button
                  onClick={handleValidateBoarding}
                  className="btn-validate-boarding"
                  disabled={!qrData || !gateNumber || !livePhoto || loading}
                >
                  {loading ? '⏳ Validation...' : '🔒 Valider Embarquement'}
                </button>
              )}
            </div>
          </>
        ) : (
          /* Résultat */
          <div className="boarding-result">
            {boardingResult.access_granted ? (
              <>
                <div className="access-granted">
                  <div className="access-icon">✅</div>
                  <h2>ACCÈS AUTORISÉ</h2>
                </div>

                <div className="passenger-details">
                  {boardingResult.boarding_pass && (
                    <>
                      <div className="detail-row">
                        <span>Vol/Train :</span>
                        <strong>{boardingResult.boarding_pass.flight_train_number}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Porte :</span>
                        <strong>{boardingResult.boarding_pass.gate || gateNumber}</strong>
                      </div>
                      {boardingResult.boarding_pass.seat && (
                        <div className="detail-row">
                          <span>Siège :</span>
                          <strong>{boardingResult.boarding_pass.seat}</strong>
                        </div>
                      )}
                    </>
                  )}

                  {boardingResult.passenger?.pmr_assistance && (
                    <div className="pmr-assistance-alert">
                      ♿ ASSISTANCE PMR - Priorité embarquement
                    </div>
                  )}

                  {boardingResult.verification && (
                    <div className="verification-result">
                      <p>✅ Face match : {boardingResult.verification.face_match_score?.toFixed(0)}%</p>
                    </div>
                  )}
                </div>

                <p className="auto-reset-notice">
                  Auto-reset dans 5 secondes...
                </p>
              </>
            ) : (
              <div className="access-denied">
                <div className="denied-icon">❌</div>
                <h2>ACCÈS REFUSÉ</h2>
                <p>{boardingResult.message || 'Boarding pass invalide'}</p>
                <button onClick={reset} className="btn-retry">
                  🔄 Réessayer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Infos porte */}
      <div className="gate-info-bar">
        <div className="info-item">
          <span>Porte :</span>
          <strong>{gateNumber || '---'}</strong>
        </div>
        <div className="info-item">
          <span>Mode :</span>
          <strong>{verificationMode === 'qr_only' ? 'Rapide' : 'Sécurisé'}</strong>
        </div>
        <div className="info-item">
          <span>Heure :</span>
          <strong>{new Date().toLocaleTimeString('fr-FR')}</strong>
        </div>
      </div>
    </div>
  );
};

export default BoardingGate;
