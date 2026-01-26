import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Divider,
  Stack,
  Avatar,
  TextField,
  useTheme,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Person as PersonIcon,
  ConfirmationNumber as TicketIcon,
  SupportAgent as AgentIcon,
  QrCode as QrIcon,
  Phone as PhoneIcon,
  Accessible as AccessibleIcon
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

const PriseEnChargeValidation = () => {
  const theme = useTheme();
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [priseEnCharge, setPriseEnCharge] = useState(null);
  const [error, setError] = useState(null);
  const [agentQrPublicId, setAgentQrPublicId] = useState('');
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    fetchPriseEnCharge();
  }, [token]);

  const fetchPriseEnCharge = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/prise-en-charge/${token}`);

      if (response.data.success) {
        setPriseEnCharge(response.data.prise_en_charge);
        if (response.data.prise_en_charge.status === 'validated') {
          setValidated(true);
        }
      }
    } catch (err) {
      console.error('❌ Erreur fetch:', err);
      setError(err.response?.data?.error || 'Prise en charge introuvable ou expirée');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!agentQrPublicId.trim()) return;

    try {
      setValidating(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/prise-en-charge/${token}/validate`,
        { agent_qr_public_id: agentQrPublicId.trim() }
      );

      if (response.data.success) {
        setValidated(true);
        await fetchPriseEnCharge();
      }
    } catch (err) {
      console.error('❌ Erreur validation:', err);
      alert(`❌ ${err.response?.data?.error || 'Erreur lors de la validation'}`);
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography color="textSecondary" variant="h6">Chargement du dossier...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }} action={
          <Button color="inherit" size="small" onClick={() => navigate('/')}>ACCUEIL</Button>
        }>
          <Typography variant="h6">Dossier introuvable</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 4, md: 10 } }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{
          p: { xs: 3, md: 6 },
          borderRadius: 6,
          border: '1px solid #e2e8f0',
          bgcolor: 'white',
          boxShadow: '0 20px 40px rgba(0,0,0,0.03)'
        }}>
          {/* Header */}
          <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, fontWeight: 900 }}>Prise en Charge PMR</Typography>
              <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 600 }}>Dossier sécurisé #{token.substring(0, 8).toUpperCase()}</Typography>
            </Box>
            <Chip
              label={validated ? 'STATUT: VALIDÉE' : 'STATUT: EN ATTENTE'}
              color={validated ? 'success' : 'warning'}
              variant="filled"
              sx={{ fontWeight: 800, px: 1.5, height: 36, fontSize: '0.85rem' }}
            />
          </Box>

          <Grid container spacing={4}>
            {/* Passenger Info */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', border: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 2 }}>
                    👤 Passager PMR
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>{priseEnCharge.user.surname} {priseEnCharge.user.name}</Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <AccessibleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2">{priseEnCharge.user.type_handicap || 'Assistance générale'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2">{priseEnCharge.user.phone || 'Contact non renseigné'}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Transport Info */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', border: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'secondary.main', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 2 }}>
                    🎫 Réservation & Trajet
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>#{priseEnCharge.reservation.num_reza}</Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <TicketIcon fontSize="small" sx={{ color: 'secondary.main', mt: 0.3 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{priseEnCharge.segment?.mode || 'Transport'}</Typography>
                        {priseEnCharge.segment?.line && <Typography variant="caption" color="textSecondary">Ligne {priseEnCharge.segment.line}</Typography>}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <QrIcon fontSize="small" sx={{ color: 'secondary.main', mt: 0.3 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>PEC Étape #{priseEnCharge.etape_numero}</Typography>
                        <Typography variant="caption" color="textSecondary">{priseEnCharge.location}</Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Main Validation Action */}
            <Grid item xs={12}>
              <Divider sx={{ my: 4 }} />

              {validated ? (
                <Box sx={{
                  p: { xs: 3, md: 5 },
                  bgcolor: '#f0fdf4',
                  borderRadius: 5,
                  border: '2px solid #bcf0da',
                  textAlign: 'center',
                  animation: 'fadeIn 0.5s ease-out'
                }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 72, height: 72, mx: 'auto', mb: 3, boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)' }}>
                    <SuccessIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h3" gutterBottom sx={{ fontWeight: 900 }}>Prise en charge effectuée</Typography>
                  <Typography variant="body1" color="textSecondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
                    Validée avec succès le {new Date(priseEnCharge.validated_at).toLocaleString('fr-FR')}
                  </Typography>
                  <Paper variant="outlined" sx={{ display: 'inline-flex', alignItems: 'center', px: 3, py: 1.5, borderRadius: 3, bgcolor: 'white', gap: 1.5 }}>
                    <AgentIcon color="success" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Validé par : {priseEnCharge.validated_by}</Typography>
                  </Paper>
                </Box>
              ) : (
                <Paper elevation={0} sx={{
                  p: { xs: 3, md: 5 },
                  bgcolor: '#f1f5f9',
                  borderRadius: 5,
                  border: '1px solid #e2e8f0'
                }}>
                  <Box component="form" onSubmit={handleValidate}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>Confirmer la prise en charge</Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                      Pour valider légalement cet accompagnement, veuillez copier le contenu du QR Code Agent ou le code d'identification fourni.
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Code Agent / QR Public ID"
                          placeholder="Ex: AGENT-QR-12345"
                          value={agentQrPublicId}
                          onChange={(e) => setAgentQrPublicId(e.target.value)}
                          variant="outlined"
                          disabled={validating}
                          required
                          sx={{
                            bgcolor: 'white',
                            '& .MuiOutlinedInput-root': { borderRadius: 3 },
                            '& .MuiInputLabel-root': { fontWeight: 700 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          size="large"
                          disabled={validating || !agentQrPublicId.trim()}
                          sx={{
                            py: 2,
                            borderRadius: 3,
                            fontWeight: 900,
                            fontSize: '1.1rem',
                            boxShadow: '0 8px 24px rgba(46, 179, 120, 0.2)'
                          }}
                        >
                          {validating ? <CircularProgress size={28} color="inherit" /> : 'VALIDER MAINTENANT'}
                        </Button>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <SuccessIcon sx={{ color: 'text.disabled', mt: 0.2 }} fontSize="small" />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Cette action est irréversible et notifie instantanément le passager que vous avez débuté l'accompagnement.
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>

          {priseEnCharge.agent && (
            <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'secondary.light', boxShadow: theme.shadows[1] }}>
                <AgentIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Agent Coordinateur</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{priseEnCharge.agent.surname} {priseEnCharge.agent.name}</Typography>
                <Typography variant="body2" color="textSecondary">{priseEnCharge.agent.entreprise}</Typography>
              </Box>
            </Box>
          )}
        </Paper>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
            © FlexiTrip - Système Sécurisé de Prise en Charge PMR (SAE501)
          </Typography>
        </Box>

        <style>
          {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}
        </style>
      </Container>
    </Box>
  );
};

export default PriseEnChargeValidation;
