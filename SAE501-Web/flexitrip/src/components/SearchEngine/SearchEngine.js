import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Container, TextField, Button, Alert, FormControlLabel, Checkbox, Select, MenuItem, InputLabel, FormControl, Card, CardContent, Typography, Grid, Chip } from '@mui/material';
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
    const [demoMode, setDemoMode] = useState(false);

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
        setDemoMode(false);

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
                `${API_BASE_URL}/search/multimodal?${params.toString()}`,
                { timeout: 3000 }  // Timeout court pour démo
            );

            setResults(response.data);
            setLoading(false);

        } catch (err) {
            console.warn('⚠️ API indisponible, chargement données démo locale...', err);
            
            // Fallback : charger mock data local
            try {
                const mockData = await import('../../data/mock/reservations.json');
                setResults(mockData.default.results);
                setDemoMode(true);
                setLoading(false);
            } catch (mockError) {
                console.error('Erreur chargement données démo:', mockError);
                setError('Erreur : impossible de charger les données');
                setLoading(false);
            }
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
        <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', py: 4 }}>
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h3">🔍 Recherche de voyage multimodal</Typography>
                    <Typography variant="body1" color="text.secondary">
                        Trouvez votre itinéraire combinant avion, train et bus
                    </Typography>
                </Box>

                {/* Badge MODE DÉMO */}
                {demoMode && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        ⚠️ MODE DÉMO - Données locales chargées
                    </Alert>
                )}

                {/* Formulaire de recherche */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="📍 Départ"
                                        name="departure"
                                        value={searchParams.departure}
                                        onChange={handleInputChange}
                                        placeholder="Paris, Lyon, Marseille..."
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="🎯 Destination"
                                        name="destination"
                                        value={searchParams.destination}
                                        onChange={handleInputChange}
                                        placeholder="Barcelone, Madrid, Rome..."
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="📅 Date"
                                        name="date"
                                        value={searchParams.date}
                                        onChange={handleInputChange}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ min: new Date().toISOString().split('T')[0] }}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="💰 Prix maximum"
                                        name="max_price"
                                        value={searchParams.max_price}
                                        onChange={handleInputChange}
                                        inputProps={{ min: 0, step: 10 }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>🔄 Correspondances max</InputLabel>
                                        <Select
                                            label="🔄 Correspondances max"
                                            name="max_transfers"
                                            value={searchParams.max_transfers}
                                            onChange={handleInputChange}
                                        >
                                            <MenuItem value={0}>Direct uniquement</MenuItem>
                                            <MenuItem value={1}>1 correspondance</MenuItem>
                                            <MenuItem value={2}>2 correspondances</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="pmr_required"
                                                checked={searchParams.pmr_required}
                                                onChange={handleInputChange}
                                            />
                                        }
                                        label="♿ Accessibilité PMR requise"
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ textAlign: 'right' }}>
                                <Button type="submit" variant="contained" disabled={loading}>
                                    {loading ? '🔄 Recherche en cours...' : '🚀 Rechercher'}
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        ❌ {error}
                    </Alert>
                )}

                {/* Résultats */}
                {results && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5">✨ {results.results.total} itinéraire(s) trouvé(s)</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Chip label={`📍 ${results.results.direct} direct(s)`} />
                                <Chip label={`🔄 ${results.results.with_transfers} correspondance(s)`} />
                            </Box>
                        </Box>

                        {results.trips.length === 0 ? (
                            <Alert severity="info">Aucun itinéraire trouvé avec ces critères. Essayez de modifier vos paramètres de recherche.</Alert>
                        ) : (
                            <Grid container spacing={2}>
                                {results.trips.map((trip, index) => (
                                    <Grid item xs={12} key={index}>
                                        <Card sx={{ borderRadius: 2 }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="subtitle1">
                                                        {trip.type === 'direct' ? '🎯 Trajet direct' : `🔄 ${trip.number_of_transfers} correspondance(s)`}
                                                    </Typography>
                                                    {trip.pmr_compatible && (
                                                        <Chip label="♿ PMR" color="success" size="small" />
                                                    )}
                                                </Box>

                                                <Box sx={{ mt: 2 }}>
                                                    {trip.segments.map((segment, idx) => (
                                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, borderBottom: idx < trip.segments.length - 1 ? '1px solid' : 'none', borderColor: 'grey.200' }}>
                                                            <Box sx={{ width: 28 }}>
                                                                {segment.type === 'avion' && '✈️'}
                                                                {segment.type === 'train' && '🚄'}
                                                                {segment.type === 'taxi' && '🚕'}
                                                            </Box>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography variant="body1" fontWeight={600}>{segment.departure}</Typography>
                                                                    <Typography variant="body2" color="text.secondary">→</Typography>
                                                                    <Typography variant="body1" fontWeight={600}>{segment.arrival}</Typography>
                                                                </Box>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {segment.company} {segment.train_type ? `• ${segment.train_type}` : ''} • {segment.duration} • {formatPrice(segment.price)}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    🕐 {new Date(segment.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} → 🕐 {new Date(segment.arrival_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </Box>

                                                {trip.transfer_info && (
                                                    <Alert severity="info" sx={{ mt: 2 }}>
                                                        🔄 Correspondance à <strong>{trip.transfer_info.city}</strong> ({trip.transfer_info.duration})
                                                    </Alert>
                                                )}

                                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <Chip label={`⏱️ ${trip.total_duration}`} />
                                                        <Chip label={`💰 ${formatPrice(trip.total_price)}`} />
                                                    </Box>
                                                    <Button variant="contained" color="primary" onClick={() => handleSelectTrip(trip)}>
                                                        Sélectionner →
                                                    </Button>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}
            </Container>
        </Box>
    );
}

export default SearchEngine;
