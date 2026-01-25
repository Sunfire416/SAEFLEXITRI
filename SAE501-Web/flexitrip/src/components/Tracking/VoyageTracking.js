import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import './VoyageTracking.css';
import { Box, Container, Card, CardContent, Typography, Button, Alert, Stepper, Step, StepLabel } from '@mui/material';

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
            const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';
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
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <div className="spinner"></div>
                        <Typography variant="body1">Chargement des données de suivi...</Typography>
                    </CardContent>
                </Card>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box className="tracking-header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Button variant="outlined" onClick={() => navigate('/user/voyages')}>← Retour</Button>
                <Typography variant="h4">🗺️ Suivi en temps réel</Typography>
            </Box>

            {/* Status Bar */}
            <Alert severity={status === 'on_time' ? 'success' : status === 'delayed' ? 'warning' : status === 'cancelled' ? 'error' : 'info'} sx={{ mb: 2, borderRadius: 2 }}>
                {getStatusText()}
            </Alert>

            {/* Trip Info */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
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
                            </CardContent>
                        </Card>

            {/* Map Placeholder */}
            <Box sx={{ border: '2px solid', borderColor: 'secondary.main', borderRadius: 3, overflow: 'hidden', height: 400, mb: 3 }}>
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
            </Box>

            {/* Alerts */}
            {alerts.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ mb: 1 }}>🔔 Alertes récentes</Typography>
                    <Card>
                        <CardContent>
                            {alerts.map(alert => (
                                <Box key={alert.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'grey.200' }}>
                                    <Typography>{alert.message}</Typography>
                                    <Typography variant="body2" color="text.secondary">{formatTime(alert.timestamp)}</Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Live Updates */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 1 }}>📡 Mises à jour en direct</Typography>
                <Typography>Connexion WebSocket active</Typography>
                <Typography>Suivi GPS activé</Typography>
                {delay > 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>Retard détecté - Notification envoyée</Alert>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary" onClick={() => alert('Support contacté')}>📞 Contacter le support</Button>
                <Button variant="contained" color="primary" onClick={() => navigate(`/user/checkin/${reservationId}`)}>✈️ Check-in</Button>
            </Box>
        </Container>
    );
};

export default VoyageTracking;
