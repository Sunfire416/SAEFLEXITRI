/**
 * CheckInInterface
 * Interface de check-in manuel pour les réservations
 * /user/checkin/:reservationId
 */

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './CheckInInterface.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

const CheckInInterface = () => {
    const { reservationId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [reservation, setReservation] = useState(null);
    const [checkinStatus, setCheckinStatus] = useState(null);
    const [boardingPass, setBoardingPass] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReservationAndStatus();
    }, [reservationId]);

    const fetchReservationAndStatus = async () => {
        try {
            setLoading(true);
            
            // Récupérer statut check-in
            const statusRes = await axios.get(
                `${API_BASE_URL}/api/checkin/${reservationId}/status`,
                { params: { user_id: user?.user_id } }
            );

            if (statusRes.data.success) {
                setCheckinStatus(statusRes.data);
                if (statusRes.data.checkin_data) {
                    setBoardingPass(statusRes.data.checkin_data);
                }
            }

            // Récupérer détails réservation (via voyageHistory endpoint)
            const reservationRes = await axios.get(
                `${API_BASE_URL}/voyages/details/${reservationId}`,
                { params: { user_id: user?.user_id } }
            );

            if (reservationRes.data.success) {
                setReservation(reservationRes.data.details);
            }

        } catch (err) {
            console.error('❌ Erreur chargement:', err);
            setError('Impossible de charger les informations');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckin = async () => {
        if (!window.confirm('Effectuer le check-in maintenant ?')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.post(
                `${API_BASE_URL}/api/checkin/${reservationId}`,
                { 
                    user_id: user?.user_id,
                    reservation_id: parseInt(reservationId),
                    location: 'Web Interface'
                }
            );

            if (response.data.success) {
                alert('✅ Check-in effectué avec succès !');
                setBoardingPass(response.data.boarding_pass);
                setCheckinStatus({ ...checkinStatus, checked_in: true });
            }

        } catch (err) {
            console.error('❌ Erreur check-in:', err);
            setError(err.response?.data?.error || 'Erreur lors du check-in');
            alert('❌ ' + (err.response?.data?.error || 'Erreur check-in'));
        } finally {
            setLoading(false);
        }
    };

    const handleCancelCheckin = async () => {
        if (!window.confirm('Annuler le check-in ? Votre boarding pass sera supprimé.')) {
            return;
        }

        try {
            setLoading(true);

            const response = await axios.delete(
                `${API_BASE_URL}/api/checkin/${reservationId}`,
                { data: { user_id: user?.user_id } }
            );

            if (response.data.success) {
                alert('✅ Check-in annulé');
                setBoardingPass(null);
                setCheckinStatus({ ...checkinStatus, checked_in: false });
            }

        } catch (err) {
            console.error('❌ Erreur annulation:', err);
            alert('❌ Erreur annulation');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !reservation) {
        return (
            <div className="checkin-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement...</p>
                </div>
            </div>
        );
    }

    if (error && !reservation) {
        return (
            <div className="checkin-container">
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={() => navigate('/user/voyages')} className="btn-secondary">
                        Retour aux voyages
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="checkin-container">
            <div className="checkin-header">
                <button onClick={() => navigate('/user/voyages')} className="btn-back">
                    ← Retour
                </button>
                <h1>✈️ Check-in</h1>
            </div>

            {/* Informations réservation */}
            {reservation && (
                <div className="reservation-summary">
                    <h2>Informations du voyage</h2>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <span className="label">De :</span>
                            <span className="value">{reservation.Lieu_depart}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">À :</span>
                            <span className="value">{reservation.Lieu_arrivee}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Départ :</span>
                            <span className="value">
                                {new Date(reservation.Date_depart).toLocaleString('fr-FR')}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Transport :</span>
                            <span className="value">{reservation.Type_Transport}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Référence :</span>
                            <span className="value">{reservation.num_reza_mmt}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Statut check-in */}
            <div className="checkin-status-card">
                {checkinStatus?.checked_in ? (
                    <>
                        <div className="status-header success">
                            <span className="status-icon">✅</span>
                            <h3>Check-in effectué</h3>
                        </div>

                        {boardingPass && (
                            <div className="boarding-pass">
                                <h4>🎫 Carte d'embarquement</h4>
                                <div className="boarding-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Numéro :</span>
                                        <span className="detail-value">{boardingPass.boarding_pass}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Porte :</span>
                                        <span className="detail-value">{boardingPass.gate}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Siège :</span>
                                        <span className="detail-value">{boardingPass.seat}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Embarquement :</span>
                                        <span className="detail-value">
                                            {new Date(boardingPass.boarding_time).toLocaleTimeString('fr-FR')}
                                        </span>
                                    </div>
                                </div>

                                <div className="qr-code-display">
                                    <div className="qr-placeholder">
                                        <span className="qr-text">{boardingPass.qr_code}</span>
                                    </div>
                                    <p className="qr-instruction">
                                        Présentez ce QR code à l'embarquement
                                    </p>
                                </div>

                                <button 
                                    onClick={handleCancelCheckin}
                                    className="btn-danger"
                                    disabled={loading}
                                >
                                    Annuler le check-in
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="status-header pending">
                            <span className="status-icon">⏳</span>
                            <h3>Check-in non effectué</h3>
                        </div>

                        <div className="checkin-instructions">
                            <h4>📋 Instructions</h4>
                            <ul>
                                <li>✓ Vérifiez vos informations de voyage</li>
                                <li>✓ Assurez-vous d'avoir vos documents</li>
                                <li>✓ Le check-in peut être effectué jusqu'à 1h avant le départ</li>
                            </ul>
                        </div>

                        <button
                            onClick={handleCheckin}
                            className="btn-primary btn-large"
                            disabled={loading}
                        >
                            {loading ? 'Traitement...' : 'Effectuer le check-in'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CheckInInterface;
