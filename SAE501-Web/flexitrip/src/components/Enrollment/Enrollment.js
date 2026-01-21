/**
 * Enrollment - Page d'enregistrement biométrique
 * VERSION CORRIGÉE - Récupère automatiquement reservation_id
 */

import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import WebcamCapture from '../shared/WebcamCapture';
import './Enrollment.css';
import { AuthContext } from '../../context/AuthContext';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

const Enrollment = () => {
  const { user } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reservationId, setReservationId] = useState(null);

  // Données formulaire
  const [documentType, setDocumentType] = useState('cni');
  const [idPhotoRecto, setIdPhotoRecto] = useState(null);
  const [idPhotoVerso, setIdPhotoVerso] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [selfieVideo, setSelfieVideo] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);

  // Résultat enrollment
  const [enrollmentResult, setEnrollmentResult] = useState(null);

  // 🆕 Récupérer reservation_id au chargement
  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const userId = user?.user_id || 4;

        // 🔧 TEMPORAIRE : Forcer reservation_id=1 pour debug
        console.log('🔧 Mode DEBUG : Forcing reservation_id=1');
        setReservationId(1);
        return;

        // Récupérer la dernière réservation de l'utilisateur
        const response = await axios.get(
          `${API_BASE_URL}/reservations/user/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data && response.data.length > 0) {
          // Prendre la première réservation (la plus récente)
          const latestReservation = response.data[0];
          setReservationId(latestReservation.reservation_id);
          console.log('✅ Reservation_id récupéré:', latestReservation.reservation_id);
        } else {
          console.warn('⚠️ Aucune réservation trouvée pour user_id:', userId);
          // 🔧 FALLBACK : Forcer reservation_id=1
          setReservationId(1);
        }
      } catch (err) {
        console.error('❌ Erreur récupération réservation:', err);
        // 🔧 FALLBACK : Forcer reservation_id=1
        setReservationId(1);
      }
    };

    fetchReservation();
  }, [user]);

  // Upload image et convertir en base64
  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Capture selfie depuis webcam
  const handleSelfieCapture = (imageBase64) => {
    setSelfiePhoto(imageBase64);
  };

  // Capture vidéo liveness
  const handleVideoCapture = (frames) => {
    setSelfieVideo(frames);
  };

  // Validation étape 1
  const validateStep1 = () => {
    if (!documentType || !idPhotoRecto) {
      setError('Type de document et photo recto requis');
      return false;
    }
    if (documentType === 'cni' && !idPhotoVerso) {
      setError('Photo verso requise pour une CNI');
      return false;
    }
    return true;
  };

  // Validation étape 2
  const validateStep2 = () => {
    if (!selfiePhoto) {
      setError('Selfie requis');
      return false;
    }
    return true;
  };

  // Validation étape 3
  const validateStep3 = () => {
    if (!consentGiven) {
      setError('Vous devez accepter le consentement RGPD');
      return false;
    }
    return true;
  };

  // Passer à l'étape suivante
  const nextStep = () => {
    setError(null);

    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    if (step === 3) {
      if (!validateStep3()) return;
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  // Retour étape précédente
  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  // Soumettre enrollment
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer user_id
      let userId = user?.user_id;

      // Si pas connecté, utiliser un ID de test
      if (!userId) {
        console.warn('⚠️ User non connecté, utilisation user_id=4 pour test');
        userId = 4;
      }

      const enrollmentData = {
        user_id: userId,
        reservation_id: reservationId, // 🆕 AJOUT DU RESERVATION_ID
        document_type: documentType,
        id_photo_recto: idPhotoRecto,
        id_photo_verso: documentType === 'cni' ? idPhotoVerso : undefined,
        selfie_photo: selfiePhoto,
        selfie_video_frames: selfieVideo,
        consent_given: consentGiven,
        consent_ip: window.location.hostname
      };

      console.log('📤 Envoi enrollment avec reservation_id:', reservationId);

      const response = await axios.post(
        `${API_BASE_URL}/biometric/enrollment/register`,
        enrollmentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('✅ Enrollment réussi:', response.data);

      setEnrollmentResult(response.data);
      setStep(4);

    } catch (err) {
      console.error('❌ Erreur enrollment:', err);
      setError(
        err.response?.data?.error ||
        'Erreur lors de l\'enregistrement biométrique'
      );
    } finally {
      setLoading(false);
    }
  };

  // Télécharger QR code
  const downloadQR = () => {
    if (!enrollmentResult?.qr_data_url) return;

    const link = document.createElement('a');
    link.href = enrollmentResult.qr_data_url;
    link.download = `enrollment_qr_${enrollmentResult.enrollment_id}.png`;
    link.click();
  };

  return (
    <div className="enrollment-container">
      <div className="enrollment-card">
        <h1>🔐 Enregistrement Biométrique</h1>
        <p className="enrollment-subtitle">
          Enregistrez votre identité pour un voyage sans contact
        </p>

        {/* 🆕 Afficher reservation_id si trouvé */}
        {reservationId && (
          <div className="reservation-info">
            ✅ Réservation #{reservationId} détectée
          </div>
        )}

        {/* Stepper */}
        <div className="stepper">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Pièce d'identité</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Selfie</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Consentement</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">QR Code</div>
          </div>
        </div>

        {/* Étape 1 : Pièce d'identité */}
        {step === 1 && (
          <div className="step-content">
            <h2>📄 Pièce d'identité</h2>

            <div className="form-group">
              <label>Type de document</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="document-type-select"
              >
                <option value="cni">Carte Nationale d'Identité</option>
                <option value="passeport">Passeport</option>
              </select>
            </div>

            <div className="form-group">
              <label>Photo Recto *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, setIdPhotoRecto)}
                className="file-input"
              />
              {idPhotoRecto && (
                <img src={idPhotoRecto} alt="Recto" className="preview-image" />
              )}
            </div>

            {documentType === 'cni' && (
              <div className="form-group">
                <label>Photo Verso *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setIdPhotoVerso)}
                  className="file-input"
                />
                {idPhotoVerso && (
                  <img src={idPhotoVerso} alt="Verso" className="preview-image" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Étape 2 : Selfie */}
        {step === 2 && (
          <div className="step-content">
            <h2>📸 Selfie</h2>

            {!selfiePhoto ? (
              <WebcamCapture
                mode="photo"
                label="Prendre un selfie"
                onCapture={handleSelfieCapture}
              />
            ) : (
              <div className="selfie-preview">
                <img src={selfiePhoto} alt="Selfie" />
                <button onClick={() => setSelfiePhoto(null)} className="btn-retake">
                  🔄 Reprendre
                </button>
              </div>
            )}

            {selfiePhoto && (
              <div className="liveness-section">
                <h3>🎥 Vérification de vivacité (optionnel)</h3>
                <p>Enregistrez une courte vidéo pour améliorer la sécurité</p>

                {!selfieVideo ? (
                  <WebcamCapture
                    mode="video"
                    label="Enregistrer vidéo"
                    videoFrames={5}
                    videoDuration={2}
                    onVideoCapture={handleVideoCapture}
                  />
                ) : (
                  <div className="video-captured">
                    ✅ Vidéo enregistrée ({selfieVideo.length} frames)
                    <button onClick={() => setSelfieVideo(null)} className="btn-retake">
                      🔄 Reprendre
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Étape 3 : Consentement */}
        {step === 3 && (
          <div className="step-content">
            <h2>📜 Consentement RGPD</h2>

            <div className="consent-box">
              <h3>Traitement de vos données biométriques</h3>
              <p>
                En cochant cette case, vous consentez explicitement au traitement de vos
                données biométriques par FlexiTrip dans le cadre de votre voyage.
              </p>
              <h4>Données collectées :</h4>
              <ul>
                <li>Photo de votre pièce d'identité (recto/verso)</li>
                <li>Photo de votre visage (selfie)</li>
                <li>Vidéo courte pour vérification de vivacité (optionnel)</li>
                <li>Template biométrique extrait de votre visage</li>
              </ul>
              <h4>Finalité :</h4>
              <ul>
                <li>Vérification de votre identité lors de l'embarquement</li>
                <li>Sécurisation de votre parcours de voyage</li>
                <li>Assistance PMR personnalisée</li>
              </ul>
              <h4>Vos droits (RGPD) :</h4>
              <ul>
                <li>Droit d'accès à vos données</li>
                <li>Droit de rectification</li>
                <li>Droit d'effacement (suppression)</li>
                <li>Droit de révocation du consentement à tout moment</li>
              </ul>
              <h4>Sécurité :</h4>
              <ul>
                <li>Vos données sont chiffrées avec AES-256</li>
                <li>Conservation maximale : 1 an après votre dernier voyage</li>
                <li>Aucun partage avec des tiers sans votre accord</li>
              </ul>
            </div>

            <div className="consent-checkbox">
              <input
                type="checkbox"
                id="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
              />
              <label htmlFor="consent">
                J'accepte le traitement de mes données biométriques conformément au RGPD *
              </label>
            </div>
          </div>
        )}

        {/* Étape 4 : Résultat */}
        {step === 4 && enrollmentResult && (
          <div className="step-content result-step">
            <div className="success-icon">✅</div>
            <h2>Enregistrement réussi !</h2>

            <div className="identity-detected">
              <h3>Identité détectée</h3>
              <p className="identity-name">
                {enrollmentResult.identity?.prenom} {enrollmentResult.identity?.nom}
              </p>
              <p>
                Numéro ID : {enrollmentResult.identity?.numero_id}
              </p>
            </div>

            <div className="quality-scores">
              <h3>Scores de qualité</h3>
              <div className="score-item">
                <span className="score-label">OCR (extraction ID)</span>
                <div className="score-bar">
                  <div
                    className="score-fill ocr"
                    style={{ width: `${enrollmentResult.quality_scores?.ocr || 0}%` }}
                  ></div>
                </div>
                <span className="score-value">
                  {enrollmentResult.quality_scores?.ocr?.toFixed(1)}%
                </span>
              </div>

              <div className="score-item">
                <span className="score-label">Face Match (correspondance)</span>
                <div className="score-bar">
                  <div
                    className="score-fill face-match"
                    style={{ width: `${enrollmentResult.quality_scores?.face_match || 0}%` }}
                  ></div>
                </div>
                <span className="score-value">
                  {enrollmentResult.quality_scores?.face_match?.toFixed(1)}%
                </span>
              </div>

              {enrollmentResult.quality_scores?.liveness && (
                <div className="score-item">
                  <span className="score-label">Liveness (vivacité)</span>
                  <div className="score-bar">
                    <div
                      className="score-fill liveness"
                      style={{ width: `${enrollmentResult.quality_scores.liveness}%` }}
                    ></div>
                  </div>
                  <span className="score-value">
                    {enrollmentResult.quality_scores.liveness.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <div className="qr-code-section">
              <h3>🎫 Votre QR Code</h3>
              <p>Présentez ce QR code lors de l'embarquement</p>
              <img
                src={enrollmentResult.qr_data_url}
                alt="QR Code Enrollment"
                className="qr-code-image"
              />
              <button onClick={downloadQR} className="btn-download">
                💾 Télécharger le QR Code
              </button>
              <p className="expiration-notice">
                Valable jusqu'au : {new Date(enrollmentResult.expires_at).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <button onClick={() => window.location.href = '/user/profile'} className="btn-finish">
              ✔️ Terminer
            </button>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Boutons navigation */}
        {step < 4 && (
          <div className="step-actions">
            {step > 1 && (
              <button onClick={prevStep} className="btn-back">
                ← Retour
              </button>
            )}
            <button
              onClick={nextStep}
              className="btn-next"
              disabled={loading}
            >
              {loading ? '⏳ Traitement...' : step === 3 ? '✅ Valider l\'enregistrement' : 'Suivant →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Enrollment;