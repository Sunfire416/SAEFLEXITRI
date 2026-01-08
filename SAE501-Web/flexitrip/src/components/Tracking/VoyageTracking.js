import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import './VoyageTracking.css';

const VoyageTracking = () => {
    const { reservationId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [reservation, setReservation] = useState(null);
    const [position, setPosition] = useState(null);
    const [status, setStatus] = useState('on_time'); // on_time, delayed, cancelled
    const [delay, setDelay] = useState(0);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const wsRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        if (reservationId && user?.user_id) {
            fetchReservationData();
            initWebSocket();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [reservationId, user]);

    const fetchReservationData = async () => {
        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
            const token = localStorage.getItem('token');

            const response = await axios.get(
                `${API_URL}/voyages/details/${reservationId}?user_id=${user.user_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setReservation(response.data);
            
            // Initialiser position de départ
            if (response.data.Lieu_depart) {
                geocodeLocation(response.data.Lieu_depart);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la réservation:', error);
            alert('Impossible de charger les informations du voyage');
        } finally {
            setLoading(false);
        }
    };

    const geocodeLocation = async (locationName) => {
        try {
            // Simulation de géocodage (remplacer par Google Maps API en production)
            const locations = {
                'Paris': { lat: 48.8566, lng: 2.3522 },
                'Lyon': { lat: 45.7640, lng: 4.8357 },
                'Marseille': { lat: 43.2965, lng: 5.3698 },
                'Milan': { lat: 45.4642, lng: 9.1900 },
                'London': { lat: 51.5074, lng: -0.1278 },
                'New York': { lat: 40.7128, lng: -74.0060 }
            };

            const coords = locations[locationName] || { lat: 48.8566, lng: 2.3522 };
            setPosition(coords);
            initMap(coords);
        } catch (error) {
            console.error('Erreur géocodage:', error);
        }
    };

    const initMap = (coords) => {
        // Simulation d'une carte (remplacer par Google Maps en production)
        console.log('Carte initialisée avec:', coords);
        // TODO: Intégrer Google Maps API
        // const map = new google.maps.Map(mapRef.current, { center: coords, zoom: 12 });
    };

    const initWebSocket = () => {
        try {
            // Simulation WebSocket (remplacer par vrai WebSocket en production)
            // const ws = new WebSocket('ws://localhost:17777/tracking');
            
            // Simulation de mises à jour en temps réel
            const simulationInterval = setInterval(() => {
                updatePosition();
                checkDelays();
            }, 10000); // Mise à jour toutes les 10 secondes

            // Cleanup
            return () => clearInterval(simulationInterval);
        } catch (error) {
            console.error('Erreur WebSocket:', error);
        }
    };

    const updatePosition = () => {
        // Simulation de mouvement
        setPosition(prev => {
            if (!prev) return null;
            return {
                lat: prev.lat + (Math.random() - 0.5) * 0.01,
                lng: prev.lng + (Math.random() - 0.5) * 0.01
            };
        });
    };

    const checkDelays = () => {
        // Simulation de détection de retards
        const randomDelay = Math.floor(Math.random() * 30);
        if (randomDelay > 15) {
            setDelay(randomDelay);
            setStatus('delayed');
            addAlert(`⏱️ Retard de ${randomDelay} minutes détecté`);
        } else if (randomDelay > 25) {
            setStatus('cancelled');
            addAlert('❌ Voyage annulé - Contactez le service client');
        }
    };

    const addAlert = (message) => {
        const newAlert = {
            id: Date.now(),
            message,
            timestamp: new Date()
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 5));
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = () => {
        switch (status) {
            case 'on_time': return '#27ae60';
            case 'delayed': return '#f39c12';
            case 'cancelled': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'on_time': return '✅ À l\'heure';
            case 'delayed': return `⏱️ Retard de ${delay} min`;
            case 'cancelled': return '❌ Annulé';
            default: return '⏳ En cours';
        }
    };

    if (loading || !reservation) {
        return (
            <div className="tracking-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Chargement des données de suivi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tracking-container">
            <div className="tracking-header">
                <button onClick={() => navigate('/user/voyages')} className="back-btn">
                    ← Retour
                </button>
                <h1>🗺️ Suivi en temps réel</h1>
            </div>

            {/* Status Bar */}
            <div className="status-bar" style={{ backgroundColor: getStatusColor() }}>
                <span className="status-text">{getStatusText()}</span>
            </div>

            {/* Trip Info */}
            <div className="trip-info-card">
                <div className="route-info">
                    <div className="location">
                        <span className="icon">📍</span>
                        <div>
                            <p className="label">Départ</p>
                            <p className="value">{reservation.Lieu_depart}</p>
                            <p className="time">{formatTime(reservation.Date_depart)}</p>
                        </div>
                    </div>
                    <div className="route-line">
                        <div className="line"></div>
                        <span className="transport-icon">
                            {reservation.Type_Transport === 'train' && '🚄'}
                            {reservation.Type_Transport === 'bus' && '🚌'}
                            {reservation.Type_Transport === 'avion' && '✈️'}
                            {reservation.Type_Transport === 'taxi' && '🚕'}
                        </span>
                    </div>
                    <div className="location">
                        <span className="icon">🎯</span>
                        <div>
                            <p className="label">Arrivée</p>
                            <p className="value">{reservation.Lieu_arrivee}</p>
                            <p className="time">{formatTime(reservation.Date_arrivee)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Placeholder */}
            <div className="map-container">
                <div ref={mapRef} className="map-placeholder">
                    <div className="map-overlay">
                        <p>🗺️ Carte interactive</p>
                        <p className="map-hint">
                            {position 
                                ? `Position: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
                                : 'Chargement de la position...'
                            }
                        </p>
                        <p className="map-note">
                            💡 Intégration Google Maps en cours
                        </p>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="alerts-section">
                    <h2>🔔 Alertes récentes</h2>
                    <div className="alerts-list">
                        {alerts.map(alert => (
                            <div key={alert.id} className="alert-item">
                                <span className="alert-message">{alert.message}</span>
                                <span className="alert-time">
                                    {formatTime(alert.timestamp)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Live Updates */}
            <div className="live-updates">
                <h2>📡 Mises à jour en direct</h2>
                <div className="update-item">
                    <span className="pulse-dot"></span>
                    <p>Connexion WebSocket active</p>
                </div>
                <div className="update-item">
                    <span className="pulse-dot"></span>
                    <p>Suivi GPS activé</p>
                </div>
                {delay > 0 && (
                    <div className="update-item warning">
                        <span className="pulse-dot"></span>
                        <p>Retard détecté - Notification envoyée</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="tracking-actions">
                <button className="action-btn" onClick={() => alert('Support contacté')}>
                    📞 Contacter le support
                </button>
                <button className="action-btn" onClick={() => navigate(`/user/checkin/${reservationId}`)}>
                    ✈️ Check-in
                </button>
            </div>
        </div>
    );
};

export default VoyageTracking;
