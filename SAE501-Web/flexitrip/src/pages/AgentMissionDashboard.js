import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  Navigation as NavIcon,
} from '@mui/icons-material';

const AgentMissionDashboard = () => {
  const [missions] = useState([
    {
      id: 'mission-demo-1',
      pmr_name: 'Pauline Dupont',
      pmr_phone: '+33 6 12 34 56 78',
      journey: 'Paris Gare Lyon → Marseille Airport',
      current_leg: 2,
      total_legs: 3,
      status: 'IN_PROGRESS',
      pickup_time: '11:00',
      eta_station: '14:00',
      segment: 'BUS - Lyon → Marseille'
    },
    {
      id: 'mission-demo-2',
      pmr_name: 'Jean Martin',
      pmr_phone: '+33 6 87 65 43 21',
      journey: 'Paris → Nice',
      current_leg: 1,
      total_legs: 2,
      status: 'AWAITING_PICKUP',
      pickup_time: '08:00',
      eta_station: '10:00',
      segment: 'TRAIN - Paris → Lyon'
    }
  ]);

  const [selectedMission, setSelectedMission] = useState(missions[0]);
  const [boarded, setBoarded] = useState(false);

  const handleBoard = () => {
    setBoarded(true);
    setTimeout(() => {
      alert(`✅ ${selectedMission.pmr_name} embarqué(e) avec succès !`);
      setBoarded(false);
    }, 1000);
  };

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Typography variant="h3" gutterBottom sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          Mes Missions (Aujourd'hui)
        </Typography>

        <Grid container spacing={3}>
          {/* Colonne gauche : Liste missions */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {missions.map(mission => (
                <Card
                  key={mission.id}
                  onClick={() => setSelectedMission(mission)}
                  sx={{
                    cursor: 'pointer',
                    border: 2,
                    borderColor: selectedMission?.id === mission.id ? 'primary.main' : 'transparent',
                    backgroundColor: selectedMission?.id === mission.id ? 'primary.50' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.light',
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h5" fontWeight={600}>
                        {mission.pmr_name}
                      </Typography>
                      <Chip
                        label={mission.status === 'IN_PROGRESS' ? '🔄 En cours' : '⏳ En attente'}
                        color={mission.status === 'IN_PROGRESS' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NavIcon fontSize="small" />
                        {mission.journey}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🚆 {mission.segment}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon fontSize="small" />
                        {mission.pickup_time} → {mission.eta_station}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        📊 Étape {mission.current_leg}/{mission.total_legs}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>

          {/* Colonne droite : Détail mission */}
          <Grid item xs={12} md={7}>
            {selectedMission && (
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h4" gutterBottom>
                    {selectedMission.pmr_name}
                  </Typography>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography fontWeight={600}>📍 Trajet :</Typography>
                      <Typography>{selectedMission.journey}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography fontWeight={600}>🚆 Segment actuel :</Typography>
                      <Typography>{selectedMission.segment}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography fontWeight={600}>📊 Étape :</Typography>
                      <Typography>{selectedMission.current_leg}/{selectedMission.total_legs}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <PhoneIcon fontSize="small" />
                      <Typography fontWeight={600}>Téléphone :</Typography>
                      <Typography>{selectedMission.pmr_phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <ScheduleIcon fontSize="small" />
                      <Typography fontWeight={600}>Départ :</Typography>
                      <Typography>{selectedMission.pickup_time}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography fontWeight={600}>🎯 Arrivée prévue :</Typography>
                      <Typography>{selectedMission.eta_station}</Typography>
                    </Box>
                  </Box>

                  {/* QR Code */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      backgroundColor: 'grey.50',
                      borderRadius: 2,
                      textAlign: 'center',
                      mb: 3
                    }}
                  >
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      📱 QR Code Mission
                    </Typography>
                    <Box sx={{ 
                      display: 'inline-block', 
                      p: 2, 
                      backgroundColor: 'white',
                      borderRadius: 2,
                      border: 3,
                      borderColor: 'secondary.main'
                    }}>
                      <QRCodeSVG
                        value={JSON.stringify({
                          mission_id: selectedMission.id,
                          pmr_id: 'pmr-demo-1',
                          pmr_name: selectedMission.pmr_name,
                          leg: selectedMission.current_leg,
                          timestamp: new Date().toISOString()
                        })}
                        size={240}
                        level="H"
                        includeMargin={false}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      À scanner pour validation embarquement
                    </Typography>
                  </Paper>

                  {/* Bouton embarquement */}
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleBoard}
                    disabled={boarded}
                    startIcon={<CheckIcon />}
                    sx={{ py: 1.5 }}
                  >
                    {boarded ? '✅ PMR Embarqué !' : 'Valider Embarquement'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AgentMissionDashboard;
