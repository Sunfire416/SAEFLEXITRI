import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../../context/AuthContext';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider
} from '@mui/material';
import {
  ConfirmationNumber as TicketIcon,
  Refresh as RefreshIcon,
  FlightTakeoff as FlightIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon,
  Accessible as AccessibleIcon,
  PriorityHigh as PriorityIcon
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

const BoardingPassList = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [boardingPasses, setBoardingPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBoardingPasses();
  }, [user]);

  const fetchBoardingPasses = async () => {
    if (!user?.user_id) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const voyagesResponse = await axios.get(
        `${API_BASE_URL}/api/voyages/history`,
        {
          params: { user_id: user.user_id }
        }
      );

      if (!voyagesResponse.data.success) {
        throw new Error('Erreur récupération voyages');
      }

      const reservations = voyagesResponse.data.voyages.flatMap(
        voyage => voyage.reservations || []
      );

      const boardingPassPromises = reservations.map(async (reservation) => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/boarding/pass/${reservation.reservation_id}`
          );
          return response.data.success ? response.data.boarding_pass : null;
        } catch (err) {
          if (err.response?.status === 404) {
            return null;
          }
          throw err;
        }
      });

      const passes = await Promise.all(boardingPassPromises);
      const validPasses = passes.filter(pass => pass !== null);

      setBoardingPasses(validPasses);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur fetch boarding passes:', err);
      setError('Erreur lors du chargement des boarding passes');
    } finally {
      setLoading(false);
    }
  };

  const generateQRData = (boardingPass) => {
    return JSON.stringify({
      type: 'BOARDING_PASS',
      pass_id: boardingPass.pass_id,
      reservation_id: boardingPass.reservation_id,
      user_id: boardingPass.user_id,
      flight_train: boardingPass.flight_train_number,
      gate: boardingPass.gate,
      seat: boardingPass.seat,
      boarding_time: boardingPass.boarding_time,
      issued_at: boardingPass.issued_at
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'issued':
        return { icon: <CheckIcon />, label: 'Émis', color: 'success' };
      case 'boarded':
        return { icon: <FlightIcon />, label: 'Embarqué', color: 'primary' };
      case 'cancelled':
        return { icon: <CancelIcon />, label: 'Annulé', color: 'error' };
      case 'expired':
        return { icon: <TimerIcon />, label: 'Expiré', color: 'warning' };
      default:
        return { icon: <TicketIcon />, label: status, color: 'default' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="textSecondary">Chargement de vos boarding passes...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 6 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, gap: 2 }}>
          <TicketIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h1">Mes Boarding Passes</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }} action={
            <Button color="inherit" size="small" onClick={fetchBoardingPasses} startIcon={<RefreshIcon />}>Réessayer</Button>
          }>
            {error}
          </Alert>
        )}

        {boardingPasses.length === 0 ? (
          <Paper elevation={0} sx={{ p: { xs: 4, md: 8 }, textAlign: 'center', borderRadius: 4 }}>
            <TicketIcon sx={{ fontSize: 100, color: 'text.disabled', mb: 3, opacity: 0.2 }} />
            <Typography variant="h2" color="textSecondary" gutterBottom>Aucun boarding pass</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Vous n'avez pas encore de boarding pass émis. Effectuez un check-in pour obtenir votre boarding pass.
            </Typography>
            <Button variant="contained" href="/user/voyages" sx={{ borderRadius: 3 }}>
              Voir mes voyages
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={4}>
            {boardingPasses.map((pass) => {
              const statusInfo = getStatusInfo(pass.status);
              return (
                <Grid item xs={12} md={6} key={pass.pass_id}>
                  <Card elevation={0} sx={{
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                    '&:hover': { boxShadow: theme.shadows[4] },
                    transition: '0.3s'
                  }}>
                    <CardHeader
                      sx={{
                        bgcolor: pass.status === 'boarded' ? 'primary.main' : 'secondary.main',
                        color: 'white',
                        py: 2
                      }}
                      avatar={
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                          {statusInfo.icon}
                        </Avatar>
                      }
                      title={<Typography variant="h4" color="white" sx={{ fontSize: '1.25rem' }}>{statusInfo.label}</Typography>}
                      action={
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, mr: 2, mt: 1, display: 'block' }}>
                          PASS #{pass.pass_id}
                        </Typography>
                      }
                    />
                    <CardContent sx={{ p: 4 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={7}>
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Vol / Train</Typography>
                            <Typography variant="h2" sx={{ fontSize: '2rem', fontFamily: 'monospace', mt: 0.5, color: 'primary.dark' }}>{pass.flight_train_number}</Typography>
                          </Box>

                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Porte</Typography>
                              <Typography variant="h5" fontWeight={600}>{pass.gate || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Place</Typography>
                              <Typography variant="h5" fontWeight={600}>{pass.seat || 'N/A'}</Typography>
                            </Grid>
                          </Grid>

                          <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Embarquement</Typography>
                            <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                              {formatDate(pass.boarding_time)} à {formatTime(pass.boarding_time)}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {pass.pmr_assistance && (
                              <Chip
                                icon={<AccessibleIcon fontSize="small" />}
                                label="Assistance PMR"
                                color="primary"
                                variant="outlined"
                                size="small"
                                sx={{ fontWeight: 600, px: 1 }}
                              />
                            )}
                            {pass.pmr_priority && (
                              <Chip
                                icon={<PriorityIcon fontSize="small" />}
                                label="Priorité"
                                color="warning"
                                variant="outlined"
                                size="small"
                                sx={{ fontWeight: 600, px: 1 }}
                              />
                            )}
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={5} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: '#f8fafc',
                              borderRadius: 4,
                              border: '2px dashed #cbd5e0',
                              textAlign: 'center',
                              width: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center'
                            }}
                          >
                            <Box sx={{ p: 1, bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', mb: 2 }}>
                              <QRCodeSVG
                                value={generateQRData(pass)}
                                size={150}
                                level="H"
                                includeMargin={false}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.2 }}>
                              Scannez ce code ou utilisez le Pass ID <strong>{pass.pass_id}</strong>
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 3.5 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontWeight: 600 }}>Émis le</Typography>
                          <Typography variant="body2" fontWeight={500} color="textPrimary">{formatDate(pass.issued_at)} à {formatTime(pass.issued_at)}</Typography>
                        </Box>
                        {pass.boarded_at && (
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'success.main' }}>Embarqué</Typography>
                            <Typography variant="body2" fontWeight={600} color="success.dark">{formatDate(pass.boarded_at)} à {formatTime(pass.boarded_at)}</Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default BoardingPassList;

