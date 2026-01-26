import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
    Box,
    Container,
    Paper,
    Alert,
    Button,
    Typography,
    Grid,
    Chip,
    Divider,
    Avatar,
    useTheme,
    Card,
    CardContent,
    Stack,
    TextField,
    CircularProgress
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    History as HistoryIcon,
    Search as SearchIcon,
    Print as PrintIcon,
    Info as InfoIcon,
    Accessible as AccessibleIcon,
    Fingerprint as FingerprintIcon,
    AirplaneTicket as TicketIcon,
    Payments as PaymentsIcon,
    Timeline as TimelineIcon,
    Navigation as NavigationIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const BookingResult = () => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { booking } = location.state || {};

    const [effectiveBooking, setEffectiveBooking] = useState(booking || null);
    const [demoMode, setDemoMode] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fallback: si aucune réservation passée via la navigation, charger le mock JSON
        if (!effectiveBooking) {
            setLoading(true);
            import('../data/mock/booking.json')
                .then((mod) => {
                    if (mod?.default?.booking) {
                        setEffectiveBooking(mod.default.booking);
                        setDemoMode(true);
                    }
                })
                .catch(() => {
                    // ignore, on affichera l'écran d'erreur standard
                })
                .finally(() => setLoading(false));
        }
    }, [effectiveBooking]);

    if (!effectiveBooking) {
        if (loading) {
            return (
                <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                    <Stack spacing={3} alignItems="center">
                        <CircularProgress size={60} />
                        <Typography variant="h5" color="textSecondary">Chargement des données...</Typography>
                    </Stack>
                </Box >
            );
        }
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, maxWidth: 500 }}>
                    <Typography variant="h2" color="error" gutterBottom sx={{ fontSize: '2.5rem' }}>❌ Aucune réservation</Typography>
                    <Typography color="textSecondary" sx={{ mb: 4 }}>Retournez à la recherche pour créer une réservation</Typography>
                    <Button variant="contained" size="large" onClick={() => navigate('/user/search')}>Retour à la recherche</Button>
                </Paper>
            </Box>
        );
    }

    const { workflow_type, booking: bookingData, payment, timeline, total_price, remaining_balance, itinerary } = effectiveBooking;

    const formatTime = (isoDate) => {
        if (!isoDate) return 'N/A';
        return new Date(isoDate).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Paris'
        });
    };

    const getTransportIcon = (mode) => {
        const icons = {
            train: '🚆',
            bus: '🚌',
            flight: '✈️',
            avion: '✈️',
            metro: '🚇',
            tram: '🚊',
            walk: '🚶',
            taxi: '🚕'
        };
        return icons[mode] || '🚗';
    };

    const getWorkflowColor = (type) => {
        const colors = {
            'MINIMAL': '#22c55e',
            'LIGHT': '#3b82f6',
            'MODERATE': '#f59e0b',
            'FULL': '#ef4444'
        };
        return colors[type] || theme.palette.primary.main;
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
            <Container maxWidth="md">
                {demoMode && (
                    <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
                        ⚠️ MODE DÉMO: données locales affichées
                    </Alert>
                )}

                {/* Success Header */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 4, md: 6 },
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #2eb378 0%, #5bbcea 100%)',
                        color: 'white',
                        borderRadius: 4,
                        mb: 4,
                        boxShadow: '0 8px 32px rgba(46, 179, 120, 0.25)'
                    }}
                >
                    <CheckCircleIcon sx={{ fontSize: 80, mb: 2, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }} />
                    <Typography variant="h1" sx={{ color: 'white', mb: 1, fontSize: { xs: '2rem', md: '2.5rem' } }}>Réservation Confirmée !</Typography>
                    <Typography variant="h5" sx={{ opacity: 0.95, fontWeight: 400 }}>Votre voyage a été réservé avec succès</Typography>
                </Paper>

                {/* Workflow Badge */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                    <Chip
                        label={`Workflow ${workflow_type}`}
                        sx={{
                            bgcolor: getWorkflowColor(workflow_type),
                            color: 'white',
                            fontWeight: 800,
                            px: 2.5,
                            height: 44,
                            fontSize: '1.1rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            letterSpacing: 0.5
                        }}
                    />
                </Box>

                {/* Main Info Card */}
                <Card sx={{ borderRadius: 4, mb: 4, border: '1px solid #e2e8f0' }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                            <Typography variant="h3">📋 Détails du voyage</Typography>
                            <Chip
                                label={`Resa #${bookingData.reservation_id || bookingData.voyage_id}`}
                                color="secondary"
                                variant="outlined"
                                sx={{ fontWeight: 700, borderRadius: 2 }}
                            />
                        </Box>

                        <Grid container spacing={2} sx={{ mb: 4 }}>
                            {[
                                { label: '📍 Référence', value: bookingData.booking_reference, icon: <TicketIcon fontSize="small" color="primary" /> },
                                { label: '🏢 Opérateur', value: bookingData.operator, icon: <NavigationIcon fontSize="small" color="primary" /> },
                                { label: '💰 Prix Total', value: `${total_price?.toFixed(2)}€`, icon: <PaymentsIcon fontSize="small" color="primary" /> },
                                { label: '💳 Solde restant', value: `${remaining_balance?.toFixed(2)}€`, icon: <PaymentsIcon fontSize="small" color="primary" /> }
                            ].map((item, idx) => (
                                <Grid item xs={12} sm={6} key={idx}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb', display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ p: 1, bgcolor: 'white', borderRadius: 1.5, display: 'flex', boxShadow: theme.shadows[1] }}>{item.icon}</Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</Typography>
                                            <Typography variant="body1" fontWeight={700} color="text.primary">{item.value}</Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Components PMR, Biometric, etc. */}
                        <Stack spacing={2}>
                            {bookingData.assistance && (
                                <Paper sx={{ p: 3, bgcolor: '#f0f9ff', borderRadius: 3, borderLeft: '6px solid #3b82f6' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                        <AccessibleIcon color="primary" />
                                        <Typography variant="h4" color="#1e40af">Assistance PMR</Typography>
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={4}>
                                            <Typography variant="caption" color="text.secondary">Agent affecté</Typography>
                                            <Typography variant="body1" fontWeight={600}>{bookingData.assistance.agent_name}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={8}>
                                            <Typography variant="caption" color="text.secondary">Point de rencontre</Typography>
                                            <Typography variant="body1" fontWeight={600}>{bookingData.assistance.meeting_point}</Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            )}

                            {bookingData.biometric && (
                                <Paper sx={{ p: 3, bgcolor: '#fdf2f8', borderRadius: 3, borderLeft: '6px solid #db2777' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                        <FingerprintIcon sx={{ color: '#db2777' }} />
                                        <Typography variant="h4" sx={{ color: '#9d174d' }}>Vérification biométrique</Typography>
                                    </Box>
                                    <Typography variant="body2">✅ Enrôlement réussi • Confiance: <strong>{(bookingData.biometric.confidence * 100).toFixed(1)}%</strong></Typography>
                                </Paper>
                            )}

                            {bookingData.prise_en_charge && Array.isArray(bookingData.prise_en_charge) && bookingData.prise_en_charge.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <InfoIcon color="primary" /> Prise en Charge PMR
                                    </Typography>
                                    <Stack spacing={2}>
                                        {bookingData.prise_en_charge.map((pec) => (
                                            <Paper key={pec.id} variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: '#fbbf24', bgcolor: '#fffbeb' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h6" fontWeight={700}>Étape {pec.etape_numero} • {pec.mode?.toUpperCase()}</Typography>
                                                    <Chip
                                                        label={pec.status === 'pending' ? 'En attente' : pec.status === 'validated' ? 'Validée' : 'Annulée'}
                                                        color={pec.status === 'pending' ? 'warning' : pec.status === 'validated' ? 'success' : 'error'}
                                                        size="small"
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    <strong>Lieu:</strong> {pec.location} {pec.line && `• Ligne: ${pec.line}`}
                                                </Typography>

                                                {pec.status === 'pending' && (
                                                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px dashed #fbbf24' }}>
                                                        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#92400e', fontWeight: 600 }}>Lien de validation pour le personnel :</Typography>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <TextField size="small" fullWidth value={pec.validation_url} InputProps={{ readOnly: true, sx: { bgcolor: '#f9fafb', fontSize: '0.8rem', fontFamily: 'monospace' } }} />
                                                            <Button
                                                                variant="contained"
                                                                color="warning"
                                                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(pec.validation_url);
                                                                    alert('Lien copié !');
                                                                }}
                                                            >Copier</Button>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Paper>
                                        ))}
                                    </Stack>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => navigate(`/suivi-prise-en-charge/${bookingData.reservation_id}`)}
                                        sx={{ mt: 2, py: 1.5, borderRadius: 3 }}
                                    >📊 Suivre toutes les prises en charge</Button>
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {/* QR Code Card */}
                {bookingData.qr_code && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 4, md: 6 },
                            borderRadius: 4,
                            textAlign: 'center',
                            mb: 4,
                            border: '3px solid',
                            borderColor: 'secondary.main',
                            bgcolor: 'white'
                        }}
                    >
                        <Typography variant="h2" gutterBottom>📱 Votre QR Code</Typography>
                        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>Présentez ce code lors de votre voyage pour valider vos accès</Typography>

                        <Box sx={{ display: 'inline-block', p: 3, bgcolor: 'white', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 4 }}>
                            <QRCodeSVG
                                value={bookingData.qr_code.qr_url || bookingData.qr_code.qr_data}
                                size={220}
                                level="H"
                                includeMargin={true}
                            />
                        </Box>

                        <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 3, maxWidth: 400, mx: 'auto', border: '1px solid #e2e8f0' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700, textTransform: 'uppercase' }}>Code de validation manuel</Typography>
                            <Typography variant="h2" sx={{ letterSpacing: 6, fontFamily: 'monospace', color: 'primary.dark' }}>{bookingData.qr_code.display_code}</Typography>
                        </Box>
                    </Paper>
                )}

                {/* Itinerary Timeline */}
                {itinerary && itinerary.segments && (
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="h3" sx={{ mb: 4, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            <NavigationIcon color="primary" /> Votre Itinéraire Détaillé
                        </Typography>
                        <Box sx={{ position: 'relative', pl: 4 }}>
                            {itinerary.segments.map((segment, idx) => (
                                <Box key={idx} sx={{ position: 'relative', mb: 4 }}>
                                    {/* Line connector */}
                                    {idx < itinerary.segments.length - 1 && (
                                        <Box sx={{ position: 'absolute', left: -26, top: 40, bottom: -20, width: 4, bgcolor: 'secondary.light', opacity: 0.3, borderRadius: 2 }} />
                                    )}

                                    {/* Icon Marker */}
                                    <Avatar
                                        sx={{
                                            position: 'absolute',
                                            left: -48,
                                            top: 0,
                                            bgcolor: 'white',
                                            color: 'text.primary',
                                            border: '3px solid',
                                            borderColor: 'secondary.main',
                                            width: 48,
                                            height: 48,
                                            zIndex: 2,
                                            fontSize: '1.5rem'
                                        }}
                                    >
                                        {getTransportIcon(segment.mode)}
                                    </Avatar>

                                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="h6" fontWeight={800} color="primary.dark">{(segment.mode || '').toUpperCase()}</Typography>
                                                {segment.operator && <Typography variant="caption" color="textSecondary">{segment.operator}</Typography>}
                                            </Box>
                                            <Chip label={`${segment.duration || '?'} min`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                        </Box>

                                        <Stack spacing={2.5}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: 'primary.main', ring: '4px solid rgba(46, 179, 120, 0.1)' }} />
                                                <Box>
                                                    <Typography variant="body1" fontWeight={700}>{segment.departure_station || segment.from}</Typography>
                                                    {segment.departure_time && <Typography variant="caption" color="text.secondary">{formatTime(segment.departure_time)}</Typography>}
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: 'secondary.main' }} />
                                                <Box>
                                                    <Typography variant="body1" fontWeight={700}>{segment.arrival_station || segment.to}</Typography>
                                                    {segment.arrival_time && <Typography variant="caption" color="text.secondary">{formatTime(segment.arrival_time)}</Typography>}
                                                </Box>
                                            </Box>
                                        </Stack>

                                        {segment.accessible === false && (
                                            <Alert severity="warning" sx={{ mt: 2, py: 0, borderRadius: 2 }}>Accessibilité limitée</Alert>
                                        )}
                                    </Paper>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Final Actions */}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<HistoryIcon />}
                            onClick={() => navigate('/user/voyages')}
                            sx={{ py: 2, borderRadius: 3, fontSize: '1.1rem' }}
                        >
                            Voir mes voyages
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<SearchIcon />}
                            onClick={() => navigate('/user/search')}
                            sx={{ py: 2, borderRadius: 3, fontSize: '1.1rem' }}
                        >
                            Nouvelle recherche
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="text"
                            fullWidth
                            startIcon={<PrintIcon />}
                            onClick={() => window.print()}
                            sx={{ color: 'text.secondary' }}
                        >
                            Imprimer ma confirmation
                        </Button>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default BookingResult;

