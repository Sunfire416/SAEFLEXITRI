import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import './TripBuilder.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

function TripBuilder() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [selectedTrip] = useState(location.state?.selectedTrip);
    const [pmrOptions, setPmrOptions] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!selectedTrip) {
            navigate('/search');
        }
    }, [selectedTrip, navigate]);

    const handlePMROptionChange = (segmentIndex, option, value) => {
        setPmrOptions(prev => ({
            ...prev,
            [segmentIndex]: {
                ...prev[segmentIndex],
                [option]: value
            }
        }));
    };

    const handleProceedToPayment = async () => {
        if (!user) {
            alert('Veuillez vous connecter pour continuer');
            navigate('/login');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Créer le voyage dans MongoDB
            const voyageData = {
                id_pmr: user.user_id,
                id_accompagnant: null,
                prix_total: selectedTrip.total_price,
                bagage: [],
                etapes: selectedTrip.segments.map((seg, idx) => ({
                    type: seg.type,
                    id: seg.id,
                    adresse_1: seg.departure || '',
                    adresse_2: seg.arrival || '',
                    departure_time: seg.departure_time,
                    arrival_time: seg.arrival_time
                })),
                // ==========================================
                // 🆕 AJOUTER LES OPTIONS PMR
                // ==========================================
                pmr_options: Object.keys(pmrOptions).length > 0 ? pmrOptions : null
            };

            const voyageResponse = await axios.post(
                `${API_BASE_URL}/voyage/insert`,
                voyageData,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            const id_voyage = voyageResponse.data.id_voyage;

            // Naviguer vers le checkout
            navigate('/checkout', {
                state: {
                    voyage: voyageResponse.data,
                    trip: selectedTrip,
                    pmrOptions: pmrOptions,
                    id_voyage: id_voyage
                }
            });

        } catch (err) {
            console.error('Erreur création voyage:', err);
            setError(err.response?.data?.message || 'Erreur lors de la création du voyage');
            setLoading(false);
        }
    };

    if (!selectedTrip) return null;

    return (
        <div className="trip-builder-container">
            <div className="trip-builder-header">
                <button className="back-button" onClick={() => navigate('/search')}>
                    ← Retour à la recherche
                </button>
                <h1>🎫 Personnaliser votre voyage</h1>
            </div>

            <div className="trip-overview">
                <div className="overview-card">
                    <h2>📍 Votre itinéraire</h2>
                    <div className="route-summary">
                        <span className="route-city">{selectedTrip.segments[0].departure}</span>
                        <span className="route-arrow">→</span>
                        <span className="route-city">{selectedTrip.segments[selectedTrip.segments.length - 1].arrival}</span>
                    </div>
                    <div className="trip-stats">
                        <div className="stat">
                            <span className="stat-label">⏱️ Durée totale</span>
                            <span className="stat-value">{selectedTrip.total_duration}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">💰 Prix total</span>
                            <span className="stat-value">{selectedTrip.total_price.toFixed(2)}€</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">🔄 Correspondances</span>
                            <span className="stat-value">{selectedTrip.number_of_transfers}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="segments-configuration">
                <h2>🚄 Détails des segments</h2>
                {selectedTrip.segments.map((segment, index) => (
                    <div key={index} className="segment-config-card">
                        <div className="segment-header">
                            <div className="segment-title">
                                <span className="segment-icon">
                                    {segment.type === 'avion' && '✈️'}
                                    {segment.type === 'train' && '🚄'}
                                    {segment.type === 'taxi' && '🚕'}
                                </span>
                                <div>
                                    <h3>Étape {index + 1} : {segment.departure} → {segment.arrival}</h3>
                                    <p className="segment-company">{segment.company}</p>
                                </div>
                            </div>
                            {segment.pmr_compatible && (
                                <span className="pmr-compatible-badge">♿ PMR</span>
                            )}
                        </div>

                        <div className="segment-details">
                            <div className="detail-row">
                                <span>🕐 Départ: {new Date(segment.departure_time).toLocaleString('fr-FR')}</span>
                                <span>🕐 Arrivée: {new Date(segment.arrival_time).toLocaleString('fr-FR')}</span>
                            </div>
                            <div className="detail-row">
                                <span>⏱️ Durée: {segment.duration}</span>
                                <span>💰 Prix: {segment.price.toFixed(2)}€</span>
                            </div>
                        </div>

                        {/* Options PMR */}
                        {segment.pmr_compatible && (
                            <div className="pmr-options-section">
                                <h4>♿ Options d'accessibilité disponibles</h4>
                                <div className="pmr-options-grid">
                                    <label className="pmr-option">
                                        <input
                                            type="checkbox"
                                            checked={pmrOptions[index]?.espace_fauteuil || false}
                                            onChange={(e) => handlePMROptionChange(index, 'espace_fauteuil', e.target.checked)}
                                        />
                                        <span>🦽 Espace pour fauteuil roulant</span>
                                    </label>
                                    <label className="pmr-option">
                                        <input
                                            type="checkbox"
                                            checked={pmrOptions[index]?.assistance_embarquement || false}
                                            onChange={(e) => handlePMROptionChange(index, 'assistance_embarquement', e.target.checked)}
                                        />
                                        <span>🤝 Assistance à l'embarquement</span>
                                    </label>
                                    <label className="pmr-option">
                                        <input
                                            type="checkbox"
                                            checked={pmrOptions[index]?.assistance_debarquement || false}
                                            onChange={(e) => handlePMROptionChange(index, 'assistance_debarquement', e.target.checked)}
                                        />
                                        <span>🤝 Assistance au débarquement</span>
                                    </label>
                                    <label className="pmr-option">
                                        <input
                                            type="checkbox"
                                            checked={pmrOptions[index]?.siege_adapte || false}
                                            onChange={(e) => handlePMROptionChange(index, 'siege_adapte', e.target.checked)}
                                        />
                                        <span>💺 Siège adapté</span>
                                    </label>
                                    <label className="pmr-option">
                                        <input
                                            type="checkbox"
                                            checked={pmrOptions[index]?.aide_transfert || false}
                                            onChange={(e) => handlePMROptionChange(index, 'aide_transfert', e.target.checked)}
                                        />
                                        <span>🔄 Aide au transfert</span>
                                    </label>
                                    <label className="pmr-option">
                                        <input
                                            type="checkbox"
                                            checked={pmrOptions[index]?.chien_assistance || false}
                                            onChange={(e) => handlePMROptionChange(index, 'chien_assistance', e.target.checked)}
                                        />
                                        <span>🐕‍🦺 Chien d'assistance</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            <div className="trip-actions">
                <button 
                    className="proceed-button"
                    onClick={handleProceedToPayment}
                    disabled={loading}
                >
                    {loading ? '⏳ Création du voyage...' : '💳 Procéder au paiement'}
                </button>
            </div>
        </div>
    );
}

export default TripBuilder;
