import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SearchEngine.css';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

function SearchEngine() {
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useState({
        departure: '',
        destination: '',
        date: '',
        pmr_required: false,
        max_price: 1000,
        max_transfers: 2
    });

    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSearchParams(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const params = new URLSearchParams({
                departure: searchParams.departure,
                destination: searchParams.destination,
                ...(searchParams.date && { date: searchParams.date }),
                pmr_required: searchParams.pmr_required,
                max_price: searchParams.max_price,
                max_transfers: searchParams.max_transfers
            });

            const response = await axios.get(
                `${API_BASE_URL}/search/multimodal?${params.toString()}`
            );

            setResults(response.data);
            setLoading(false);

        } catch (err) {
            console.error('Erreur recherche:', err);
            setError(err.response?.data?.message || 'Erreur lors de la recherche');
            setLoading(false);
        }
    };

    const handleSelectTrip = (trip) => {
        // Naviguer vers le TripBuilder avec le voyage sélectionné
        navigate('/trip-builder', { state: { selectedTrip: trip } });
    };

    const formatDuration = (duration) => {
        return duration || 'N/A';
    };

    const formatPrice = (price) => {
        return `${price.toFixed(2)}€`;
    };

    return (
        <div className="search-engine-container">
            <div className="search-header">
                <h1>🔍 Recherche de voyage multimodal</h1>
                <p>Trouvez votre itinéraire combinant avion, train et bus</p>
            </div>

            {/* Formulaire de recherche */}
            <form className="search-form" onSubmit={handleSearch}>
                <div className="search-row">
                    <div className="search-field">
                        <label htmlFor="departure">📍 Départ</label>
                        <input
                            type="text"
                            id="departure"
                            name="departure"
                            value={searchParams.departure}
                            onChange={handleInputChange}
                            placeholder="Paris, Lyon, Marseille..."
                            required
                        />
                    </div>

                    <div className="search-field">
                        <label htmlFor="destination">🎯 Destination</label>
                        <input
                            type="text"
                            id="destination"
                            name="destination"
                            value={searchParams.destination}
                            onChange={handleInputChange}
                            placeholder="Barcelone, Madrid, Rome..."
                            required
                        />
                    </div>

                    <div className="search-field">
                        <label htmlFor="date">📅 Date</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={searchParams.date}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>

                <div className="search-row">
                    <div className="search-field">
                        <label htmlFor="max_price">💰 Prix maximum</label>
                        <input
                            type="number"
                            id="max_price"
                            name="max_price"
                            value={searchParams.max_price}
                            onChange={handleInputChange}
                            min="0"
                            step="10"
                        />
                    </div>

                    <div className="search-field">
                        <label htmlFor="max_transfers">🔄 Correspondances max</label>
                        <select
                            id="max_transfers"
                            name="max_transfers"
                            value={searchParams.max_transfers}
                            onChange={handleInputChange}
                        >
                            <option value="0">Direct uniquement</option>
                            <option value="1">1 correspondance</option>
                            <option value="2">2 correspondances</option>
                        </select>
                    </div>

                    <div className="search-field checkbox-field">
                        <label>
                            <input
                                type="checkbox"
                                name="pmr_required"
                                checked={searchParams.pmr_required}
                                onChange={handleInputChange}
                            />
                            ♿ Accessibilité PMR requise
                        </label>
                    </div>
                </div>

                <button type="submit" className="search-button" disabled={loading}>
                    {loading ? '🔄 Recherche en cours...' : '🚀 Rechercher'}
                </button>
            </form>

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            {/* Résultats */}
            {results && (
                <div className="search-results">
                    <div className="results-header">
                        <h2>✨ {results.results.total} itinéraire(s) trouvé(s)</h2>
                        <div className="results-stats">
                            <span>📍 {results.results.direct} direct(s)</span>
                            <span>🔄 {results.results.with_transfers} avec correspondance(s)</span>
                        </div>
                    </div>

                    {results.trips.length === 0 ? (
                        <div className="no-results">
                            <p>Aucun itinéraire trouvé avec ces critères.</p>
                            <p>Essayez de modifier vos paramètres de recherche.</p>
                        </div>
                    ) : (
                        <div className="trips-list">
                            {results.trips.map((trip, index) => (
                                <div key={index} className={`trip-card ${trip.pmr_compatible ? 'pmr-compatible' : ''}`}>
                                    <div className="trip-header">
                                        <div className="trip-type">
                                            {trip.type === 'direct' ? '🎯 Trajet direct' : `🔄 ${trip.number_of_transfers} correspondance(s)`}
                                        </div>
                                        {trip.pmr_compatible && (
                                            <span className="pmr-badge">♿ PMR</span>
                                        )}
                                    </div>

                                    <div className="trip-segments">
                                        {trip.segments.map((segment, idx) => (
                                            <div key={idx} className="segment">
                                                <div className="segment-icon">
                                                    {segment.type === 'avion' && '✈️'}
                                                    {segment.type === 'train' && '🚄'}
                                                    {segment.type === 'taxi' && '🚕'}
                                                </div>
                                                <div className="segment-info">
                                                    <div className="segment-route">
                                                        <strong>{segment.departure}</strong>
                                                        <span className="arrow">→</span>
                                                        <strong>{segment.arrival}</strong>
                                                    </div>
                                                    <div className="segment-details">
                                                        <span>{segment.company}</span>
                                                        {segment.train_type && <span>• {segment.train_type}</span>}
                                                        <span>• {segment.duration}</span>
                                                        <span>• {formatPrice(segment.price)}</span>
                                                    </div>
                                                    <div className="segment-times">
                                                        <span>🕐 {new Date(segment.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span>→</span>
                                                        <span>🕐 {new Date(segment.arrival_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {trip.transfer_info && (
                                        <div className="transfer-info">
                                            🔄 Correspondance à <strong>{trip.transfer_info.city}</strong> ({trip.transfer_info.duration})
                                        </div>
                                    )}

                                    <div className="trip-footer">
                                        <div className="trip-summary">
                                            <span className="total-duration">⏱️ {trip.total_duration}</span>
                                            <span className="total-price">💰 {formatPrice(trip.total_price)}</span>
                                        </div>
                                        <button
                                            className="select-trip-button"
                                            onClick={() => handleSelectTrip(trip)}
                                        >
                                            Sélectionner →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchEngine;
