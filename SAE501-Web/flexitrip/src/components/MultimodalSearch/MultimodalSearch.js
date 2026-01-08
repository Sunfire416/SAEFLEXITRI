import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MultimodalSearch.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

/**
 * Page de recherche multimodale avec Google Maps APIs
 * Correspond au backend POST /api/search/multimodal
 */
const MultimodalSearch = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [searchForm, setSearchForm] = useState({
        origin: '',
        destination: '',
        date: '',
        pmr_needs: {
            mobility_aid: 'none',
            wheelchair_type: null,
            visual_impairment: false,
            hearing_impairment: false,
            service_dog: false,
            assistance_level: 'partial',
            accepts_flight: true
        }
    });

    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePMRChange = (field, value) => {
        setSearchForm(prev => ({
            ...prev,
            pmr_needs: {
                ...prev.pmr_needs,
                [field]: value
            }
        }));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setResults(null);

        try {
            const searchData = {
                origin: searchForm.origin,
                destination: searchForm.destination,
                date: searchForm.date || new Date().toISOString(),
                pmr_needs: searchForm.pmr_needs
            };

            console.log('🔍 Recherche multimodale:', searchData);

            const response = await axios.post(
                `${API_BASE_URL}/api/search/multimodal`,
                searchData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Résultats:', response.data);
            
            // Vérifier si c'est une erreur de clé API
            if (!response.data.success || response.data.error) {
                setError(response.data.error || 'Erreur lors de la recherche');
                setResults(null);
                setLoading(false);
                return;
            }
            
            setResults(response.data);

        } catch (err) {
            console.error('❌ Erreur recherche:', err);
            setError(err.response?.data?.error || err.message || 'Erreur lors de la recherche');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h${mins}min` : `${mins}min`;
    };

    const formatPrice = (price) => {
        return price ? `${price.toFixed(2)}€` : 'N/A';
    };

    const getTransportIcon = (mode) => {
        const icons = {
            train: '🚆',
            bus: '🚌',
            flight: '✈️',
            metro: '🚇',
            tram: '🚊',
            walk: '🚶'
        };
        return icons[mode] || '🚗';
    };

    const getAccessibilityBadge = (score) => {
        if (score >= 80) return { label: 'Excellent', color: '#22c55e' };
        if (score >= 60) return { label: 'Bon', color: '#3b82f6' };
        if (score >= 40) return { label: 'Moyen', color: '#f59e0b' };
        return { label: 'Limité', color: '#ef4444' };
    };

    // 🆕 Fonction de réservation
    const handleBooking = async (route) => {
        if (!user) {
            alert('Vous devez être connecté pour réserver');
            navigate('/login');
            return;
        }

        setBookingLoading(true);

        try {
            // Récupérer le token JWT
            const token = localStorage.getItem('token');
            console.log('🔑 Token récupéré:', token ? 'Présent (' + token.substring(0, 20) + '...)' : '❌ ABSENT');
            
            if (!token) {
                alert('❌ Token manquant. Veuillez vous reconnecter.');
                navigate('/login');
                setBookingLoading(false);
                return;
            }

            // 1. Prévisualiser le workflow
            console.log('📋 Appel workflow-preview avec token...');
            const workflowRes = await axios.post(
                `${API_BASE_URL}/api/booking/workflow-preview`,
                { itinerary: route },
                { 
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    } 
                }
            );
            
            console.log('✅ Workflow reçu:', workflowRes.data);

            const workflow = workflowRes.data.workflow;
            const steps = workflow.required_steps.join(', ');
            
            // 2. Confirmer avec l'utilisateur
            const confirmed = window.confirm(
                `🎫 Réservation ${workflow.workflow_type}\n\n` +
                `Étapes nécessaires: ${steps}\n` +
                `Prix estimé: ${formatPrice(route.estimated_price)}\n\n` +
                `Confirmer la réservation ?`
            );

            if (!confirmed) {
                setBookingLoading(false);
                return;
            }

            // 3. Préparer l'itinéraire avec les bonnes données
            const enrichedItinerary = {
                ...route,
                from: {
                    name: searchForm.origin,
                    lat: route.start_location?.lat || 0,
                    lng: route.start_location?.lng || 0
                },
                to: {
                    name: searchForm.destination,
                    lat: route.end_location?.lat || 0,
                    lng: route.end_location?.lng || 0
                },
                transport_mode: route.transport_mode || route.segments?.[0]?.mode || 'multimodal',
                distance_km: route.distance ? route.distance / 1000 : 0,
                has_flight: route.segments?.some(s => s.mode === 'flight') || false,
                is_international: false // TODO: détecter selon les pays
            };
            
            console.log('📦 Itinéraire enrichi:', enrichedItinerary);

            // 4. Créer la réservation (token déjà récupéré au début)
            const bookingRes = await axios.post(
                `${API_BASE_URL}/api/booking/create`,
                {
                    itinerary: enrichedItinerary,
                    pmr_needs: searchForm.pmr_needs || {}
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (bookingRes.data.success) {
                // 5. Rediriger vers la page de résultat
                navigate('/user/booking-result', {
                    state: { booking: bookingRes.data }
                });
            } else {
                alert(`❌ Erreur: ${bookingRes.data.error}`);
            }

        } catch (err) {
            console.error('❌ Erreur réservation:', err);
            
            let errorMessage = 'Erreur lors de la réservation';
            
            if (err.response) {
                // Le serveur a répondu avec un code d'erreur
                console.error('📡 Réponse serveur:', err.response.status, err.response.data);
                
                if (err.response.status === 401) {
                    errorMessage = 'Session expirée. Veuillez vous reconnecter.';
                    // Rediriger vers login après 2 secondes
                    setTimeout(() => navigate('/login'), 2000);
                } else if (err.response.status === 403) {
                    errorMessage = 'Token invalide. Veuillez vous reconnecter.';
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
                }
            } else if (err.request) {
                // La requête a été envoyée mais pas de réponse
                console.error('📡 Pas de réponse du serveur');
                errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
            } else {
                // Erreur lors de la configuration de la requête
                console.error('⚙️ Erreur config:', err.message);
                errorMessage = err.message;
            }
            
            alert(`❌ ${errorMessage}`);
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="multimodal-search-container">
            {/* Header */}
            <div className="search-hero">
                <h1>🔍 Recherche Multimodale</h1>
                <p>Trouvez votre itinéraire accessible avec Google Maps</p>
                <div className="powered-by">
                    <span>Propulsé par</span>
                    <strong>Google Maps APIs</strong>
                </div>
            </div>

            {/* Formulaire de recherche */}
            <div className="search-card">
                <h2>🎯 Votre Itinéraire</h2>
                <form onSubmit={handleSearch} className="search-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="origin">📍 Départ</label>
                            <input
                                type="text"
                                id="origin"
                                name="origin"
                                value={searchForm.origin}
                                onChange={handleInputChange}
                                placeholder="Paris Gare de Lyon"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="destination">🎯 Arrivée</label>
                            <input
                                type="text"
                                id="destination"
                                name="destination"
                                value={searchForm.destination}
                                onChange={handleInputChange}
                                placeholder="Lyon Part-Dieu"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="date">📅 Date de départ</label>
                            <input
                                type="datetime-local"
                                id="date"
                                name="date"
                                value={searchForm.date}
                                onChange={handleInputChange}
                                min={new Date().toISOString().slice(0, 16)}
                            />
                        </div>
                    </div>

                    {/* Options PMR */}
                    <div className="pmr-options">
                        <h3>🦽 Besoins d'accessibilité</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="mobility_aid">Aide à la mobilité</label>
                                <select
                                    id="mobility_aid"
                                    value={searchForm.pmr_needs.mobility_aid}
                                    onChange={(e) => handlePMRChange('mobility_aid', e.target.value)}
                                >
                                    <option value="none">Aucune</option>
                                    <option value="wheelchair">Fauteuil roulant</option>
                                    <option value="cane">Canne</option>
                                    <option value="walker">Déambulateur</option>
                                </select>
                            </div>

                            {searchForm.pmr_needs.mobility_aid === 'wheelchair' && (
                                <div className="form-group">
                                    <label htmlFor="wheelchair_type">Type de fauteuil</label>
                                    <select
                                        id="wheelchair_type"
                                        value={searchForm.pmr_needs.wheelchair_type || 'manual'}
                                        onChange={(e) => handlePMRChange('wheelchair_type', e.target.value)}
                                    >
                                        <option value="manual">Manuel</option>
                                        <option value="electric">Électrique</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="assistance_level">Niveau d'assistance</label>
                                <select
                                    id="assistance_level"
                                    value={searchForm.pmr_needs.assistance_level}
                                    onChange={(e) => handlePMRChange('assistance_level', e.target.value)}
                                >
                                    <option value="none">Autonome</option>
                                    <option value="partial">Partielle</option>
                                    <option value="full">Complète</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row checkboxes">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={searchForm.pmr_needs.visual_impairment}
                                    onChange={(e) => handlePMRChange('visual_impairment', e.target.checked)}
                                />
                                <span>Déficience visuelle</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={searchForm.pmr_needs.hearing_impairment}
                                    onChange={(e) => handlePMRChange('hearing_impairment', e.target.checked)}
                                />
                                <span>Déficience auditive</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={searchForm.pmr_needs.service_dog}
                                    onChange={(e) => handlePMRChange('service_dog', e.target.checked)}
                                />
                                <span>Chien d'assistance</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={searchForm.pmr_needs.accepts_flight}
                                    onChange={(e) => handlePMRChange('accepts_flight', e.target.checked)}
                                />
                                <span>Accepter les vols (longue distance)</span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="btn-search" disabled={loading}>
                        {loading ? '🔄 Recherche en cours...' : '🔍 Rechercher'}
                    </button>
                </form>
            </div>

            {/* Erreur */}
            {error && (
                <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <div className="error-content">
                        <h3>Erreur</h3>
                        <p>{error}</p>
                        {error.includes('Google Maps API Key') && (
                            <div className="error-help">
                                <strong>💡 Solution :</strong>
                                <ol>
                                    <li>Vérifiez que GOOGLE_MAPS_API_KEY est dans le fichier .env</li>
                                    <li>Redémarrez le backend : <code>docker compose restart api</code></li>
                                    <li>Vérifiez les logs : <code>docker compose logs api</code></li>
                                </ol>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Résultats */}
            {results && results.success !== false && (
                <div className="results-container">
                    <h2>📍 Résultats de recherche</h2>
                    <p className="results-info">
                        {results.routes?.length || 0} itinéraire(s) trouvé(s)
                        {results.distance && ` • Distance: ${(results.distance / 1000).toFixed(0)} km`}
                    </p>

                    {results.routes && results.routes.length > 0 ? (
                        <div className="routes-list">
                            {results.routes.map((route, idx) => {
                                const accessibility = getAccessibilityBadge(route.accessibility_score);
                                
                                return (
                                    <div key={idx} className="route-card">
                                        <div className="route-header">
                                            <div className="route-title">
                                                <h3>Itinéraire {idx + 1}</h3>
                                                <span 
                                                    className="accessibility-badge"
                                                    style={{ backgroundColor: accessibility.color }}
                                                >
                                                    {accessibility.label}
                                                </span>
                                            </div>
                                            <div className="route-summary">
                                                <span className="duration">⏱️ {formatDuration(route.duration)}</span>
                                                <span className="price">💰 {formatPrice(route.estimated_price)}</span>
                                            </div>
                                        </div>

                                        <div className="route-segments">
                                            {route.segments?.map((segment, segIdx) => (
                                                <div key={segIdx} className="segment">
                                                    <div className="segment-icon">
                                                        {getTransportIcon(segment.mode)}
                                                    </div>
                                                    <div className="segment-info">
                                                        <div className="segment-mode">
                                                            <strong>{segment.mode.toUpperCase()}</strong>
                                                            {segment.operator && (
                                                                <span className="operator">{segment.operator}</span>
                                                            )}
                                                        </div>
                                                        <div className="segment-details">
                                                            <span>{segment.from} → {segment.to}</span>
                                                        </div>
                                                        <div className="segment-time">
                                                            <span>🕐 {new Date(segment.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                            <span>→</span>
                                                            <span>🕐 {new Date(segment.arrival_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        {segment.accessibility_features && segment.accessibility_features.length > 0 && (
                                                            <div className="accessibility-features">
                                                                {segment.accessibility_features.map((feature, fIdx) => (
                                                                    <span key={fIdx} className="feature-tag">
                                                                        ✓ {feature}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {route.warnings && route.warnings.length > 0 && (
                                            <div className="route-warnings">
                                                <strong>⚠️ Avertissements:</strong>
                                                <ul>
                                                    {route.warnings.map((warning, wIdx) => (
                                                        <li key={wIdx}>{warning}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <button 
                                            className="btn-book-route"
                                            onClick={() => handleBooking(route)}
                                            disabled={bookingLoading}
                                        >
                                            {bookingLoading ? '⏳ Réservation...' : '🎫 Réserver ce trajet'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-results">
                            <p>😕 Aucun itinéraire trouvé pour cette recherche</p>
                            <p>Essayez de modifier vos critères ou vos besoins PMR</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultimodalSearch;
