import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Button,
  Avatar,
  Divider,
  Stack,
  Grid,
  useTheme,
  Tooltip,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  QrCode2 as QrIcon,
  Accessible as AccessibleIcon,
  DeleteOutline as DeleteIcon,
  Luggage as LuggageIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Navigation as NavigationIcon,
  CheckCircle as SuccessIcon,
  Cancel as CancelIcon,
  AirplanemodeActive as AirplaneIcon,
  InfoOutlined as InfoIcon,
  ChatBubbleOutline as ChatIcon
} from '@mui/icons-material';

const VoyageCard = ({ voyage, bagagesByReservationId = {}, onOpenQR, onCancelCheckin, onDeleteVoyage }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const getStatusInfo = (status) => {
    const statuses = {
      pending: { label: 'À venir', color: 'warning', icon: <ScheduleIcon fontSize="small" /> },
      en_cours: { label: 'En cours', color: 'primary', icon: <NavigationIcon fontSize="small" /> },
      confirmed: { label: 'Confirmé', color: 'success', icon: <SuccessIcon fontSize="small" /> },
      completed: { label: 'Terminé', color: 'success', icon: <SuccessIcon fontSize="small" /> },
      cancelled: { label: 'Annulé', color: 'error', icon: <CancelIcon fontSize="small" /> }
    };
    return statuses[status] || statuses.pending;
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTransportIcon = (type) => {
    const icons = {
      train: '🚄', avion: '✈️', bus: '🚌', taxi: '🚕', tram: '🚊', metro: '🚇', walking: '🚶', WALKING: '🚶'
    };
    return icons[type] || '🚆';
  };

  const statusInfo = getStatusInfo(voyage.status);
  const hasReservations = voyage.reservations && voyage.reservations.length > 0;

  const reservationIds = hasReservations ? voyage.reservations.map(r => String(r.reservation_id)) : [];
  const bagageCount = reservationIds.reduce((sum, id) => sum + ((bagagesByReservationId[id] || []).length), 0);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 5,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        bgcolor: 'white',
        transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { boxShadow: '0 12px 32px rgba(0,0,0,0.06)', borderColor: 'primary.light' }
      }}
    >
      <Box sx={{ p: { xs: 2.5, md: 4 } }}>
        {/* Top Row: Status & Price */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Chip
            icon={statusInfo.icon}
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
            sx={{ fontWeight: 800, px: 1, height: 28 }}
          />
          <Typography variant="h4" color="primary.dark" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
            {voyage.prix_total ? `${voyage.prix_total}€` : '--€'}
          </Typography>
        </Box>

        {/* Middle Row: Route Journey */}
        <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(46, 179, 120, 0.1)', color: 'primary.main', width: 48, height: 48 }}>
                <LocationIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Départ</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 0.5 }}>{voyage.depart}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{formatDate(voyage.date_debut)}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={2} sx={{ textAlign: 'center', py: { xs: 2, md: 0 } }}>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Divider sx={{ width: '100%', borderColor: 'primary.light', borderStyle: 'dashed', borderWidth: 1 }} />
              <AirplaneIcon sx={{
                position: 'absolute',
                color: 'primary.main',
                bgcolor: 'white',
                p: 0.5,
                fontSize: 28,
                transform: 'rotate(90deg)'
              }} />
            </Box>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 700, color: 'text.secondary' }}>
              {voyage.etapes?.length || 0} étape(s)
            </Typography>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, justifyContent: { md: 'flex-end' } }}>
              <Box sx={{ textAlign: { md: 'right' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Arrivée</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 0.5 }}>{voyage.arrivee}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{formatDate(voyage.date_fin)}</Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(91, 188, 234, 0.1)', color: 'secondary.main', width: 48, height: 48 }}>
                <LocationIcon />
              </Avatar>
            </Box>
          </Grid>
        </Grid>

        {/* Bottom Row: Info Tags */}
        <Stack direction="row" spacing={2} sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
          {(voyage.booking_reference || (voyage.reservations && voyage.reservations[0]?.booking_reference)) && (
            <Chip
              label={`Ref: ${voyage.booking_reference || voyage.reservations[0].booking_reference}`}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700, borderRadius: 1.5, bgcolor: '#f8fafc' }}
            />
          )}
          {bagageCount > 0 && (
            <Chip
              icon={<LuggageIcon sx={{ fontSize: '1rem !important' }} />}
              label={`${bagageCount} bagage(s)`}
              size="small"
              sx={{ fontWeight: 700, borderRadius: 1.5, bgcolor: '#f0f9ff', color: '#0369a1' }}
            />
          )}
          {voyage.reservations?.some(r => r.assistance_PMR === 'Oui') && (
            <Chip
              icon={<AccessibleIcon sx={{ fontSize: '1rem !important' }} />}
              label="Assistance PMR"
              size="small"
              sx={{ fontWeight: 700, borderRadius: 1.5, bgcolor: '#fff7ed', color: '#c2410c' }}
            />
          )}
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Actions Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" spacing={1.5}>
            <Button
              startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setExpanded(!expanded)}
              variant="text"
              sx={{ fontWeight: 800, textTransform: 'none', color: 'text.primary' }}
            >
              {expanded ? 'Masquer' : 'Détails du trajet'}
            </Button>
            <Button
              startIcon={<QrIcon />}
              onClick={() => onOpenQR(voyage)}
              disabled={voyage.status === 'cancelled'}
              variant="contained"
              color="secondary"
              sx={{ borderRadius: 2.5, px: 3, fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}
            >
              Accéder aux QR
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            {voyage.reservations?.some(r => r.assistance_PMR === 'Oui') && (
              <Tooltip title="Suivre mes étapes PMR">
                <IconButton
                  color="warning"
                  sx={{ bgcolor: '#fff7ed', '&:hover': { bgcolor: '#ffedd5' } }}
                  onClick={() => {
                    const resaId = voyage.reservations.find(r => r.assistance_PMR === 'Oui')?.reservation_id;
                    window.location.href = `/suivi-prise-en-charge/${resaId}`;
                  }}
                >
                  <AccessibleIcon />
                </IconButton>
              </Tooltip>
            )}
            {voyage.status !== 'cancelled' && voyage.status !== 'completed' && (
              <Tooltip title="Supprimer ce voyage">
                <IconButton
                  color="error"
                  sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                  onClick={() => onDeleteVoyage(voyage.id_voyage)}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Detailed Section */}
      <Collapse in={expanded}>
        <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <NavigationIcon color="primary" fontSize="small" /> Itinéraire détaillé
          </Typography>

          <Stack spacing={0} sx={{ position: 'relative', pl: 4 }}>
            {/* Vertical line connector */}
            <Box sx={{ position: 'absolute', left: 14, top: 20, bottom: 20, width: 2, bgcolor: 'primary.light', opacity: 0.3 }} />

            {voyage.etapes?.map((etape, idx) => (
              <Box key={idx} sx={{ position: 'relative', mb: idx === voyage.etapes.length - 1 ? 0 : 4 }}>
                {/* Icon marker */}
                <Box sx={{
                  position: 'absolute', left: -34, top: 0,
                  width: 28, height: 28,
                  borderRadius: '50%', bgcolor: 'white',
                  border: '2px solid', borderColor: 'primary.main',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 1, fontSize: '1rem'
                }}>
                  {getTransportIcon(etape.type || etape.vehicle_type)}
                </Box>

                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" fontWeight={800} color="primary.dark">
                      {etape.line ? `Ligne ${etape.line}` : (etape.compagnie || etape.type || 'Transport')}
                    </Typography>
                    {etape.duration_minutes && (
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', bgcolor: '#f1f5f9', px: 1, borderRadius: 1 }}>
                        ⏱️ {etape.duration_minutes} min
                      </Typography>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <strong>{formatTime(etape.departure_time)}</strong> {etape.departure_station || etape.adresse_1}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span" sx={{ opacity: 0.5 }}>→</Typography>
                        <strong>{formatTime(etape.arrival_time)}</strong> {etape.arrival_station || etape.adresse_2}
                      </Typography>
                    </Grid>
                  </Grid>

                  {etape.accessible === false && (
                    <Alert severity="warning" sx={{ mt: 2, py: 0, borderRadius: 2, '& .MuiAlert-message': { fontWeight: 600, fontSize: '0.75rem' } }}>
                      Accessibilité limitée sur ce segment
                    </Alert>
                  )}
                </Paper>
              </Box>
            ))}
          </Stack>

          <Typography variant="h6" sx={{ mt: 5, mb: 3, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <InfoIcon color="primary" fontSize="small" /> Réservations associées
          </Typography>

          <Stack spacing={2}>
            {voyage.reservations?.map((resa, idx) => (
              <Paper key={idx} variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={800}>N° {resa.num_reza}</Typography>
                  <Chip label={resa.ticket_status} size="small" variant="outlined" sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
                </Box>

                {resa.boarding_pass && (
                  <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="primary.dark" fontWeight={600}>
                      🎫 Porte <strong>{resa.boarding_pass.gate}</strong> • Siège <strong>{resa.boarding_pass.seat}</strong>
                    </Typography>
                    <Button size="small" color="error" onClick={() => onCancelCheckin(resa.reservation_id)} sx={{ fontWeight: 700, textTransform: 'none' }}>Annuler check-in</Button>
                  </Box>
                )}

                {/* Bagages for this resa */}
                {bagagesByReservationId[String(resa.reservation_id)]?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>TRAÇABILITÉ BAGAGES ({bagagesByReservationId[String(resa.reservation_id)].length})</Typography>
                    <Stack spacing={1}>
                      {bagagesByReservationId[String(resa.reservation_id)].map(b => (
                        <Box key={b.bagage_id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 1.5 }}>
                          <Typography variant="caption" fontWeight={600}>#{b.bagage_id} - {b.bagage_type}</Typography>
                          <Button
                            size="small"
                            sx={{ fontSize: '0.65rem', fontWeight: 800 }}
                            onClick={() => window.location.href = `/user/baggage-tracking/${b.bagage_id}`}
                          >Suivre</Button>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            ))}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default VoyageCard;
