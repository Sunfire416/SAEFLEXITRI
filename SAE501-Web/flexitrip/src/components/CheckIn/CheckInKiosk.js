/**
 * CheckInKiosk - Interface check-in kiosk/agent
 * VERSION CORRIGÉE - Affichage boarding pass complet
 */

import React, { useState } from 'react';
import axios from 'axios';
import WebcamCapture from '../shared/WebcamCapture';
import './CheckInKiosk.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

const CheckInKiosk = () => {
  const [mode, setMode] = useState('kiosk'); // 'kiosk' ou 'agent'
  const [step, setStep] = useState(1); // 1: scan QR, 2: photo, 3: résultat
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Données
  const [qrData, setQrData] = useState('');
  const [livePhoto, setLivePhoto] = useState(null);
  const [location, setLocation] = useState('');

  // Résultat
  const [checkInResult, setCheckInResult] = useState(null);

  // Scanner QR (simulation)
  const handleQRScan = (e) => {
    const input = e.target.value;
    setQrData(input);
  };

  // Simuler scan QR depuis fichier
  const handleQRFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Dans la vraie vie : utiliser jsQR pour décoder l'image
    // Ici : simulation
    const mockQRData = JSON.stringify({
      type: 'ENROLLMENT',
      id: 'ENR-4-1767532528-A3F2',
      user_id: 4,
      reservation_id: 3,
      identity: {
        nom: 'DUPONT',
        prenom: 'JEAN',
        dob: '1985-05-15'
      },
      issued_at: new Date().toISOString()
    });

    setQrData(mockQRData);
    console.log('📷 QR code scanné (simulation)');
  };

  // Capture photo live
  const handlePhotoCapture = (imageBase64) => {
    setLivePhoto(imageBase64);
  };

  // Soumettre check-in
  const handleCheckIn = async () => {
    if (!qrData || !livePhoto || !location) {
      setError('Tous les champs sont requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const checkinData = {
        qr_data: qrData,
        live_photo: livePhoto,
        location: location,
        checkin_type: mode
      };

      console.log('📤 Envoi check-in...');

      const response = await axios.post(
        `${API_BASE_URL}/checkin/scan`,
        checkinData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Check-in réussi:', response.data);

      setCheckInResult(response.data);
      setStep(3);

    } catch (err) {
      console.error('❌ Erreur check-in:', err);
      setError(
        err.response?.data?.error || 
        'Erreur lors du check-in'
      );
    } finally {
      setLoading(false);
    }
  };

  // Check-in manuel (agent)
  const handleManualCheckIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const manualData = {
        reservation_id: 3, // À récupérer depuis formulaire
        agent_id: 1,
        location: location,
        reason: 'Check-in manuel suite à échec auto'
      };

      const response = await axios.post(
        `${API_BASE_URL}/checkin/manual`,
        manualData
      );

      console.log('✅ Check-in manuel réussi:', response.data);

      setCheckInResult(response.data);
      setStep(3);

    } catch (err) {
      console.error('❌ Erreur check-in manuel:', err);
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  // Imprimer boarding pass
  const printBoardingPass = () => {
    if (!checkInResult?.boarding_pass) return;

    const bp = checkInResult.boarding_pass;
    const passenger = checkInResult.passenger;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Boarding Pass - FlexiTrip</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 2rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .bp-container {
              background: white;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 2rem;
              border-radius: 15px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            h1 { margin: 0 0 1rem; font-size: 1.8rem; }
            h2 { margin: 0.5rem 0; font-size: 1.5rem; color: #667eea; }
            .details { margin: 2rem 0; text-align: left; }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 0.8rem; 
              border-bottom: 1px solid #eee; 
            }
            .detail-row:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; font-size: 1.1rem; }
            img { max-width: 300px; margin: 2rem 0; }
            .barcode { 
              margin: 1rem 0; 
              font-family: 'Courier New', monospace; 
              font-size: 1.5rem;
              letter-spacing: 0.2rem;
              background: #f5f5f5;
              padding: 1rem;
              border-radius: 5px;
            }
            .pmr-alert {
              background: #ffc107;
              color: #000;
              padding: 1rem;
              margin: 1.5rem 0;
              border-radius: 8px;
              font-weight: bold;
              font-size: 1.1rem;
            }
            @media print {
              body { background: white; }
              .bp-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="bp-container">
            <h1>🎫 FlexiTrip Boarding Pass</h1>
            <h2>${passenger?.nom || 'N/A'} ${passenger?.prenom || 'N/A'}</h2>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Vol/Train :</span>
                <span class="value">${bp.flight_train || bp.flight_train_number || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Embarquement :</span>
                <span class="value">${new Date(bp.boarding_time).toLocaleString('fr-FR')}</span>
              </div>
              ${bp.gate ? `
              <div class="detail-row">
                <span class="label">Porte :</span>
                <span class="value">${bp.gate}</span>
              </div>
              ` : ''}
              ${bp.seat ? `
              <div class="detail-row">
                <span class="label">Siège :</span>
                <span class="value">${bp.seat}</span>
              </div>
              ` : ''}
            </div>
            
            ${bp.pmr_assistance ? '<div class="pmr-alert">♿ ASSISTANCE PMR REQUISE - PRIORITÉ EMBARQUEMENT</div>' : ''}
            
            ${bp.qr_data ? `<img src="data:image/png;base64,QR_CODE_PLACEHOLDER" alt="QR Code" />` : ''}
            ${bp.barcode ? `<div class="barcode">${bp.barcode}</div>` : ''}
            
            <p style="color: #999; font-size: 0.9rem; margin-top: 2rem;">
              Pass ID: ${bp.pass_id} | Émis le ${new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Recommencer
  const reset = () => {
    setStep(1);
    setQrData('');
    setLivePhoto(null);
    setCheckInResult(null);
    setError(null);
  };

  return (
    <div className="checkin-kiosk-container">
      <div className="kiosk-header">
        <h1>🏢 FlexiTrip Check-In</h1>
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'kiosk' ? 'active' : ''}`}
            onClick={() => setMode('kiosk')}
          >
            🖥️ Mode Kiosk
          </button>
          <button
            className={`mode-btn ${mode === 'agent' ? 'active' : ''}`}
            onClick={() => setMode('agent')}
          >
            👤 Mode Agent
          </button>
        </div>
      </div>

      <div className="kiosk-content">
        {/* Étape 1 : Scanner QR */}
        {step === 1 && (
          <div className="kiosk-step">
            <h2>📱 Scannez votre QR code</h2>

            <div className="qr-scan-section">
              {/* Simulation scan */}
              <div className="qr-input-group">
                <label>Scanner QR (ou coller données JSON)</label>
                <textarea
                  value={qrData}
                  onChange={handleQRScan}
                  placeholder='{"type":"ENROLLMENT","id":"ENR-4-..."}'
                  rows={4}
                  className="qr-input"
                />
              </div>

              <div className="qr-upload-group">
                <label>Ou uploader image QR</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQRFileUpload}
                  className="file-input"
                />
              </div>

              {/* Location */}
              <div className="location-group">
                <label>Localisation</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="location-select"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Gare Lyon Part-Dieu">Gare Lyon Part-Dieu</option>
                  <option value="Gare Paris Montparnasse">Gare Paris Montparnasse</option>
                  <option value="CDG Terminal 2E">CDG Terminal 2E</option>
                  <option value="Orly Terminal 3">Orly Terminal 3</option>
                </select>
              </div>

              {qrData && (
                <div className="qr-preview">
                  ✅ QR code détecté
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn-next-kiosk"
              disabled={!qrData || !location}
            >
              Suivant → Vérification faciale
            </button>
          </div>
        )}

        {/* Étape 2 : Photo faciale */}
        {step === 2 && (
          <div className="kiosk-step">
            <h2>📸 Vérification faciale</h2>
            <p className="step-instruction">
              Positionnez votre visage face à la caméra
            </p>

            {!livePhoto ? (
              <WebcamCapture
                mode="photo"
                label="Capturer photo"
                onCapture={handlePhotoCapture}
              />
            ) : (
              <div className="photo-preview">
                <img src={livePhoto} alt="Live" />
                <button onClick={() => setLivePhoto(null)} className="btn-retake">
                  🔄 Reprendre
                </button>
              </div>
            )}

            {error && (
              <div className="error-box">
                ⚠️ {error}
              </div>
            )}

            <div className="kiosk-actions">
              <button onClick={() => setStep(1)} className="btn-back-kiosk">
                ← Retour
              </button>

              {mode === 'kiosk' && (
                <button
                  onClick={handleCheckIn}
                  className="btn-checkin"
                  disabled={!livePhoto || loading}
                >
                  {loading ? '⏳ Vérification...' : '✅ Valider check-in'}
                </button>
              )}

              {mode === 'agent' && (
                <>
                  <button
                    onClick={handleCheckIn}
                    className="btn-checkin"
                    disabled={!livePhoto || loading}
                  >
                    Vérification auto
                  </button>
                  <button
                    onClick={handleManualCheckIn}
                    className="btn-manual"
                    disabled={loading}
                  >
                    ✋ Override manuel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Étape 3 : Résultat + Boarding Pass */}
        {step === 3 && checkInResult && (
          <div className="kiosk-step result-step">
            <div className="success-animation">
              <div className="checkmark">✓</div>
            </div>

            <h2>Check-in réussi !</h2>

            <div className="passenger-info">
              <h3>Passager</h3>
              <p className="passenger-name">
                {checkInResult.passenger?.nom || 'N/A'} {checkInResult.passenger?.prenom || 'N/A'}
              </p>

              {checkInResult.verification && (
                <div className="verification-scores">
                  <div className="score-badge">
                    Face Match : {checkInResult.verification.face_match_score?.toFixed(0)}%
                  </div>
                  {checkInResult.verification.liveness_verified && (
                    <div className="score-badge green">
                      ✅ Liveness vérifié
                    </div>
                  )}
                </div>
              )}
            </div>

            {checkInResult.boarding_pass && (
              <div className="boarding-pass-display">
                <h3>🎫 Boarding Pass</h3>

                <div className="bp-details">
                  <div className="bp-row">
                    <span>Vol/Train :</span>
                    <strong>
                      {checkInResult.boarding_pass.flight_train || 
                       checkInResult.boarding_pass.flight_train_number || 
                       'N/A'}
                    </strong>
                  </div>
                  <div className="bp-row">
                    <span>Embarquement :</span>
                    <strong>
                      {new Date(checkInResult.boarding_pass.boarding_time).toLocaleString('fr-FR')}
                    </strong>
                  </div>
                  {checkInResult.boarding_pass.gate && (
                    <div className="bp-row">
                      <span>Porte :</span>
                      <strong>{checkInResult.boarding_pass.gate}</strong>
                    </div>
                  )}
                  {checkInResult.boarding_pass.seat && (
                    <div className="bp-row">
                      <span>Siège :</span>
                      <strong>{checkInResult.boarding_pass.seat}</strong>
                    </div>
                  )}
                </div>

                {checkInResult.boarding_pass.pmr_assistance && (
                  <div className="pmr-alert">
                    ♿ Assistance PMR requise - Priorité embarquement
                  </div>
                )}

                <div className="bp-qr-display">
                  {checkInResult.boarding_pass.qr_code && (
                    <img
                      src={checkInResult.boarding_pass.qr_code}
                      alt="Boarding Pass QR"
                      className="bp-qr-image"
                    />
                  )}
                  {checkInResult.boarding_pass.barcode && (
                    <p className="barcode-text">
                      {checkInResult.boarding_pass.barcode}
                    </p>
                  )}
                </div>

                <button onClick={printBoardingPass} className="btn-print">
                  🖨️ Imprimer boarding pass
                </button>
              </div>
            )}

            <div className="completion-actions">
              <button onClick={reset} className="btn-new-checkin">
                ➕ Nouveau check-in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInKiosk;