import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  Avatar,
  IconButton,
  FormControlLabel,
  Checkbox,
  TextField,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Chat as ChatIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

const SuiviPriseEnCharge = () => {
  const theme = useTheme();
  const { reservationId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [prisesEnCharge, setPrisesEnCharge] = useState([]);
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPrisesEnCharge();

    // Auto-refresh toutes les 10 secondes si activé
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchPrisesEnCharge(true); // silent refresh
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [reservationId, autoRefresh]);

  const fetchPrisesEnCharge = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/prise-en-charge/reservation/${reservationId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.success) {
        setPrisesEnCharge(response.data.prises_en_charge || []);
        setReservation(response.data.reservation || null);
      }
    } catch (err) {
      console.error('❌ Erreur fetch:', err);
      if (!silent) {
        setError(err.response?.data?.error || 'Erreur lors du chargement');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'validated': return { label: 'Validée', color: 'success', icon: <CheckCircleIcon /> };
      case 'pending': return { label: 'En attente', color: 'warning', icon: <InfoIcon /> };
      case 'cancelled': return { label: 'Annulée', color: 'error', icon: <InfoIcon /> };
      default: return { label: status, color: 'default', icon: <InfoIcon /> };
    }
  };

  const copyLink = (url, etape) => {
    navigator.clipboard.writeText(url);
    alert(`✅ Lien copié pour l'étape ${etape} !`);
  };

  const openChat = (etapeNumero) => {
    if (!reservationId || !etapeNumero) return;
    navigate(`/chat/reservation/${reservationId}/etape/${etapeNumero}`);
  };

  const validatedCount = prisesEnCharge.filter(p => p.status === 'validated').length;
  const progressPercentage = prisesEnCharge.length > 0
    ? (validatedCount / prisesEnCharge.length) * 100
    : 0;

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography color="textSecondary" variant="h6">Chargement du suivi...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }} action={
          <Button color="inherit" size="small" onClick={() => navigate('/user/voyages')}>Retour</Button>
        }>
          <Typography variant="h6">Erreur</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f1f5f9' }, boxShadow: theme.shadows[1], mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>Suivi Prise en Charge</Typography>
          </Box>
          <FormControlLabel
            control={<Checkbox checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} color="primary" />}
            label="Auto-refresh (10s)"
            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.9rem', color: 'text.secondary', fontWeight: 500 } }}
          />
        </Box>

        {reservation && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 4,
              background: 'linear-gradient(135deg, #2eb378 0%, #5bbcea 100%)',
              color: 'white',
              borderRadius: 4,
              boxShadow: '0 8px 24px rgba(46, 179, 120, 0.2)'
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, color: 'white', fontWeight: 700 }}>📋 Réservation #{reservationId}</Typography>
            <Stack spacing={1}>
              <Typography variant="body1" sx={{ opacity: 0.95 }}><strong>Trajet :</strong> {reservation.lieu_depart} → {reservation.lieu_arrivee}</Typography>
              <Typography variant="body1" sx={{ opacity: 0.95 }}><strong>Date :</strong> {new Date(reservation.date_depart).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Typography>
            </Stack>
          </Paper>
        )}

        {/* Progress Section */}
        <Paper elevation={0} sx={{ p: 3, mb: 6, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={800} color="text.primary">{validatedCount} / {prisesEnCharge.length} étapes validées</Typography>
            <Typography variant="h5" fontWeight={900} color="primary.main">{progressPercentage.toFixed(0)}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 14,
              borderRadius: 7,
              bgcolor: '#f1f5f9',
              '& .MuiLinearProgress-bar': {
                borderRadius: 7,
                backgroundImage: 'linear-gradient(90deg, #2eb378 0%, #5bbcea 100%)'
              }
            }}
          />
        </Paper>

        {prisesEnCharge.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '1px dashed #cbd5e0', bgcolor: 'transparent' }}>
            <InfoIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
            <Typography color="textSecondary" variant="h6">Aucune prise en charge trouvée pour cette réservation.</Typography>
          </Paper>
        ) : (
          <Box sx={{ position: 'relative', pl: { xs: 2, md: 4 } }}>
            {/* Vertical Line for Timeline */}
            <Box sx={{ position: 'absolute', left: { xs: 22, md: 38 }, top: 20, bottom: 20, width: 4, bgcolor: '#f1f5f9', borderRadius: 2, zIndex: 0 }} />

            <Stack spacing={4}>
              {prisesEnCharge.map((pec, index) => {
                const status = getStatusInfo(pec.status);
                return (
                  <Box key={pec.id} sx={{ display: 'flex', gap: { xs: 2, md: 4 }, position: 'relative', zIndex: 1 }}>
                    {/* Step Marker */}
                    <Avatar sx={{
                      bgcolor: pec.status === 'validated' ? 'success.main' : pec.status === 'pending' ? 'warning.main' : 'error.main',
                      width: { xs: 40, md: 50 },
                      height: { xs: 40, md: 50 },
                      fontWeight: 900,
                      fontSize: '1.25rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      border: '4px solid white'
                    }}>
                      {pec.etape_numero}
                    </Avatar>

                    {/* Content Card */}
                    <Paper elevation={0} sx={{
                      flex: 1,
                      p: { xs: 2.5, md: 3.5 },
                      borderRadius: 4,
                      border: '1px solid #e2e8f0',
                      borderLeft: `8px solid ${theme.palette[status.color].main}`,
                      bgcolor: 'white',
                      '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.08)', transform: 'translateX(4px)' },
                      transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {pec.segment?.mode?.toUpperCase() || 'TRANSPORT'} {pec.segment?.line && ` - Ligne ${pec.segment.line}`}
                        </Typography>
                        <Chip icon={status.icon} label={status.label} color={status.color} size="small" sx={{ fontWeight: 700, px: 1 }} />
                      </Box>

                      <Stack spacing={2} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <LocationIcon sx={{ color: 'primary.main', mt: 0.3 }} fontSize="small" />
                          <Typography variant="body1"><strong>Lieu :</strong> {pec.location}</Typography>
                        </Box>
                        {pec.segment?.operator && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <BusinessIcon sx={{ color: 'secondary.main', mt: 0.3 }} fontSize="small" />
                            <Typography variant="body1"><strong>Opérateur :</strong> {pec.segment.operator}</Typography>
                          </Box>
                        )}
                      </Stack>

                      {pec.status === 'pending' && (
                        <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, border: '2px dashed #cbd5e0' }}>
                          <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 850, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>🔗 Lien de validation pour le personnel :</Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField
                              size="small"
                              fullWidth
                              value={pec.validation_url}
                              variant="outlined"
                              InputProps={{
                                readOnly: true,
                                sx: { bgcolor: 'white', fontSize: '0.85rem', fontFamily: 'monospace', borderRadius: 2 }
                              }}
                            />
                            <Button
                              variant="contained"
                              color="warning"
                              startIcon={<CopyIcon />}
                              onClick={() => copyLink(pec.validation_url, pec.etape_numero)}
                              sx={{ borderRadius: 2, whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 700 }}
                            >Copier le lien</Button>
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, fontStyle: 'italic', color: 'text.secondary' }}>Présentez ce lien à l'agent de transport pour qu'il valide votre passage.</Typography>
                        </Box>
                      )}

                      {pec.status === 'validated' && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f0fdf4', borderColor: '#bcf0da', borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>✅ Prise en charge effectuée</Typography>
                            <Typography variant="caption" color="text.secondary">Validée le {new Date(pec.validated_at).toLocaleString('fr-FR')}</Typography>
                            {pec.validated_by && <Typography variant="caption" color="text.secondary">Par : <strong>{pec.validated_by}</strong></Typography>}
                          </Paper>
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            startIcon={<ChatIcon />}
                            onClick={() => openChat(pec.etape_numero)}
                            sx={{ py: 1.2, borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}
                          >
                            Ouvrir le chat d'étape
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                )
              })}
            </Stack>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 8, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            startIcon={<RefreshIcon />}
            onClick={() => fetchPrisesEnCharge()}
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 700 }}
          >Actualiser</Button>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<HistoryIcon />}
            onClick={() => navigate('/user/voyages')}
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 700 }}
          >Mes Voyages</Button>
        </Box>
      </Container>
    </Box>
  );
};

export default SuiviPriseEnCharge;

