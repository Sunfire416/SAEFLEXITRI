import React, { useState } from 'react';
import axios from 'axios';
import WebcamCapture from '../shared/WebcamCapture';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Stack,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  useTheme,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
  Chip
} from '@mui/material';
import {
  QrCodeScanner as QrIcon,
  Face as FaceIcon,
  CheckCircle as SuccessIcon,
  Refresh as ResetIcon,
  Print as PrintIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Computer as KioskIcon,
  SupportAgent as AgentIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

const CheckInKiosk = () => {
  const theme = useTheme();
  const [mode, setMode] = useState('kiosk'); // 'kiosk' ou 'agent'
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Données
  const [qrData, setQrData] = useState('');
  const [livePhoto, setLivePhoto] = useState(null);
  const [location, setLocation] = useState('');

  // Résultat
  const [checkInResult, setCheckInResult] = useState(null);

  const steps = ['Identification', 'Biométrie', 'Confirmation'];

  const handleQRScan = (e) => {
    setQrData(e.target.value);
  };

  const handleQRFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulation du contenu d'un QR code
    const mockQRData = JSON.stringify({
      type: 'ENROLLMENT',
      id: 'ENR-DEMO-' + Math.floor(Math.random() * 10000),
      user_id: 4,
      reservation_id: 3,
      identity: {
        nom: 'DUPONT',
        prenom: 'JEAN',
        dob: '1985-05-15'
      },
      issued_at: new Date().toISOString()
    });

    setQrData(mockQRData);
    if (location) setActiveStep(1);
  };

  const handlePhotoCapture = (imageBase64) => {
    setLivePhoto(imageBase64);
  };

  const handleCheckIn = async () => {
    if (!qrData || !livePhoto || !location) {
      setError('Tous les champs sont requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let checkinData;

      if (qrData.startsWith('{')) {
        // C'est un QR JSON
        checkinData = {
          qr_data: qrData,
          live_photo: livePhoto,
          location: location,
          checkin_type: mode
        };
      } else {
        // C'est un booking_reference simple, chercher d'abord la réservation
        const searchResponse = await axios.get(`${API_BASE_URL}/checkin/search-reservation`, {
          params: { booking_reference: qrData }
        });

        if (!searchResponse.data.success || !searchResponse.data.reservation) {
          throw new Error('Réservation introuvable avec ce code');
        }

        const reservation = searchResponse.data.reservation;
        checkinData = {
          user_id: reservation.user_id,
          reservation_id: reservation.reservation_id,
          live_photo: livePhoto,
          location: location,
          checkin_type: mode
        };
      }

      const response = await axios.post(
        `${API_BASE_URL}/checkin/scan`,
        checkinData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setCheckInResult(response.data);
      setActiveStep(2);

    } catch (err) {
      console.error('❌ Erreur check-in:', err);
      setError(err.response?.data?.error || 'Erreur lors du traitement de votre check-in');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setActiveStep(0);
    setQrData('');
    setLivePhoto(null);
    setCheckInResult(null);
    setError(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{
          p: { xs: 3, md: 6 },
          borderRadius: 6,
          border: '1px solid #e2e8f0',
          bgcolor: 'white',
          boxShadow: '0 10px 40px rgba(0,0,0,0.03)'
        }}>
          {/* Header */}
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, fontWeight: 900 }}>Check-In Libre Service</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4, fontSize: '1.1rem' }}>Identifiez-vous pour obtenir votre boarding pass</Typography>

            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(e, v) => v && setMode(v)}
              sx={{ bgcolor: '#f1f5f9', p: 0.5, borderRadius: 3 }}
            >
              <ToggleButton value="kiosk" sx={{ px: 4, py: 1.2, borderRadius: '10px !important', textTransform: 'none', fontWeight: 800, gap: 1 }}>
                <KioskIcon fontSize="small" /> Kiosk
              </ToggleButton>
              <ToggleButton value="agent" sx={{ px: 4, py: 1.2, borderRadius: '10px !important', textTransform: 'none', fontWeight: 800, gap: 1 }}>
                <AgentIcon fontSize="small" /> Agent
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 8, '& .MuiStepLabel-label': { fontWeight: 700 } }}>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {/* Content Switcher */}
          <Box sx={{ minHeight: 400 }}>
            {activeStep === 0 && (
              <Box component="div" sx={{ animation: 'fadeIn 0.5s ease-out' }}>
                <Typography variant="h3" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 800 }}>
                  <QrIcon color="primary" sx={{ fontSize: 32 }} /> Scanner votre QR Code
                </Typography>

                <Stack spacing={4}>
                  <FormControl fullWidth>
                    <InputLabel>Lieu d'enregistrement</InputLabel>
                    <Select
                      value={location}
                      label="Lieu d'enregistrement"
                      onChange={(e) => setLocation(e.target.value)}
                      sx={{ borderRadius: 3 }}
                    >
                      <MenuItem value="Gare Lyon Part-Dieu">Gare Lyon Part-Dieu</MenuItem>
                      <MenuItem value="Gare Paris Montparnasse">Gare Paris Montparnasse</MenuItem>
                      <MenuItem value="CDG Terminal 2E">CDG Terminal 2E</MenuItem>
                      <MenuItem value="Orly Terminal 3">Orly Terminal 3</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Référence de réservation ou QR JSON"
                    multiline rows={4} fullWidth
                    value={qrData} onChange={handleQRScan}
                    placeholder='Entrez votre code de réservation (ex: FR-123) ou scannez le QR code de votre voyage'
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />

                  <Paper variant="outlined" sx={{ p: 4, border: '2px dashed #cbd5e0', borderRadius: 4, textAlign: 'center', bgcolor: '#f8fafc' }}>
                    <Button variant="contained" component="label" startIcon={<UploadIcon />} sx={{ borderRadius: 2, textTransform: 'none', px: 4 }}>
                      Simuler un scan de fichier
                      <input type="file" hidden accept="image/*" onChange={handleQRFileUpload} />
                    </Button>
                    <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>Format accepté: PNG, JPG, JPEG</Typography>
                  </Paper>
                </Stack>

                <Box sx={{ mt: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained" size="large" endIcon={<NextIcon />}
                    disabled={!qrData || !location}
                    onClick={() => setActiveStep(1)}
                    sx={{ px: 6, py: 2, borderRadius: 4, fontWeight: 800, fontSize: '1.1rem', boxShadow: theme.shadows[4] }}
                  >Étape suivante</Button>
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box component="div" sx={{ animation: 'fadeIn 0.5s ease-out' }}>
                <Typography variant="h3" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 800 }}>
                  <FaceIcon color="primary" sx={{ fontSize: 32 }} /> Enrôlement Biométrique
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 5 }}>Positionnez votre visage face à la caméra. Vos données resteront cryptées sur la blockchain.</Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
                  {!livePhoto ? (
                    <Paper elevation={4} sx={{ p: 2, borderRadius: 6, bgcolor: '#000', overflow: 'hidden', width: '100%', maxWidth: 540, aspectRatio: '4/3', position: 'relative' }}>
                      <WebcamCapture mode="photo" label="Capturer mon identité" onCapture={handlePhotoCapture} />
                    </Paper>
                  ) : (
                    <Box sx={{ position: 'relative', width: '100%', maxWidth: 540 }}>
                      <Box component="img" src={livePhoto} sx={{ width: '100%', borderRadius: 6, boxShadow: theme.shadows[15], border: '4px solid white' }} />
                      <IconButton
                        onClick={() => setLivePhoto(null)}
                        sx={{
                          position: 'absolute', top: 20, right: 20,
                          bgcolor: 'white', '&:hover': { bgcolor: '#f1f5f9' },
                          boxShadow: theme.shadows[4]
                        }}
                      ><ResetIcon /></IconButton>
                      <Box sx={{ position: 'absolute', bottom: -15, left: '50%', transform: 'translateX(-50%)' }}>
                        <Chip label="Photo capturée ✅" color="success" sx={{ fontWeight: 800, px: 2, height: 32 }} />
                      </Box>
                    </Box>
                  )}
                </Box>

                {error && <Alert severity="error" variant="filled" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}

                <Box sx={{ mt: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button startIcon={<BackIcon />} onClick={() => setActiveStep(0)} sx={{ fontWeight: 700, borderRadius: 2 }}>Retour à l'identification</Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {mode === 'agent' && (
                      <Button variant="outlined" color="warning" onClick={handleCheckIn} sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}>Override Manuel</Button>
                    )}
                    <Button
                      variant="contained" size="large"
                      disabled={!livePhoto || loading}
                      onClick={handleCheckIn}
                      sx={{ px: 6, py: 2, borderRadius: 4, fontWeight: 800, fontSize: '1.1rem' }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Finaliser le Check-in'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {activeStep === 2 && checkInResult && (
              <Box component="div" sx={{ textAlign: 'center', animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                <Avatar sx={{ bgcolor: 'success.main', width: 100, height: 100, mx: 'auto', mb: 3, boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)' }}>
                  <SuccessIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <Typography variant="h2" gutterBottom sx={{ fontWeight: 900 }}>Check-in validé avec succès !</Typography>
                <Typography color="textSecondary" sx={{ mb: 8, fontSize: '1.2rem' }}>Bon voyage avec FlexiTrip, {checkInResult.passenger?.prenom}.</Typography>

                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: 4, height: '100%', textAlign: 'left', border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                      <CardContent sx={{ p: 4 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Passager Vérifié</Typography>
                        <Typography variant="h3" sx={{ mt: 1, mb: 3, fontWeight: 800 }}>{checkInResult.passenger?.nom} {checkInResult.passenger?.prenom}</Typography>

                        <Stack spacing={1.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <SuccessIcon color="success" fontSize="small" />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Biométrie confirmée ({(checkInResult.verification?.face_match_score || 99).toFixed(0)}%)</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <SuccessIcon color="success" fontSize="small" />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Liveness verified ✅</Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{
                      borderRadius: 4,
                      height: '100%',
                      background: 'linear-gradient(135deg, #2eb378 0%, #15803d 100%)',
                      color: 'white',
                      textAlign: 'left',
                      boxShadow: '0 12px 24px rgba(46, 179, 120, 0.25)'
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Carte d'Accès</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>ID: {checkInResult.boarding_pass?.pass_id}</Typography>
                        </Box>
                        <Typography variant="h2" sx={{ color: 'white', mb: 4, fontSize: '2.5rem', fontFamily: 'monospace' }}>
                          {checkInResult.boarding_pass?.flight_train || checkInResult.boarding_pass?.flight_train_number}
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>PORTE</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>{checkInResult.boarding_pass?.gate || 'TBA'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>SIÈGE</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>{checkInResult.boarding_pass?.seat || 'Any'}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {checkInResult.boarding_pass?.pmr_assistance && (
                  <Alert severity="warning" variant="filled" sx={{ mt: 5, borderRadius: 4, py: 2, fontWeight: 900, fontSize: '1.1rem', boxShadow: theme.shadows[4] }}>
                    ♿ ASSISTANCE PMR REQUISE - PRIORITÉ D'EMBARQUEMENT
                  </Alert>
                )}

                <Divider sx={{ my: 8 }} />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<ResetIcon />}
                    onClick={reset}
                    sx={{ borderRadius: 3, py: 2, px: 4, fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                  >Nouveau Check-in</Button>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PrintIcon />}
                    color="primary"
                    onClick={() => window.print()}
                    sx={{ borderRadius: 3, py: 2, px: 6, fontWeight: 800, boxShadow: theme.shadows[4] }}
                  >Imprimer Boarding Pass</Button>
                </Stack>
              </Box>
            )}
          </Box>
        </Paper>

        <style>
          {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}
        </style>
      </Container>
    </Box>
  );
};

export default CheckInKiosk;